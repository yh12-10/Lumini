
import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { Flashcard, QuizQuestion, Language, Concept, RoadmapStep, QAPair, BlankSentence } from '../types';

// Safely initialize the AI client
const getAiClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing. Features will not work.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Retry helper to handle network blips or rate limits (429)
async function runWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.status === 503 || error?.message?.includes('fetch failed'))) {
      console.warn(`Retrying AI call... Attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return runWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

const cleanJson = (text: string): string => {
  let clean = text.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  clean = clean.replace(/\s*```$/, '');
  return clean.trim();
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateSummary = async (text: string, lang: Language, mode: 'normal' | 'eli5' = 'normal'): Promise<string> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const prompt = mode === 'eli5'
      ? (lang === 'ar' 
          ? `اشرح هذا النص وكأنك تتحدث لطفل عمره 5 سنوات. استخدم كلمات بسيطة جداً، جمل قصيرة، وتشبيهات ممتعة. تجنب المصطلحات المعقدة تماماً:\n${text.substring(0, 20000)}` 
          : `Explain this text as if you are talking to a 5-year-old. Use extremely simple words, short sentences, and fun analogies. Avoid ALL complex jargon:\n${text.substring(0, 20000)}`)
      : (lang === 'ar' ? `لخص هذا النص بشكل شامل ومفيد:\n${text.substring(0, 20000)}` : `Summarize this text comprehensively:\n${text.substring(0, 20000)}`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Summary unavailable.";
  });
};

export const translateText = async (text: string, targetLang: Language): Promise<string> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following text into ${targetLang === 'ar' ? 'Arabic' : 'English'}. Return ONLY the translated text:\n\n${text}`,
    });
    return response.text || text;
  });
};

export const generateQA = async (text: string, lang: Language, existingQuestions: string[] = []): Promise<QAPair[]> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const avoid = existingQuestions.length > 0 ? `DO NOT duplicate these questions: ${JSON.stringify(existingQuestions.slice(0, 10))}` : "";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 5 deep-thinking Q&A pairs from this text. ${avoid}. Ensure they are unique and cover different aspects. Output as JSON array of {question, answer}. Lang: ${lang}\n\n${text.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ["question", "answer"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text)).map((i: any) => ({ ...i, id: generateId() }));
  });
};

export const generateBlanks = async (text: string, lang: Language, existingSentences: string[] = []): Promise<BlankSentence[]> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const avoid = existingSentences.length > 0 ? `DO NOT duplicate these sentences: ${JSON.stringify(existingSentences.slice(0, 5))}` : "";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 5 "Fill in the Blank" sentences from this text. ${avoid}. Use "[blank]" for the missing word. Output as JSON array of {sentence, answer}. Choose significant keywords as answers. Lang: ${lang}\n\n${text.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentence: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ["sentence", "answer"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text)).map((i: any) => ({ ...i, id: generateId() }));
  });
};

export const getBlankHint = async (sentence: string, answer: string, lang: Language): Promise<string> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const prompt = lang === 'ar' 
      ? `أعطني تلميحاً بسيطاً للكلمة المفقودة "${answer}" في هذه الجملة: "${sentence}". لا تذكر الكلمة نفسها.`
      : `Give a short, helpful hint for the missing word "${answer}" in this sentence: "${sentence}". Do not reveal the answer itself.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No hint available.";
  });
};

export const generateRoadmap = async (text: string, lang: Language): Promise<RoadmapStep[]> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a 5-step learning roadmap for this content. Output as JSON array of {title, description, level}. Levels: Beginner, Intermediate, Advanced. Lang: ${lang}\n\n${text.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              level: { type: Type.STRING },
            },
            required: ["title", "description", "level"]
          }
        }
      }
    });
    const data = JSON.parse(cleanJson(response.text));
    return data.map((d: any) => ({ ...d, id: generateId(), completed: false }));
  });
};

export const extractConcepts = async (text: string, lang: Language): Promise<Concept[]> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract key concepts as JSON array of {term, definition, category}. Lang: ${lang}\n\n${text.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["term", "definition", "category"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text));
  });
};

export const generateFlashcards = async (text: string, lang: Language, existingTerms: string[] = []): Promise<Flashcard[]> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const avoid = existingTerms.length > 0 ? `DO NOT create cards for these terms: ${JSON.stringify(existingTerms.slice(0, 10))}` : "";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create 5 study flashcards as JSON array of {front, back}. ${avoid}. Try to cover different parts of the text. Lang: ${lang}\n\n${text.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
            },
            required: ["front", "back"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text)).map((c: any) => ({ id: generateId(), ...c }));
  });
};

export const generateQuiz = async (text: string, lang: Language, existingQuestions: string[] = []): Promise<QuizQuestion[]> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const avoid = existingQuestions.length > 0 ? `DO NOT duplicate these questions: ${JSON.stringify(existingQuestions.slice(0, 5))}` : "";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a 5-question quiz as JSON array of {question, options, correctAnswer, explanation}. ${avoid}. Ensure diverse questions. Lang: ${lang}\n\n${text.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text)).map((q: any) => ({ id: generateId(), ...q }));
  });
};

export const chatWithDoc = async (history: any[], message: string, context: string, lang: Language) => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are a study tutor. Use this context: ${context.substring(0, 30000)}. Language: ${lang}`
      },
      history: history
    });
    const result = await chat.sendMessage({ message });
    return result.text || "Error processing message.";
  });
};

export const recognizeCanvasContent = async (base64Image: string, mode: 'text' | 'shape', lang: Language): Promise<string> => {
  return runWithRetry(async () => {
    const ai = getAiClient();
    const prompt = mode === 'text'
      ? (lang === 'ar' ? 'قم بتحويل النص المكتوب بخط اليد في هذه الصورة إلى نص رقمي. أعد فقط النص بدون أي مقدمات.' : 'Transcribe the handwritten text in this image. Return ONLY the text, no conversational filler.')
      : (lang === 'ar' ? 'حلل هذا الرسم. إذا كان شكلاً هندسياً، صفه. إذا كان مخططاً أو معادلة، اشرحها باختصار.' : 'Analyze this drawing. If it is a geometric shape, describe it. If it is a diagram or math problem, explain it briefly.');

    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: base64Image
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [imagePart, { text: prompt }]
      }
    });

    return response.text || "";
  });
};

export const getLiveSession = async (context: string, lang: Language, onMessage: (msg: LiveServerMessage) => void, onClose: () => void) => {
  // Live API uses web sockets, so normal retries don't apply, but client init protection is needed
  const ai = getAiClient();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => { console.debug('Live session opened'); },
      onmessage: (msg: LiveServerMessage) => {
        onMessage(msg);
      },
      onclose: onClose,
      onerror: (e) => { console.error('Live session error', e); onClose(); }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `Tutor the user on this: ${context.substring(0, 20000)}. Lang: ${lang}`,
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
    }
  });
};

export function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  const uint8 = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
  return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
}

export function decodeAudio(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate = 24000, channels = 1): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frames = dataInt16.length / channels;
  const buffer = ctx.createBuffer(channels, frames, sampleRate);
  for (let c = 0; c < channels; c++) {
    const cd = buffer.getChannelData(c);
    for (let i = 0; i < frames; i++) cd[i] = dataInt16[i * channels + c] / 32768.0;
  }
  return buffer;
}
