import {
  Task,
  LearningGoal,
  Module,
  Resource,
  LearningSession,
  UserSettings,
  WebsiteBookmark,
} from '../types';
import { getTodayDateString } from '../utils/timeUtils';

// Helper to format hours & minutes to "HH:mm"
function formatHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function generateInitialTasks(): Task[] {
  const now = new Date();
  const today = getTodayDateString();

  // Tomorrow date
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  // Completed task earlier today
  const tCompStart = new Date(now.getTime() - 150 * 60 * 1000); // 2.5h ago
  const tCompEnd = new Date(now.getTime() - 60 * 60 * 1000); // 1h ago
  const tCompFinished = new Date(now.getTime() - 75 * 60 * 1000);

  // Active task running right now (started 25m ago, ends in 45m)
  const tActiveStart = new Date(now.getTime() - 25 * 60 * 1000);
  const tActiveEnd = new Date(now.getTime() + 45 * 60 * 1000);

  // Upcoming task starting in 55m
  const tUp1Start = new Date(now.getTime() + 55 * 60 * 1000);
  const tUp1End = new Date(now.getTime() + 115 * 60 * 1000);

  // Upcoming task starting in 130m
  const tUp2Start = new Date(now.getTime() + 130 * 60 * 1000);
  const tUp2End = new Date(now.getTime() + 190 * 60 * 1000);

  return [
    {
      id: 'task-1',
      title: 'Watch CSS Grid Complete Tutorial',
      date: today,
      startTime: formatHHMM(tActiveStart),
      endTime: formatHHMM(tActiveEnd),
      priority: 'high',
      status: 'in_progress',
      category: 'Learning',
      goalId: 'goal-webdesign',
      moduleId: 'mod-wd-04',
      resourceId: 'res-css-grid-video',
      subtasks: [
        { id: 'sub-1', title: 'Understand grid-template-columns and fr units', completed: true },
        { id: 'sub-2', title: 'Practice repeat() and minmax() functions', completed: true },
        { id: 'sub-3', title: 'Test auto-fit vs auto-fill behavior', completed: false },
        { id: 'sub-4', title: 'Build responsive 3-column card grid', completed: false },
      ],
      links: [
        { id: 'lnk-1', title: 'CSS Grid Tutorial (YouTube)', url: 'https://www.youtube.com/watch?v=rg7Fvvl3taU', type: 'youtube' },
        { id: 'lnk-2', title: 'MDN Grid Layout Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout', type: 'docs' },
        { id: 'lnk-3', title: 'Grid Garden Practice', url: 'https://cssgridgarden.com', type: 'reference' }
      ],
      notes: 'Focus on how auto-fit handles varying card counts without explicit media queries. Test with 320px minimum column constraint.',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: 'task-2',
      title: 'Build Elementor Hero Section',
      date: today,
      startTime: formatHHMM(tUp1Start),
      endTime: formatHHMM(tUp1End),
      priority: 'high',
      status: 'todo',
      category: 'Practice',
      goalId: 'goal-wordpress',
      moduleId: 'mod-wp-06',
      resourceId: 'res-elementor-container',
      subtasks: [
        { id: 'sub-21', title: 'Create Flexbox container structure', completed: true },
        { id: 'sub-22', title: 'Add heading and lead typography', completed: true },
        { id: 'sub-23', title: 'Add CTA button with micro-interaction', completed: false },
        { id: 'sub-24', title: 'Add high-res editorial image with overlay', completed: false },
        { id: 'sub-25', title: 'Test responsive layout on mobile breakpoint', completed: false },
      ],
      links: [
        { id: 'lnk-21', title: 'Figma Reference File', url: 'https://figma.com', type: 'figma' },
        { id: 'lnk-22', title: 'Elementor Container Docs', url: 'https://elementor.com/help/flexbox-containers/', type: 'docs' },
        { id: 'lnk-23', title: 'Hero Section Inspiration', url: 'https://dribbble.com', type: 'reference' }
      ],
      notes: 'Make sure outer container uses min-height: 80vh and inner content has 16px padding on mobile.',
      createdAt: new Date(now.getTime() - 40000000).toISOString(),
    },
    {
      id: 'task-3',
      title: 'Read WordPress Documentation',
      date: today,
      startTime: formatHHMM(tCompStart),
      endTime: formatHHMM(tCompEnd),
      priority: 'medium',
      status: 'completed',
      category: 'Review',
      goalId: 'goal-wordpress',
      moduleId: 'mod-wp-04',
      resourceId: 'res-wp-plugins-doc',
      subtasks: [
        { id: 'sub-31', title: 'Review Hook system (actions vs filters)', completed: true },
        { id: 'sub-32', title: 'Understand plugin activation lifecycle', completed: true },
        { id: 'sub-33', title: 'Write down sample add_action snippet in notes', completed: true },
      ],
      links: [
        { id: 'lnk-31', title: 'WordPress Plugin Handbook', url: 'https://developer.wordpress.org/plugins/', type: 'docs' }
      ],
      notes: 'Action hooks execute code at specific points; filter hooks modify data before it is rendered or stored.',
      createdAt: new Date(now.getTime() - 200000000).toISOString(),
      completedAt: tCompFinished.toISOString(),
    },
    {
      id: 'task-4',
      title: 'Complete C Pointer Exercises',
      date: today,
      startTime: formatHHMM(tUp2Start),
      endTime: formatHHMM(tUp2End),
      priority: 'medium',
      status: 'todo',
      category: 'Practice',
      goalId: 'goal-cprog',
      moduleId: 'mod-c-03',
      resourceId: 'res-c-pointers-doc',
      subtasks: [
        { id: 'sub-41', title: 'Exercise 1: Pointer arithmetic with arrays', completed: false },
        { id: 'sub-42', title: 'Exercise 2: Swap function using pointers', completed: false },
        { id: 'sub-43', title: 'Exercise 3: String length function without strlen', completed: false },
        { id: 'sub-44', title: 'Run valgrind to check for memory leaks', completed: false },
      ],
      links: [
        { id: 'lnk-41', title: 'C Pointers Guide', url: 'https://www.learn-c.org/en/Pointers', type: 'docs' },
        { id: 'lnk-42', title: 'Compiler Explorer (Godbolt)', url: 'https://godbolt.org', type: 'reference' }
      ],
      notes: 'Remember dereferencing `*ptr` accesses the value, while `&var` retrieves the memory address.',
      createdAt: new Date(now.getTime() - 10000000).toISOString(),
    },
    {
      id: 'task-5',
      title: 'Reply to client website review email',
      date: today,
      startTime: '17:00',
      endTime: '17:30',
      priority: 'low',
      status: 'todo',
      category: 'Work',
      subtasks: [
        { id: 'sub-51', title: 'Draft reply regarding staging feedback', completed: false },
        { id: 'sub-52', title: 'Attach updated screenshot of hero banner', completed: false }
      ],
      links: [],
      notes: 'Independent task (not bound to a learning goal). Keep concise.',
      createdAt: new Date(now.getTime() - 50000000).toISOString(),
    },
    {
      id: 'task-6',
      title: 'JavaScript Closures and Scope Practice',
      date: tomorrow,
      startTime: '10:00',
      endTime: '11:30',
      priority: 'high',
      status: 'todo',
      category: 'Learning',
      goalId: 'goal-javascript',
      moduleId: 'mod-js-02',
      resourceId: 'res-js-closures-video',
      subtasks: [
        { id: 'sub-61', title: 'Watch explanation of lexical environment', completed: false },
        { id: 'sub-62', title: 'Build memoization function from scratch', completed: false },
        { id: 'sub-63', title: 'Solve 3 LeetCode closure problems', completed: false }
      ],
      links: [
        { id: 'lnk-61', title: 'JavaScript Closures Video', url: 'https://www.youtube.com/watch?v=1S8SBDh-zk8', type: 'youtube' }
      ],
      notes: 'A closure is the combination of a function bundled together with references to its surrounding lexical state.',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    }
  ];
}

