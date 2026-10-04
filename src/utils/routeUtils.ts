import { ActiveView } from '../types';

export interface RouteState {
  view: ActiveView;
  goalId: string | null;
  moduleId: string | null;
}

/**
 * Parses the current URL pathname or hash into view, goalId, and moduleId.
 */
export function parseCurrentRoute(): RouteState {
  let path = window.location.pathname.toLowerCase();

  // Support hash routing fallback if present (#goals, #bookmarks, etc.)
  if (window.location.hash) {
    const hashPath = window.location.hash.replace('#', '').toLowerCase();
    if (hashPath) {
      path = hashPath.startsWith('/') ? hashPath : '/' + hashPath;
    }
  }

  // Strip trailing slashes
  path = path.replace(/\/+$/, '') || '/';

  if (path === '/' || path === '/tasks') {
    return { view: 'tasks', goalId: null, moduleId: null };
  }

  if (path === '/goals') {
    return { view: 'goals', goalId: null, moduleId: null };
  }

  if (path === '/bookmarks') {
    return { view: 'bookmarks', goalId: null, moduleId: null };
  }

  if (path === '/habits' || path === '/streak' || path === '/streaks') {
    return { view: 'habits', goalId: null, moduleId: null };
  }

  if (path === '/progress' || path === '/resources' || path === '/learning') {
    return { view: 'progress', goalId: null, moduleId: null };
  }

  if (path === '/settings') {
    return { view: 'settings', goalId: null, moduleId: null };
  }

  // Check /goals/:goalId/modules/:moduleId
  const goalModuleMatch = path.match(/^\/goals\/([^\/]+)\/modules\/([^\/]+)$/);
  if (goalModuleMatch) {
    return {
      view: 'module-detail',
      goalId: decodeURIComponent(goalModuleMatch[1]),
      moduleId: decodeURIComponent(goalModuleMatch[2]),
    };
  }

  // Check /modules/:moduleId
  const moduleMatch = path.match(/^\/modules\/([^\/]+)$/);
  if (moduleMatch) {
    return {
      view: 'module-detail',
      goalId: null,
      moduleId: decodeURIComponent(moduleMatch[1]),
    };
  }

  // Check /goals/:goalId
  const goalMatch = path.match(/^\/goals\/([^\/]+)$/);
  if (goalMatch) {
    return {
      view: 'goal-detail',
      goalId: decodeURIComponent(goalMatch[1]),
      moduleId: null,
    };
  }

  // Default fallback
  return { view: 'tasks', goalId: null, moduleId: null };
}

/**
 * Formats a clean URL path string based on activeView and selected IDs.
 */
export function formatRoutePath(
  view: ActiveView,
  goalId?: string | null,
  moduleId?: string | null
): string {
  switch (view) {
    case 'tasks':
      return '/tasks';
    case 'goals':
      return '/goals';
    case 'goal-detail':
      return goalId ? `/goals/${encodeURIComponent(goalId)}` : '/goals';
    case 'module-detail':
      if (goalId && moduleId) {
        return `/goals/${encodeURIComponent(goalId)}/modules/${encodeURIComponent(moduleId)}`;
      }
      if (moduleId) {
        return `/modules/${encodeURIComponent(moduleId)}`;
      }
      return goalId ? `/goals/${encodeURIComponent(goalId)}` : '/goals';
    case 'bookmarks':
      return '/bookmarks';
    case 'habits':
      return '/habits';
    case 'progress':
      return '/progress';
    case 'settings':
      return '/settings';
    default:
      return '/tasks';
  }
}
