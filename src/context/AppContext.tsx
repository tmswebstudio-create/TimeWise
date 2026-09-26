import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Task,
  LearningGoal,
  Module,
  Resource,
  LearningSession,
  UserSettings,
  ActiveView,
  Subtask,
  TaskLink,
  ResourceSection,
} from '../types';
import {
  generateInitialTasks,
  initialLearningGoals,
  initialModules,
  initialResources,
  initialSessions,
  initialSettings,
} from '../data/initialData';
import { getTodayDateString, addDays } from '../utils/timeUtils';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  writeBatch,
} from 'firebase/firestore';

interface AppContextType {
  tasks: Task[];
  goals: LearningGoal[];
  modules: Module[];
  resources: Resource[];
  sessions: LearningSession[];
  settings: UserSettings;
  activeView: ActiveView;
  selectedGoalId: string | null;
  selectedModuleId: string | null;
  selectedTaskId: string | null;
  currentTime: Date;
  isCloudSyncing: boolean;

  // Panel expansion & collapse state
  isRightPanelOpen: boolean;
  toggleRightPanel: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Modals & Drawers state
  isTaskFormOpen: boolean;
  taskToEdit: Task | null;
  isGoalFormOpen: boolean;
  goalToEdit: LearningGoal | null;
  isModuleFormOpen: boolean;
  moduleToEdit: Module | null;
  isResourcePlayerOpen: boolean;
  activePlayingResource: Resource | null;
  isResourceFormOpen: boolean;
  resourceToEdit: Resource | null;
  preselectedGoalId: string | null;
  preselectedModuleId: string | null;
  isSearchOpen: boolean;
  toastMessage: string | null;

  // Navigation
  setActiveView: (view: ActiveView, goalId?: string, moduleId?: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  openTaskForm: (task?: Task | null, prefill?: Partial<Task>) => void;
  closeTaskForm: () => void;
  openGoalForm: (goal?: LearningGoal | null) => void;
  closeGoalForm: () => void;
  openModuleForm: (module?: Module | null, prefillGoalId?: string) => void;
  closeModuleForm: () => void;
  openResourceForm: (goalId?: string, moduleId?: string, resource?: Resource | null) => void;
  closeResourceForm: () => void;
  openResourcePlayer: (resource: Resource) => void;
  closeResourcePlayer: () => void;
  setIsSearchOpen: (open: boolean) => void;
  showToast: (message: string) => void;

  // Categories
  categories: string[];
  addCustomCategory: (category: string) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string, links?: TaskLink[]) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  addLinkToTask: (taskId: string, link: Omit<TaskLink, 'id'>) => void;
  deleteLinkFromTask: (taskId: string, linkId: string) => void;
  addLinkToSubtask: (taskId: string, subtaskId: string, link: Omit<TaskLink, 'id'>) => void;
  deleteLinkFromSubtask: (taskId: string, subtaskId: string, linkId: string) => void;
  duplicateTask: (taskId: string) => void;
  reorderTasks: (sourceId: string, targetId: string) => void;
  moveTaskToDate: (taskId: string, targetDate: string) => void;
  rescheduleIncompleteTasksToToday: (fromDate: string) => void;
  rescheduleAllOverdueToToday: () => void;
  moveRemainingTodayToTomorrow: () => void;

  // Goal actions
  addGoal: (goal: Omit<LearningGoal, 'id'>) => LearningGoal;
  updateGoal: (id: string, updates: Partial<LearningGoal>) => void;
  deleteGoal: (id: string) => void;
  reorderGoals: (sourceId: string, targetId: string) => void;

  // Module actions
  addModule: (module: Omit<Module, 'id'>) => Module;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  toggleModuleComplete: (moduleId: string) => void;

  // Resource actions
  addResource: (res: Omit<Resource, 'id'>) => Resource;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  updateResourcePlayback: (resourceId: string, currentTimeSec: number, durationSec?: number) => void;
  markResourceCompleted: (resourceId: string) => void;
  createTaskFromResource: (resourceId: string) => void;
  reorderResources: (sourceId: string, targetId: string) => void;
  moveResourceToSection: (resourceId: string, targetSection: ResourceSection) => void;

  // Settings & reset
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetToDemoData: () => void;
  clearAllUserData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();

