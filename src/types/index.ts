export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskCategory = string;

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  links?: TaskLink[];
}

export type LinkType = 'figma' | 'docs' | 'youtube' | 'reference' | 'github' | 'other';

export interface TaskLink {
  id: string;
  title: string;
  url: string;
  type: LinkType;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "09:00" (24h format for calculation)
  endTime: string; // "10:30" (24h format for calculation)
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  goalId?: string | null;
  moduleId?: string | null;
  resourceId?: string | null;
  subtasks: Subtask[];
  links: TaskLink[];
  notes: string;
  createdAt: string;
  completedAt?: string | null;
  order?: number;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  progress: number; // 0 - 100
  category: string;
  totalLearningTimeMinutes: number;
  lastStudiedAt: string;
  color?: string;
  order?: number;
}

export type ModuleStatus = 'completed' | 'in_progress' | 'not_started' | 'locked';

export interface Module {
  id: string;
  goalId: string;
  order: number;
  code: string; // e.g. "01", "02"
  title: string;
  description: string;
  status: ModuleStatus;
  progress: number; // 0 - 100
  notes: string;
  icon?: string;
  imageUrl?: string;
}

export type ResourceType = 'youtube' | 'article' | 'documentation' | 'reference';
export type ResourceSection = 'learn' | 'practice' | 'review';
export type ResourceStatus = 'not_started' | 'in_progress' | 'completed' | 'saved';

export interface PlaylistVideo {
  videoId: string;
  title: string;
  channel?: string;
  durationSeconds?: number;
  thumbnail?: string;
  index: number;
}

export interface Resource {
  id: string;
  goalId: string;
  moduleId: string;
  type: ResourceType;
  section: ResourceSection;
  title: string;
  url: string;
  channel?: string;
  thumbnail?: string;
  durationSeconds: number; // e.g. 2120 = 35m 20s
  videoId?: string; // YouTube video ID (e.g. "k32voqQhODc")
  playlistId?: string; // YouTube playlist ID (e.g. "PL4Gr5tOAPJi...")
  isPlaylist?: boolean;
  playlistVideos?: PlaylistVideo[];
  currentPlaylistIndex?: number;
  completedVideoIds?: string[];
  status: ResourceStatus;
  currentTime: number; // playback position in seconds
  lastWatchedAt?: string;
  description?: string;
  notes?: string;
  order?: number;
  videoCount?: number;
}

export interface LearningSession {
  id: string;
  resourceId: string;
  goalId: string;
  moduleId: string;
  resourceTitle: string;
  activityType: 'Video Lecture' | 'Documentation' | 'Practice Exercise' | 'Project Code';
  durationMinutes: number;
  timestamp: string; // ISO string or human string
}

export interface UserSettings {
  timezone: string;
  dailyTargetMinutes: number;
  timeFormat: '12h' | '24h';
  soundEnabled: boolean;
  name: string;
}

export interface WebsiteBookmark {
  id: string;
  title: string;
  url: string;
  faviconUrl: string;
  category: string;
  subcategory?: string;
  notes?: string;
  isPinned?: boolean;
  clickCount?: number;
  lastVisitedAt?: string;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface HabitTimeLog {
  id: string;
  habitId: string;
  date: string; // ISO date 'YYYY-MM-DD'
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number; // Duration in minutes
  notes?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  category: string;
  color: string; // Preset name or hex code
  customColorHex?: string; // Optional explicit hex code e.g. '#6366F1'
  icon?: string; // Preset icon identifier or 'custom'
  customIconUrl?: string; // Base64 data URL or external URL for uploaded custom icon
  frequency: 'daily' | 'weekdays' | 'custom';
  startDate?: string; // ISO date 'YYYY-MM-DD' when the habit tracking starts
  completedDates: string[]; // array of ISO 'YYYY-MM-DD'
  targetDaysPerWeek?: number;
  timeLogs?: HabitTimeLog[]; // Array of manual & dynamic time logs
  order?: number;
  archived?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ActiveView = 
  | 'tasks'
  | 'goals'
  | 'goal-detail'
  | 'module-detail'
  | 'progress'
  | 'bookmarks'
  | 'habits'
  | 'settings';
