
import React, { useState, useRef } from 'react';
import { User, Language, Activity } from '../types';
import { t } from '../utils/translations';
import { User as UserIcon, Moon, Sun, Shield, LogOut, Check, Zap, History, Clock, Palette, Edit3, Smile, Upload } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  language: Language;
  onLogout: () => void;
  activities: Activity[];
}

const AVATARS = [
  '🐶', '🐱', '🦊', '🦁', '🐸', '🦄', '🐙', '🦋', '🦉', '🦖', '🤖', '👽', '👨‍🚀', '🧙‍♂️', '🦸‍♀️', '🥷'
];

const THEMES = [
  { name: 'Indigo', class: 'bg-indigo-500' },
  { name: 'Emerald', class: 'bg-emerald-500' },
  { name: 'Rose', class: 'bg-rose-500' },
  { name: 'Amber', class: 'bg-amber-500' },
  { name: 'Violet', class: 'bg-violet-500' },
  { name: 'Cyan', class: 'bg-cyan-500' },
];

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, language, onLogout, activities }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser({ ...user, name, bio });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleDarkMode = () => {
    onUpdateUser({ ...user, darkMode: !user.darkMode });
  };

  const handleAvatarSelect = (avatar: string) => {
    // When selecting an emoji, clear the custom uploaded image so the emoji shows
    onUpdateUser({ ...user, avatarId: avatar, avatar: undefined });
  };

  const handleThemeSelect = (theme: string) => {
    onUpdateUser({ ...user, themePreference: theme });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Set the custom image
        onUpdateUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="px-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{t[language].settings}</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Customize your persona and view your journey.</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex shadow-inner">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Profile & Style
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Activity Log
           </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <UserIcon className="w-48 h-48" />
              </div>
              
              <div className="flex flex-col md:flex-row items-start gap-8 relative z-10 mb-10">
                <div className="group relative">
                  <div 
                    className={`w-32 h-32 rounded-[32px] flex items-center justify-center text-6xl shadow-2xl transition-all hover:scale-105 cursor-pointer overflow-hidden ${user.themePreference || 'bg-gradient-to-br from-brand-500 to-fuchsia-600'}`}
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to upload image"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="drop-shadow-sm">{user.avatarId || user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-3 -right-3 bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
                
                <div className="flex-1 w-full">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Personal Details</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t[language].name}</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none dark:text-white transition-all font-bold text-lg"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bio / Status</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none dark:text-white transition-all font-medium resize-none h-24"
                        placeholder="What's on your mind? (e.g., 'Mastering Biology 101')"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-8 relative z-10">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                   <Smile className="w-4 h-4" /> Choose Avatar
                </label>
                <div className="flex flex-wrap gap-3">
                  {AVATARS.map(av => (
                    <button
                      key={av}
                      onClick={() => handleAvatarSelect(av)}
                      className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all hover:scale-110 ${user.avatarId === av && !user.avatar ? 'bg-brand-100 dark:bg-brand-900 border-2 border-brand-500 scale-110' : 'bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700'}`}
                    >
                      {av}
                    </button>
                  ))}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                    title="Upload Custom Image"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end relative z-10">
                 <button 
                  onClick={handleSave}
                  className="flex items-center justify-center px-10 py-4 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 w-full md:w-fit active:scale-95"
                >
                  {isSaved ? <Check className="w-5 h-5 mr-3" /> : null}
                  {t[language].saveChanges}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-8">
            {/* Theme & Appearance */}
            <div className="bg-white dark:bg-slate-900 rounded-[30px] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
               <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                 <Palette className="w-5 h-5 text-fuchsia-500" />
                 Theme & Style
               </h3>

               <div className="space-y-6">
                 <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Accent Color</label>
                   <div className="flex gap-3 flex-wrap">
                      {THEMES.map(t => (
                        <button
                          key={t.name}
                          onClick={() => handleThemeSelect(t.class)}
                          className={`w-8 h-8 rounded-full ${t.class} transition-transform hover:scale-110 ${user.themePreference === t.class ? 'ring-4 ring-slate-200 dark:ring-slate-600 scale-110' : ''}`}
                          title={t.name}
                        />
                      ))}
                   </div>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                   <span className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                     {user.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                     {t[language].darkMode}
                   </span>
                   <button 
                     onClick={toggleDarkMode}
                     className={`w-12 h-7 rounded-full p-1 transition-all duration-300 flex items-center ${user.darkMode ? 'bg-brand-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'}`}
                   >
                     <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                   </button>
                 </div>
               </div>
            </div>

            {/* Account Status */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-[30px] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                 <Shield className="w-24 h-24 text-brand-400" />
               </div>
               <h3 className="text-lg font-black text-white mb-4 relative z-10">Membership</h3>
               <div className="relative z-10">
                 <h4 className="text-2xl font-black text-white mb-2">{t[language].premium}</h4>
                 <div className="flex items-center text-brand-400 text-xs font-black uppercase tracking-widest bg-brand-500/10 w-fit px-3 py-1.5 rounded-full border border-brand-500/20 mb-6">
                   <Zap className="w-3 h-3 mr-2" /> Scholar
                 </div>
                 <button 
                    onClick={onLogout}
                    className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-all flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t[language].signOut}
                  </button>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-xl border border-slate-100 dark:border-slate-800 animate-fade-in-up">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-500">
                 <History className="w-5 h-5" />
               </div>
               Full Activity Log
             </h3>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activities.length} Records</span>
           </div>
           
           <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {activities.length === 0 ? (
                 <div className="text-center py-20 opacity-50">
                    <p className="font-bold text-slate-400 uppercase text-xs tracking-widest">{t[language].noActivity}</p>
                 </div>
              ) : (
                 activities.map((act) => (
                    <div key={act.id} className="flex items-start p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm">
                       <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center mr-5 text-slate-500 shadow-sm shrink-0">
                          <Clock className="w-5 h-5" />
                       </div>
                       <div className="flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">{act.description}</p>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{act.type}</span>
                            <p className="text-xs text-slate-400 font-medium">
                               {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};
