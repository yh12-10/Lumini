
import React, { useState } from 'react';
import { User, Language } from '../types';
import { t } from '../utils/translations';
import { Bot, Sparkles, Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, language, setLanguage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      // Strong password validation
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const isLongEnough = password.length >= 8;

      if (!hasUpperCase || !hasNumber || !isLongEnough) {
        setError(t[language].passwordCriteria);
        return;
      }
    }

    const user: User = {
      name: name || (language === 'ar' ? 'طالب' : 'Student'),
      email: email || 'student@example.com',
      darkMode: false
    };
    onLogin(user);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 border border-white/50 dark:border-slate-800">
        
        {/* Sidebar Info Section */}
        <div className="md:w-[45%] bg-gradient-to-br from-brand-600 to-indigo-800 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-inner">
                 <Bot className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter">{language === 'ar' ? 'لومينا AI' : 'Lumina AI'}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight">
              {language === 'ar' ? 'مستقبلك الدراسي يبدأ هنا.' : 'Your Learning Journey Starts Here.'}
            </h1>
            <p className="text-brand-100 text-lg font-medium opacity-90">
              {language === 'ar' 
                ? 'حول مستنداتك إلى تجربة تفاعلية مذهلة بالذكاء الاصطناعي.' 
                : 'Transform your documents into stunning interactive study sessions with AI.'}
            </p>
          </div>
          
          <div className="mt-12 flex gap-3 relative z-10">
            <button 
              type="button"
              onClick={() => setLanguage('en')} 
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${language === 'en' ? 'bg-white text-brand-700 border-white shadow-lg' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
              English
            </button>
            <button 
              type="button"
              onClick={() => setLanguage('ar')} 
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${language === 'ar' ? 'bg-white text-brand-700 border-white shadow-lg' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Main Form Section */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-start">
              <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                {isLogin ? (t[language].login || 'Login') : (t[language].signup || 'Sign Up')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isLogin 
                  ? (language === 'ar' ? 'مرحباً بعودتك! سجل الدخول للمتابعة.' : 'Welcome back! Please login to continue.') 
                  : (language === 'ar' ? 'أنشئ حسابك المجاني في ثوانٍ.' : 'Create your free account in seconds.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t[language].name || 'Full Name'}</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="e.g. John Doe"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t[language].email || 'Email Address'}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all dark:text-white font-medium"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t[language].password || 'Password'}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all dark:text-white font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${showPassword ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error && (
                  <div className="flex items-start gap-2 mt-3 text-red-500 text-xs font-bold animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white font-black text-lg rounded-2xl shadow-2xl shadow-brand-500/20 transition-all hover:-translate-y-1 active:scale-[0.98] mt-4 flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5" />
                {isLogin ? (t[language].login || 'Login') : (t[language].getStarted || 'Get Started')}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isLogin ? (t[language].noAccount || "Don't have an account?") : (t[language].alreadyAccount || "Already have an account?")}{' '}
                <button 
                  type="button"
                  onClick={toggleMode} 
                  className="text-brand-600 font-black hover:underline ml-1"
                >
                  {isLogin ? (t[language].signup || 'Sign Up') : (t[language].login || 'Login')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
