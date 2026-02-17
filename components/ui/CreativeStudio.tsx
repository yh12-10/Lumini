
import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Type, Eraser, Download, Trash2, Save, Palette, Check, Layout, AlignLeft, Grid, CaseUpper, Wand2, Loader2, Sparkles } from 'lucide-react';
import { Language, CreativeProject } from '../../types';
import { recognizeCanvasContent } from '../../services/gemini';
import { t } from '../../utils/translations';

interface CreativeStudioProps {
  language: Language;
  project?: CreativeProject;
  onSave: (project: CreativeProject) => void;
  onNew: () => void;
}

const FONTS = [
  { name: 'Modern', value: 'Inter, sans-serif' },
  { name: 'Arabic', value: "'Tajawal', 'Amiri', sans-serif" },
  { name: 'Serif', value: "'Merriweather', serif" },
  { name: 'Mono', value: "'Fira Code', monospace" },
  { name: 'Hand', value: "'Patrick Hand', cursive" },
];

const COLORS = ['#0f172a', '#334155', '#475569', '#dc2626', '#16a34a', '#2563eb', '#9333ea', '#d97706'];
const BG_COLORS = ['#ffffff', '#f8fafc', '#f0f9ff', '#f0fdf4', '#fff1f2', '#fffbeb', '#1e293b'];

