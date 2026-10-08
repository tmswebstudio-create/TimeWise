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
  WebsiteBookmark,
  Habit,
  HabitTimeLog,
} from '../types';
import {
  generateInitialTasks,
  initialLearningGoals,
  initialModules,
  initialResources,
  initialSessions,
  initialSettings,
  initialBookmarks,
  generateInitialHabits,
} from '../data/initialData';
import { getTodayDateString, addDays, getCurrentTimeString24h, formatDurationHuman } from '../utils/timeUtils';
import { parseCurrentRoute, formatRoutePath } from '../utils/routeUtils';
import { useAuth } from './AuthContext';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
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
  linkTaskToHabit: (taskId: string, habitId: string | null) => void;
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

  // Website Bookmarks
  bookmarks: WebsiteBookmark[];
  isBookmarkFormOpen: boolean;
  bookmarkToEdit: WebsiteBookmark | null;
  preselectedBookmarkCategory?: string | null;
  preselectedBookmarkSubcategory?: string | null;
  openBookmarkForm: (bookmark?: WebsiteBookmark | null, category?: string, subcategory?: string) => void;
  closeBookmarkForm: () => void;
  addBookmark: (bookmark: Omit<WebsiteBookmark, 'id' | 'createdAt'>) => WebsiteBookmark;
  updateBookmark: (id: string, updates: Partial<WebsiteBookmark>) => void;
  deleteBookmark: (id: string) => void;
  togglePinBookmark: (id: string) => void;
  recordBookmarkClick: (id: string) => void;
  reorderBookmarks: (sourceId: string, targetId: string) => void;
  moveBookmark: (bookmarkId: string, targetCategory: string, targetSubcategory?: string, targetBookmarkId?: string) => void;
  pinnedBookmarkOrder: string[];
  reorderPinnedBookmarks: (sourceId: string, targetId: string) => void;
  categoryOrder: string[];
  reorderCategories: (sourceCat: string, targetCat: string) => void;
  subcategoryOrder: Record<string, string[]>;
  reorderSubcategories: (category: string, sourceSubcat: string, targetSubcat: string) => void;

  // Habits & Streaks
  habits: Habit[];
  habitCategories: string[];
  addCustomHabitCategory: (category: string) => void;
  isHabitFormOpen: boolean;
  habitToEdit: Habit | null;
  openHabitForm: (habit?: Habit | null) => void;
  closeHabitForm: () => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDate: (habitId: string, dateStr: string) => void;
  markHabitCompletedForDate: (habitId: string, dateStr: string) => void;
  unmarkHabitCompletedForDate: (habitId: string, dateStr: string) => void;
  reorderHabits: (sourceId: string, targetId: string) => void;

  // Habit Time Tracking (Dynamic live timer & manual logs by date)
  addHabitTimeLog: (habitId: string, log: Omit<HabitTimeLog, 'id' | 'createdAt'>, markCompleted?: boolean) => void;
  deleteHabitTimeLog: (habitId: string, logId: string) => void;
  updateHabitTimeLog: (habitId: string, logId: string, updates: Partial<HabitTimeLog>) => void;
  activeHabitTimer: { habitId: string; startTimestamp: number; startTimeStr: string } | null;
  startHabitTimer: (habitId: string) => void;
  stopHabitTimer: (habitId: string, notes?: string, markCompleted?: boolean) => HabitTimeLog | null;
  cancelHabitTimer: (habitId: string) => void;
  isTimeTrackerOpen: boolean;
  activeTimeTrackingHabitId: string | null;
  timeTrackerInitialDate: string | null;
  openTimeTracker: (habitId: string, initialDate?: string) => void;
  closeTimeTracker: () => void;

  // Settings & reset
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetToDemoData: () => void;
  clearAllUserData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }
  return obj;
};

