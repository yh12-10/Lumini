
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, MessageSquare, Mic, Layers, BrainCircuit, Send, Sparkles, RefreshCw, CheckCircle, FileText, StickyNote, Lightbulb, Trophy, RotateCcw, Loader2, Languages, Baby, Map as MapIcon, HelpCircle, PenTool, Timer as TimerIcon, Brain, AlertCircle, Info, HelpCircle as QuestionIcon, Volume2, Eye, PlusCircle, ZoomIn, ZoomOut, Menu, Printer, Download, MoreVertical, Maximize, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { Doc, ChatMessage, Flashcard, QuizQuestion, Language, StudyMode, Note, Concept, RoadmapStep, QAPair, BlankSentence, Activity, Quiz } from '../types';
import { chatWithDoc, generateFlashcards, generateQuiz, generateSummary, extractConcepts, translateText, generateRoadmap, generateQA, generateBlanks, getBlankHint } from '../services/gemini';
import { useLiveVoice } from '../hooks/useLiveVoice';
import { t } from '../utils/translations';

interface StudySessionProps {
  doc: Doc;
  onBack: () => void;
  language: Language;
  onUpdateNote: (note: Note) => void;
  savedNote?: Note;
  onAddXp: (amount: number) => void;
  onUpdateDoc: (doc: Doc) => void;
  onAddActivity: (type: Activity['type'], description: string) => void;
  onSaveQuiz: (quiz: Quiz) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ doc, onBack, language, onUpdateNote, savedNote, onAddXp, onUpdateDoc, onAddActivity, onSaveQuiz }) => {
  const [activeTab, setActiveTab] = useState<StudyMode>('original');
  const [showNotes, setShowNotes] = useState(false);
  const [noteContent, setNoteContent] = useState(savedNote?.content || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState<string | null>(doc.summary || null);
  const [summaryMode, setSummaryMode] = useState<'normal' | 'eli5'>('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  
  const [concepts, setConcepts] = useState<Concept[]>(doc.concepts || []);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>(doc.roadmap || []);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [blankSentences, setBlankSentences] = useState<BlankSentence[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
  const [blankResults, setBlankResults] = useState<Record<string, boolean>>({});
  const [blankHints, setBlankHints] = useState<Record<string, string>>({});
  const [isHintLoading, setIsHintLoading] = useState<Record<string, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  // Doc Viewer State
  const [zoomLevel, setZoomLevel] = useState(100);

  const { isActive: isVoiceActive, isSpeaking, isConnecting, error: voiceError, startSession, stopSession } = useLiveVoice(doc.content, language);

  useEffect(() => {
    if (activeTab === 'summary' && !summary) handleFetch('summary');
    if (activeTab === 'concepts' && concepts.length === 0) handleFetch('concepts');
    if (activeTab === 'roadmap' && roadmap.length === 0) handleFetch('roadmap');
    if (activeTab === 'qa' && qaPairs.length === 0) handleFetch('qa');
    if (activeTab === 'blanks' && blankSentences.length === 0) handleFetch('blanks');
    if (activeTab === 'flashcards' && flashcards.length === 0) handleFetch('flashcards');
    if (activeTab === 'quiz' && quizQuestions.length === 0) handleFetch('quiz');
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFetch = async (type: string) => {
    setIsGenerating(true);
    try {
      if (type === 'summary') {
        const res = await generateSummary(doc.content, language, summaryMode);
        setSummary(res);
        onUpdateDoc({ ...doc, summary: res });
      } else if (type === 'concepts') {
        const res = await extractConcepts(doc.content, language);
        setConcepts(res);
        onUpdateDoc({ ...doc, concepts: res });
      } else if (type === 'roadmap') {
        const res = await generateRoadmap(doc.content, language);
        setRoadmap(res);
        onUpdateDoc({ ...doc, roadmap: res });
      } else if (type === 'qa') {
        const res = await generateQA(doc.content, language);
        setQaPairs(res);
      } else if (type === 'blanks') {
        const res = await generateBlanks(doc.content, language);
        setBlankSentences(res);
      } else if (type === 'flashcards') {
        const res = await generateFlashcards(doc.content, language);
        setFlashcards(res);
      } else if (type === 'quiz') {
        const res = await generateQuiz(doc.content, language);
        setQuizQuestions(res);
      }
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const handleLoadMore = async (type: 'qa' | 'blanks' | 'flashcards' | 'quiz') => {
    setIsGeneratingMore(true);
    try {
      if (type === 'qa') {
        const res = await generateQA(doc.content, language);
        setQaPairs(prev => [...prev, ...res]);
      } else if (type === 'blanks') {
        const res = await generateBlanks(doc.content, language);
        setBlankSentences(prev => [...prev, ...res]);
      } else if (type === 'flashcards') {
        const res = await generateFlashcards(doc.content, language);
        setFlashcards(prev => [...prev, ...res]);
      } else if (type === 'quiz') {
        const res = await generateQuiz(doc.content, language);
        setQuizQuestions(prev => [...prev, ...res]);
        if (quizSubmitted) setQuizSubmitted(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleLocalTranslate = async (id: string, text: string) => {
    if (translations[id]) {
      setTranslations(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    const target = language === 'en' ? 'ar' : 'en';
    const res = await translateText(text, target);
    setTranslations(prev => ({ ...prev, [id]: res }));
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoadingChat) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoadingChat(true);
    const botText = await chatWithDoc(messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), input, doc.content, language);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: botText, timestamp: Date.now() }]);
    setIsLoadingChat(false);
    onAddXp(5);
    onAddActivity('chat', `Chatted with AI about ${doc.title}`);
  };

  const handleBlankSubmit = (id: string, correct: string) => {
    const userVal = blankAnswers[id]?.trim().toLowerCase();
    const isCorrect = userVal === correct.toLowerCase();
    setBlankResults({ ...blankResults, [id]: isCorrect });
    if (isCorrect) {
      onAddXp(15);
      onAddActivity('quiz', `Mastered a "Fill in the Blank" challenge in ${doc.title}`);
      if (Object.keys(blankResults).filter(k => blankResults[k]).length + 1 === blankSentences.length) {
        confetti();
      }
    }
  };

  const handleQuizSubmit = () => {
    const score = calculateScore();
    setQuizSubmitted(true); 
    onAddXp(score * 20);
    const completedQuiz: Quiz = {
      id: Date.now().toString(),
      docId: doc.id,
      title: `${doc.title} Quiz`,
      questions: quizQuestions,
      score: score,
      dateCreated: new Date().toISOString()
    };
    onSaveQuiz(completedQuiz);
    onAddActivity('quiz', `Completed quiz for ${doc.title} with score ${score}/${quizQuestions.length}`);
    if (score === quizQuestions.length) confetti();
  };

  const fetchHintForBlank = async (id: string, sentence: string, answer: string) => {
    setIsHintLoading({ ...isHintLoading, [id]: true });
    try {
      const hint = await getBlankHint(sentence, answer, language);
      setBlankHints({ ...blankHints, [id]: hint });
    } catch (e) {
      setBlankHints({ ...blankHints, [id]: "Sorry, couldn't get a hint right now." });
    }
    setIsHintLoading({ ...isHintLoading, [id]: false });
  };

  const calculateScore = () => quizQuestions.reduce((acc, q) => (quizAnswers[q.id] === q.correctAnswer ? acc + 1 : acc), 0);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center px-6 justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur z-20">
        <div className="flex items-center overflow-hidden">
          <button onClick={onBack} className={`p-2 hover:bg-slate-100 rounded-full ${language === 'ar' ? 'ml-2' : 'mr-2'} transition-colors`}>
            {language === 'ar' ? <ArrowRight /> : <ArrowLeft />}
          </button>
          <h2 className="font-bold truncate text-slate-800 dark:text-slate-100">{doc.title}</h2>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowNotes(!showNotes)} className={`p-2 rounded-xl transition-all ${showNotes ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}>
             <StickyNote className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-2 overflow-x-auto no-scrollbar flex items-center gap-2 glass-panel shadow-sm z-20 relative">
        {[
          { id: 'original', icon: Eye, label: t[language].original },
          { id: 'summary', icon: FileText, label: t[language].summary },
          { id: 'concepts', icon: Lightbulb, label: t[language].concepts },
          { id: 'roadmap', icon: MapIcon, label: t[language].roadmap },
          { id: 'qa', icon: QuestionIcon, label: t[language].qa },
          { id: 'blanks', icon: PenTool, label: t[language].blanks },
          { id: 'chat', icon: MessageSquare, label: t[language].chat },
          { id: 'voice', icon: Mic, label: t[language].live },
          { id: 'flashcards', icon: Layers, label: t[language].flashcards },
          { id: 'quiz', icon: BrainCircuit, label: t[language].quiz },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 dark:text-slate-400'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/20 dark:bg-slate-950/20 relative">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full animate-pulse">
            <RefreshCw className="w-10 h-10 text-brand-500 animate-spin mb-4" />
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">{t[language].generating}</p>
          </div>
        ) : (
          <div className="h-full">
            
            {/* Original File Tab - PDF Viewer Style */}
            {activeTab === 'original' && (
              <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900">
                {/* Viewer Toolbar */}
                <div className="bg-slate-700 text-white p-3 flex items-center justify-between shadow-md z-10 sticky top-0">
                  <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                      <Menu className="w-5 h-5" />
                    </button>
                    <div className="font-medium text-sm truncate max-w-[200px]" title={doc.title}>
                      {doc.title}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                     <span className="text-xs px-3 text-slate-300 font-mono">1 / {Math.max(1, Math.ceil(doc.content.length / 3000))}</span>
                     <div className="w-px h-4 bg-slate-600"></div>
                     <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-1.5 hover:bg-slate-600 rounded-md">
                       <ZoomOut className="w-4 h-4" />
                     </button>
                     <span className="text-xs font-mono min-w-[3rem] text-center">{zoomLevel}%</span>
                     <button onClick={() => setZoomLevel(z => Math.min(200, z + 10))} className="p-1.5 hover:bg-slate-600 rounded-md">
                       <ZoomIn className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white" title="Rotate">
                      <RotateCw className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white" title="Download">
                      <Download className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white" title="Print">
                      <Printer className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Viewer Content (Paper) */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-500/50 flex justify-center custom-scrollbar">
                  <div 
                    className="bg-white text-slate-900 shadow-2xl p-12 min-h-[1000px] origin-top transition-transform duration-200 ease-out"
                    style={{ 
                      width: '850px', 
                      maxWidth: '100%',
                      transform: `scale(${zoomLevel / 100})`,
                      marginBottom: '50px'
                    }}
                  >
                    <pre className="whitespace-pre-wrap font-serif text-lg leading-loose selection:bg-cyan-100 selection:text-cyan-900">
                      {doc.content}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs remain unchanged in logic, but are rendered inside this container */}
            {activeTab === 'summary' && (
              <div className="p-8 max-w-4xl mx-auto space-y-6 text-start">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    <button onClick={() => { setSummaryMode(summaryMode === 'normal' ? 'eli5' : 'normal'); handleFetch('summary'); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${summaryMode === 'eli5' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                      <Baby className={`w-3 h-3 ${language === 'ar' ? 'ml-2' : 'mr-2'} inline`} /> {t[language].eli5}
                    </button>
                    <button onClick={() => handleLocalTranslate('main-summary', summary || '')} className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all border border-brand-100 dark:bg-brand-900/20 dark:border-brand-800">
                      <Languages className={`w-3 h-3 ${language === 'ar' ? 'ml-2' : 'mr-2'} inline`} /> {t[language].translate}
                    </button>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative group">
                  <ReactMarkdown>{translations['main-summary'] || summary || ''}</ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === 'concepts' && (
              <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {concepts.length === 0 ? <p className="text-center col-span-2 py-20 text-slate-400 font-bold uppercase tracking-widest">{t[language].noConcepts}</p> : concepts.map((c, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-l-8 border-yellow-500 shadow-sm group hover:shadow-xl transition-all text-start border dark:border-slate-800">
                    <div className="flex justify-between mb-4">
                      <h4 className="font-black text-xl text-slate-800 dark:text-white">{translations[`concept-t-${i}`] || c.term}</h4>
                      <button onClick={() => {
                        handleLocalTranslate(`concept-t-${i}`, c.term);
                        handleLocalTranslate(`concept-d-${i}`, c.definition);
                      }} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Languages className="w-5 h-5 text-slate-400 hover:text-brand-500" />
                      </button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{translations[`concept-d-${i}`] || c.definition}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Roadmap Tab */}
            {activeTab === 'roadmap' && (
              <div className="p-8 max-w-3xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <MapIcon className="text-emerald-500" /> {t[language].roadmap}
                </h3>
                <div className="space-y-4">
                  {roadmap.map((step, idx) => (
                    <div key={step.id} className={`relative ${language === 'ar' ? 'pr-12' : 'pl-12'} pb-8 border-l-2 border-emerald-100 last:border-0 group`}>
                      <div className={`absolute ${language === 'ar' ? '-right-[9px]' : '-left-[9px]'} top-0 w-4 h-4 rounded-full border-2 border-white shadow-md transition-colors ${step.completed ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-emerald-300'}`}></div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all text-start">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{translations[`roadmap-${step.id}`] || step.title}</h4>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              handleLocalTranslate(`roadmap-${step.id}`, step.title);
                              handleLocalTranslate(`roadmap-desc-${step.id}`, step.description);
                            }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <Languages className="w-4 h-4 text-slate-400" />
                            </button>
                            <input type="checkbox" checked={step.completed} onChange={() => {
                              const next = [...roadmap];
                              next[idx].completed = !next[idx].completed;
                              setRoadmap(next);
                              if (next[idx].completed) {
                                onAddXp(20);
                                onAddActivity('upload', `Completed roadmap milestone: ${step.title}`);
                              }
                            }} className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full mb-3 inline-block">{step.level}</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{translations[`roadmap-desc-${step.id}`] || step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'qa' && (
              <div className="p-8 max-w-4xl mx-auto space-y-6 text-start pb-20">
                {qaPairs.length === 0 ? <p className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">Generating Q&A...</p> : qaPairs.map((qa, i) => (
                  <div key={qa.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-xl transition-all relative">
                    <button onClick={() => {
                      handleLocalTranslate(`qa-q-${qa.id}`, qa.question);
                      handleLocalTranslate(`qa-a-${qa.id}`, qa.answer);
                    }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all">
                      <Languages className="w-5 h-5 text-brand-500" />
                    </button>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl flex items-center justify-center font-black shrink-0">Q</div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight pr-8">{translations[`qa-q-${qa.id}`] || qa.question}</h4>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center font-black shrink-0">A</div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{translations[`qa-a-${qa.id}`] || qa.answer}</p>
                    </div>
                  </div>
                ))}
                {qaPairs.length > 0 && (
                   <div className="flex justify-center pt-8">
                      <button 
                        onClick={() => handleLoadMore('qa')} 
                        disabled={isGeneratingMore}
                        className="flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                      >
                         {isGeneratingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                         {t[language].generateMore || "Generate More"}
                      </button>
                   </div>
                )}
              </div>
            )}

            {/* Blanks Tab */}
            {activeTab === 'blanks' && (
              <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
                <div className="text-center mb-10">
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{t[language].blanks}</h3>
                   <p className="text-slate-500 dark:text-slate-400 font-medium">Complete the sentences to test your comprehension.</p>
                </div>
                {blankSentences.map((s, idx) => {
                  const parts = s.sentence.split('[blank]');
                  return (
                    <div key={s.id} className={`bg-white dark:bg-slate-900 p-10 rounded-[40px] border transition-all shadow-sm relative overflow-hidden group ${
                      blankResults[s.id] === true ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20' : 
                      blankResults[s.id] === false ? 'border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/20' : 
                      'border-slate-100 dark:border-slate-800'
                    }`}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </div>
                        {blankResults[s.id] === true && <div className="text-emerald-500 flex items-center gap-1 font-bold text-xs uppercase tracking-widest animate-bounce-small"><CheckCircle className="w-4 h-4" /> Correct</div>}
                      </div>

                      <div className="text-xl md:text-2xl font-bold leading-relaxed text-slate-800 dark:text-slate-100 text-start flex flex-wrap items-center gap-2">
                        <span>{translations[`blank-p1-${s.id}`] || parts[0]}</span>
                        <div className="relative inline-block min-w-[140px] group">
                          <input 
                            value={blankAnswers[s.id] || ''} 
                            onChange={e => setBlankAnswers({...blankAnswers, [s.id]: e.target.value})}
                            onKeyDown={e => e.key === 'Enter' && handleBlankSubmit(s.id, s.answer)}
                            disabled={blankResults[s.id] === true}
                            className={`w-full px-4 py-1 bg-transparent border-b-4 outline-none transition-all text-center placeholder:text-slate-300 dark:placeholder:text-slate-700 ${
                              blankResults[s.id] === true ? 'border-emerald-500 text-emerald-600 font-black' : 
                              blankResults[s.id] === false ? 'border-red-500 text-red-600' : 
                              'border-brand-500 focus:border-brand-600 focus:bg-brand-50/30 dark:focus:bg-brand-900/20'
                            }`}
                            placeholder="..."
                          />
                        </div>
                        <span>{translations[`blank-p2-${s.id}`] || parts[1]}</span>
                      </div>

                      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleBlankSubmit(s.id, s.answer)} 
                            disabled={blankResults[s.id] === true}
                            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
                              blankResults[s.id] === true ? 'bg-emerald-500 text-white cursor-not-allowed opacity-50' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20'
                            }`}
                          >
                            {t[language].check}
                          </button>
                          
                          <button 
                            onClick={() => fetchHintForBlank(s.id, s.sentence, s.answer)}
                            disabled={blankResults[s.id] === true || isHintLoading[s.id]}
                            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-brand-200"
                            title="Get AI Hint"
                          >
                            {isHintLoading[s.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
                          </button>
                        </div>

                        <button onClick={() => {
                          handleLocalTranslate(`blank-p1-${s.id}`, parts[0]);
                          handleLocalTranslate(`blank-p2-${s.id}`, parts[1]);
                          if (blankHints[s.id]) handleLocalTranslate(`blank-hint-txt-${s.id}`, blankHints[s.id]);
                        }} className="text-xs font-bold text-slate-400 hover:text-brand-500 flex items-center gap-2 transition-colors">
                          <Languages className="w-4 h-4" /> {t[language].translate}
                        </button>
                      </div>

                      {blankHints[s.id] && (
                        <div className="mt-6 p-5 bg-indigo-50 dark:bg-brand-900/20 rounded-2xl border-l-4 border-indigo-400 animate-fade-in-up text-start">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-brand-400 flex items-center gap-2 mb-2"><Info className="w-3 h-3" /> AI {t[language].hint}</p>
                          <p className="text-sm font-medium text-indigo-700 dark:text-brand-300 leading-relaxed">{translations[`blank-hint-txt-${s.id}`] || blankHints[s.id]}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {blankSentences.length > 0 && (
                   <div className="flex justify-center pt-8">
                      <button 
                        onClick={() => handleLoadMore('blanks')} 
                        disabled={isGeneratingMore}
                        className="flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                      >
                         {isGeneratingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                         {t[language].generateMore || "Generate More"}
                      </button>
                   </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col p-6 space-y-4">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-4 rounded-3xl max-w-[85%] relative group text-start shadow-sm border ${
                        m.role === 'user' 
                          ? 'bg-brand-600 text-white border-transparent rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-bl-none text-slate-800 dark:text-slate-200'
                      }`}>
                        <ReactMarkdown>{translations[`chat-${m.id}`] || m.text}</ReactMarkdown>
                        {m.role === 'model' && (
                          <button onClick={() => handleLocalTranslate(`chat-${m.id}`, m.text)} className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-slate-100 dark:border-slate-600">
                            <Languages className="w-3.5 h-3.5 text-brand-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoadingChat && <div className="flex gap-2 items-center text-slate-400 font-bold text-xs uppercase tracking-widest"><Loader2 className="animate-spin w-4 h-4 text-brand-500" /> Thinking...</div>}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800">
                  <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                    className="flex-1 p-4 bg-transparent outline-none dark:text-white font-medium" 
                    placeholder={t[language].chatPlaceholder} 
                  />
                  <button onClick={handleSendMessage} className="p-4 bg-brand-600 text-white rounded-2xl shadow-xl hover:bg-brand-700 transition-all hover:scale-105 active:scale-95"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
              <div className="p-8 max-w-4xl mx-auto space-y-8 text-start pb-20">
                {!quizSubmitted ? (
                  <>
                    <div className="text-center mb-10">
                      <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{t[language].quiz}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Test what you've learned from this document.</p>
                    </div>
                    {quizQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                        <button onClick={() => handleLocalTranslate(`quiz-q-${q.id}`, q.question)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <Languages className="w-4 h-4 text-brand-500" />
                        </button>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white mb-6 pr-8">{idx + 1}. {translations[`quiz-q-${q.id}`] || q.question}</h4>
                        <div className="grid gap-3">
                          {q.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: oIdx })}
                              className={`p-5 rounded-2xl text-start font-bold transition-all border-2 ${
                                quizAnswers[q.id] === oIdx
                                  ? 'bg-brand-600 text-white border-transparent shadow-lg scale-[1.02]'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:border-brand-200'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${quizAnswers[q.id] === oIdx ? 'bg-white/20' : 'bg-white dark:bg-slate-700 shadow-sm'}`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                {opt}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center pt-6 gap-4">
                      <button 
                        onClick={() => handleLoadMore('quiz')} 
                        disabled={isGeneratingMore}
                        className="px-8 py-5 bg-white dark:bg-slate-800 border-2 border-brand-100 dark:border-slate-700 text-brand-600 dark:text-brand-400 rounded-3xl font-black text-lg shadow-lg hover:bg-brand-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                      >
                        {isGeneratingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                        {t[language].loadMore || "Load More"}
                      </button>
                      
                      <button onClick={handleQuizSubmit} className="px-12 py-5 bg-brand-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all">
                        {t[language].submit}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center animate-fade-in-up">
                    <div className="w-24 h-24 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Trophy className="w-12 h-12 text-brand-600" />
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{t[language].goodJob}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xl mb-12">You scored {calculateScore()} out of {quizQuestions.length}</p>
                    
                    <div className="space-y-6 max-w-3xl mx-auto text-start">
                      {quizQuestions.map((q, idx) => (
                        <div key={idx} className={`p-8 rounded-[40px] border-2 group relative transition-all ${quizAnswers[q.id] === q.correctAnswer ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-red-50/30 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'}`}>
                          <button onClick={() => {
                            handleLocalTranslate(`quiz-exp-${q.id}`, q.explanation);
                            handleLocalTranslate(`quiz-q-res-${q.id}`, q.question);
                          }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                            <Languages className="w-4 h-4 text-brand-500" />
                          </button>
                          <h4 className="font-black text-lg mb-4 text-slate-800 dark:text-white pr-8">{idx + 1}. {translations[`quiz-q-res-${q.id}`] || q.question}</h4>
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest ${quizAnswers[q.id] === q.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                              {quizAnswers[q.id] === q.correctAnswer ? t[language].correct : t[language].wrong}
                            </span>
                            <span className="text-sm font-bold text-slate-400">Answer: {q.options[q.correctAnswer]}</span>
                          </div>
                          <div className="p-5 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/20 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mb-2 flex items-center gap-2"><Sparkles className="w-3 h-3" /> {t[language].explanation}</p>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{translations[`quiz-exp-${q.id}`] || q.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }} className="mt-12 px-10 py-4 bg-slate-800 text-white dark:bg-slate-700 rounded-2xl font-black transition-all hover:bg-slate-900 active:scale-95">
                      {t[language].restart}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Flashcards Tab */}
            {activeTab === 'flashcards' && (
              <div className="h-full flex flex-col items-center justify-center p-8">
                {flashcards.length === 0 ? (
                  <p className="text-slate-400 font-bold uppercase tracking-widest">Generating Flashcards...</p>
                ) : (
                  <div className="w-full max-w-xl">
                    <div className="mb-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{t[language].card} {activeCardIndex + 1} / {flashcards.length}</span>
                      <button onClick={() => {
                        handleLocalTranslate(`fc-f-${flashcards[activeCardIndex].id}`, flashcards[activeCardIndex].front);
                        handleLocalTranslate(`fc-b-${flashcards[activeCardIndex].id}`, flashcards[activeCardIndex].back);
                      }} className="flex items-center gap-1 hover:text-brand-500 transition-colors">
                        <Languages className="w-3 h-3" /> {t[language].translate}
                      </button>
                    </div>
                    
                    <div className="h-[350px] md:h-[450px] w-full cursor-pointer relative" onClick={() => setIsCardFlipped(!isCardFlipped)} style={{ perspective: '1200px' }}>
                      <div className={`w-full h-full relative transition-all duration-700 transform-style-3d shadow-2xl rounded-[40px] ${isCardFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                        <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[40px] p-12 flex flex-col items-center justify-center text-center border-2 border-slate-50 dark:border-slate-800" style={{ backfaceVisibility: 'hidden' }}>
                          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight">
                            {translations[`fc-f-${flashcards[activeCardIndex].id}`] || flashcards[activeCardIndex].front}
                          </p>
                          <div className="mt-8 flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
                            <Sparkles className="w-3 h-3" /> {t[language].flip}
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-brand-600 text-white rounded-[40px] p-12 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <p className="text-xl md:text-2xl font-bold leading-relaxed">
                            {translations[`fc-b-${flashcards[activeCardIndex].id}`] || flashcards[activeCardIndex].back}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-10 w-full gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveCardIndex(prev => Math.max(0, prev - 1)); setIsCardFlipped(false); }} 
                        disabled={activeCardIndex === 0}
                        className="flex-1 py-4 bg-white dark:bg-slate-800 rounded-2xl font-black text-slate-600 dark:text-slate-300 shadow-lg disabled:opacity-30 active:scale-95 transition-all border border-slate-100 dark:border-slate-700"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveCardIndex(prev => Math.min(flashcards.length - 1, prev + 1)); setIsCardFlipped(false); }} 
                        disabled={activeCardIndex === flashcards.length - 1}
                        className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-500/20 disabled:opacity-30 active:scale-95 transition-all"
                      >
                        Next
                      </button>
                    </div>
                    
                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={() => handleLoadMore('flashcards')} 
                        disabled={isGeneratingMore}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
                      >
                        {isGeneratingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                        {t[language].generateMore || "Generate More Cards"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voice Tab */}
            {activeTab === 'voice' && (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-950 text-white relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 transition-opacity duration-1000 ${isVoiceActive ? 'opacity-100' : 'opacity-0'}`}></div>
                
                {/* Visualizer Circle */}
                <div className="relative mb-10">
                   {isSpeaking && (
                     <div className="absolute inset-[-40px] rounded-full border border-brand-500/30 animate-ping"></div>
                   )}
                   <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 relative z-10 ${isVoiceActive ? (isSpeaking ? 'bg-brand-500 shadow-[0_0_150px_rgba(99,102,241,0.8)] scale-110' : 'bg-brand-600 shadow-[0_0_100px_rgba(99,102,241,0.4)]') : 'bg-slate-800'}`}>
                    {isSpeaking ? <Volume2 className="w-20 h-20 animate-bounce-small" /> : <Mic className={`w-20 h-20 ${isVoiceActive ? 'animate-pulse' : 'text-slate-500'}`} />}
                  </div>
                </div>

                <h3 className="text-4xl font-black mb-4 relative z-10 tracking-tight text-center">
                  {isConnecting ? 'Connecting AI...' : (isVoiceActive ? (isSpeaking ? t[language].voiceSpeaking : t[language].voiceListening) : t[language].live)}
                </h3>
                
                <p className="text-slate-400 mb-12 max-w-sm text-center relative z-10 text-lg font-medium opacity-80">
                  {isVoiceActive ? t[language].voiceDescActive : t[language].voiceDesc}
                </p>
                
                {voiceError && (
                  <div className="mb-6 bg-red-900/40 text-red-100 px-6 py-4 rounded-3xl border border-red-800 relative z-10 flex items-start gap-3 font-bold text-sm max-w-md animate-fade-in-up">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{voiceError}</span>
                  </div>
                )}
                
                <button onClick={isVoiceActive ? stopSession : startSession} disabled={isConnecting} className={`px-20 py-6 rounded-full font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 relative z-10 ${isVoiceActive ? 'bg-red-500 hover:bg-red-600' : 'bg-white text-slate-950 hover:shadow-brand-500/50'}`}>
                  {isConnecting ? <Loader2 className="animate-spin" /> : (isVoiceActive ? t[language].endSession : t[language].startConv)}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notepad Overlay */}
      {showNotes && (
        <div className="w-full md:w-96 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col shadow-2xl z-40 h-full fixed md:relative right-0 top-0 animate-slide-in">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-black text-2xl flex items-center gap-3 text-slate-800 dark:text-white"><StickyNote className="text-amber-500 w-8 h-8" /> Notepad</h3>
            <button onClick={() => setShowNotes(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><ArrowRight className="w-6 h-6" /></button>
          </div>
          <textarea 
            value={noteContent} 
            onChange={e => { setNoteContent(e.target.value); onUpdateNote({ docId: doc.id, content: e.target.value, lastModified: Date.now() }); }} 
            className="flex-1 bg-amber-50/20 dark:bg-slate-800/50 p-8 rounded-[40px] border-2 border-amber-100/30 dark:border-slate-700/30 outline-none resize-none font-bold text-lg leading-relaxed focus:border-amber-500/30 transition-all shadow-inner dark:text-slate-100" 
            placeholder="Type your observations and notes here. They are saved automatically." 
          />
          <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> {t[language].saveNotes || 'Auto-saved Locally'}
          </div>
        </div>
      )}
    </div>
  );
};
