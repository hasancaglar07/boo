export interface ChapterTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'predefined' | 'custom';
}

export interface WritingStats {
  totalWords: number;
  avgWordsPerChapter: number;
  completedChapters: number;
  totalChapters: number;
  completionPercentage: number;
  writingStreak: number;
  wordsToday: number;
  wordsThisWeek: number;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  disabledInInputs?: boolean;
}
