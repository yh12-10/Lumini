
import React, { useRef, useState } from 'react';
import { Upload, FileText, Plus, Search, Trash2, BookOpen, BrainCircuit, Clock } from 'lucide-react';
import { Doc, Language, Quiz } from '../types';
import { t } from '../utils/translations';

interface DocumentManagerProps {
  docs: Doc[];
  quizzes: Quiz[];
  onUpload: (file: File) => void;
  onSelectDoc: (doc: Doc) => void;
  onDeleteDoc: (id: string) => void;
  language: Language;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ docs, quizzes, onUpload, onSelectDoc, onDeleteDoc, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'a few seconds ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const filteredDocs = docs.filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in max-w-7xl mx-auto pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{t[language].documents}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage and organize your learning materials</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-2xl shadow-xl shadow-cyan-200 dark:shadow-none transition-all hover:-translate-y-1 active:scale-95 font-bold w-full md:w-auto"
        >
          <Plus className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {t[language].upload}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".txt,.md,.js,.py,.json,.pdf,.docx" 
          onChange={handleFileChange}
        />
      </div>

      {/* Drag & Drop Area */}
      {docs.length === 0 && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-4 border-dashed rounded-[30px] md:rounded-[40px] h-48 md:h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
            isDragging ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <Upload className={`w-8 h-8 md:w-10 md:h-10 ${isDragging ? 'text-cyan-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-bold text-base md:text-lg text-center px-4">{t[language].uploadDrag}</p>
          <p className="text-sm text-slate-400 mt-2 font-medium">{t[language].uploadSub}</p>
        </div>
      )}

      {/* Search Bar */}
      {docs.length > 0 && (
        <div className="relative max-w-2xl">
          <Search className={`absolute ${language === 'ar' ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
          <input 
            type="text" 
            placeholder={t[language].search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${language === 'ar' ? 'pr-16 pl-6' : 'pl-16 pr-6'} py-4 md:py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-base md:text-lg`}
          />
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
        {filteredDocs.map((doc) => {
          const quizCount = quizzes.filter(q => q.docId === doc.id).length;
          // Placeholder logic for flashcards count since it's not strictly persisted yet
          const flashcardCount = doc.concepts ? Math.floor(doc.concepts.length / 2) : 0;

          return (
            <div 
              key={doc.id} 
              onClick={() => onSelectDoc(doc)}
              className="group relative bg-white dark:bg-slate-900 rounded-[30px] md:rounded-[35px] p-6 md:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-transparent hover:border-cyan-100 dark:hover:border-cyan-900/30 flex flex-col h-[280px] md:h-[320px]"
            >
               {/* Icon */}
               <div className="w-12 h-12 md:w-14 md:h-14 bg-cyan-400 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-cyan-200 dark:shadow-none">
                 <FileText className="w-6 h-6 md:w-7 md:h-7" />
               </div>
               
               {/* Title & Size */}
               <div className="mb-6 flex-1">
                 <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 leading-tight" title={doc.title}>
                   {doc.title}
                 </h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                   {formatFileSize(doc.size)}
                 </p>
               </div>
               
               {/* Stats Row */}
               <div className="flex items-center gap-6 mb-8">
                 <div className="flex items-center gap-2 text-fuchsia-500 font-bold text-xs">
                   <BookOpen className="w-4 h-4" />
                   <span>{flashcardCount}</span>
                 </div>
                 <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                   <BrainCircuit className="w-4 h-4" />
                   <span>{quizCount}</span>
                 </div>
               </div>
               
               {/* Footer */}
               <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-slate-400">
                 <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                   <Clock className="w-3.5 h-3.5" />
                   <span>{getTimeAgo(doc.dateAdded)}</span>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                   className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 rounded-full transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