// Helper to synchronously load initial cached data for instant reload rendering
const loadInitialCachedData = <T,>(keyPrefix: string, fallback: T): T => {
  try {
    const savedGuest = localStorage.getItem('timewise_local_guest');
    const guestKey = savedGuest ? JSON.parse(savedGuest)?.uid : null;
    const savedLast = localStorage.getItem('timewise_last_auth_user');
    const lastUid = savedLast ? JSON.parse(savedLast)?.uid : null;
    const currentUid = auth.currentUser?.uid || guestKey || lastUid;

    const candidates = [
      currentUid ? `timewise_${keyPrefix}_${currentUid}` : null,
      `timewise_${keyPrefix}`,
    ].filter(Boolean) as string[];

    for (const key of candidates) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as unknown as T;
        }
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`timewise_${keyPrefix}_`)) {
        const val = localStorage.getItem(k);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as unknown as T;
          }
        }
      }
    }
  } catch (e) {}
  return fallback;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest, loading } = useAuth();
  const canSyncToFirestore = Boolean(
    user &&
    !isGuest &&
    !user.uid.startsWith('guest_') &&
    auth.currentUser &&
    auth.currentUser.uid === user.uid
  );

  // Live ticking date/time updated every 1s
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Primary Data State with instant synchronous local cache fallback
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadInitialCachedData<Task[]>('tasks', generateInitialTasks())
  );
  const [goals, setGoals] = useState<LearningGoal[]>(() =>
    loadInitialCachedData<LearningGoal[]>('goals', initialLearningGoals)
  );
  const [modules, setModules] = useState<Module[]>(() =>
    loadInitialCachedData<Module[]>('modules', initialModules)
  );
  const [resources, setResources] = useState<Resource[]>(() =>
    loadInitialCachedData<Resource[]>('resources', initialResources)
  );
  const [sessions, setSessions] = useState<LearningSession[]>(() =>
    loadInitialCachedData<LearningSession[]>('sessions', initialSessions)
  );
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [categories, setCategories] = useState<string[]>([
    'Computer Science',
    'Web Development',
    'System Design',
    'Data Structures',
    'Design',
    'General',
  ]);

  // View & Nav State (Initialized from URL route or localStorage)
  const initialRoute = parseCurrentRoute();

  const [activeView, setActiveViewRaw] = useState<ActiveView>(() => {
    // If URL path is explicitly defined (like /goals or /bookmarks), use it!
    if (window.location.pathname !== '/' && window.location.pathname !== '/tasks') {
      return initialRoute.view;
    }
    // Otherwise fallback to localStorage if available
    try {
      const saved = localStorage.getItem('timewise_active_view');
      if (saved) return saved as ActiveView;
    } catch (e) {}
    return initialRoute.view;
  });

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(() => {
    if (initialRoute.goalId) return initialRoute.goalId;
    try {
      const saved = localStorage.getItem('timewise_selected_goal_id');
      if (saved) return saved;
    } catch (e) {}
    return null;
  });

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(() => {
    if (initialRoute.moduleId) return initialRoute.moduleId;
    try {
      const saved = localStorage.getItem('timewise_selected_module_id');
      if (saved) return saved;
    } catch (e) {}
    return null;
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Sync Nav State to localStorage & URL Route
  useEffect(() => {
    try {
      localStorage.setItem('timewise_active_view', activeView);
    } catch (e) {}
  }, [activeView]);

  useEffect(() => {
    try {
      if (selectedGoalId) {
        localStorage.setItem('timewise_selected_goal_id', selectedGoalId);
      } else {
        localStorage.removeItem('timewise_selected_goal_id');
      }
    } catch (e) {}
  }, [selectedGoalId]);

  useEffect(() => {
    try {
      if (selectedModuleId) {
        localStorage.setItem('timewise_selected_module_id', selectedModuleId);
      } else {
        localStorage.removeItem('timewise_selected_module_id');
      }
    } catch (e) {}
  }, [selectedModuleId]);

  // Sync URL route on mount and browser back/forward (popstate)
  useEffect(() => {
    const currentPath = formatRoutePath(activeView, selectedGoalId, selectedModuleId);
    if (window.location.pathname !== currentPath && !window.location.hash) {
      window.history.replaceState({ view: activeView, goalId: selectedGoalId, moduleId: selectedModuleId }, '', currentPath);
    }

    const handlePopState = () => {
      const route = parseCurrentRoute();
      setActiveViewRaw(route.view);
      setSelectedGoalId(route.goalId);
      setSelectedModuleId(route.moduleId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Website Bookmarks State
  const [bookmarks, setBookmarks] = useState<WebsiteBookmark[]>(() =>
    loadInitialCachedData<WebsiteBookmark[]>('bookmarks', initialBookmarks)
  );
  const [isBookmarkFormOpen, setIsBookmarkFormOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<WebsiteBookmark | null>(null);
  const [preselectedBookmarkCategory, setPreselectedBookmarkCategory] = useState<string | null>(null);
  const [preselectedBookmarkSubcategory, setPreselectedBookmarkSubcategory] = useState<string | null>(null);

  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('timewise_bookmark_category_order');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [subcategoryOrder, setSubcategoryOrder] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('timewise_bookmark_subcategory_order');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [pinnedBookmarkOrder, setPinnedBookmarkOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('timewise_pinned_bookmark_order');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Habits & Streaks State
  const [habits, setHabits] = useState<Habit[]>(() =>
    loadInitialCachedData<Habit[]>('habits', generateInitialHabits())
  );
  const [habitCategories, setHabitCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('timewise_habit_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['Coding', 'Algorithms', 'Architecture', 'Health', 'Learning', 'Productivity', 'General'];
  });

  const addCustomHabitCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setHabitCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = [...prev, trimmed];
      try {
        localStorage.setItem('timewise_habit_categories', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast(`Added category: ${trimmed}`);
  };

  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  const openHabitForm = (habit?: Habit | null) => {
    setHabitToEdit(habit || null);
    setIsHabitFormOpen(true);
  };

  const closeHabitForm = () => {
    setHabitToEdit(null);
    setIsHabitFormOpen(false);
  };

  // Habit Time Tracker Modal and Dynamic Timer state
  const [isTimeTrackerOpen, setIsTimeTrackerOpen] = useState<boolean>(false);
  const [activeTimeTrackingHabitId, setActiveTimeTrackingHabitId] = useState<string | null>(null);
  const [timeTrackerInitialDate, setTimeTrackerInitialDate] = useState<string | null>(null);

  const [activeHabitTimer, setActiveHabitTimer] = useState<{
    habitId: string;
    startTimestamp: number;
    startTimeStr: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('timewise_active_habit_timer');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const openTimeTracker = (habitId: string, initialDate?: string) => {
    setActiveTimeTrackingHabitId(habitId);
    setTimeTrackerInitialDate(initialDate || getTodayDateString());
    setIsTimeTrackerOpen(true);
  };

  const closeTimeTracker = () => {
    setIsTimeTrackerOpen(false);
    setActiveTimeTrackingHabitId(null);
    setTimeTrackerInitialDate(null);
  };

  // Panels & Sidebars - default left and right panels stay collapsed
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

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
    // CRITICAL: Do NOT clear or wipe state while Auth state is still loading asynchronously!
    if (loading) {
      return;
    }

    if (!user) {
      setIsCloudSyncing(false);
      return;
    }

    // If user is a local guest or auth is not authenticated with Firebase Auth,
    // operate purely in local mode without attaching Firestore listeners (which would fail permissions)
    if (!canSyncToFirestore) {
      setIsCloudSyncing(false);
      const guestKey = user.uid;
      try {
        const localTasks = localStorage.getItem(`timewise_tasks_${guestKey}`) || localStorage.getItem('timewise_tasks');
        if (localTasks) setTasks(JSON.parse(localTasks));
        else {
          const t = generateInitialTasks();
          setTasks(t);
          localStorage.setItem(`timewise_tasks_${guestKey}`, JSON.stringify(t));
          localStorage.setItem('timewise_tasks', JSON.stringify(t));
        }

        const localGoals = localStorage.getItem(`timewise_goals_${guestKey}`) || localStorage.getItem('timewise_goals');
        if (localGoals) setGoals(JSON.parse(localGoals));
        else {
          setGoals(initialLearningGoals);
          localStorage.setItem(`timewise_goals_${guestKey}`, JSON.stringify(initialLearningGoals));
          localStorage.setItem('timewise_goals', JSON.stringify(initialLearningGoals));
        }

        const localModules = localStorage.getItem(`timewise_modules_${guestKey}`) || localStorage.getItem('timewise_modules');
        if (localModules) setModules(JSON.parse(localModules));
        else {
          setModules(initialModules);
          localStorage.setItem(`timewise_modules_${guestKey}`, JSON.stringify(initialModules));
          localStorage.setItem('timewise_modules', JSON.stringify(initialModules));
        }

        const localResources = localStorage.getItem(`timewise_resources_${guestKey}`) || localStorage.getItem('timewise_resources');
        if (localResources) setResources(JSON.parse(localResources));
        else {
          setResources(initialResources);
          localStorage.setItem(`timewise_resources_${guestKey}`, JSON.stringify(initialResources));
          localStorage.setItem('timewise_resources', JSON.stringify(initialResources));
        }

        const localSessions = localStorage.getItem(`timewise_sessions_${guestKey}`) || localStorage.getItem('timewise_sessions');
        if (localSessions) setSessions(JSON.parse(localSessions));
        else {
          setSessions(initialSessions);
          localStorage.setItem(`timewise_sessions_${guestKey}`, JSON.stringify(initialSessions));
          localStorage.setItem('timewise_sessions', JSON.stringify(initialSessions));
        }

        const localBookmarks = localStorage.getItem(`timewise_bookmarks_${guestKey}`) || localStorage.getItem('timewise_bookmarks');
        if (localBookmarks) setBookmarks(JSON.parse(localBookmarks));
        else {
          setBookmarks(initialBookmarks);
          localStorage.setItem(`timewise_bookmarks_${guestKey}`, JSON.stringify(initialBookmarks));
          localStorage.setItem('timewise_bookmarks', JSON.stringify(initialBookmarks));
        }

        const localHabits = localStorage.getItem(`timewise_habits_${guestKey}`) || localStorage.getItem('timewise_habits');
        if (localHabits) setHabits(JSON.parse(localHabits));
        else {
          const h = generateInitialHabits();
          setHabits(h);
          localStorage.setItem(`timewise_habits_${guestKey}`, JSON.stringify(h));
          localStorage.setItem('timewise_habits', JSON.stringify(h));
        }
      } catch (e) {
        console.error('Error reading local guest data:', e);
      }
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

        if (fetchedTasks.length > 0) {
          fetchedTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setTasks(fetchedTasks);
          try {
            localStorage.setItem(`timewise_tasks_${userId}`, JSON.stringify(fetchedTasks));
            localStorage.setItem('timewise_tasks', JSON.stringify(fetchedTasks));
          } catch (e) {}
        } else {
          // If Firestore is empty, check local storage
          const localCache = localStorage.getItem(`timewise_tasks_${userId}`) || localStorage.getItem('timewise_tasks');
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTasks(parsed);
                const batch = writeBatch(db);
                parsed.forEach((t) => batch.set(doc(db, 'users', userId, 'tasks', t.id), sanitizeForFirestore({ ...t, userId })));
                batch.commit().catch(() => {});
                return;
              }
            } catch (e) {}
          }
          const starterTasks = generateInitialTasks();
          setTasks(starterTasks);
          try {
            localStorage.setItem(`timewise_tasks_${userId}`, JSON.stringify(starterTasks));
            localStorage.setItem('timewise_tasks', JSON.stringify(starterTasks));
            const batch = writeBatch(db);
            starterTasks.forEach((t) => batch.set(doc(db, 'users', userId, 'tasks', t.id), sanitizeForFirestore({ ...t, userId })));
            batch.commit().catch(() => {});
          } catch (e) {}
        }
        setIsCloudSyncing(false);
      },
      (err) => {
        const local = localStorage.getItem(`timewise_tasks_${userId}`) || localStorage.getItem('timewise_tasks');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) setTasks(parsed);
          } catch (e) {}
        }
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/tasks`);
      }
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

        if (fetchedGoals.length > 0) {
          fetchedGoals.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setGoals(fetchedGoals);
          try {
            localStorage.setItem(`timewise_goals_${userId}`, JSON.stringify(fetchedGoals));
            localStorage.setItem('timewise_goals', JSON.stringify(fetchedGoals));
          } catch (e) {}
        } else {
          const localCache = localStorage.getItem(`timewise_goals_${userId}`) || localStorage.getItem('timewise_goals');
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setGoals(parsed);
                const batch = writeBatch(db);
                parsed.forEach((g) => batch.set(doc(db, 'users', userId, 'goals', g.id), sanitizeForFirestore({ ...g, userId })));
                batch.commit().catch(() => {});
                return;
              }
            } catch (e) {}
          }
          setGoals(initialLearningGoals);
          try {
            localStorage.setItem(`timewise_goals_${userId}`, JSON.stringify(initialLearningGoals));
            localStorage.setItem('timewise_goals', JSON.stringify(initialLearningGoals));
            const batch = writeBatch(db);
            initialLearningGoals.forEach((g) => batch.set(doc(db, 'users', userId, 'goals', g.id), sanitizeForFirestore({ ...g, userId })));
            batch.commit().catch(() => {});
          } catch (e) {}
        }
      },
      (err) => {
        const local = localStorage.getItem(`timewise_goals_${userId}`) || localStorage.getItem('timewise_goals');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) setGoals(parsed);
          } catch (e) {}
        }
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/goals`);
      }
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

        if (fetchedModules.length > 0) {
          fetchedModules.sort((a, b) => a.order - b.order);
          setModules(fetchedModules);
          try {
            localStorage.setItem(`timewise_modules_${userId}`, JSON.stringify(fetchedModules));
            localStorage.setItem('timewise_modules', JSON.stringify(fetchedModules));
          } catch (e) {}
        } else {
          const localCache = localStorage.getItem(`timewise_modules_${userId}`) || localStorage.getItem('timewise_modules');
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setModules(parsed);
                const batch = writeBatch(db);
                parsed.forEach((m) => batch.set(doc(db, 'users', userId, 'modules', m.id), sanitizeForFirestore({ ...m, userId })));
                batch.commit().catch(() => {});
                return;
              }
            } catch (e) {}
          }
          setModules(initialModules);
          try {
            localStorage.setItem(`timewise_modules_${userId}`, JSON.stringify(initialModules));
            localStorage.setItem('timewise_modules', JSON.stringify(initialModules));
            const batch = writeBatch(db);
            initialModules.forEach((m) => batch.set(doc(db, 'users', userId, 'modules', m.id), sanitizeForFirestore({ ...m, userId })));
            batch.commit().catch(() => {});
          } catch (e) {}
        }
      },
      (err) => {
        const local = localStorage.getItem(`timewise_modules_${userId}`) || localStorage.getItem('timewise_modules');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) setModules(parsed);
          } catch (e) {}
        }
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/modules`);
      }
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

        if (fetchedRes.length > 0) {
          fetchedRes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setResources(fetchedRes);
          try {
            localStorage.setItem(`timewise_resources_${userId}`, JSON.stringify(fetchedRes));
            localStorage.setItem('timewise_resources', JSON.stringify(fetchedRes));
          } catch (e) {}
        } else {
          const localCache = localStorage.getItem(`timewise_resources_${userId}`) || localStorage.getItem('timewise_resources');
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setResources(parsed);
                const batch = writeBatch(db);
                parsed.forEach((r) => batch.set(doc(db, 'users', userId, 'resources', r.id), sanitizeForFirestore({ ...r, userId })));
                batch.commit().catch(() => {});
                return;
              }
            } catch (e) {}
          }
          setResources(initialResources);
          try {
            localStorage.setItem(`timewise_resources_${userId}`, JSON.stringify(initialResources));
            localStorage.setItem('timewise_resources', JSON.stringify(initialResources));
            const batch = writeBatch(db);
            initialResources.forEach((r) => batch.set(doc(db, 'users', userId, 'resources', r.id), sanitizeForFirestore({ ...r, userId })));
            batch.commit().catch(() => {});
          } catch (e) {}
        }
      },
      (err) => {
        const local = localStorage.getItem(`timewise_resources_${userId}`) || localStorage.getItem('timewise_resources');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) setResources(parsed);
          } catch (e) {}
        }
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/resources`);
      }
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

        if (fetchedSessions.length > 0) {
          setSessions(fetchedSessions);
          try {
            localStorage.setItem(`timewise_sessions_${userId}`, JSON.stringify(fetchedSessions));
            localStorage.setItem('timewise_sessions', JSON.stringify(fetchedSessions));
          } catch (e) {}
        } else {
          const localCache = localStorage.getItem(`timewise_sessions_${userId}`) || localStorage.getItem('timewise_sessions');
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSessions(parsed);
                const batch = writeBatch(db);
                parsed.forEach((s) => batch.set(doc(db, 'users', userId, 'sessions', s.id), sanitizeForFirestore({ ...s, userId })));
                batch.commit().catch(() => {});
                return;
              }
            } catch (e) {}
          }
          setSessions(initialSessions);
          try {
            localStorage.setItem(`timewise_sessions_${userId}`, JSON.stringify(initialSessions));
            localStorage.setItem('timewise_sessions', JSON.stringify(initialSessions));
          } catch (e) {}
        }
      },
      (err) => {
        const local = localStorage.getItem(`timewise_sessions_${userId}`) || localStorage.getItem('timewise_sessions');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) setSessions(parsed);
          } catch (e) {}
        }
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/sessions`);
      }
    );

    // 7. Sync Bookmarks
    const bookmarksCollRef = collection(db, 'users', userId, 'bookmarks');
    const unsubBookmarks = onSnapshot(
      bookmarksCollRef,
      (snapshot) => {
        const fetchedBookmarks: WebsiteBookmark[] = [];
        snapshot.forEach((docSnap) => {
          fetchedBookmarks.push(docSnap.data() as WebsiteBookmark);
        });

        if (fetchedBookmarks.length > 0) {
          setBookmarks(fetchedBookmarks);
          try {
            localStorage.setItem(`timewise_bookmarks_${userId}`, JSON.stringify(fetchedBookmarks));
            localStorage.setItem('timewise_bookmarks', JSON.stringify(fetchedBookmarks));
          } catch (e) {}
        } else {
          const localCache = localStorage.getItem(`timewise_bookmarks_${userId}`) || localStorage.getItem('timewise_bookmarks');
          if (localCache) {
            try {
              const parsed = JSON.parse(localCache);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setBookmarks(parsed);
                const batch = writeBatch(db);
                parsed.forEach((bm) => batch.set(doc(db, 'users', userId, 'bookmarks', bm.id), sanitizeForFirestore({ ...bm, userId })));
                batch.commit().catch(() => {});
                return;
              }
            } catch (e) {}
          }
          setBookmarks(initialBookmarks);
          try {
            localStorage.setItem(`timewise_bookmarks_${userId}`, JSON.stringify(initialBookmarks));
            localStorage.setItem('timewise_bookmarks', JSON.stringify(initialBookmarks));
            const batch = writeBatch(db);
            initialBookmarks.forEach((bm) => batch.set(doc(db, 'users', userId, 'bookmarks', bm.id), sanitizeForFirestore({ ...bm, userId })));
            batch.commit().catch(() => {});
          } catch (e) {}
        }
      },
      (err) => {
        const raw = localStorage.getItem(`timewise_bookmarks_${userId}`) || localStorage.getItem('timewise_bookmarks');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) setBookmarks(parsed);
          } catch (e) {}
        }
        handleFirestoreError(err, OperationType.LIST, `users/${userId}/bookmarks`);
      }
    );

    // 8. HABITS SUBCOLLECTION
    const habitsCollRef = collection(db, 'users', userId, 'habits');
    const unsubHabits = onSnapshot(
      habitsCollRef,
      (snapshot) => {
        const fetchedHabits: Habit[] = [];
        snapshot.forEach((docSnap) => {
          fetchedHabits.push(docSnap.data() as Habit);
        });

        const localCache =
          localStorage.getItem(`timewise_habits_${userId}`) || localStorage.getItem('timewise_habits');
        let localHabits: Habit[] = [];
        if (localCache) {
          try {
            const parsed = JSON.parse(localCache);
            if (Array.isArray(parsed)) localHabits = parsed;
          } catch (e) {}
        }

        if (fetchedHabits.length > 0) {
          // Reconcile remote and local habits so partial Firestore sync never wipes other habits or logs
          const mergedMap = new Map<string, Habit>();
          fetchedHabits.forEach((remoteH) => {
            const localH = localHabits.find((lh) => lh.id === remoteH.id);
            if (localH) {
              const combinedLogsMap = new Map<string, HabitTimeLog>();
              (localH.timeLogs || []).forEach((l) => combinedLogsMap.set(l.id, l));
              (remoteH.timeLogs || []).forEach((l) => combinedLogsMap.set(l.id, l));
              const combinedDates = Array.from(
                new Set([...(remoteH.completedDates || []), ...(localH.completedDates || [])])
              );

              mergedMap.set(remoteH.id, {
                ...remoteH,
                timeLogs: Array.from(combinedLogsMap.values()),
                completedDates: combinedDates,
              });
            } else {
              mergedMap.set(remoteH.id, remoteH);
            }
          });

          // Include any local habits that haven't synced to Firestore yet
          const missingFromRemote: Habit[] = [];
          localHabits.forEach((lh) => {
            if (!mergedMap.has(lh.id)) {
              mergedMap.set(lh.id, lh);
              missingFromRemote.push(lh);
            }
          });

          const finalHabits = Array.from(mergedMap.values()).sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );
          setHabits(finalHabits);

          try {
            localStorage.setItem(`timewise_habits_${userId}`, JSON.stringify(finalHabits));
            localStorage.setItem('timewise_habits', JSON.stringify(finalHabits));
          } catch (e) {}

          // Backfill missing local habits to Firestore
          if (missingFromRemote.length > 0) {
            const batch = writeBatch(db);
            missingFromRemote.forEach((mh) => {
              batch.set(
                doc(db, 'users', userId, 'habits', mh.id),
                sanitizeForFirestore({ ...mh, userId }),
                { merge: true }
              );
            });
            batch.commit().catch(() => {});
          }
        } else {
          if (localHabits.length > 0) {
            setHabits(localHabits);
            const batch = writeBatch(db);
            localHabits.forEach((h) =>
              batch.set(doc(db, 'users', userId, 'habits', h.id), sanitizeForFirestore({ ...h, userId }))
            );
            batch.commit().catch(() => {});
            return;
          }
          const starterHabits = generateInitialHabits();
          setHabits(starterHabits);
          try {
            localStorage.setItem(`timewise_habits_${userId}`, JSON.stringify(starterHabits));
            localStorage.setItem('timewise_habits', JSON.stringify(starterHabits));
            const batch = writeBatch(db);
            starterHabits.forEach((h) =>
              batch.set(doc(db, 'users', userId, 'habits', h.id), sanitizeForFirestore({ ...h, userId }))
            );
            batch.commit().catch(() => {});
          } catch (e) {}
        }
      },
      (err) => {
        const raw =
          localStorage.getItem(`timewise_habits_${userId}`) || localStorage.getItem('timewise_habits');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) setHabits(parsed);
          } catch (e) {}
        }
        console.warn('Firestore habits sync warning:', err);
      }
    );

    return () => {
      unsubUser();
      unsubTasks();
      unsubGoals();
      unsubModules();
      unsubResources();
      unsubSessions();
      unsubBookmarks();
      unsubHabits();
    };
  }, [user, isGuest, canSyncToFirestore, loading]);

  // Navigation Helper
  const setActiveView = (view: ActiveView, goalId?: string, moduleId?: string) => {
    const nextGoalId = goalId ?? (view === 'goal-detail' || view === 'module-detail' ? selectedGoalId : null);
    const nextModuleId = moduleId ?? (view === 'module-detail' ? selectedModuleId : null);

    setActiveViewRaw(view);
    setSelectedGoalId(nextGoalId);
    setSelectedModuleId(nextModuleId);

    const newPath = formatRoutePath(view, nextGoalId, nextModuleId);
    if (window.location.pathname !== newPath) {
      window.history.pushState({ view, goalId: nextGoalId, moduleId: nextModuleId }, '', newPath);
    }

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
  // HABIT & STREAK COMPLETION HELPERS
  // ----------------------------------------------------
  const markHabitCompletedForDate = (habitId: string, dateStr: string) => {
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === habitId);
      if (idx === -1) return prev;

      const currentHabit = prev[idx];
      if (currentHabit.completedDates.includes(dateStr)) {
        return prev;
      }

      const updatedDates = [...currentHabit.completedDates, dateStr];
      const updatedHabit: Habit = {
        ...currentHabit,
        completedDates: updatedDates,
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...prev];
      nextList[idx] = updatedHabit;

      try {
        if (user?.uid) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(nextList));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(nextList));
      } catch (e) {}

      return nextList;
    });

    if (canSyncToFirestore && user) {
      const current = habits.find((h) => h.id === habitId);
      if (current && !current.completedDates.includes(dateStr)) {
        const syncHabit: Habit = {
          ...current,
          completedDates: [...current.completedDates, dateStr],
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };
        const habitDocRef = doc(db, 'users', user.uid, 'habits', habitId);
        setDoc(habitDocRef, sanitizeForFirestore(syncHabit), { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
        });
      }
    }
  };

  const unmarkHabitCompletedForDate = (habitId: string, dateStr: string) => {
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === habitId);
      if (idx === -1) return prev;

      const currentHabit = prev[idx];
      if (!currentHabit.completedDates.includes(dateStr)) {
        return prev;
      }

      const updatedDates = currentHabit.completedDates.filter((d) => d !== dateStr);
      const updatedHabit: Habit = {
        ...currentHabit,
        completedDates: updatedDates,
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...prev];
      nextList[idx] = updatedHabit;

      try {
        if (user?.uid) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(nextList));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(nextList));
      } catch (e) {}

      return nextList;
    });

    if (canSyncToFirestore && user) {
      const current = habits.find((h) => h.id === habitId);
      if (current && current.completedDates.includes(dateStr)) {
        const syncHabit: Habit = {
          ...current,
          completedDates: current.completedDates.filter((d) => d !== dateStr),
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };
        const habitDocRef = doc(db, 'users', user.uid, 'habits', habitId);
        setDoc(habitDocRef, sanitizeForFirestore(syncHabit), { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
        });
      }
    }
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

    setTasks((prev) => {
      const next = [createdTask, ...prev];
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_tasks_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      localStorage.setItem('timewise_tasks', JSON.stringify(next));
      return next;
    });

    if (canSyncToFirestore && user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', id);
      setDoc(taskDocRef, sanitizeForFirestore({ ...createdTask, userId: user.uid })).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/tasks/${id}`)
      );
    }

    // Auto-complete linked streak if created as completed
    if (createdTask.status === 'completed' && createdTask.habitId) {
      const taskDate = createdTask.date || getTodayDateString();
      markHabitCompletedForDate(createdTask.habitId, taskDate);
      const linkedHabit = habits.find((h) => h.id === createdTask.habitId);
      showToast(`Task added & 🔥 Streak for "${linkedHabit?.title || 'Habit'}" marked done for ${taskDate}!`);
    } else {
      showToast('Task added successfully');
    }

    return createdTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const existingTask = tasks.find((t) => t.id === id);
    const targetHabitId = updates.habitId !== undefined ? updates.habitId : existingTask?.habitId;
    const taskDate = updates.date || existingTask?.date || getTodayDateString();

    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_tasks_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      localStorage.setItem('timewise_tasks', JSON.stringify(next));
      return next;
    });

    if (canSyncToFirestore && user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', id);
      updateDoc(taskDocRef, sanitizeForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${id}`)
      );
    }

    // CONNECTION: Auto-complete / uncomplete linked streak for that day
    if (updates.status === 'completed' && targetHabitId) {
      markHabitCompletedForDate(targetHabitId, taskDate);
    } else if (
      updates.status &&
      updates.status !== 'completed' &&
      existingTask?.status === 'completed' &&
      targetHabitId
    ) {
      const hasOtherCompleted = tasks.some(
        (t) =>
          t.id !== id &&
          t.habitId === targetHabitId &&
          (t.date || getTodayDateString()) === taskDate &&
          t.status === 'completed'
      );
      if (!hasOtherCompleted) {
        unmarkHabitCompletedForDate(targetHabitId, taskDate);
      }
    } else if (
      updates.habitId &&
      updates.habitId !== existingTask?.habitId &&
      existingTask?.status === 'completed'
    ) {
      markHabitCompletedForDate(updates.habitId, taskDate);
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_tasks_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    if (selectedTaskId === id) setSelectedTaskId(null);

    if (canSyncToFirestore && user) {
      const taskDocRef = doc(db, 'users', user.uid, 'tasks', id);
      deleteDoc(taskDocRef).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${id}`)
      );
    }

    showToast('Task deleted');
  };

  const linkTaskToHabit = (taskId: string, habitId: string | null) => {
    const task = tasks.find((t) => t.id === taskId);
    updateTask(taskId, { habitId });
    if (habitId) {
      const h = habits.find((item) => item.id === habitId);
      if (task && task.status === 'completed') {
        const taskDate = task.date || getTodayDateString();
        markHabitCompletedForDate(habitId, taskDate);
      }
      showToast(`Linked to streak: "${h?.title || 'Habit'}" 🔥`);
    } else {
      showToast('Streak unlinked from task');
    }
  };

  const toggleTaskComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null;
    const taskDate = task.date || getTodayDateString();

    updateTask(id, {
      status: nextStatus,
      completedAt,
    });

    if (nextStatus === 'completed') {
      if (task.habitId) {
        markHabitCompletedForDate(task.habitId, taskDate);
        const linkedHabit = habits.find((h) => h.id === task.habitId);
        showToast(
          `Task completed! 🔥 Streak for "${linkedHabit?.title || 'Habit'}" completed for ${taskDate}!`
        );
      } else {
        showToast('Task marked complete! Great progress.');
      }
    } else {
      if (task.habitId) {
        const hasOtherCompleted = tasks.some(
          (t) =>
            t.id !== id &&
            t.habitId === task.habitId &&
            (t.date || getTodayDateString()) === taskDate &&
            t.status === 'completed'
        );
        if (!hasOtherCompleted) {
          unmarkHabitCompletedForDate(task.habitId, taskDate);
        }
        const linkedHabit = habits.find((h) => h.id === task.habitId);
        showToast(`Task reopened • Streak for "${linkedHabit?.title || 'Habit'}" updated`);
      }
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

      const reordered = updated.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));

      if (canSyncToFirestore && user) {
        reordered.forEach((taskItem) => {
          const docRef = doc(db, 'users', user.uid, 'tasks', taskItem.id);
          updateDoc(docRef, { order: taskItem.order }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskItem.id}`)
          );
        });
      } else if (user) {
        try {
          localStorage.setItem(`timewise_tasks_${user.uid}`, JSON.stringify(reordered));
        } catch (e) {}
      }

      return reordered;
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

    setGoals((prev) => {
      const next = [...prev, createdGoal];
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_goals_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (canSyncToFirestore && user) {
      const goalDocRef = doc(db, 'users', user.uid, 'goals', id);
      setDoc(goalDocRef, sanitizeForFirestore({ ...createdGoal, userId: user.uid })).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/goals/${id}`)
      );
    }

    showToast('Learning Goal created');
    return createdGoal;
  };

  const updateGoal = (id: string, updates: Partial<LearningGoal>) => {
    setGoals((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_goals_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (canSyncToFirestore && user) {
      const goalDocRef = doc(db, 'users', user.uid, 'goals', id);
      updateDoc(goalDocRef, sanitizeForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/goals/${id}`)
      );
    }
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_goals_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    // Also cascade delete modules and resources
    const targetModules = modules.filter((m) => m.goalId === id);
    targetModules.forEach((m) => deleteModule(m.id));

    if (selectedGoalId === id) {
      setSelectedGoalId(null);
      setActiveView('goals');
    }

    if (canSyncToFirestore && user) {
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

      const reordered = updated.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));

      if (canSyncToFirestore && user) {
        reordered.forEach((goal) => {
          const docRef = doc(db, 'users', user.uid, 'goals', goal.id);
          updateDoc(docRef, { order: goal.order }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/goals/${goal.id}`)
          );
        });
      } else if (user) {
        try {
          localStorage.setItem(`timewise_goals_${user.uid}`, JSON.stringify(reordered));
        } catch (e) {}
      }

      return reordered;
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

    setModules((prev) => {
      const next = [...prev, createdModule];
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_modules_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (canSyncToFirestore && user) {
      const modDocRef = doc(db, 'users', user.uid, 'modules', id);
      setDoc(modDocRef, sanitizeForFirestore({ ...createdModule, userId: user.uid })).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/modules/${id}`)
      );
    }

    showToast('Module created');
    return createdModule;
  };

  const updateModule = (id: string, updates: Partial<Module>) => {
    setModules((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_modules_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (canSyncToFirestore && user) {
      const modDocRef = doc(db, 'users', user.uid, 'modules', id);
      updateDoc(modDocRef, sanitizeForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/modules/${id}`)
      );
    }
  };

  const deleteModule = (id: string) => {
    setModules((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_modules_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    // Cascade delete attached resources
    const targetRes = resources.filter((r) => r.moduleId === id);
    targetRes.forEach((r) => deleteResource(r.id));

    if (selectedModuleId === id) {
      setSelectedModuleId(null);
      setActiveView('goal-detail');
    }

    if (canSyncToFirestore && user) {
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
      order: newResData.order ?? (resources.length + 1),
    };

    setResources((prev) => {
      const next = [...prev, createdRes];
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_resources_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (canSyncToFirestore && user) {
      const resDocRef = doc(db, 'users', user.uid, 'resources', id);
      setDoc(resDocRef, sanitizeForFirestore({ ...createdRes, userId: user.uid })).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/resources/${id}`)
      );
    }

    showToast('Resource added to module');
    return createdRes;
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    const target = resources.find((r) => r.id === id);
    if (!target) return;

    const nextResources = resources.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setResources(nextResources);

    if (user && !canSyncToFirestore) {
      try {
        localStorage.setItem(`timewise_resources_${user.uid}`, JSON.stringify(nextResources));
      } catch (e) {}
    }

    if (activePlayingResource && activePlayingResource.id === id) {
      setActivePlayingResource((prev) => (prev ? { ...prev, ...updates } : null));
    }

    if (canSyncToFirestore && user) {
      const resDocRef = doc(db, 'users', user.uid, 'resources', id);
      updateDoc(resDocRef, sanitizeForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/resources/${id}`)
      );
    }

    recalcModuleProgress(target.moduleId, nextResources);
  };

  const deleteResource = (id: string) => {
    setResources((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_resources_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    if (activePlayingResource?.id === id) {
      setIsResourcePlayerOpen(false);
      setActivePlayingResource(null);
    }

    if (canSyncToFirestore && user) {
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

    setSessions((prev) => {
      const next = [studySession, ...prev];
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_sessions_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (canSyncToFirestore && user) {
      const sessionDocRef = doc(db, 'users', user.uid, 'sessions', studySession.id);
      setDoc(sessionDocRef, sanitizeForFirestore({ ...studySession, userId: user.uid })).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${studySession.id}`)
      );
    }

    recalcModuleProgress(target.moduleId);
    showToast('Resource marked completed');
  };

  const recalcModuleProgress = (moduleId: string, customResources?: Resource[]) => {
    const activeResources = customResources || resources;
    const modResources = activeResources.filter((r) => r.moduleId === moduleId);
    if (modResources.length === 0) return;

    let totalCompletionPercentageSum = 0;
    for (const r of modResources) {
      if (r.isPlaylist) {
        const totalVids = r.playlistVideos?.length || 0;
        const completedVids = r.completedVideoIds?.length || 0;
        const pct = totalVids > 0 ? (completedVids / totalVids) * 100 : (r.status === 'completed' ? 100 : 0);
        totalCompletionPercentageSum += pct;
      } else {
        if (r.status === 'completed') {
          totalCompletionPercentageSum += 100;
        } else if (r.durationSeconds > 0 && r.currentTime > 0) {
          const pct = Math.min(100, Math.round((r.currentTime / r.durationSeconds) * 100));
          totalCompletionPercentageSum += pct;
        }
      }
    }

    const progress = Math.round(totalCompletionPercentageSum / modResources.length);
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

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

      const reordered = updated.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));

      if (canSyncToFirestore && user) {
        reordered.forEach((res) => {
          const docRef = doc(db, 'users', user.uid, 'resources', res.id);
          updateDoc(docRef, { order: res.order, updatedAt: new Date().toISOString() }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/resources/${res.id}`)
          );
        });
      } else if (user) {
        try {
          localStorage.setItem(`timewise_resources_${user.uid}`, JSON.stringify(reordered));
        } catch (e) {}
      }

      return reordered;
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
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      if (user && !canSyncToFirestore) {
        try {
          localStorage.setItem(`timewise_settings_${user.uid}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (canSyncToFirestore && user) {
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
    const initialBm = initialBookmarks;
    setBookmarks(initialBm);
    const initialH = generateInitialHabits();
    setHabits(initialH);
    setSettings(initialSettings);

    if (canSyncToFirestore && user) {
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
      initialBookmarks.forEach((bm) => {
        batch.set(doc(db, 'users', user.uid, 'bookmarks', bm.id), { ...bm, userId: user.uid });
      });
      initialH.forEach((h) => {
        batch.set(doc(db, 'users', user.uid, 'habits', h.id), sanitizeForFirestore({ ...h, userId: user.uid }));
      });
      batch.commit().catch((err) => console.error('Failed to batch save demo data:', err));
    } else if (user) {
      try {
        localStorage.setItem(`timewise_tasks_${user.uid}`, JSON.stringify(initialT));
        localStorage.setItem(`timewise_goals_${user.uid}`, JSON.stringify(initialLearningGoals));
        localStorage.setItem(`timewise_modules_${user.uid}`, JSON.stringify(initialModules));
        localStorage.setItem(`timewise_resources_${user.uid}`, JSON.stringify(initialResources));
        localStorage.setItem(`timewise_sessions_${user.uid}`, JSON.stringify(initialSessions));
        localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(initialBm));
        localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(initialH));
      } catch (e) {}
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
    setBookmarks([]);
    setHabits([]);

    if (canSyncToFirestore && user) {
      tasks.forEach((t) => deleteDoc(doc(db, 'users', user.uid, 'tasks', t.id)));
      goals.forEach((g) => deleteDoc(doc(db, 'users', user.uid, 'goals', g.id)));
      modules.forEach((m) => deleteDoc(doc(db, 'users', user.uid, 'modules', m.id)));
      resources.forEach((r) => deleteDoc(doc(db, 'users', user.uid, 'resources', r.id)));
      sessions.forEach((s) => deleteDoc(doc(db, 'users', user.uid, 'sessions', s.id)));
      bookmarks.forEach((bm) => deleteDoc(doc(db, 'users', user.uid, 'bookmarks', bm.id)));
      habits.forEach((h) => deleteDoc(doc(db, 'users', user.uid, 'habits', h.id)));
    } else if (user) {
      try {
        localStorage.removeItem(`timewise_tasks_${user.uid}`);
        localStorage.removeItem(`timewise_goals_${user.uid}`);
        localStorage.removeItem(`timewise_modules_${user.uid}`);
        localStorage.removeItem(`timewise_resources_${user.uid}`);
        localStorage.removeItem(`timewise_sessions_${user.uid}`);
        localStorage.removeItem(`timewise_bookmarks_${user.uid}`);
        localStorage.removeItem(`timewise_habits_${user.uid}`);
      } catch (e) {}
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

  // Website Bookmarks Actions
  const openBookmarkForm = (bookmark?: WebsiteBookmark | null, category?: string, subcategory?: string) => {
    setBookmarkToEdit(bookmark || null);
    setPreselectedBookmarkCategory(category || null);
    setPreselectedBookmarkSubcategory(subcategory || null);
    setIsBookmarkFormOpen(true);
  };

  const closeBookmarkForm = () => {
    setIsBookmarkFormOpen(false);
    setBookmarkToEdit(null);
    setPreselectedBookmarkCategory(null);
    setPreselectedBookmarkSubcategory(null);
  };

  const addBookmark = (newBookmarkData: Omit<WebsiteBookmark, 'id' | 'createdAt'>): WebsiteBookmark => {
    const id = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdBookmark: WebsiteBookmark = {
      ...newBookmarkData,
      id,
      createdAt: new Date().toISOString(),
      clickCount: 0,
    };

    setBookmarks((prev) => [createdBookmark, ...prev]);

    if (canSyncToFirestore && user) {
      const bmDocRef = doc(db, 'users', user.uid, 'bookmarks', id);
      setDoc(bmDocRef, sanitizeForFirestore({ ...createdBookmark, userId: user.uid })).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/bookmarks/${id}`)
      );
      try {
        const updated = [createdBookmark, ...bookmarks];
        localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(updated));
      } catch (e) {}
    } else if (user) {
      try {
        const updated = [createdBookmark, ...bookmarks];
        localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(updated));
      } catch (e) {}
    } else {
      try {
        const updated = [createdBookmark, ...bookmarks];
        localStorage.setItem('timewise_bookmarks', JSON.stringify(updated));
      } catch (e) {}
    }

    showToast(`Bookmark "${createdBookmark.title}" added`);
    return createdBookmark;
  };

  const updateBookmark = (id: string, updates: Partial<WebsiteBookmark>) => {
    const fullUpdates = { ...updates, updatedAt: new Date().toISOString() };
    setBookmarks((prev) =>
      prev.map((bm) => (bm.id === id ? { ...bm, ...fullUpdates } : bm))
    );

    if (canSyncToFirestore && user) {
      const bmDocRef = doc(db, 'users', user.uid, 'bookmarks', id);
      updateDoc(bmDocRef, sanitizeForFirestore(fullUpdates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/bookmarks/${id}`)
      );
      try {
        const updated = bookmarks.map((bm) => (bm.id === id ? { ...bm, ...fullUpdates } : bm));
        localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(updated));
      } catch (e) {}
    } else if (user) {
      try {
        const updated = bookmarks.map((bm) => (bm.id === id ? { ...bm, ...fullUpdates } : bm));
        localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
    showToast('Bookmark updated');
  };

  const deleteBookmark = (id: string) => {
    const target = bookmarks.find((bm) => bm.id === id);
    setBookmarks((prev) => prev.filter((bm) => bm.id !== id));

    if (canSyncToFirestore && user) {
      const bmDocRef = doc(db, 'users', user.uid, 'bookmarks', id);
      deleteDoc(bmDocRef).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/bookmarks/${id}`)
      );
      try {
        const updated = bookmarks.filter((bm) => bm.id !== id);
        localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(updated));
      } catch (e) {}
    } else if (user) {
      try {
        const updated = bookmarks.filter((bm) => bm.id !== id);
        localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
    showToast(`Bookmark "${target?.title || 'item'}" removed`);
  };

  const togglePinBookmark = (id: string) => {
    const bm = bookmarks.find((b) => b.id === id);
    if (!bm) return;
    const isPinned = !bm.isPinned;
    updateBookmark(id, { isPinned });
  };

  const recordBookmarkClick = (id: string) => {
    const bm = bookmarks.find((b) => b.id === id);
    if (!bm) return;
    const clickCount = (bm.clickCount || 0) + 1;
    const lastVisitedAt = new Date().toISOString();
    updateBookmark(id, { clickCount, lastVisitedAt });
  };

  const reorderBookmarks = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setBookmarks((prev) => {
      const sourceIndex = prev.findIndex((b) => b.id === sourceId);
      const targetIndex = prev.findIndex((b) => b.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      // Strictly maintain the moved card's own category and subcategory
      updated.splice(targetIndex, 0, moved);

      const reordered = updated.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));

      if (canSyncToFirestore && user) {
        reordered.forEach((bm) => {
          const docRef = doc(db, 'users', user.uid, 'bookmarks', bm.id);
          updateDoc(docRef, { order: bm.order, updatedAt: new Date().toISOString() }).catch(() => {});
        });
      }
      if (user) {
        try {
          localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(reordered));
        } catch (e) {}
      } else {
        try {
          localStorage.setItem('timewise_bookmarks', JSON.stringify(reordered));
        } catch (e) {}
      }

      return reordered;
    });
  };

  const reorderPinnedBookmarks = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setPinnedBookmarkOrder((prev) => {
      const currentPinnedIds = bookmarks.filter((b) => b.isPinned).map((b) => b.id);
      const combined = Array.from(
        new Set([...prev.filter((id) => currentPinnedIds.includes(id)), ...currentPinnedIds])
      );
      const sourceIdx = combined.indexOf(sourceId);
      const targetIdx = combined.indexOf(targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const updated = [...combined];
      const [moved] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, moved);

      try {
        localStorage.setItem('timewise_pinned_bookmark_order', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const moveBookmark = (
    bookmarkId: string,
    targetCategory: string,
    targetSubcategory?: string,
    targetBookmarkId?: string
  ) => {
    setBookmarks((prev) => {
      const sourceIndex = prev.findIndex((b) => b.id === bookmarkId);
      if (sourceIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);

      const modified = {
        ...moved,
        category: targetCategory,
        subcategory: targetSubcategory || moved.subcategory || 'General',
      };

      if (targetBookmarkId) {
        const targetIndex = updated.findIndex((b) => b.id === targetBookmarkId);
        if (targetIndex !== -1) {
          updated.splice(targetIndex, 0, modified);
        } else {
          updated.push(modified);
        }
      } else {
        updated.push(modified);
      }

      if (canSyncToFirestore && user) {
        const bmDocRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);
        updateDoc(bmDocRef, {
          category: targetCategory,
          subcategory: modified.subcategory,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
      if (user) {
        try {
          localStorage.setItem(`timewise_bookmarks_${user.uid}`, JSON.stringify(updated));
        } catch (e) {}
      } else {
        try {
          localStorage.setItem('timewise_bookmarks', JSON.stringify(updated));
        } catch (e) {}
      }

      return updated;
    });
    showToast(`Moved to ${targetCategory}${targetSubcategory ? ` / ${targetSubcategory}` : ''}`);
  };

  const reorderCategories = (sourceCat: string, targetCat: string) => {
    if (sourceCat === targetCat) return;
    setCategoryOrder((prev) => {
      const allCats = Array.from(new Set([...prev, ...bookmarks.map((b) => b.category || 'General')]));
      const sourceIdx = allCats.indexOf(sourceCat);
      const targetIdx = allCats.indexOf(targetCat);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const updated = [...allCats];
      const [moved] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, moved);

      try {
        localStorage.setItem('timewise_bookmark_category_order', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Category reordered`);
  };

  const reorderSubcategories = (category: string, sourceSubcat: string, targetSubcat: string) => {
    if (sourceSubcat === targetSubcat) return;
    setSubcategoryOrder((prev) => {
      const existing = prev[category] || [];
      const currentSubs = Array.from(
        new Set([
          ...existing,
          ...bookmarks.filter((b) => b.category === category).map((b) => b.subcategory || 'General'),
        ])
      );

      const sourceIdx = currentSubs.indexOf(sourceSubcat);
      const targetIdx = currentSubs.indexOf(targetSubcat);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const updatedList = [...currentSubs];
      const [moved] = updatedList.splice(sourceIdx, 1);
      updatedList.splice(targetIdx, 0, moved);

      const updatedMap = {
        ...prev,
        [category]: updatedList,
      };

      try {
        localStorage.setItem('timewise_bookmark_subcategory_order', JSON.stringify(updatedMap));
      } catch (e) {}
      return updatedMap;
    });
    showToast(`Subcategory reordered`);
  };

  // Habits & Streaks Operations
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt'>): Habit => {
    const newId = `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newHabit: Habit = {
      ...habitData,
      id: newId,
      userId: user?.uid,
      startDate: habitData.startDate || getTodayDateString(),
      order: habits.length + 1,
      createdAt: new Date().toISOString(),
    };

    setHabits((prev) => {
      const next = [...prev, newHabit];
      try {
        if (user?.uid) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(next));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (canSyncToFirestore && user) {
      const habitDocRef = doc(db, 'users', user.uid, 'habits', newId);
      setDoc(habitDocRef, sanitizeForFirestore(newHabit)).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/habits/${newId}`);
      });
    }

    showToast(`Added habit: ${newHabit.title}`);
    return newHabit;
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    let resolvedUpdatedHabit: Habit | null = null;
    let nextListToSave: Habit[] = [];

    setHabits((prev) => {
      const next = prev.map((h) => {
        if (h.id === id) {
          const mod: Habit = { ...h, ...updates, updatedAt: new Date().toISOString() };
          resolvedUpdatedHabit = mod;
          return mod;
        }
        return h;
      });
      nextListToSave = next;
      return next;
    });

    const fallbackHabit = habits.find((h) => h.id === id);
    const targetHabit: Habit | null =
      resolvedUpdatedHabit ||
      (fallbackHabit ? { ...fallbackHabit, ...updates, updatedAt: new Date().toISOString() } : null);

    if (targetHabit) {
      const finalNext =
        nextListToSave.length > 0
          ? nextListToSave
          : habits.map((h) => (h.id === id ? targetHabit : h));

      try {
        if (user) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(finalNext));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(finalNext));
      } catch (e) {}

      if (canSyncToFirestore && user) {
        const habitDocRef = doc(db, 'users', user.uid, 'habits', id);
        setDoc(habitDocRef, sanitizeForFirestore({ ...targetHabit, userId: user.uid }), { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${id}`);
        });
      }
    }

    showToast('Habit updated');
  };

  const deleteHabit = (id: string) => {
    let nextListToSave: Habit[] = [];
    setHabits((prev) => {
      const next = prev.filter((h) => h.id !== id);
      nextListToSave = next;
      return next;
    });

    const finalNext =
      nextListToSave.length > 0 ? nextListToSave : habits.filter((h) => h.id !== id);

    try {
      if (user) {
        localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(finalNext));
      }
      localStorage.setItem('timewise_habits', JSON.stringify(finalNext));
    } catch (e) {}

    if (canSyncToFirestore && user) {
      const habitDocRef = doc(db, 'users', user.uid, 'habits', id);
      deleteDoc(habitDocRef).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/habits/${id}`);
      });
    }

    showToast('Habit deleted');
  };

  const toggleHabitDate = (habitId: string, dateStr: string) => {
    let resolvedUpdatedHabit: Habit | null = null;
    let nextListToSave: Habit[] = [];

    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === habitId);
      if (idx === -1) return prev;

      const currentHabit = prev[idx];
      const hasDate = currentHabit.completedDates.includes(dateStr);
      const updatedDates = hasDate
        ? currentHabit.completedDates.filter((d) => d !== dateStr)
        : [...currentHabit.completedDates, dateStr];

      const updatedHabit: Habit = {
        ...currentHabit,
        completedDates: updatedDates,
        updatedAt: new Date().toISOString(),
      };

      resolvedUpdatedHabit = updatedHabit;

      const nextList = [...prev];
      nextList[idx] = updatedHabit;
      nextListToSave = nextList;
      return nextList;
    });

    const fallbackHabit = habits.find((h) => h.id === habitId);
    const targetHabit: Habit | null =
      resolvedUpdatedHabit ||
      (fallbackHabit
        ? {
            ...fallbackHabit,
            completedDates: fallbackHabit.completedDates.includes(dateStr)
              ? fallbackHabit.completedDates.filter((d) => d !== dateStr)
              : [...fallbackHabit.completedDates, dateStr],
            updatedAt: new Date().toISOString(),
          }
        : null);

    if (targetHabit) {
      const finalNext =
        nextListToSave.length > 0
          ? nextListToSave
          : habits.map((h) => (h.id === habitId ? targetHabit : h));

      try {
        if (user) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(finalNext));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(finalNext));
      } catch (e) {}

      if (canSyncToFirestore && user) {
        const habitDocRef = doc(db, 'users', user.uid, 'habits', habitId);
        setDoc(habitDocRef, sanitizeForFirestore({ ...targetHabit, userId: user.uid }), { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
        });
      }

      const hasDate = fallbackHabit?.completedDates.includes(dateStr);
      showToast(hasDate ? `Unmarked for ${dateStr}` : `Marked done for ${dateStr}! 🔥`);
    }
  };

  const reorderHabits = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setHabits((prev) => {
      const srcIdx = prev.findIndex((h) => h.id === sourceId);
      const tgtIdx = prev.findIndex((h) => h.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, moved);
      const reindexed = next.map((h, index) => ({ ...h, order: index + 1 }));

      try {
        if (user) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(reindexed));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(reindexed));
      } catch (e) {}

      if (canSyncToFirestore && user) {
        const batch = writeBatch(db);
        reindexed.forEach((h) => {
          batch.set(doc(db, 'users', user.uid, 'habits', h.id), sanitizeForFirestore({ ...h, userId: user.uid }), { merge: true });
        });
        batch.commit().catch(() => {});
      }

      return reindexed;
    });
  };

  // ----------------------------------------------------
  // HABIT TIME TRACKING (MANUAL LOGS & DYNAMIC LIVE TIMER)
  // ----------------------------------------------------
  const addHabitTimeLog = (
    habitId: string,
    logData: Omit<HabitTimeLog, 'id' | 'createdAt'>,
    markCompleted: boolean = true
  ) => {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newLog: HabitTimeLog = {
      ...logData,
      id,
      habitId,
      createdAt: new Date().toISOString(),
    };

    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === habitId);
      if (idx === -1) return prev;

      const currentHabit = prev[idx];
      const existingLogs = currentHabit.timeLogs || [];
      const updatedLogs = [newLog, ...existingLogs];

      let updatedCompletedDates = currentHabit.completedDates || [];
      if (markCompleted && !updatedCompletedDates.includes(logData.date)) {
        updatedCompletedDates = [...updatedCompletedDates, logData.date];
      }

      const updatedHabit: Habit = {
        ...currentHabit,
        timeLogs: updatedLogs,
        completedDates: updatedCompletedDates,
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...prev];
      nextList[idx] = updatedHabit;

      try {
        if (user?.uid) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(nextList));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(nextList));
      } catch (e) {}

      return nextList;
    });

    if (canSyncToFirestore && user) {
      const current = habits.find((h) => h.id === habitId);
      const updatedLogs = [newLog, ...(current?.timeLogs || [])];
      let updatedCompletedDates = current?.completedDates || [];
      if (markCompleted && !updatedCompletedDates.includes(logData.date)) {
        updatedCompletedDates = [...updatedCompletedDates, logData.date];
      }
      const syncHabit: Habit = {
        ...(current || {
          id: habitId,
          title: 'Habit',
          category: 'General',
          color: 'blue',
          frequency: 'daily' as const,
          createdAt: new Date().toISOString(),
        }),
        timeLogs: updatedLogs,
        completedDates: updatedCompletedDates,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      };

      const habitDocRef = doc(db, 'users', user.uid, 'habits', habitId);
      setDoc(habitDocRef, sanitizeForFirestore(syncHabit), { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
      });
    }

    const durationText = formatDurationHuman(logData.durationMinutes);
    showToast(`Logged ${durationText} on ${logData.date}`);
  };

  const deleteHabitTimeLog = (habitId: string, logId: string) => {
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === habitId);
      if (idx === -1) return prev;

      const currentHabit = prev[idx];
      const updatedLogs = (currentHabit.timeLogs || []).filter((l) => l.id !== logId);

      const updatedHabit: Habit = {
        ...currentHabit,
        timeLogs: updatedLogs,
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...prev];
      nextList[idx] = updatedHabit;

      try {
        if (user?.uid) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(nextList));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(nextList));
      } catch (e) {}

      return nextList;
    });

    if (canSyncToFirestore && user) {
      const current = habits.find((h) => h.id === habitId);
      if (current) {
        const updatedLogs = (current.timeLogs || []).filter((l) => l.id !== logId);
        const syncHabit: Habit = {
          ...current,
          timeLogs: updatedLogs,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };

        const habitDocRef = doc(db, 'users', user.uid, 'habits', habitId);
        setDoc(habitDocRef, sanitizeForFirestore(syncHabit), { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
        });
      }
    }

    showToast('Time log removed');
  };

  const updateHabitTimeLog = (habitId: string, logId: string, updates: Partial<HabitTimeLog>) => {
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === habitId);
      if (idx === -1) return prev;

      const currentHabit = prev[idx];
      const updatedLogs = (currentHabit.timeLogs || []).map((l) => {
        if (l.id === logId) {
          return { ...l, ...updates };
        }
        return l;
      });

      const updatedHabit: Habit = {
        ...currentHabit,
        timeLogs: updatedLogs,
        updatedAt: new Date().toISOString(),
      };

      const nextList = [...prev];
      nextList[idx] = updatedHabit;

      try {
        if (user?.uid) {
          localStorage.setItem(`timewise_habits_${user.uid}`, JSON.stringify(nextList));
        }
        localStorage.setItem('timewise_habits', JSON.stringify(nextList));
      } catch (e) {}

      return nextList;
    });

    if (canSyncToFirestore && user) {
      const current = habits.find((h) => h.id === habitId);
      if (current) {
        const updatedLogs = (current.timeLogs || []).map((l) =>
          l.id === logId ? { ...l, ...updates } : l
        );
        const syncHabit: Habit = {
          ...current,
          timeLogs: updatedLogs,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };

        const habitDocRef = doc(db, 'users', user.uid, 'habits', habitId);
        setDoc(habitDocRef, sanitizeForFirestore(syncHabit), { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
        });
      }
    }

    showToast('Time log updated');
  };

  const startHabitTimer = (habitId: string) => {
    const startTimestamp = Date.now();
    const startTimeStr = getCurrentTimeString24h(new Date());
    const timerData = { habitId, startTimestamp, startTimeStr };

    setActiveHabitTimer(timerData);
    try {
      localStorage.setItem('timewise_active_habit_timer', JSON.stringify(timerData));
    } catch (e) {}

    const targetHabit = habits.find((h) => h.id === habitId);
    showToast(`⏱️ Started timer for "${targetHabit?.title || 'Habit'}"`);
  };

  const stopHabitTimer = (
    habitId: string,
    notes?: string,
    markCompleted: boolean = true
  ): HabitTimeLog | null => {
    if (!activeHabitTimer || activeHabitTimer.habitId !== habitId) {
      return null;
    }

    const endTimestamp = Date.now();
    const endTimeStr = getCurrentTimeString24h(new Date());
    const elapsedMinutes = Math.max(
      1,
      Math.round((endTimestamp - activeHabitTimer.startTimestamp) / (1000 * 60))
    );

    const logData: Omit<HabitTimeLog, 'id' | 'createdAt'> = {
      habitId,
      date: getTodayDateString(),
      startTime: activeHabitTimer.startTimeStr,
      endTime: endTimeStr,
      durationMinutes: elapsedMinutes,
      notes: notes?.trim() || undefined,
    };

    addHabitTimeLog(habitId, logData, markCompleted);

    setActiveHabitTimer(null);
    try {
      localStorage.removeItem('timewise_active_habit_timer');
    } catch (e) {}

    return {
      ...logData,
      id: `log_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  };

  const cancelHabitTimer = (habitId: string) => {
    if (activeHabitTimer?.habitId === habitId) {
      setActiveHabitTimer(null);
      try {
        localStorage.removeItem('timewise_active_habit_timer');
      } catch (e) {}
      showToast('Timer cancelled');
    }
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
        linkTaskToHabit,
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
        bookmarks,
        isBookmarkFormOpen,
        bookmarkToEdit,
        preselectedBookmarkCategory,
        preselectedBookmarkSubcategory,
        openBookmarkForm,
        closeBookmarkForm,
        addBookmark,
        updateBookmark,
        deleteBookmark,
        togglePinBookmark,
        recordBookmarkClick,
        reorderBookmarks,
        moveBookmark,
        pinnedBookmarkOrder,
        reorderPinnedBookmarks,
        categoryOrder,
        reorderCategories,
        subcategoryOrder,
        reorderSubcategories,
        habits,
        habitCategories,
        addCustomHabitCategory,
        isHabitFormOpen,
        habitToEdit,
        openHabitForm,
        closeHabitForm,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitDate,
        markHabitCompletedForDate,
        unmarkHabitCompletedForDate,
        reorderHabits,
        addHabitTimeLog,
        deleteHabitTimeLog,
        updateHabitTimeLog,
        activeHabitTimer,
        startHabitTimer,
        stopHabitTimer,
        cancelHabitTimer,
        isTimeTrackerOpen,
        activeTimeTrackingHabitId,
        timeTrackerInitialDate,
        openTimeTracker,
        closeTimeTracker,
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