export const initialLearningGoals: LearningGoal[] = [
  {
    id: 'goal-wordpress',
    title: 'WordPress',
    description: 'Learn WordPress from fundamentals through advanced website building, custom themes, and full-site editing.',
    coverImage: '/src/assets/images/goal_cover_wordpress_1790353812080.jpg',
    progress: 72,
    category: 'CMS & Web',
    totalLearningTimeMinutes: 1475, // 24h 35m
    lastStudiedAt: 'Today, 8:30 PM',
  },
  {
    id: 'goal-webdesign',
    title: 'Web Design & Development',
    description: 'Master modern layout, CSS Grid, Flexbox, responsive typography, and design systems for production websites.',
    coverImage: '/src/assets/images/goal_cover_webdesign_1790353826065.jpg',
    progress: 45,
    category: 'Frontend Engineering',
    totalLearningTimeMinutes: 1095, // 18h 15m
    lastStudiedAt: 'Today, 10:15 PM',
  },
  {
    id: 'goal-cprog',
    title: 'C Programming',
    description: 'Low-level systems programming, pointers, memory allocation, and data structures from first principles.',
    coverImage: '/src/assets/images/goal_cover_cprogramming_1790353839928.jpg',
    progress: 28,
    category: 'Systems & Computer Science',
    totalLearningTimeMinutes: 760, // 12h 40m
    lastStudiedAt: 'Yesterday, 4:10 PM',
  },
  {
    id: 'goal-javascript',
    title: 'JavaScript',
    description: 'Core language mechanics, closures, asynchronous patterns, prototypes, and modern ESNext features.',
    coverImage: '/src/assets/images/goal_cover_javascript_1790353853600.jpg',
    progress: 15,
    category: 'Programming Languages',
    totalLearningTimeMinutes: 560, // 9h 20m
    lastStudiedAt: '3 days ago',
  }
];

