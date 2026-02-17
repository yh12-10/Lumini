
import React from 'react';
import { Bot, FileText, LayoutDashboard, Menu, X, Settings as SettingsIcon, Wrench, LogOut } from 'lucide-react';
import { AppView, Language, User } from '../../types';
import { t } from '../../utils/translations';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  children: React.ReactNode;
  user?: User | null;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, language, setLanguage, children, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // If no user (Auth view), render children without sidebar
  if (!user) {
    return <>{children}</>;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-2 rounded-xl transition-all duration-200 group ${
        currentView === view
          ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 dark:shadow-none'
          : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 hover:shadow-md'
      }`}
    >
      <Icon className={`w-5 h-5 ${language === 'ar' ? 'ml-3' : 'mr-3'} ${currentView === view ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 ${language === 'ar' ? 'right-0 border-l dark:border-slate-800' : 'left-0 border-r dark:border-slate-800'} z-50 h-screen w-72 bg-slate-50 dark:bg-slate-900 p-6 flex flex-col transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
      } lg:translate-x-0`}>
        <div className="flex items-center mb-10 px-2">
          <div className={`w-10 h-10 bg-gradient-to-br from-brand-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200 ${language === 'ar' ? 'ml-3' : 'mr-3'}`}>
            <Bot className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400">
            {language === 'ar' ? 'لومينا AI' : 'Lumina AI'}
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="ml-auto lg:hidden p-1 text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label={t[language].dashboard} />
          <NavItem view={AppView.DOCUMENTS} icon={FileText} label={t[language].documents} />
          <NavItem view={AppView.TOOLS} icon={Wrench} label={t[language].tools} />
          <NavItem view={AppView.SETTINGS} icon={SettingsIcon} label={t[language].settings} />
        </nav>

        {/* User Mini Profile */}
        <div className="mb-4 flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden shadow-inner shrink-0 ${
             user.avatar 
                ? 'bg-transparent' 
                : (user.themePreference || 'bg-brand-100 dark:bg-brand-900/50')
             } ${
               !user.avatar && user.themePreference ? 'text-white' : 'text-brand-600 dark:text-brand-300'
             }`}>
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.avatarId || user.name.charAt(0).toUpperCase()
              )}
           </div>
           <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{t[language].free}</p>
           </div>
        </div>

        {/* Language Toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-100 dark:border-slate-700 flex shadow-sm">
          <button 
            onClick={() => setLanguage('en')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('ar')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'ar' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            AR
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800 flex items-center px-4 sticky top-0 z-30">
          <button onClick={() => setIsMobileMenuOpen(true)} className={`p-2 ${language === 'ar' ? '-mr-2' : '-ml-2'} text-slate-600 dark:text-slate-300`}>
            <Menu className="w-6 h-6" />
          </button>
          <span className={`font-semibold text-slate-700 dark:text-white ${language === 'ar' ? 'mr-3' : 'ml-3'}`}>{language === 'ar' ? 'لومينا AI' : 'Lumina AI'}</span>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
