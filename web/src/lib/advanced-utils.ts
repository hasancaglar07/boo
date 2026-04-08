import type { Chapter, ChapterState } from "./dashboard-api";
import type { WritingGoal, TimeSession, ChapterComment, ChapterVersion } from "@/types/advanced-features";

// ===== Goal Utilities =====

export function calculateGoalProgress(chapters: Chapter[], goal: WritingGoal): {
  dailyAchieved: number;
  dailyPercentage: number;
  chapterProgress: Record<number, { achieved: number; target: number; percentage: number }>;
  upcomingDeadlines: Array<{ chapterIndex: number; deadline: string; daysUntil: number }>;
} {
  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0);
  const dailyAchieved = totalWords;
  const dailyPercentage = goal.dailyTarget > 0 ? Math.round((totalWords / goal.dailyTarget) * 100) : 0;

  const chapterProgress: Record<number, { achieved: number; target: number; percentage: number }> = {};

  chapters.forEach((chapter, index) => {
    const words = countWords(chapter.content || '');
    const target = goal.chapterTargets[index] || goal.dailyTarget;
    chapterProgress[index] = {
      achieved: words,
      target,
      percentage: target > 0 ? Math.round((words / target) * 100) : 0,
    };
  });

  const upcomingDeadlines = Object.entries(goal.deadlines)
    .map(([chapterIndex, deadline]) => {
      const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        chapterIndex: parseInt(chapterIndex),
        deadline,
        daysUntil,
      };
    })
    .filter(d => d.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return {
    dailyAchieved,
    dailyPercentage,
    chapterProgress,
    upcomingDeadlines,
  };
}

export function updateGoalHistory(goal: WritingGoal, chapters: Chapter[]): WritingGoal {
  const today = new Date().toISOString().split('T')[0];
  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0);
  const achieved = totalWords;
  const completed = achieved >= goal.dailyTarget;

  const existingEntry = goal.history.find(h => h.date === today);
  if (existingEntry) {
    existingEntry.achieved = achieved;
    existingEntry.completed = completed;
  } else {
    goal.history.push({ date: today, target: goal.dailyTarget, achieved, completed });
  }

  // Keep only last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  goal.history = goal.history.filter(h => new Date(h.date) >= ninetyDaysAgo);

  return goal;
}

// ===== Time Tracking Utilities =====

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function calculateTotalTime(sessions: TimeSession[]): {
  totalSeconds: number;
  totalHours: number;
  averageSessionDuration: number;
  totalWordsWritten: number;
  wordsPerHour: number;
} {
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = totalSeconds / 3600;
  const averageSessionDuration = sessions.length > 0 ? totalSeconds / sessions.length : 0;
  const totalWordsWritten = sessions.reduce((sum, s) => sum + s.wordsWritten, 0);
  const wordsPerHour = totalHours > 0 ? Math.round(totalWordsWritten / totalHours) : 0;

  return {
    totalSeconds,
    totalHours: Math.round(totalHours * 10) / 10,
    averageSessionDuration: Math.round(averageSessionDuration),
    totalWordsWritten,
    wordsPerHour,
  };
}