  // Live ticking date/time updated every 1s
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Primary Data State
  // For new registered users, start completely clean with zero dummy data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [categories, setCategories] = useState<string[]>([
    'Computer Science',
    'Web Development',
    'System Design',
    'Data Structures',
    'Design',
    'General',
  ]);

  // View & Nav State
  const [activeView, setActiveViewRaw] = useState<ActiveView>('tasks');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Panels & Sidebars - default left and right panels collapsed
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('timewise_right_panel_open');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      // Ignore error
    }
    return false; // default collapsed
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('timewise_sidebar_collapsed');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      // Ignore error
    }
    return true; // default collapsed
  });

  // Modals
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<LearningGoal | null>(null);
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null);
  const [preselectedGoalId, setPreselectedGoalId] = useState<string | null>(null);
  const [isResourcePlayerOpen, setIsResourcePlayerOpen] = useState(false);
  const [activePlayingResource, setActivePlayingResource] = useState<Resource | null>(null);
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [preselectedModuleId, setPreselectedModuleId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3000);
  };

  // ----------------------------------------------------
  // FIREBASE REAL-TIME FIRESTORE DATA SYNC
  // ----------------------------------------------------
  useEffect(() => {
    if (!user) {
      // Unauthenticated state: Empty state for cleanliness
      setTasks([]);
      setGoals([]);
      setModules([]);
      setResources([]);
      setSessions([]);
      return;
    }

    setIsCloudSyncing(true);
    const userId = user.uid;

    // 1. Sync User Profile & Settings
    const userDocRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka',
            dailyTargetMinutes: data.dailyTargetMinutes || 180,
            timeFormat: data.timeFormat || '12h',
            soundEnabled: data.soundEnabled ?? true,
            name: data.displayName || user.displayName || 'User',
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}`)
    );

    // 2. Sync Tasks
    const tasksCollRef = collection(db, 'users', userId, 'tasks');
    const unsubTasks = onSnapshot(
      tasksCollRef,
      (snapshot) => {
        const fetchedTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTasks.push(docSnap.data() as Task);
        });
        setTasks(fetchedTasks);
        setIsCloudSyncing(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/tasks`)
    );

    // 3. Sync Goals
    const goalsCollRef = collection(db, 'users', userId, 'goals');
    const unsubGoals = onSnapshot(
      goalsCollRef,
      (snapshot) => {
        const fetchedGoals: LearningGoal[] = [];
        snapshot.forEach((docSnap) => {
          fetchedGoals.push(docSnap.data() as LearningGoal);
        });
        setGoals(fetchedGoals);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/goals`)
    );

    // 4. Sync Modules
    const modulesCollRef = collection(db, 'users', userId, 'modules');
    const unsubModules = onSnapshot(
      modulesCollRef,
      (snapshot) => {
        const fetchedModules: Module[] = [];
        snapshot.forEach((docSnap) => {
          fetchedModules.push(docSnap.data() as Module);
        });
        // Sort modules by order
        fetchedModules.sort((a, b) => a.order - b.order);
        setModules(fetchedModules);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/modules`)
    );

    // 5. Sync Resources
    const resourcesCollRef = collection(db, 'users', userId, 'resources');
    const unsubResources = onSnapshot(
      resourcesCollRef,
      (snapshot) => {
        const fetchedRes: Resource[] = [];
        snapshot.forEach((docSnap) => {
          fetchedRes.push(docSnap.data() as Resource);
        });
        setResources(fetchedRes);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/resources`)
    );

    // 6. Sync Sessions
    const sessionsCollRef = collection(db, 'users', userId, 'sessions');
    const unsubSessions = onSnapshot(
      sessionsCollRef,
      (snapshot) => {
        const fetchedSessions: LearningSession[] = [];
        snapshot.forEach((docSnap) => {
          fetchedSessions.push(docSnap.data() as LearningSession);
        });
        setSessions(fetchedSessions);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/sessions`)
    );

    return () => {
      unsubUser();
      unsubTasks();
      unsubGoals();
      unsubModules();
      unsubResources();
      unsubSessions();
    };
  }, [user]);

  // Navigation Helper
  const setActiveView = (view: ActiveView, goalId?: string, moduleId?: string) => {
    setActiveViewRaw(view);
    if (goalId) setSelectedGoalId(goalId);
    if (moduleId) setSelectedModuleId(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleRightPanel = () =>
    setIsRightPanelOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('timewise_right_panel_open', JSON.stringify(next));
      } catch (e) {
        // Ignore error
      }
      return next;
    });
  const toggleSidebar = () =>
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('timewise_sidebar_collapsed', JSON.stringify(next));
      } catch (e) {
        // Ignore error
      }
      return next;
    });

  // Category
  const addCustomCategory = (category: string) => {
    if (!category.trim() || categories.includes(category.trim())) return;
    setCategories((prev) => [...prev, category.trim()]);
  };

  // ----------------------------------------------------
  // TASK ACTIONS (Persisted to Firestore /users/{uid}/tasks)
  // ----------------------------------------------------
  const addTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdTask: Task = {
      ...newTaskData,
      id,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [createdTask, ...prev]);

    if (user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', id);
      setDoc(taskDocRef, { ...createdTask, userId: user.uid }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/tasks/${id}`)
      );
    }

    showToast('Task added successfully');
    return createdTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', id);
      updateDoc(taskDocRef, updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${id}`)
      );
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);

    if (user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', id);
      deleteDoc(taskDocRef).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${id}`)
      );
    }

    showToast('Task deleted');
  };

  const toggleTaskComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null;

    updateTask(id, {
      status: nextStatus,
      completedAt,
    });

    if (nextStatus === 'completed') {
      showToast('Task marked complete! Great progress.');
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );

    updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const addSubtask = (taskId: string, title: string, links?: TaskLink[]) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !title.trim()) return;

    const newSub: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false,
      links: links || [],
    };

    updateTask(taskId, { subtasks: [...task.subtasks, newSub] });
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    updateTask(taskId, {
      subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
    });
  };

  const addLinkToTask = (taskId: string, link: Omit<TaskLink, 'id'>) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newLink: TaskLink = {
      ...link,
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    updateTask(taskId, { links: [...task.links, newLink] });
  };

  const deleteLinkFromTask = (taskId: string, linkId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    updateTask(taskId, {
      links: task.links.filter((l) => l.id !== linkId),
    });
  };

  const addLinkToSubtask = (taskId: string, subtaskId: string, link: Omit<TaskLink, 'id'>) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newLink: TaskLink = {
      ...link,
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    const updatedSubs = task.subtasks.map((s) => {
      if (s.id === subtaskId) {
        return { ...s, links: [...(s.links || []), newLink] };
      }
      return s;
    });

    updateTask(taskId, { subtasks: updatedSubs });
  };

  const deleteLinkFromSubtask = (taskId: string, subtaskId: string, linkId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubs = task.subtasks.map((s) => {
      if (s.id === subtaskId) {
        return {
          ...s,
          links: (s.links || []).filter((l) => l.id !== linkId),
        };
      }
      return s;
    });

    updateTask(taskId, { subtasks: updatedSubs });
  };

  const duplicateTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { id, createdAt, ...rest } = task;
    addTask({
      ...rest,
      title: `${task.title} (Copy)`,
      status: 'todo',
      completedAt: null,
      subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
    });
  };

  const reorderTasks = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setTasks((prev) => {
      const sourceIndex = prev.findIndex((t) => t.id === sourceId);
      const targetIndex = prev.findIndex((t) => t.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const moveTaskToDate = (taskId: string, targetDate: string) => {
    updateTask(taskId, { date: targetDate });
    showToast(`Task moved to ${targetDate}`);
  };

  const rescheduleIncompleteTasksToToday = (fromDate: string) => {
    const today = getTodayDateString();
    const incomplete = tasks.filter((t) => t.date === fromDate && t.status !== 'completed');
    if (incomplete.length === 0) {
      showToast('No incomplete tasks to reschedule');
      return;
    }

    incomplete.forEach((t) => {
      updateTask(t.id, { date: today });
    });
    showToast(`Rescheduled ${incomplete.length} task(s) to today`);
  };

  const rescheduleAllOverdueToToday = () => {
    const today = getTodayDateString();
    const overdue = tasks.filter((t) => t.date < today && t.status !== 'completed');
    if (overdue.length === 0) {
      showToast('No overdue tasks');
      return;
    }

    overdue.forEach((t) => {
      updateTask(t.id, { date: today });
    });
    showToast(`Rescheduled ${overdue.length} overdue task(s) to today`);
  };

  const moveRemainingTodayToTomorrow = () => {
    const today = getTodayDateString();
    const tomorrow = addDays(today, 1);
    const incomplete = tasks.filter((t) => t.date === today && t.status !== 'completed');
    if (incomplete.length === 0) {
      showToast('No remaining tasks for today');
      return;
    }

    incomplete.forEach((t) => {
      updateTask(t.id, { date: tomorrow });
    });
    showToast(`Moved ${incomplete.length} task(s) to tomorrow`);
  };

  // ----------------------------------------------------
  // GOAL ACTIONS (Persisted to Firestore /users/{uid}/goals)
  // ----------------------------------------------------
  const addGoal = (newGoalData: Omit<LearningGoal, 'id'>): LearningGoal => {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdGoal: LearningGoal = {
      ...newGoalData,
      id,
    };

    setGoals((prev) => [...prev, createdGoal]);

    if (user) {
      const goalDocRef = doc(db, 'users', user.uid, 'goals', id);
      setDoc(goalDocRef, { ...createdGoal, userId: user.uid }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/goals/${id}`)
      );
    }

    showToast('Learning Goal created');
    return createdGoal;
  };

  const updateGoal = (id: string, updates: Partial<LearningGoal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );

    if (user) {
      const goalDocRef = doc(db, 'users', user.uid, 'goals', id);
      updateDoc(goalDocRef, updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/goals/${id}`)
      );
    }
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    // Also cascade delete modules and resources
    const targetModules = modules.filter((m) => m.goalId === id);
    targetModules.forEach((m) => deleteModule(m.id));

    if (selectedGoalId === id) {
      setSelectedGoalId(null);
      setActiveView('goals');
    }

    if (user) {
      const goalDocRef = doc(db, 'users', user.uid, 'goals', id);
      deleteDoc(goalDocRef).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/goals/${id}`)
      );
    }

    showToast('Goal deleted');
  };

  const reorderGoals = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setGoals((prev) => {
      const sourceIndex = prev.findIndex((g) => g.id === sourceId);
      const targetIndex = prev.findIndex((g) => g.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  // ----------------------------------------------------
  // MODULE ACTIONS (Persisted to Firestore /users/{uid}/modules)
  // ----------------------------------------------------
  const addModule = (newModuleData: Omit<Module, 'id'>): Module => {
    const id = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdModule: Module = {
      ...newModuleData,
      id,
    };

    setModules((prev) => [...prev, createdModule]);

    if (user) {
      const modDocRef = doc(db, 'users', user.uid, 'modules', id);
      setDoc(modDocRef, { ...createdModule, userId: user.uid }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/modules/${id}`)
      );
    }

    showToast('Module created');
    return createdModule;
  };

  const updateModule = (id: string, updates: Partial<Module>) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

    if (user) {
      const modDocRef = doc(db, 'users', user.uid, 'modules', id);
      updateDoc(modDocRef, updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/modules/${id}`)
      );
    }
  };

  const deleteModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    // Cascade delete attached resources
    const targetRes = resources.filter((r) => r.moduleId === id);
    targetRes.forEach((r) => deleteResource(r.id));

    if (selectedModuleId === id) {
      setSelectedModuleId(null);
      setActiveView('goal-detail');
    }

    if (user) {
      const modDocRef = doc(db, 'users', user.uid, 'modules', id);
      deleteDoc(modDocRef).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/modules/${id}`)
      );
    }

    showToast('Module deleted');
  };

  const toggleModuleComplete = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;

    const nextStatus = mod.status === 'completed' ? 'not_started' : 'completed';
    const nextProgress = nextStatus === 'completed' ? 100 : 0;

    updateModule(moduleId, {
      status: nextStatus,
      progress: nextProgress,
    });
  };

  // ----------------------------------------------------
  // RESOURCE ACTIONS (Persisted to Firestore /users/{uid}/resources)
  // ----------------------------------------------------
  const addResource = (newResData: Omit<Resource, 'id'>): Resource => {
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdRes: Resource = {
      ...newResData,
      id,
    };

    setResources((prev) => [...prev, createdRes]);

    if (user) {
      const resDocRef = doc(db, 'users', user.uid, 'resources', id);
      setDoc(resDocRef, { ...createdRes, userId: user.uid }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/resources/${id}`)
      );
    }

    showToast('Resource added to module');
    return createdRes;
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );

    if (activePlayingResource && activePlayingResource.id === id) {
      setActivePlayingResource((prev) => (prev ? { ...prev, ...updates } : null));
    }

    if (user) {
      const resDocRef = doc(db, 'users', user.uid, 'resources', id);
      updateDoc(resDocRef, updates).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/resources/${id}`)
      );
    }
  };

  const deleteResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    if (activePlayingResource?.id === id) {
      setIsResourcePlayerOpen(false);
      setActivePlayingResource(null);
    }

    if (user) {
      const resDocRef = doc(db, 'users', user.uid, 'resources', id);
      deleteDoc(resDocRef).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/resources/${id}`)
      );
    }

    showToast('Resource removed');
  };

  const updateResourcePlayback = (
    resourceId: string,
    currentTimeSec: number,
    durationSec?: number
  ) => {
    const target = resources.find((r) => r.id === resourceId);
    if (!target) return;

    const dur = durationSec || target.durationSeconds || 1;
    const isFinished = currentTimeSec >= dur - 5;
    const status = isFinished ? 'completed' : currentTimeSec > 10 ? 'in_progress' : target.status;

    updateResource(resourceId, {
      currentTime: Math.round(currentTimeSec),
      durationSeconds: dur,
      status,
      lastWatchedAt: new Date().toISOString(),
    });

    // Automatically recalculate module & goal progress
    recalcModuleProgress(target.moduleId);
  };

  const markResourceCompleted = (resourceId: string) => {
    const target = resources.find((r) => r.id === resourceId);
    if (!target) return;

    updateResource(resourceId, {
      status: 'completed',
      currentTime: target.durationSeconds || 0,
      lastWatchedAt: new Date().toISOString(),
    });

    // Log study session
    const studySession: LearningSession = {
      id: `sess_${Date.now()}`,
      resourceId: target.id,
      goalId: target.goalId,
      moduleId: target.moduleId,
      resourceTitle: target.title,
      activityType: 'Video Lecture',
      durationMinutes: Math.max(5, Math.round((target.durationSeconds || 300) / 60)),
      timestamp: new Date().toISOString(),
    };

    setSessions((prev) => [studySession, ...prev]);

    if (user) {
      const sessionDocRef = doc(db, 'users', user.uid, 'sessions', studySession.id);
      setDoc(sessionDocRef, { ...studySession, userId: user.uid }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${studySession.id}`)
      );
    }

    recalcModuleProgress(target.moduleId);
    showToast('Resource marked completed');
  };

  const recalcModuleProgress = (moduleId: string) => {
    const modResources = resources.filter((r) => r.moduleId === moduleId);
    if (modResources.length === 0) return;

    const completed = modResources.filter((r) => r.status === 'completed').length;
    const progress = Math.round((completed / modResources.length) * 100);
    const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

    updateModule(moduleId, { progress, status });
  };

  const createTaskFromResource = (resourceId: string) => {
    const res = resources.find((r) => r.id === resourceId);
    if (!res) return;

    const today = getTodayDateString();
    openTaskForm(null, {
      title: `Study: ${res.title}`,
      category: 'Learning',
      goalId: res.goalId,
      moduleId: res.moduleId,
      resourceId: res.id,
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      priority: 'high',
      notes: `Dedicated focus study for resource: ${res.url}`,
    });
  };

  const reorderResources = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setResources((prev) => {
      const sourceIndex = prev.findIndex((r) => r.id === sourceId);
      const targetIndex = prev.findIndex((r) => r.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const moveResourceToSection = (resourceId: string, targetSection: ResourceSection) => {
    updateResource(resourceId, { section: targetSection });
    showToast(`Moved to ${targetSection}`);
  };

  // ----------------------------------------------------
  // SETTINGS & DATA SEEDING / CLEARING
  // ----------------------------------------------------
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      updateDoc(userDocRef, {
        ...newSettings,
        displayName: newSettings.name,
        updatedAt: new Date().toISOString(),
      }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`)
      );
    }
    showToast('Settings saved successfully');
  };

  // Load starter/demo kit if explicitly requested by the user
  const resetToDemoData = () => {
    const initialT = generateInitialTasks();
    setTasks(initialT);
    setGoals(initialLearningGoals);
    setModules(initialModules);
    setResources(initialResources);
    setSessions(initialSessions);
    setSettings(initialSettings);

    if (user) {
      // Sync batch to Firestore
      const batch = writeBatch(db);
      initialT.forEach((t) => {
        batch.set(doc(db, 'users', user.uid, 'tasks', t.id), { ...t, userId: user.uid });
      });
      initialLearningGoals.forEach((g) => {
        batch.set(doc(db, 'users', user.uid, 'goals', g.id), { ...g, userId: user.uid });
      });
      initialModules.forEach((m) => {
        batch.set(doc(db, 'users', user.uid, 'modules', m.id), { ...m, userId: user.uid });
      });
      initialResources.forEach((r) => {
        batch.set(doc(db, 'users', user.uid, 'resources', r.id), { ...r, userId: user.uid });
      });
      initialSessions.forEach((s) => {
        batch.set(doc(db, 'users', user.uid, 'sessions', s.id), { ...s, userId: user.uid });
      });
      batch.commit().catch((err) => console.error('Failed to batch save demo data:', err));
    }

    showToast('Sample Starter Kit loaded');
  };

  // Clear all data to pristine empty state
  const clearAllUserData = () => {
    setTasks([]);
    setGoals([]);
    setModules([]);
    setResources([]);
    setSessions([]);

    if (user) {
      tasks.forEach((t) => deleteDoc(doc(db, 'users', user.uid, 'tasks', t.id)));
      goals.forEach((g) => deleteDoc(doc(db, 'users', user.uid, 'goals', g.id)));
      modules.forEach((m) => deleteDoc(doc(db, 'users', user.uid, 'modules', m.id)));
      resources.forEach((r) => deleteDoc(doc(db, 'users', user.uid, 'resources', r.id)));
      sessions.forEach((s) => deleteDoc(doc(db, 'users', user.uid, 'sessions', s.id)));
    }

    showToast('All data cleared. Clean slate ready.');
  };

  // Modal open/close helpers
  const openTaskForm = (task?: Task | null, prefill?: Partial<Task>) => {
    setTaskToEdit(task || (prefill as Task) || null);
    setIsTaskFormOpen(true);
  };
  const closeTaskForm = () => {
    setIsTaskFormOpen(false);
    setTaskToEdit(null);
  };

  const openGoalForm = (goal?: LearningGoal | null) => {
    setGoalToEdit(goal || null);
    setIsGoalFormOpen(true);
  };
  const closeGoalForm = () => {
    setIsGoalFormOpen(false);
    setGoalToEdit(null);
  };

  const openModuleForm = (module?: Module | null, prefillGoalId?: string) => {
    setModuleToEdit(module || null);
    setPreselectedGoalId(prefillGoalId || null);
    setIsModuleFormOpen(true);
  };
  const closeModuleForm = () => {
    setIsModuleFormOpen(false);
    setModuleToEdit(null);
    setPreselectedGoalId(null);
  };

  const openResourceForm = (goalId?: string, moduleId?: string, resource?: Resource | null) => {
    setPreselectedGoalId(goalId || null);
    setPreselectedModuleId(moduleId || null);
    setResourceToEdit(resource || null);
    setIsResourceFormOpen(true);
  };
  const closeResourceForm = () => {
    setIsResourceFormOpen(false);
    setResourceToEdit(null);
    setPreselectedGoalId(null);
    setPreselectedModuleId(null);
  };

  const openResourcePlayer = (resource: Resource) => {
    setActivePlayingResource(resource);
    setIsResourcePlayerOpen(true);
  };
  const closeResourcePlayer = () => {
    setIsResourcePlayerOpen(false);
    setActivePlayingResource(null);
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        goals,
        modules,
        resources,
        sessions,
        settings,
        activeView,
        selectedGoalId,
        selectedModuleId,
        selectedTaskId,
        currentTime,
        isCloudSyncing,
        isRightPanelOpen,
        toggleRightPanel,
        isSidebarCollapsed,
        toggleSidebar,
        isTaskFormOpen,
        taskToEdit,
        isGoalFormOpen,
        goalToEdit,
        isModuleFormOpen,
        moduleToEdit,
        isResourcePlayerOpen,
        activePlayingResource,
        isResourceFormOpen,
        resourceToEdit,
        preselectedGoalId,
        preselectedModuleId,
        isSearchOpen,
        toastMessage,
        setActiveView,
        setSelectedTaskId,
        openTaskForm,
        closeTaskForm,
        openGoalForm,
        closeGoalForm,
        openModuleForm,
        closeModuleForm,
        openResourceForm,
        closeResourceForm,
        openResourcePlayer,
        closeResourcePlayer,
        setIsSearchOpen,
        showToast,
        categories,
        addCustomCategory,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        addLinkToTask,
        deleteLinkFromTask,
        addLinkToSubtask,
        deleteLinkFromSubtask,
        duplicateTask,
        reorderTasks,
        moveTaskToDate,
        rescheduleIncompleteTasksToToday,
        rescheduleAllOverdueToToday,
        moveRemainingTodayToTomorrow,
        addGoal,
        updateGoal,
        deleteGoal,
        reorderGoals,
        addModule,
        updateModule,
        deleteModule,
        toggleModuleComplete,
        addResource,
        updateResource,
        deleteResource,
        updateResourcePlayback,
        markResourceCompleted,
        createTaskFromResource,
        reorderResources,
        moveResourceToSection,
        updateSettings,
        resetToDemoData,
        clearAllUserData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
