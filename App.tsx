
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Layout } from './components/ui/Layout';
import { Auth } from './components/Auth';
import { AppView, Doc, Quiz, Language, UserProgress, Note, User, Task, Activity, CreativeProject } from './types';
import { parseFile } from './services/fileProcessing';
import { Loader2 } from 'lucide-react';
import { t } from './utils/translations';

// Lazy Load Components for Performance
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const DocumentManager = React.lazy(() => import('./components/DocumentManager').then(module => ({ default: module.DocumentManager })));
const StudySession = React.lazy(() => import('./components/StudySession').then(module => ({ default: module.StudySession })));
const Settings = React.lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));
const Tools = React.lazy(() => import('./components/Tools').then(module => ({ default: module.Tools })));

const INITIAL_PROGRESS: UserProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: new Date().toISOString(),
  quizzesAce: 0
};

// Helper for lazy loading from localStorage to prevent overwrite
const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  // CRITICAL: Initialize state lazily from localStorage to guarantee persistence
  const [userDb, setUserDb] = useState<Record<string, User>>(() => loadState('lumina_users_db', {}));
  const [user, setUser] = useState<User | null>(() => loadState('lumina_user', null));
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('lumina_language') as Language) || 'en';
  });

  const [docs, setDocs] = useState<Doc[]>(() => loadState('lumina_docs', []));
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => loadState('lumina_quizzes', []));
  const [userProgress, setUserProgress] = useState<UserProgress>(() => loadState('lumina_progress', INITIAL_PROGRESS));
  const [notes, setNotes] = useState<Note[]>(() => loadState('lumina_notes', []));
  const [tasks, setTasks] = useState<Task[]>(() => loadState('lumina_tasks', []));
  const [activities, setActivities] = useState<Activity[]>(() => loadState('lumina_activities', []));
  const [projects, setProjects] = useState<CreativeProject[]>(() => loadState('lumina_projects', []));

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Persistence Effects - These run whenever state changes to save data
  useEffect(() => { if (user) localStorage.setItem('lumina_user', JSON.stringify(user)); else localStorage.removeItem('lumina_user'); }, [user]);
  useEffect(() => { localStorage.setItem('lumina_docs', JSON.stringify(docs)); }, [docs]);
  useEffect(() => { localStorage.setItem('lumina_quizzes', JSON.stringify(quizzes)); }, [quizzes]);
  useEffect(() => { localStorage.setItem('lumina_progress', JSON.stringify(userProgress)); }, [userProgress]);
  useEffect(() => { localStorage.setItem('lumina_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('lumina_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('lumina_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('lumina_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('lumina_language', language); }, [language]);
  useEffect(() => { localStorage.setItem('lumina_users_db', JSON.stringify(userDb)); }, [userDb]);

  // Dark Mode Side Effect
  useEffect(() => {
    if (user?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.darkMode]);

  // Database Function: Add Activity securely linked to User
  const addActivity = useCallback((type: Activity['type'], description: string) => {
    if (!user) return; 

    const newActivity: Activity = {
      id: Date.now().toString(),
      userId: user.email,
      type,
      description,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  }, [user]);

  const handleLogin = (incomingUser: User) => {
    const existingUser = userDb[incomingUser.email];
    let finalUser: User;
    if (existingUser) {
      finalUser = { ...existingUser };
    } else {
      finalUser = incomingUser;
    }
    setUserDb(prev => ({ ...prev, [finalUser.email]: finalUser }));
    setUser(finalUser);
    setCurrentView(AppView.DASHBOARD);
    
    // Log login activity
    const loginActivity: Activity = {
      id: Date.now().toString(),
      userId: finalUser.email,
      type: 'upload',
      description: `Logged in as ${finalUser.name}`,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [loginActivity, ...prev]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setUserDb(prev => ({ ...prev, [updatedUser.email]: updatedUser }));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView(AppView.AUTH);
  };

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const content = await parseFile(file);
      const extension = file.name.split('.').pop()?.toLowerCase();
      let type: Doc['type'] = 'text';
      if (extension === 'pdf') type = 'pdf';
      else if (extension === 'docx') type = 'docx';
      else if (extension === 'md') type = 'md';

      const newDoc: Doc = {
        id: Date.now().toString(),
        title: file.name,
        content: content,
        type: type,
        size: file.size, 
        dateAdded: new Date().toISOString()
      };
      setDocs(prev => [newDoc, ...prev]);
      setCurrentView(AppView.DOCUMENTS);
      handleAddXp(50); 
      addActivity('upload', `Uploaded document: ${file.name}`);
      
      const today = new Date().toDateString();
      const lastStudy = new Date(userProgress.lastStudyDate).toDateString();
      if (today !== lastStudy) {
        setUserProgress(prev => ({
          ...prev,
          streak: prev.streak + 1,
          lastStudyDate: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDoc = (doc: Doc) => {
    setActiveDoc(doc);
    setCurrentView(AppView.STUDY);
    addActivity('chat', `Started studying: ${doc.title}`);
  };

  const handleDeleteDoc = (id: string) => {
    const docToDelete = docs.find(d => d.id === id);
    setDocs(prev => prev.filter(d => d.id !== id));
    if (docToDelete) addActivity('upload', `Deleted document: ${docToDelete.title}`);
    if (activeDoc?.id === id) {
      setActiveDoc(null);
      setCurrentView(AppView.DOCUMENTS);
    }
  };

  const handleUpdateNote = (note: Note) => {
    setNotes(prev => {
      const filtered = prev.filter(n => n.docId !== note.docId);
      return [...filtered, note];
    });
  };

  const handleUpdateDoc = (updatedDoc: Doc) => {
    setDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    setActiveDoc(updatedDoc);
  };

  const handleSaveQuiz = (quiz: Quiz) => {
    setQuizzes(prev => [...prev, quiz]);
    if (quiz.score && quiz.questions.length > 0 && quiz.score === quiz.questions.length) {
      setUserProgress(prev => ({ ...prev, quizzesAce: prev.quizzesAce + 1 }));
    }
  };

  const handleAddXp = (amount: number) => {
    setUserProgress(prev => {
      const newXp = prev.xp + amount;
      const nextLevelXp = prev.level * 500;
      let newLevel = prev.level;
      if (newXp >= nextLevelXp) {
        newLevel += 1;
      }
      return { ...prev, xp: newXp, level: newLevel };
    });
  };

  const handleAddTask = (text: string) => {
    const newTask: Task = { id: Date.now().toString(), text, completed: false, createdAt: Date.now() };
    setTasks(prev => [newTask, ...prev]);
    addActivity('note', `Added a study task`);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveProject = (project: CreativeProject) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === project.id);
      if (exists) {
        return prev.map(p => p.id === project.id ? project : p);
      }
      return [project, ...prev];
    });
    addActivity('drawing', `Saved creative project: ${project.title}`);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    addActivity('upload', `Deleted creative project`);
  };
  
  const getUserActivities = () => {
    if (!user) return [];
    return activities.filter(a => a.userId === user.email || !a.userId);
  };

  const renderContent = () => {
    if (!user) return <Auth onLogin={handleLogin} language={language} setLanguage={setLanguage} />;

    return (
      <Suspense fallback={
        <div className="h-full w-full flex flex-col items-center justify-center p-10">
           <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
           <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Application...</p>
        </div>
      }>
        {currentView === AppView.DASHBOARD && <Dashboard docs={docs} quizzes={quizzes} language={language} userProgress={userProgress} activities={getUserActivities()} />}
        {currentView === AppView.DOCUMENTS && <DocumentManager docs={docs} quizzes={quizzes} onUpload={handleUpload} onSelectDoc={handleSelectDoc} onDeleteDoc={handleDeleteDoc} language={language} />}
        {currentView === AppView.TOOLS && <Tools language={language} tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} projects={projects} onSaveProject={handleSaveProject} onDeleteProject={handleDeleteProject} />}
        {currentView === AppView.SETTINGS && <Settings user={user} onUpdateUser={handleUpdateUser} language={language} onLogout={handleLogout} activities={getUserActivities()} />}
        {currentView === AppView.STUDY && activeDoc && (
          <StudySession 
            doc={activeDoc} 
            onBack={() => setCurrentView(AppView.DOCUMENTS)}
            language={language}
            onUpdateNote={handleUpdateNote}
            savedNote={notes.find(n => n.docId === activeDoc.id)}
            onAddXp={handleAddXp}
            onUpdateDoc={handleUpdateDoc}
            onAddActivity={addActivity}
            onSaveQuiz={handleSaveQuiz}
          />
        )}
      </Suspense>
    );
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onChangeView={(view) => {
          if (view !== AppView.STUDY) setActiveDoc(null);
          setCurrentView(view);
        }}
        language={language}
        setLanguage={setLanguage}
        user={user}
      >
        {renderContent()}
      </Layout>
      
      {isProcessing && (
        <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-bounce-small border border-slate-100 dark:border-slate-800">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t[language].processing}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{t[language].processingDesc}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