export function getProductivityHeatmap(sessions: TimeSession[]): Array<{
  date: string;
  hours: number;
  words: number;
}> {
  const byDate = new Map<string, { hours: number; words: number }>();

  sessions.forEach(session => {
    const date = new Date(session.startTime).toISOString().split('T')[0];
    const existing = byDate.get(date) || { hours: 0, words: 0 };
    existing.hours += session.duration / 3600;
    existing.words += session.wordsWritten;
    byDate.set(date, existing);
  });

  return Array.from(byDate.entries())
    .map(([date, data]) => ({
      date,
      hours: Math.round(data.hours * 10) / 10,
      words: data.words,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ===== Comment Utilities =====

export function addComment(
  comments: Record<number, ChapterComment[]>,
  chapterIndex: number,
  text: string,
  author: string,
  position?: { line: number; offset: number }
): ChapterComment {
  const newComment: ChapterComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chapterIndex,
    text,
    author,
    timestamp: new Date().toISOString(),
    resolved: false,
    replies: [],
    position,
  };

  if (!comments[chapterIndex]) {
    comments[chapterIndex] = [];
  }
  comments[chapterIndex].push(newComment);

  return newComment;
}

export function addReply(
  comments: Record<number, ChapterComment[]>,
  chapterIndex: number,
  commentId: string,
  text: string,
  author: string
): ChapterCommentReply | null {
  const chapterComments = comments[chapterIndex];
  if (!chapterComments) return null;

  const comment = chapterComments.find(c => c.id === commentId);
  if (!comment) return null;

  const reply: ChapterCommentReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    author,
    timestamp: new Date().toISOString(),
  };

  comment.replies.push(reply);
  return reply;
}

export function toggleCommentResolved(
  comments: Record<number, ChapterComment[]>,
  chapterIndex: number,
  commentId: string
): boolean {
  const chapterComments = comments[chapterIndex];
  if (!chapterComments) return false;

  const comment = chapterComments.find(c => c.id === commentId);
  if (!comment) return false;

  comment.resolved = !comment.resolved;
  return comment.resolved;
}

export function getUnresolvedCount(comments: Record<number, ChapterComment[]>): number {
  return Object.values(comments).reduce((sum, chapterComments) => {
    return sum + chapterComments.filter(c => !c.resolved).length;
  }, 0);
}

// ===== Version History Utilities =====

export function createVersion(
  chapterIndex: number,
  content: string,
  autoSave: boolean,
  label?: string
): ChapterVersion {
  return {
    id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chapterIndex,
    timestamp: new Date().toISOString(),
    content,
    autoSave,
    label,
  };
}

export function addVersion(
  versions: Record<number, ChapterVersion[]>,
  chapterIndex: number,
  content: string,
  autoSave: boolean,
  label?: string
): ChapterVersion {
  const version = createVersion(chapterIndex, content, autoSave, label);

  if (!versions[chapterIndex]) {
    versions[chapterIndex] = [];
  }
  versions[chapterIndex].push(version);

  // Prune: keep last 20 versions
  if (versions[chapterIndex].length > 20) {
    versions[chapterIndex] = versions[chapterIndex].slice(-20);
  }

  return version;
}

export function diffVersions(oldContent: string, newContent: string): Array<{
  type: 'same' | 'added' | 'removed';
  oldValue?: string;
  newValue?: string;
}> {
  // Simple word-by-word diff
  const oldWords = oldContent.split(/\s+/);
  const newWords = newContent.split(/\s+/);

  const diffs: Array<{ type: 'same' | 'added' | 'removed'; oldValue?: string; newValue?: string }> = [];

  let i = 0;
  let j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      diffs.push({ type: 'same', oldValue: oldWords[i], newValue: newWords[j] });
      i++;
      j++;
    } else if (i < oldWords.length && (j >= newWords.length || oldWords.indexOf(newWords[j], i) === -1)) {
      diffs.push({ type: 'removed', oldValue: oldWords[i] });
      i++;
    } else {
      diffs.push({ type: 'added', newValue: newWords[j] });
      j++;
    }
  }

  return diffs;
}

export function restoreVersion(
  chapters: Chapter[],
  versions: Record<number, ChapterVersion[]>,
  chapterIndex: number,
  versionId: string
): Chapter[] | null {
  const chapterVersions = versions[chapterIndex];
  if (!chapterVersions) return null;

  const version = chapterVersions.find(v => v.id === versionId);
  if (!version) return null;

  const updated = [...chapters];
  updated[chapterIndex] = {
    ...updated[chapterIndex],
    content: version.content,
  };

  return updated;
}

// ===== Storage Utilities =====

export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

export function clearFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear from localStorage:', error);
  }
}

// ===== Helper Functions =====

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export const STORAGE_KEYS = {
  goals: (slug: string) => `writing-goals-${slug}`,
  sessions: (slug: string) => `writing-sessions-${slug}`,
  comments: (slug: string) => `chapter-comments-${slug}`,
  versions: (slug: string) => `chapter-versions-${slug}`,
  exports: (slug: string) => `export-history-${slug}`,
  pomodoro: (slug: string) => `pomodoro-session-${slug}`,
};

export const DEFAULT_GOAL: WritingGoal = {
  dailyTarget: 2000,
  chapterTargets: {},
  deadlines: {},
  history: [],
};

export const DEFAULT_POMODORO = {
  workDuration: 25,
  breakDuration: 5,
};