export const initialModules: Module[] = [
  // WordPress Modules
  {
    id: 'mod-wp-01',
    goalId: 'goal-wordpress',
    order: 1,
    code: '01',
    title: 'WordPress Fundamentals',
    description: 'Core concepts of WordPress, architecture, server requirements, and initial setup.',
    status: 'not_started',
    progress: 0,
    notes: 'Understood wp-config, database prefix, and file hierarchy.'
  },
  {
    id: 'mod-wp-02',
    goalId: 'goal-wordpress',
    order: 2,
    code: '02',
    title: 'Dashboard & Settings',
    description: 'Deep dive into admin dashboard settings, permalinks, media library, and user roles.',
    status: 'not_started',
    progress: 0,
    notes: 'Always configure permalinks to /%postname%/ on fresh installs.'
  },
  {
    id: 'mod-wp-03',
    goalId: 'goal-wordpress',
    order: 3,
    code: '03',
    title: 'Themes',
    description: 'Classic vs Block themes, template hierarchy, child themes, and theme customizer.',
    status: 'not_started',
    progress: 0,
    notes: 'Child themes prevent updates from wiping custom style changes.'
  },
  {
    id: 'mod-wp-04',
    goalId: 'goal-wordpress',
    order: 4,
    code: '04',
    title: 'Plugins',
    description: 'Plugin directory, essential plugins, hook lifecycle, and security best practices.',
    status: 'completed',
    progress: 100,
    notes: 'Keep active plugins under 25 for optimal TTFB.'
  },
  {
    id: 'mod-wp-05',
    goalId: 'goal-wordpress',
    order: 5,
    code: '05',
    title: 'Gutenberg',
    description: 'Block editor mechanics, reusable blocks, template parts, and theme.json.',
    status: 'not_started',
    progress: 0,
    notes: 'theme.json is the source of truth for global styles.'
  },
  {
    id: 'mod-wp-06',
    goalId: 'goal-wordpress',
    order: 6,
    code: '06',
    title: 'Elementor Advanced',
    description: 'Mastering Elementor Flexbox Containers, CSS Grid, custom breakpoints, and dynamic tags.',
    status: 'in_progress',
    progress: 65,
    notes: 'Use CSS grid containers for portfolio items and flexbox for linear card contents.'
  },
  {
    id: 'mod-wp-07',
    goalId: 'goal-wordpress',
    order: 7,
    code: '07',
    title: 'Responsive Design',
    description: 'Fluid typography, viewport units, mobile breakpoints, and touch interaction tuning.',
    status: 'in_progress',
    progress: 40,
    notes: 'Test on real mobile devices to catch navigation jumpiness.'
  },
  {
    id: 'mod-wp-08',
    goalId: 'goal-wordpress',
    order: 8,
    code: '08',
    title: 'Crocoblock',
    description: 'JetEngine custom post types, relations, dynamic listings, and filtering queries.',
    status: 'not_started',
    progress: 0,
    notes: ''
  },
  {
    id: 'mod-wp-09',
    goalId: 'goal-wordpress',
    order: 9,
    code: '09',
    title: 'Performance & Optimization',
    description: 'Object caching, Redis, image WebP conversion, critical CSS, and CDN setup.',
    status: 'not_started',
    progress: 0,
    notes: ''
  },
  {
    id: 'mod-wp-10',
    goalId: 'goal-wordpress',
    order: 10,
    code: '10',
    title: 'SEO & Schema',
    description: 'Technical SEO, XML sitemaps, structured schema markup, and meta robots tags.',
    status: 'not_started',
    progress: 0,
    notes: ''
  },

  // Web Design & Dev Modules
  {
    id: 'mod-wd-01',
    goalId: 'goal-webdesign',
    order: 1,
    code: '01',
    title: 'UI/UX Fundamentals',
    description: 'Visual hierarchy, Gestalt laws, spacing scales, and user journey flow.',
    status: 'not_started',
    progress: 0,
    notes: 'Law of proximity creates natural groupings without explicit cards.'
  },
  {
    id: 'mod-wd-02',
    goalId: 'goal-webdesign',
    order: 2,
    code: '02',
    title: 'Typography & Readability',
    description: 'Modular type scales, line heights, measure constraints, and font pairing.',
    status: 'not_started',
    progress: 0,
    notes: 'Optimal reading measure is between 60 and 75 characters.'
  },
  {
    id: 'mod-wd-03',
    goalId: 'goal-webdesign',
    order: 3,
    code: '03',
    title: 'Color Theory & Systems',
    description: '60-30-10 distribution, perceptual contrast ratios, and accessible status tokens.',
    status: 'not_started',
    progress: 0,
    notes: 'Never communicate status through color alone.'
  },
  {
    id: 'mod-wd-04',
    goalId: 'goal-webdesign',
    order: 4,
    code: '04',
    title: 'Layout & CSS Grid',
    description: 'CSS Grid, fr units, minmax(), subgrid, template areas, and auto-fit techniques.',
    status: 'in_progress',
    progress: 78,
    notes: 'CSS Grid is for two-dimensional structure; Flexbox is for one-dimensional linear flow.'
  },
  {
    id: 'mod-wd-05',
    goalId: 'goal-webdesign',
    order: 5,
    code: '05',
    title: 'Responsive Design & Mobile-First',
    description: 'Container queries, fluid clamping, media queries, and responsive images.',
    status: 'not_started',
    progress: 0,
    notes: ''
  },
  {
    id: 'mod-wd-06',
    goalId: 'goal-webdesign',
    order: 6,
    code: '06',
    title: 'HTML & Semantic Architecture',
    description: 'Landmarks, document outlines, accessibility trees, and microdata.',
    status: 'not_started',
    progress: 0,
    notes: ''
  },

  // C Programming Modules
  {
    id: 'mod-c-01',
    goalId: 'goal-cprog',
    order: 1,
    code: '01',
    title: 'Intro & Compilation Model',
    description: 'GCC, Clang, preprocessing, assembly, compilation, and linking stages.',
    status: 'not_started',
    progress: 0,
    notes: 'Use -Wall -Wextra -Werror for clean compilation flags.'
  },
  {
    id: 'mod-c-02',
    goalId: 'goal-cprog',
    order: 2,
    code: '02',
    title: 'Types & Control Flow',
    description: 'Primitive types, signed vs unsigned, bitwise operators, and switch statements.',
    status: 'not_started',
    progress: 0,
    notes: 'Size of int is architecture dependent; use <stdint.h> uint32_t for precision.'
  },
  {
    id: 'mod-c-03',
    goalId: 'goal-cprog',
    order: 3,
    code: '03',
    title: 'Pointers & Memory Addresses',
    description: 'Address-of operator, dereferencing, pointer arithmetic, void pointers, and stack memory.',
    status: 'in_progress',
    progress: 35,
    notes: 'Pointer + 1 advances by sizeof(type) bytes.'
  },

  // JavaScript Modules
  {
    id: 'mod-js-01',
    goalId: 'goal-javascript',
    order: 1,
    code: '01',
    title: 'Execution Context & Call Stack',
    description: 'Creation phase, execution phase, hoisting, and the call stack.',
    status: 'not_started',
    progress: 0,
    notes: 'Var declarations are hoisted and initialized to undefined; let/const remain in TDZ.'
  },
  {
    id: 'mod-js-02',
    goalId: 'goal-javascript',
    order: 2,
    code: '02',
    title: 'Closures & Scope Chain',
    description: 'Lexical scoping, closure memory mechanics, currying, and private state encapsulation.',
    status: 'in_progress',
    progress: 30,
    notes: 'Closures retain references, not copies of outer variables.'
  }
];

