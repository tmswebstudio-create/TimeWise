/**
 * Utility functions for URL parsing, automatic favicon extraction,
 * smart website name inference, and category recommendations.
 */

// Known website brands for high-precision name resolution
const KNOWN_DOMAINS: Record<string, { name: string; category: string; subcategory: string }> = {
  'github.com': { name: 'GitHub', category: 'Development', subcategory: 'Code Repositories' },
  'gitlab.com': { name: 'GitLab', category: 'Development', subcategory: 'Code Repositories' },
  'stackoverflow.com': { name: 'Stack Overflow', category: 'Development', subcategory: 'Q&A & Troubleshooting' },
  'developer.mozilla.org': { name: 'MDN Web Docs', category: 'Learning & Docs', subcategory: 'Documentation' },
  'react.dev': { name: 'React Docs', category: 'Development', subcategory: 'Documentation' },
  'nextjs.org': { name: 'Next.js', category: 'Development', subcategory: 'Frameworks' },
  'tailwindcss.com': { name: 'Tailwind CSS', category: 'Development', subcategory: 'Documentation' },
  'typescriptlang.org': { name: 'TypeScript', category: 'Development', subcategory: 'Documentation' },
  'figma.com': { name: 'Figma', category: 'Design & UI', subcategory: 'UI & UX Design' },
  'dribbble.com': { name: 'Dribbble', category: 'Design & UI', subcategory: 'Design Inspiration' },
  'behance.net': { name: 'Behance', category: 'Design & UI', subcategory: 'Design Inspiration' },
  'youtube.com': { name: 'YouTube', category: 'Daily Needs', subcategory: 'Video & Tutorials' },
  'chatgpt.com': { name: 'ChatGPT', category: 'Daily Needs', subcategory: 'AI Assistants' },
  'chat.openai.com': { name: 'ChatGPT', category: 'Daily Needs', subcategory: 'AI Assistants' },
  'claude.ai': { name: 'Claude AI', category: 'Daily Needs', subcategory: 'AI Assistants' },
  'gemini.google.com': { name: 'Google Gemini', category: 'Daily Needs', subcategory: 'AI Assistants' },
  'notion.so': { name: 'Notion', category: 'Productivity', subcategory: 'Notes & Workspace' },
  'linear.app': { name: 'Linear', category: 'Productivity', subcategory: 'Issue Tracking' },
  'google.com': { name: 'Google', category: 'Daily Needs', subcategory: 'Search & Tools' },
  'mail.google.com': { name: 'Gmail', category: 'Daily Needs', subcategory: 'Communication' },
  'linkedin.com': { name: 'LinkedIn', category: 'Daily Needs', subcategory: 'Professional Network' },
  'twitter.com': { name: 'X / Twitter', category: 'Daily Needs', subcategory: 'Tech News & Community' },
  'x.com': { name: 'X / Twitter', category: 'Daily Needs', subcategory: 'Tech News & Community' },
  'reddit.com': { name: 'Reddit', category: 'Daily Needs', subcategory: 'Discussion & Communities' },
  'vercel.com': { name: 'Vercel', category: 'Development', subcategory: 'Deployment & Cloud' },
  'firebase.google.com': { name: 'Firebase', category: 'Development', subcategory: 'Cloud & Database' },
  'supabase.com': { name: 'Supabase', category: 'Development', subcategory: 'Cloud & Database' },
  'coursera.org': { name: 'Coursera', category: 'Learning & Docs', subcategory: 'Online Courses' },
  'udemy.com': { name: 'Udemy', category: 'Learning & Docs', subcategory: 'Online Courses' },
  'leetcode.com': { name: 'LeetCode', category: 'Learning & Docs', subcategory: 'Algorithms & Coding' },
  'hackerrank.com': { name: 'HackerRank', category: 'Learning & Docs', subcategory: 'Algorithms & Coding' },
  'codepen.io': { name: 'CodePen', category: 'Development', subcategory: 'Sandboxes & Snippets' },
  'codesandbox.io': { name: 'CodeSandbox', category: 'Development', subcategory: 'Sandboxes & Snippets' },
  'bundlephobia.com': { name: 'Bundlephobia', category: 'Development', subcategory: 'Package Inspection' },
  'npmjs.com': { name: 'npm', category: 'Development', subcategory: 'Package Registry' },
};

/**
 * Normalizes user input into a valid HTTP/HTTPS URL
 */
export function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Safely extracts hostname (domain name) from URL
 */
