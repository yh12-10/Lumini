
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './components/Dashboard';
import { DocumentManager } from './components/DocumentManager';
import { StudySession } from './components/StudySession';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { Tools } from './components/Tools';
import { AppView, Doc, Quiz, Language, UserProgress, Note, User, Task, Activity, CreativeProject } from './types';
import { parseFile } from './services/fileProcessing';
import { Loader2 } from 'lucide-react';
import { t } from './utils/translations';

const INITIAL_PROGRESS: UserProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: new Date().toISOString(),
  quizzesAce: 0
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  
  const [userProgress, setUserProgress] = useState<UserProgress>(INITIAL_PROGRESS);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<CreativeProject[]>([]);

  // User Database for persistence across logins
  const [userDb, setUserDb] = useState<Record<string, User>>({});

  // Initialization & Auth Check
  useEffect(() => {
    const savedUser = localStorage.getItem('lumina_user');
    const savedDocs = localStorage.getItem('lumina_docs');
    const savedQuizzes = localStorage.getItem('lumina_quizzes');
    const savedProgress = localStorage.getItem('lumina_progress');
    const savedNotes = localStorage.getItem('lumina_notes');
    const savedTasks = localStorage.getItem('lumina_tasks');
    const savedActivities = localStorage.getItem('lumina_activities');
    const savedProjects = localStorage.getItem('lumina_projects');
    const savedUserDb = localStorage.getItem('lumina_users_db');
    
    if (savedUserDb) setUserDb(JSON.parse(savedUserDb));

    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      if (u.darkMode) document.documentElement.classList.add('dark');
    }
    if (savedDocs) setDocs(JSON.parse(savedDocs));
    if (savedQuizzes) setQuizzes(JSON.parse(savedQuizzes));
    if (savedProgress) setUserProgress(JSON.parse(savedProgress));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
  }, []);

  // Persistence
  useEffect(() => { if (user) localStorage.setItem('lumina_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('lumina_docs', JSON.stringify(docs)); }, [docs]);
  useEffect(() => { localStorage.setItem('lumina_quizzes', JSON.stringify(quizzes)); }, [quizzes]);
  useEffect(() => { localStorage.setItem('lumina_progress', JSON.stringify(userProgress)); }, [userProgress]);
  useEffect(() => { localStorage.setItem('lumina_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('lumina_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('lumina_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('lumina_projects', JSON.stringify(projects)); }, [projects]);
  
  // Persist User Database
  useEffect(() => { 
    if (Object.keys(userDb).length > 0) {
      localStorage.setItem('lumina_users_db', JSON.stringify(userDb)); 
    }
  }, [userDb]);

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
    // Only track if user is logged in
    if (!user) return; 

    const newActivity: Activity = {
      id: Date.now().toString(),
      userId: user.email, // Link to unique user ID (email)
      type,
      description,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  }, [user]); // Re-create callback when user changes

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
    localStorage.removeItem('lumina_user'); 
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
        size: file.size, // Capture file size
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

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard docs={docs} quizzes={quizzes} language={language} userProgress={userProgress} activities={getUserActivities()} />;
      case AppView.DOCUMENTS:
        return <DocumentManager docs={docs} quizzes={quizzes} onUpload={handleUpload} onSelectDoc={handleSelectDoc} onDeleteDoc={handleDeleteDoc} language={language} />;
      case AppView.TOOLS:
        return <Tools language={language} tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} projects={projects} onSaveProject={handleSaveProject} onDeleteProject={handleDeleteProject} />;
      case AppView.SETTINGS:
        return <Settings user={user} onUpdateUser={handleUpdateUser} language={language} onLogout={handleLogout} activities={getUserActivities()} />;
      case AppView.STUDY:
        if (!activeDoc) return <Dashboard docs={docs} quizzes={quizzes} language={language} userProgress={userProgress} activities={getUserActivities()} />;
        return (
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
        );
      default:
        return <Dashboard docs={docs} quizzes={quizzes} language={language} userProgress={userProgress} activities={getUserActivities()} />;
    }
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