export const initialResources: Resource[] = [
  // Web Design CSS Grid
  {
    id: 'res-css-grid-video',
    goalId: 'goal-webdesign',
    moduleId: 'mod-wd-04',
    type: 'youtube',
    section: 'learn',
    title: 'CSS Grid Complete Tutorial',
    url: 'https://www.youtube.com/watch?v=rg7Fvvl3taU',
    channel: 'Kevin Powell',
    thumbnail: 'https://img.youtube.com/vi/rg7Fvvl3taU/hqdefault.jpg',
    durationSeconds: 2120, // 35:20
    videoId: 'rg7Fvvl3taU',
    status: 'in_progress',
    currentTime: 1062, // 17:42
    lastWatchedAt: 'Today, 10:15 PM',
    description: 'A comprehensive, clear deep-dive into CSS Grid: from track sizing to auto-fill vs auto-fit.',
    notes: 'Key takeaway at 17:42: repeat(auto-fit, minmax(280px, 1fr)) creates automatic wrapping without media queries.'
  },
  {
    id: 'res-mdn-grid',
    goalId: 'goal-webdesign',
    moduleId: 'mod-wd-04',
    type: 'documentation',
    section: 'learn',
    title: 'MDN Web Docs: CSS Grid Layout Guide',
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout',
    durationSeconds: 900, // 15m read
    status: 'completed',
    currentTime: 900,
    description: 'Official Mozilla Developer Network comprehensive specification of CSS Grid layout module.',
    notes: 'Grid items can overlap by assigning them to the same grid-row and grid-column coordinates.'
  },
  {
    id: 'res-css-grid-garden',
    goalId: 'goal-webdesign',
    moduleId: 'mod-wd-04',
    type: 'reference',
    section: 'practice',
    title: 'Grid Garden - Interactive 28-Level CSS Game',
    url: 'https://cssgridgarden.com',
    durationSeconds: 1800,
    status: 'in_progress',
    currentTime: 1200,
    description: 'Active coding exercises to practice grid-column-start, grid-area, and justify-items.',
    notes: 'Level 19: grid-template-rows takes space-separated track listings.'
  },
  {
    id: 'res-grid-notes-cheat',
    goalId: 'goal-webdesign',
    moduleId: 'mod-wd-04',
    type: 'article',
    section: 'review',
    title: 'CSS Grid Visual Cheat Sheet & Properties Matrix',
    url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
    durationSeconds: 600,
    status: 'saved',
    currentTime: 0,
    description: 'Quick reference poster covering container vs item properties with diagrams.',
    notes: 'Bookmarked for quick reference when setting up responsive layouts.'
  },

  // WordPress Elementor
  {
    id: 'res-elementor-container',
    goalId: 'goal-wordpress',
    moduleId: 'mod-wp-06',
    type: 'youtube',
    section: 'learn',
    title: 'Elementor Container Tutorial: Master Flexbox Containers',
    url: 'https://www.youtube.com/watch?v=F3zWw9dE2eA',
    channel: 'WPCrafter',
    thumbnail: 'https://img.youtube.com/vi/F3zWw9dE2eA/hqdefault.jpg',
    durationSeconds: 1540, // 25:40
    videoId: 'F3zWw9dE2eA',
    status: 'in_progress',
    currentTime: 980, // 16:20
    lastWatchedAt: 'Today, 8:30 PM',
    description: 'Learn how to transition from legacy sections & columns to lightweight Flexbox containers in Elementor.',
    notes: 'Containers reduce DOM depth by up to 50% compared to inner sections.'
  },
  {
    id: 'res-elementor-grid-doc',
    goalId: 'goal-wordpress',
    moduleId: 'mod-wp-06',
    type: 'documentation',
    section: 'learn',
    title: 'Elementor Container Performance & DOM Depth Manual',
    url: 'https://elementor.com/help/flexbox-containers/',
    durationSeconds: 720,
    status: 'completed',
    currentTime: 720,
    description: 'Official Elementor developer documentation on container settings and responsive overrides.',
    notes: 'Avoid nesting containers more than 3 levels deep.'
  },
  {
    id: 'res-wp-plugins-doc',
    goalId: 'goal-wordpress',
    moduleId: 'mod-wp-04',
    type: 'documentation',
    section: 'learn',
    title: 'WordPress Plugin Developer Handbook: Action & Filter Hooks',
    url: 'https://developer.wordpress.org/plugins/',
    durationSeconds: 1200,
    status: 'completed',
    currentTime: 1200,
    description: 'The definitive architectural guide to WordPress hooks, filters, and lifecycle methods.',
    notes: 'Plugins loaded hook is the earliest hook available for custom plugin logic.'
  },

  // C Programming
  {
    id: 'res-c-pointers-video',
    goalId: 'goal-cprog',
    moduleId: 'mod-c-03',
    type: 'youtube',
    section: 'learn',
    title: 'Pointers in C / C++ [Full Course]',
    url: 'https://www.youtube.com/watch?v=zuegQmMdy8M',
    channel: 'freeCodeCamp',
    thumbnail: 'https://img.youtube.com/vi/zuegQmMdy8M/hqdefault.jpg',
    durationSeconds: 8820, // 2h 27m
    videoId: 'zuegQmMdy8M',
    status: 'in_progress',
    currentTime: 3120, // 52:00
    lastWatchedAt: 'Yesterday, 4:10 PM',
    description: 'In-depth introduction to pointers, memory management, stack vs heap, and dynamic memory allocation.',
    notes: 'Stack memory is automatically managed, while heap memory requires explicit malloc and free.'
  },
  {
    id: 'res-c-pointers-doc',
    goalId: 'goal-cprog',
    moduleId: 'mod-c-03',
    type: 'documentation',
    section: 'practice',
    title: 'Interactive C Pointers Exercises & Memory Diagrams',
    url: 'https://www.learn-c.org/en/Pointers',
    durationSeconds: 1500,
    status: 'in_progress',
    currentTime: 600,
    description: 'Hands-on practice exercises testing pointer syntax and array-pointer equivalence.',
    notes: 'Array variable decay into pointer to first element when passed to function.'
  },

  // JavaScript
  {
    id: 'res-js-closures-video',
    goalId: 'goal-javascript',
    moduleId: 'mod-js-02',
    type: 'youtube',
    section: 'learn',
    title: 'JavaScript Closures Explained in 10 Minutes',
    url: 'https://www.youtube.com/watch?v=1S8SBDh-zk8',
    channel: 'Web Dev Simplified',
    thumbnail: 'https://img.youtube.com/vi/1S8SBDh-zk8/hqdefault.jpg',
    durationSeconds: 614, // 10:14
    videoId: '1S8SBDh-zk8',
    status: 'not_started',
    currentTime: 0,
    description: 'Clear visual demonstration of closures, lexical environment, and common interview questions.',
    notes: 'Classic interview gotcha: setTimeout inside for loop with var vs let.'
  }
];