export function getHostname(url: string): string {
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    // If not a full URL yet, strip protocols and trailing paths
    const cleaned = url
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('?')[0]
      .toLowerCase();
    return cleaned;
  }
}

/**
 * Automatically generates a high-resolution favicon URL from Google's service (128x128px)
 */
export function getFaviconUrl(url: string): string {
  const hostname = getHostname(url);
  if (!hostname || !hostname.includes('.')) {
    return '';
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
}

/**
 * Secondary backup favicon service from DuckDuckGo
 */
export function getDuckDuckGoFaviconUrl(url: string): string {
  const hostname = getHostname(url);
  if (!hostname || !hostname.includes('.')) {
    return '';
  }
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
}

/**
 * Automatically infers a clean, human-readable website name from URL
 */
export function inferWebsiteName(url: string): string {
  const hostname = getHostname(url);
  if (!hostname) return '';

  // Check known domain exact match
  if (KNOWN_DOMAINS[hostname]) {
    return KNOWN_DOMAINS[hostname].name;
  }

  // Check domain without subdomains (e.g., sub.example.com -> example.com)
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const rootDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (KNOWN_DOMAINS[rootDomain]) {
      return KNOWN_DOMAINS[rootDomain].name;
    }

    // Capitalize first part
    const mainName = parts.length > 2 && parts[0] !== 'app' && parts[0] !== 'web'
      ? `${parts[parts.length - 2]}`
      : parts[0] === 'app' || parts[0] === 'web'
      ? parts[1]
      : parts[parts.length - 2];

    return mainName.charAt(0).toUpperCase() + mainName.slice(1);
  }

  return hostname.charAt(0).toUpperCase() + hostname.slice(1);
}

/**
 * Suggests default category and subcategory for a given URL
 */
export function suggestCategoryAndSubcategory(url: string): {
  category: string;
  subcategory: string;
} {
  const hostname = getHostname(url);
  if (KNOWN_DOMAINS[hostname]) {
    return {
      category: KNOWN_DOMAINS[hostname].category,
      subcategory: KNOWN_DOMAINS[hostname].subcategory,
    };
  }

  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const rootDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (KNOWN_DOMAINS[rootDomain]) {
      return {
        category: KNOWN_DOMAINS[rootDomain].category,
        subcategory: KNOWN_DOMAINS[rootDomain].subcategory,
      };
    }
  }

  // Default fallback category & subcategory
  return {
    category: 'Daily Needs',
    subcategory: 'General',
  };
}

/**
 * Standard preset bookmark categories and their common subcategories
 */
export const DEFAULT_BOOKMARK_TAXONOMY: Record<string, string[]> = {
  'Daily Needs': ['General', 'Search & Tools', 'Communication', 'AI Assistants', 'Tech News & Community', 'Discussion & Communities'],
  'Development': ['Code Repositories', 'Documentation', 'Frameworks', 'Cloud & Database', 'Sandboxes & Snippets', 'Package Registry', 'Q&A & Troubleshooting'],
  'Design & UI': ['UI & UX Design', 'Design Inspiration', 'Design Systems', 'Icons & Illustrations', 'Color Palettes', 'Typography'],
  'Learning & Docs': ['Documentation', 'Online Courses', 'Tutorials & Guides', 'Algorithms & Coding', 'Research Papers', 'Articles'],
  'Productivity': ['Notes & Workspace', 'Issue Tracking', 'Time Tracking', 'Cloud Storage', 'Project Management'],
};

/**
 * Generates an aesthetic gradient background based on a string seed for fallback avatars
 */
export function getAvatarFallbackGradient(seed: string): { bgClass: string; textColor: string } {
  const palettes = [
    { bgClass: 'bg-gradient-to-tr from-blue-500 to-indigo-600', textColor: 'text-white' },
    { bgClass: 'bg-gradient-to-tr from-emerald-500 to-teal-600', textColor: 'text-white' },
    { bgClass: 'bg-gradient-to-tr from-amber-500 to-orange-600', textColor: 'text-white' },
    { bgClass: 'bg-gradient-to-tr from-purple-500 to-pink-600', textColor: 'text-white' },
    { bgClass: 'bg-gradient-to-tr from-rose-500 to-red-600', textColor: 'text-white' },
    { bgClass: 'bg-gradient-to-tr from-cyan-500 to-blue-600', textColor: 'text-white' },
    { bgClass: 'bg-gradient-to-tr from-violet-500 to-purple-600', textColor: 'text-white' },
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}