export const CreativeStudio: React.FC<CreativeStudioProps> = ({ language, project, onSave, onNew }) => {
  const [mode, setMode] = useState<'write' | 'draw' | 'split'>('draw');
  const [title, setTitle] = useState(project?.title || t[language].untitled);
  const [text, setText] = useState(project?.content || '');
  const [isSaved, setIsSaved] = useState(false);
  
  // Customization State
  const [textColor, setTextColor] = useState(project?.styles?.textColor || '#334155');
  const [bgColor, setBgColor] = useState(project?.styles?.bgColor || '#ffffff');
  const [fontFamily, setFontFamily] = useState(project?.styles?.fontFamily || 'Inter, sans-serif');
  const [showLines, setShowLines] = useState(project?.styles?.showLines || false);

  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);

  // AI Recognition State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMagicMenu, setShowMagicMenu] = useState(false);

  // Load project data
  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setText(project.content);
      if (project.styles) {
        setTextColor(project.styles.textColor || '#334155');
        setBgColor(project.styles.bgColor || '#ffffff');
        setFontFamily(project.styles.fontFamily || 'Inter, sans-serif');
        setShowLines(project.styles.showLines || false);
      }
      
      if (project.canvasData && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            // We do not fillrect here to allow transparency in the canvas layer if we want
            ctx?.drawImage(img, 0, 0);
          }
        };
        img.src = project.canvasData;
      }
    } else {
      setTitle(t[language].untitled);
      setText('');
      // Defaults
      setTextColor('#334155');
      setBgColor('#ffffff');
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [project?.id, language]);

  // Initialize Canvas
  useEffect(() => {
    if (canvasRef.current && !isCanvasInitialized) {
      const canvas = canvasRef.current;
      // We set a fixed internal resolution for consistency
      canvas.width = 1200;
      canvas.height = 800;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      setIsCanvasInitialized(true);
    }
  }, [isCanvasInitialized]);

  // Update context when brush settings change
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = tool === 'eraser' ? bgColor : brushColor;
        ctx.lineWidth = brushSize;
      }
    }
  }, [brushColor, brushSize, tool, bgColor]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Create a temporary canvas to composite bg color + drawing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0);
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = tempCanvas.toDataURL();
        link.click();
      }
    }
  };

  const handleRecognize = async (type: 'text' | 'shape') => {
    if (!canvasRef.current) return;
    setIsAnalyzing(true);
    setShowMagicMenu(false);

    try {
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = bgColor || '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        const base64Data = tempCanvas.toDataURL('image/png').split(',')[1];
        const result = await recognizeCanvasContent(base64Data, type, language);
        
        if (result) {
          const prefix = type === 'text' ? '\n' : '\n\n[Analysis]: ';
          setText(prev => prev + prefix + result);
          setMode('split');
        }
      }
    } catch (error) {
      console.error("Recognition failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const canvasData = canvasRef.current ? canvasRef.current.toDataURL() : null;
    const newProject: CreativeProject = {
      id: project?.id || Date.now().toString(),
      title: title || t[language].untitled,
      content: text,
      canvasData: canvasData,
      lastModified: Date.now(),
      styles: {
        textColor,
        bgColor,
        fontFamily,
        showLines
      }
    };
    onSave(newProject);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const notebookStyle = showLines ? {
    backgroundImage: `linear-gradient(${bgColor} 95%, #e2e8f0 95%)`,
    backgroundSize: '100% 40px',
    lineHeight: '40px',
    paddingTop: '0px'
  } : {};

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 md:rounded-[40px] rounded-none shadow-2xl overflow-hidden flex flex-col h-[850px] animate-fade-in-up transition-colors duration-500" style={{ backgroundColor: bgColor }}>
      
      {/* 1. Main Toolbar - Responsive */}
      <div className="bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4 z-20">
        
        {/* Left: Mode & Title */}
        <div className="flex items-center gap-4 w-full xl:w-auto overflow-x-auto no-scrollbar pb-1 shrink-0">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setMode('write')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                mode === 'write' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Type className="w-4 h-4" /> {t[language].write}
            </button>
            <button
              onClick={() => setMode('split')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                mode === 'split' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Layout className="w-4 h-4" /> {t[language].both}
            </button>
            <button
              onClick={() => setMode('draw')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                mode === 'draw' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-4 h-4" /> {t[language].draw}
            </button>
          </div>

          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="min-w-[150px] bg-transparent border-b-2 border-slate-200 dark:border-slate-700 px-2 py-2 font-bold text-lg focus:border-brand-500 outline-none transition-colors text-slate-800 dark:text-white placeholder:text-slate-400"
            placeholder={t[language].projectName}
          />
        </div>

        {/* Center: Context Tools (Scrollable on mobile) */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full overflow-x-auto no-scrollbar pb-2 xl:pb-0">
          
          {(mode === 'write' || mode === 'split') && (
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-fade-in shrink-0">
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
              
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer max-w-[80px] md:max-w-none"
              >
                {FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
              </select>

              <div className="flex items-center gap-1">
                {COLORS.slice(0, 4).map(c => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className={`w-5 h-5 rounded-full border border-slate-100 ${textColor === c ? 'ring-2 ring-offset-1 ring-brand-500' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <button 
                onClick={() => setShowLines(!showLines)}
                className={`p-2 rounded-lg transition-colors ${showLines ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Toggle Notebook Lines"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {(mode === 'draw' || mode === 'split') && (
             <div className="flex items-center gap-3 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-fade-in relative shrink-0">
                <div className="flex gap-1">
                  {COLORS.slice(0, 5).map(c => (
                    <button
                      key={c}
                      onClick={() => { setBrushColor(c); setTool('pen'); }}
                      className={`w-5 h-5 rounded-full border border-slate-100 transition-transform ${brushColor === c && tool === 'pen' ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <button
                  onClick={() => setTool('eraser')}
                  className={`p-2 rounded-lg transition-all ${tool === 'eraser' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-16 accent-brand-600 cursor-pointer hidden md:block"
                  title="Brush Size"
                />

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* Magic AI Tools */}
                <div className="relative">
                   <button
                    onClick={() => setShowMagicMenu(!showMagicMenu)}
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 ${showMagicMenu ? 'bg-fuchsia-100 text-fuchsia-700' : 'text-fuchsia-500 hover:bg-fuchsia-50'}`}
                    title="AI Magic Tools"
                   >
                     {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                   </button>
                   
                   {showMagicMenu && (
                     <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30 flex flex-col p-1 animate-fade-in-up">
                        <button 
                          onClick={() => handleRecognize('text')}
                          className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-left text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"
                        >
                          <Type className="w-4 h-4 text-emerald-500" /> {t[language].extractText}
                        </button>
                        <button 
                          onClick={() => handleRecognize('shape')}
                          className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-left text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-brand-500" /> {t[language].analyzeDrawing}
                        </button>
                     </div>
                   )}
                </div>
             </div>
          )}

          {/* Global: Bg Color */}
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
             <Palette className="w-4 h-4 text-slate-400" />
             {BG_COLORS.slice(0, 4).map(c => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  className={`w-5 h-5 rounded-full border border-slate-200 ${bgColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                  style={{ backgroundColor: c }}
                  title="Background Color"
                />
             ))}
          </div>

        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
           <button onClick={clearCanvas} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors" title="Clear Canvas">
              <Trash2 className="w-5 h-5" />
           </button>
           <button onClick={downloadDrawing} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Download">
              <Download className="w-5 h-5" />
           </button>
           <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${
              isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? t[language].saved : t[language].save}
          </button>
        </div>
      </div>

      {/* 2. Workspace Area */}
      <div className="flex-1 relative overflow-hidden flex transition-all duration-500">
        
        {/* Writing Area */}
        <div 
          className={`h-full transition-all duration-500 ease-in-out relative ${
            mode === 'write' ? 'w-full opacity-100' : 
            mode === 'split' ? 'w-1/2 opacity-100 border-r border-slate-200 dark:border-slate-700' : 
            'w-0 opacity-0 overflow-hidden'
          }`}
          style={{ backgroundColor: bgColor }}
        >
           <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب أفكارك هنا...' : 'Type your thoughts here...'}
            className="w-full h-full p-4 md:p-10 text-lg md:text-xl resize-none outline-none transition-all"
            style={{ 
              fontFamily, 
              color: textColor,
              backgroundColor: 'transparent',
              lineHeight: showLines ? '40px' : '1.8',
              ...notebookStyle
            }}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        
        {/* Drawing Area */}
        <div 
          className={`h-full transition-all duration-500 ease-in-out relative ${
            mode === 'draw' ? 'w-full opacity-100' : 
            mode === 'split' ? 'w-1/2 opacity-100' : 
            'w-0 opacity-0 overflow-hidden'
          }`}
          style={{ backgroundColor: bgColor }}
        >
           {/* We use a container to handle the canvas scaling/view */}
           <div className="w-full h-full overflow-auto flex items-center justify-center bg-transparent touch-none">
             <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none shadow-sm"
              // Fix for mobile scrolling while drawing
              style={{ maxWidth: '100%', maxHeight: '100%', touchAction: 'none' }} 
            />
           </div>
           
           {mode === 'split' && (
             <div className="absolute top-4 right-4 bg-slate-100/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-500 pointer-events-none">
               Drawing Canvas
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