export const initialSessions: LearningSession[] = [
  {
    id: 'sess-1',
    resourceId: 'res-css-grid-video',
    goalId: 'goal-webdesign',
    moduleId: 'mod-wd-04',
    resourceTitle: 'CSS Grid Complete Tutorial',
    activityType: 'Video Lecture',
    durationMinutes: 17,
    timestamp: 'Today, 10:15 PM'
  },
  {
    id: 'sess-2',
    resourceId: 'res-elementor-container',
    goalId: 'goal-wordpress',
    moduleId: 'mod-wp-06',
    resourceTitle: 'Elementor Container Tutorial',
    activityType: 'Video Lecture',
    durationMinutes: 12,
    timestamp: 'Today, 8:30 PM'
  },
  {
    id: 'sess-3',
    resourceId: 'res-elementor-grid-doc',
    goalId: 'goal-wordpress',
    moduleId: 'mod-wp-06',
    resourceTitle: 'Responsive Design Tutorial',
    activityType: 'Documentation',
    durationMinutes: 28,
    timestamp: 'Today, 7:10 PM'
  },
  {
    id: 'sess-4',
    resourceId: 'res-c-pointers-video',
    goalId: 'goal-cprog',
    moduleId: 'mod-c-03',
    resourceTitle: 'Pointers in C / C++ [Full Course]',
    activityType: 'Video Lecture',
    durationMinutes: 45,
    timestamp: 'Yesterday, 4:10 PM'
  },
  {
    id: 'sess-5',
    resourceId: 'res-mdn-grid',
    goalId: 'goal-webdesign',
    moduleId: 'mod-wd-04',
    resourceTitle: 'MDN Web Docs: CSS Grid Layout Guide',
    activityType: 'Documentation',
    durationMinutes: 25,
    timestamp: 'Yesterday, 2:30 PM'
  }
];

