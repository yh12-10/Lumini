import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';

interface PomodoroProps {
  language: Language;
}

export const Pomodoro: React.FC<PomodoroProps> = ({ language }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(e => console.error(e));
      
      // Toggle mode
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100 p-4 w-full md:w-64 mb-4 md:mb-0 transition-all hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 flex items-center">
          <Timer className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} text-brand-500`} />
          {t[language].pomodoro}
        </h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${isBreak ? 'bg-green-100 text-green-700' : 'bg-brand-100 text-brand-700'}`}>
          {isBreak ? 'Break' : 'Focus'}
        </span>
      </div>
      
      <div className="text-4xl font-mono font-bold text-slate-800 text-center mb-4 tracking-wider">
        {formatTime(timeLeft)}
      </div>

      <div className="flex justify-center gap-2">
        <button 
          onClick={toggleTimer}
          className={`p-2 rounded-xl text-white transition-colors ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600 hover:bg-brand-700'}`}
          title={isActive ? t[language].pauseTimer : t[language].startTimer}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button 
          onClick={resetTimer}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          title={t[language].resetTimer}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
