
import React, { useState } from 'react';
import { Pomodoro } from './ui/Pomodoro';
import { CreativeStudio } from './ui/CreativeStudio';
import { Language, Task, CreativeProject } from '../types';
import { t } from '../utils/translations';
import { CheckSquare, Plus, Trash2, Eye, EyeOff, Zap, PenTool, Folder, FilePlus, ChevronRight } from 'lucide-react';

interface ToolsProps {
  language: Language;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  projects: CreativeProject[];
  onSaveProject: (p: CreativeProject) => void;
  onDeleteProject: (id: string) => void;
}

export const Tools: React.FC<ToolsProps> = ({ language, tasks, onAddTask, onToggleTask, onDeleteTask, projects, onSaveProject, onDeleteProject }) => {
  const [newTask, setNewTask] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const [activeProject, setActiveProject] = useState<CreativeProject | null>(null);

  const createNewProject = () => {
    setActiveProject(null); // Null means "New Project" mode in CreativeStudio
    // Optionally scroll to studio
    const studioEl = document.getElementById('creative-studio');
    studioEl?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`space-y-10 animate-fade-in max-w-7xl mx-auto pb-16 transition-all duration-1000 ${isZenMode ? 'scale-[1.02] bg-white dark:bg-slate-900 rounded-[60px] p-12 shadow-2xl border border-slate-100 dark:border-slate-800' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between md:items-center px-4 gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{t[language].tools}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold text-lg opacity-80">{t[language].deepWork}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsZenMode(!isZenMode)} 
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl shadow-xl font-black text-sm transition-all border-2 active:scale-95 ${
              isZenMode 
                ? 'bg-brand-600 text-white border-transparent' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 hover:border-brand-500'
            }`}
          >
            {isZenMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {isZenMode ? t[language].exitZen : t[language].zenMode}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Pomodoro Timer */}
        <div className="space-y-8">
           <div className={`transition-all duration-700 ${isZenMode ? 'scale-110 shadow-2xl translate-y-4' : ''}`}>
             <Pomodoro language={language} />
           </div>
           
           {!isZenMode && (
             <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 p-8 rounded-[40px] text-center">
                <Zap className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                <h4 className="font-bold text-brand-900 dark:text-brand-100 text-lg mb-2">{t[language].proTip}</h4>
                <p className="text-brand-700 dark:text-brand-300 text-sm leading-relaxed">
                  {t[language].proTipDesc}
                </p>
             </div>
           )}
        </div>

        {/* Right Column: Task Manager */}
        <div className={`space-y-10 transition-all ${isZenMode ? 'opacity-10 pointer-events-none' : ''}`}>
           <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] h-full shadow-2xl flex flex-col min-h-[400px] overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 dark:bg-slate-800/50">
                 <h3 className="font-black flex items-center text-2xl tracking-tighter text-slate-800 dark:text-white">
                    <CheckSquare className="mr-4 text-emerald-500 w-8 h-8" /> 
                    {t[language].tasks}
                 </h3>
                 <form onSubmit={e => { e.preventDefault(); if (newTask.trim()) { onAddTask(newTask); setNewTask(''); } }} className="mt-6 relative">
                    <input 
                      value={newTask} 
                      onChange={e => setNewTask(e.target.value)} 
                      placeholder={t[language].addTask} 
                      className="w-full pl-6 pr-16 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-lg shadow-inner" 
                    />
                    <button type="submit" className="absolute right-2 top-2 p-2.5 bg-emerald-500 text-white rounded-xl shadow-xl hover:bg-emerald-600 transition-all active:scale-90">
                      <Plus className="w-5 h-5" />
                    </button>
                 </form>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar max-h-[300px]">
                 {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10 text-center">
                      <Zap className="w-16 h-16 mb-4" />
                      <p className="font-black uppercase tracking-[0.3em] text-xs">{t[language].noMissions}</p>
                    </div>
                 ) : tasks.map(t => (
                    <div key={t.id} className="group flex items-center p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border-2 border-transparent hover:border-brand-500/10 transition-all shadow-sm">
                       <button 
                        onClick={() => onToggleTask(t.id)} 
                        className={`w-6 h-6 rounded-lg border-2 mr-4 flex items-center justify-center transition-all ${
                          t.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-110' 
                            : 'border-slate-200 dark:border-slate-600 hover:border-emerald-400 bg-white dark:bg-slate-800'
                        }`}
                       >
                          {t.completed && <CheckSquare className="w-4 h-4" />}
                       </button>
                       <span className={`flex-1 font-bold text-md transition-all ${t.completed ? 'text-slate-300 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{t.text}</span>
                       <button onClick={() => onDeleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 hover:scale-125 transition-all p-2">
                        <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Full Width Creative Studio */}
      <div id="creative-studio" className={`transition-all duration-700 ${isZenMode ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 px-4">
            <div>
               <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter flex items-center gap-3">
                 <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 rounded-2xl">
                    <PenTool className="w-6 h-6" />
                 </div>
                 {t[language].creativeStudio}
               </h3>
               <p className="text-sm font-bold text-slate-400 mt-2">{t[language].creativeDesc}</p>
            </div>

            {/* Project List */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2 max-w-full no-scrollbar">
               <button 
                 onClick={createNewProject}
                 className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2 border-dashed ${!activeProject ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 border-fuchsia-300' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-fuchsia-300 hover:text-fuchsia-600'}`}
               >
                 <FilePlus className="w-4 h-4" /> {t[language].newProject}
               </button>
               {projects.map(p => (
                 <div key={p.id} className={`group relative flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2 cursor-pointer ${activeProject?.id === p.id ? 'bg-white dark:bg-slate-800 border-brand-500 text-brand-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`} onClick={() => setActiveProject(p)}>
                    <span>{p.title}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-red-400 transition-all"
                    >
                       <Trash2 className="w-3 h-3" />
                    </button>
                 </div>
               ))}
            </div>
         </div>
         
         <CreativeStudio 
           language={language} 
           project={activeProject || undefined}
           onSave={onSaveProject}
           onNew={createNewProject}
         />
      </div>
    </div>
  );
};