export const initialSettings: UserSettings = {
  timezone: 'Asia/Dhaka',
  dailyTargetMinutes: 180, // 3 hours
  timeFormat: '12h',
  soundEnabled: true,
  name: 'Alex Rivera'
};

export const initialBookmarks: WebsiteBookmark[] = [
  {
    id: 'bm-google',
    title: 'Google',
    url: 'https://www.google.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=google.com&sz=128',
    category: 'Daily Needs',
    subcategory: 'Search & Tools',
    notes: 'Primary web search & quick reference lookups',
    isPinned: true,
    clickCount: 42,
    createdAt: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'bm-youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',
    category: 'Daily Needs',
    subcategory: 'Video & Tutorials',
    notes: 'Tech tutorials, engineering deep dives, and lectures',
    isPinned: true,
    clickCount: 38,
    createdAt: '2026-09-20T08:05:00.000Z',
  },
  {
    id: 'bm-chatgpt',
    title: 'ChatGPT',
    url: 'https://chatgpt.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128',
    category: 'Daily Needs',
    subcategory: 'AI Assistants',
    notes: 'Code debugging, architecture brainstorming, and explanations',
    isPinned: true,
    clickCount: 65,
    createdAt: '2026-09-20T08:10:00.000Z',
  },
  {
    id: 'bm-claude',
    title: 'Claude AI',
    url: 'https://claude.ai',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=128',
    category: 'Daily Needs',
    subcategory: 'AI Assistants',
    notes: 'Complex technical analysis and writing',
    isPinned: true,
    clickCount: 29,
    createdAt: '2026-09-20T08:15:00.000Z',
  },
  {
    id: 'bm-github',
    title: 'GitHub',
    url: 'https://github.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=128',
    category: 'Development',
    subcategory: 'Code Repositories',
    notes: 'Source code management, PR reviews, and open source exploration',
    isPinned: true,
    clickCount: 54,
    createdAt: '2026-09-20T08:20:00.000Z',
  },
  {
    id: 'bm-figma',
    title: 'Figma',
    url: 'https://figma.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=figma.com&sz=128',
    category: 'Design & UI',
    subcategory: 'UI & UX Design',
    notes: 'Design systems, wireframes, and interface prototypes',
    isPinned: true,
    clickCount: 31,
    createdAt: '2026-09-20T08:25:00.000Z',
  },
  {
    id: 'bm-notion',
    title: 'Notion',
    url: 'https://notion.so',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=notion.so&sz=128',
    category: 'Productivity',
    subcategory: 'Notes & Workspace',
    notes: 'Project roadmaps, knowledge bases, and sprint notes',
    isPinned: true,
    clickCount: 27,
    createdAt: '2026-09-20T08:30:00.000Z',
  },
  {
    id: 'bm-mdn',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=128',
    category: 'Learning & Docs',
    subcategory: 'Documentation',
    notes: 'Standard web specifications for HTML, CSS, JavaScript, and Web APIs',
    isPinned: false,
    clickCount: 19,
    createdAt: '2026-09-21T09:00:00.000Z',
  },
  {
    id: 'bm-react',
    title: 'React Docs',
    url: 'https://react.dev',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=react.dev&sz=128',
    category: 'Development',
    subcategory: 'Documentation',
    notes: 'Official React documentation, hooks guide, and best practices',
    isPinned: false,
    clickCount: 16,
    createdAt: '2026-09-21T09:10:00.000Z',
  },
  {
    id: 'bm-tailwind',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=128',
    category: 'Development',
    subcategory: 'Documentation',
    notes: 'Utility-first CSS framework class references and cheatsheet',
    isPinned: false,
    clickCount: 22,
    createdAt: '2026-09-21T09:15:00.000Z',
  },
  {
    id: 'bm-stackoverflow',
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=128',
    category: 'Development',
    subcategory: 'Q&A & Troubleshooting',
    notes: 'Developer troubleshooting and community solutions',
    isPinned: false,
    clickCount: 18,
    createdAt: '2026-09-21T09:20:00.000Z',
  },
  {
    id: 'bm-vercel',
    title: 'Vercel',
    url: 'https://vercel.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=128',
    category: 'Development',
    subcategory: 'Cloud & Database',
    notes: 'Frontend deployments and serverless monitoring',
    isPinned: false,
    clickCount: 14,
    createdAt: '2026-09-21T09:25:00.000Z',
  },
  {
    id: 'bm-dribbble',
    title: 'Dribbble',
    url: 'https://dribbble.com',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=128',
    category: 'Design & UI',
    subcategory: 'Design Inspiration',
    notes: 'UI design trends, micro-interactions, and visual inspiration',
    isPinned: false,
    clickCount: 12,
    createdAt: '2026-09-21T09:30:00.000Z',
  },
  {
    id: 'bm-linear',
    title: 'Linear',
    url: 'https://linear.app',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=linear.app&sz=128',
    category: 'Productivity',
    subcategory: 'Issue Tracking',
    notes: 'Streamlined issue tracking and sprint velocity',
    isPinned: false,
    clickCount: 15,
    createdAt: '2026-09-21T09:35:00.000Z',
  },
];

