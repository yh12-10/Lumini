
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return await parsePdf(file);
    case 'docx':
      return await parseDocx(file);
    default:
      return await parseText(file);
  }
}

async function parsePdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // CRITICAL FIX FOR ARABIC: Load CMaps
    // This allows PDF.js to correctly map character codes to characters for non-Latin scripts
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://esm.sh/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
      enableXfa: true // Better support for form-filled PDFs
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Filter out empty items and join
      // Note: For Arabic, complex BIDI handling might ideally require post-processing,
      // but cMaps solves the garbage character issue.
      const pageText = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim().length > 0)
        .join(' ');
        
      fullText += `[Page ${i}]\n${pageText}\n\n`;
    }
    
    // Basic cleanup for joined Arabic words if they get split oddly
    return fullText;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF. Ensure the file is not password protected.");
  }
}

async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to extract text from Word document.");
  }
}

async function parseText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error("Failed to read text file"));
    reader.readAsText(file);
  });
}
