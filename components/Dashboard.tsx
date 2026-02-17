
import React, { useMemo, useState, useEffect } from 'react';
import { FileText, Brain, Activity, Zap, Star, Trophy, Sparkles, PlusCircle, ArrowUpRight, Clock, Ghost, LayoutPanelLeft, MousePointerClick } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Doc, Quiz, Language, UserProgress, Activity as ActivityType } from '../types';
import { t } from '../utils/translations';

interface DashboardProps {
  docs: Doc[];
  quizzes: Quiz[];
  language: Language;
  userProgress: UserProgress;
  activities: ActivityType[];
}

export const Dashboard: React.FC<DashboardProps> = ({ docs, quizzes, language, userProgress, activities }) => {
  const [mounted, setMounted] = useState(false);
  const nextLevelXp = userProgress.level * 500;
  const progressPercent = Math.min(100, (userProgress.xp / nextLevelXp) * 100);

  useEffect(() => { setMounted(true); }, []);

  const activityData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.map(d => ({ name: d, count: 0 }));
    
    // Count documents uploaded per day
    docs.forEach(doc => {
      if (doc.dateAdded) {
        const d = new Date(doc.dateAdded).getDay();
        counts[d].count += 1;
      }
    });
    
    return counts;
  }, [docs]);

  const ActivityIcon = ({ type }: { type: ActivityType['type'] }) => {
    switch (type) {
      case 'upload': return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'quiz': return <Brain className="w-4 h-4 text-brand-500" />;
      case 'flashcard': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'chat': return <Zap className="w-4 h-4 text-fuchsia-500" />;
      case 'note': return <PlusCircle className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Header & Progress */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
              {t[language].welcome} {userProgress.level > 1 ? `Scholar` : ''}
            </h2>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-extrabold uppercase animate-pulse">Online</div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">{t[language].welcomeDesc}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-6 shadow-xl flex items-center min-w-[320px] relative overflow-hidden group">
          <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mr-5 shadow-inner">
            <Trophy className="w-7 h-7 text-brand-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em] mb-2 text-slate-400">
              <span>{t[language].level} {userProgress.level}</span>
              <span>{userProgress.xp} XP / {nextLevelXp}</span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-50 dark:border-slate-700">
              <div className="h-full bg-brand-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: FileText, label: t[language].totalDocs, val: docs.length, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { icon: Brain, label: t[language].quizzesTaken, val: quizzes.length, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
          { icon: Zap, label: t[language].streak, val: userProgress.streak, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-lg transition-all card-3d">
            <div>
              <h4 className="text-4xl font-black text-slate-800 dark:text-white leading-tight">{stat.val}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
            </div>
            <div className={`p-4 ${stat.bg} dark:bg-slate-800 rounded-2xl ${stat.color} shadow-sm`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Recent Documents */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[35px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[400px] md:min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-3">
              <Sparkles className="text-brand-400 w-5 h-5" />
              {t[language].recentDocs}
            </h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {docs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-float">
                  <Ghost className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">{t[language].noDocs || 'No documents yet'}</p>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">Upload your first file to start your AI learning journey!</p>
              </div>
            ) : (
              docs.slice(0, 8).map(doc => (
                <div key={doc.id} className="flex items-center p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group border border-transparent hover:border-brand-50">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                    <FileText size={22} />
                  </div>
                  <div className={`flex-1 ${language === 'ar' ? 'mr-4' : 'ml-4'} overflow-hidden`}>
                    <h4 className="text-sm font-bold truncate text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{new Date(doc.dateAdded).toLocaleDateString()}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Recent Activity */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[35px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[400px] md:min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-3">
              <LayoutPanelLeft className="text-indigo-500 w-6 h-6" />
              {t[language].recentActivity}
            </h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Clock className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">{t[language].noActivity}</p>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">Activities will appear here as you interact with the tutor.</p>
              </div>
            ) : (
              activities.slice(0, 10).map((act) => (
                <div key={act.id} className="flex items-center p-5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-brand-100 transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                    <ActivityIcon type={act.type} />
                  </div>
                  <div className={`flex-1 ${language === 'ar' ? 'mr-4 text-right' : 'ml-4 text-left'}`}>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{act.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Chart Row */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[35px] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-extrabold flex items-center gap-3 tracking-tight">
            <Activity className="text-brand-500 w-6 h-6" /> 
            {t[language].learningActivity}
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            Documents Uploaded
          </span>
        </div>
        <div className="h-[280px] w-full" dir="ltr">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} 
                  dy={15} 
                  height={60}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 10 }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '12px' }} 
                />
                <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={45}>
                  {activityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === new Date().getDay() ? '#6366f1' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
