export interface WritingGoal {
  dailyTarget: number;
  chapterTargets: Record<number, number>;
  deadlines: Record<number, string>;
  history: GoalHistoryEntry[];
}

export interface GoalHistoryEntry {
  date: string;
  target: number;
  achieved: number;
  completed: boolean;
}

export interface TimeSession {
  id: string;
  chapterIndex: number;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  wordsWritten: number;
  sessionType: 'writing' | 'editing' | 'review';
}

export interface PomodoroSession {
  id: string;
  workDuration: number; // minutes (default 25)
  breakDuration: number; // minutes (default 5)
  isActive: boolean;
  isBreak: boolean;
  timeRemaining: number; // seconds
  chapterIndex?: number;
}

export interface ChapterComment {
  id: string;
  chapterIndex: number;
  text: string;
  author: string;
  timestamp: string;
  resolved: boolean;
  replies: ChapterCommentReply[];
  position?: {
    line: number;
    offset: number;
  };
}

export interface ChapterCommentReply {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface ChapterVersion {
  id: string;
  chapterIndex: number;
  timestamp: string;
  content: string;
  autoSave: boolean;
  label?: string;
}

export interface ExportOptions {
  format: 'epub' | 'pdf' | 'docx' | 'html' | 'txt' | 'md';
  includeComments: boolean;
  includeMetadata: boolean;
  template?: string;
  chapterRange?: {
    start: number;
    end: number;
  };
}

export interface ExportHistory {
  id: string;
  format: string;
  timestamp: string;
  filename: string;
  options: ExportOptions;
  fileSize?: number;
}
