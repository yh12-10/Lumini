
import { useState, useRef, useEffect, useCallback } from 'react';
import { getLiveSession, createPcmBlob, decodeAudio, decodeAudioData } from '../services/gemini';
import { Language } from '../types';

export const useLiveVoice = (documentContext: string, lang: Language) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const stopSession = useCallback(() => {
    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    audioSourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      }).catch(() => {});
      sessionPromiseRef.current = null;
    }
  }, []);

  const startSession = useCallback(async () => {
    try {
      setError(null);
      setIsConnecting(true);

      // 1. Setup Audio Contexts IMMEDIATELY on user click (Mobile Requirement)
      // We must create and resume contexts before any async work (like getUserMedia)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      
      // Force resume for mobile browsers
      await Promise.all([
        inputCtx.state === 'suspended' ? inputCtx.resume() : Promise.resolve(),
        outputCtx.state === 'suspended' ? outputCtx.resume() : Promise.resolve()
      ]);
      
      // 2. Get Stream with explicit permission handling
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch (permErr: any) {
        setIsConnecting(false);
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          throw new Error("Microphone access denied. Please click the lock icon in your browser's address bar and allow microphone access to use live voice chat.");
        } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
          throw new Error("No microphone detected. Please connect a microphone and try again.");
        } else {
          throw new Error("Could not access microphone: " + permErr.message);
        }
      }

      // 3. Connect to Gemini Live
      const sessionPromise = getLiveSession(
        documentContext,
        lang,
        async (msg) => {
          if (!outputContextRef.current) return;

          // Handle interruption (user starts speaking or manual stop)
          if (msg.serverContent?.interrupted) {
            audioSourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e) {}
            });
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsSpeaking(false);
            return;
          }

          const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            setIsSpeaking(true);
            try {
              const bytes = decodeAudio(base64Audio);
              const audioBuffer = await decodeAudioData(bytes, outputContextRef.current, 24000, 1);
              
              const ctx = outputContextRef.current;
              // Ensure gapless playback by scheduling at nextStartTime
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                // Check if any other buffers are still playing before turning off speaking indicator
                if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            } catch (err) {
              console.error("Voice output decoding error", err);
            }
          }
        },
        () => {
          stopSession();
          // Only show error if we were active
          if (isActive) {
             setError("Connection closed.");
          }
        }
      );

      sessionPromiseRef.current = sessionPromise;
      
      // Wait for connection to be established
      try {
        await sessionPromise;
      } catch (connErr: any) {
        throw new Error("Connection failed: The AI tutor is currently unavailable. Please try again in a few moments.");
      }
      
      setIsConnecting(false);
      setIsActive(true);

      // 4. Input Processing
      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (sessionPromiseRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          
          sessionPromiseRef.current.then(session => {
            if (session) {
              session.sendRealtimeInput({ media: pcmBlob });
            }
          }).catch(() => {});
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (e: any) {
      console.error("Voice session error:", e);
      setError(e.message || "An unexpected error occurred while starting the voice session.");
      setIsConnecting(false); // Ensure loading state stops
      stopSession();
    }
  }, [documentContext, lang, stopSession, isActive]);

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return { isActive, isConnecting, isSpeaking, error, startSession, stopSession };
};
