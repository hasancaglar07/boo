import type { Chapter, ChapterState } from "./dashboard-api";
import type { WritingStats } from "@/types/writing";

export function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function formatWordCount(count: number): string {
  if (count < 1000) return `${count}`;
  return `${(count / 1000).toFixed(1)}k`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown";
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffSecs < 3600) return `${diffMins} minutes ago`;
  if (diffSecs < 86400) return `${diffHours} hours ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function getFileTypeBadge(filename: string): { label: string; variant: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const typeMap: Record<string, { label: string; variant: string }> = {
    'pdf': { label: 'PDF', variant: 'red' },
    'epub': { label: 'EPUB', variant: 'blue' },
    'docx': { label: 'DOCX', variant: 'blue' },
    'doc': { label: 'DOC', variant: 'blue' },
    'txt': { label: 'TXT', variant: 'gray' },
    'md': { label: 'MD', variant: 'gray' },
    'json': { label: 'JSON', variant: 'yellow' },
    'html': { label: 'HTML', variant: 'orange' },
  };

  return typeMap[ext] || { label: ext.toUpperCase(), variant: 'gray' };
}

export function isTextFile(filename: string): boolean {
  const textExtensions = ['txt', 'md', 'json', 'html', 'xml', 'csv'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return textExtensions.includes(ext);
}

export function calculateWritingStats(chapters: Chapter[]): WritingStats {
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(ch => ch.state === 'done').length;
  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0);
  const avgWordsPerChapter = totalChapters > 0 ? Math.round(totalWords / totalChapters) : 0;
  const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  // Calculate writing streak (simplified version)
  const writingStreak = calculateWritingStreak(chapters);

  // Calculate words today/this week (simplified - would need timestamps)
  const wordsToday = 0; // Would need chapter.updated_at
  const wordsThisWeek = totalWords; // Simplified

  return {
    totalWords,
    avgWordsPerChapter,
    completedChapters,
    totalChapters,
    completionPercentage,
    writingStreak,
    wordsToday,
    wordsThisWeek,
  };
}

function calculateWritingStreak(chapters: Chapter[]): number {
  // Simplified streak calculation
  // In production, would use chapter.updated_at timestamps
  const chaptersWithContent = chapters.filter(ch => countWords(ch.content || '') > 0);
  return chaptersWithContent.length > 0 ? 1 : 0;
}

export function getChapterStateWeight(state: ChapterState): number {
  const weights: Record<ChapterState, number> = {
    draft: 0,
    writing: 1,
    review: 2,
    done: 3,
  };
  return weights[state] || 0;
}

export const PREDEFINED_TEMPLATES = [
  {
    id: 'intro',
    name: 'Introduction',
    description: 'Hook, thesis statement, and chapter roadmap',
    content: `# Introduction

## Hook
Start with an engaging opening that grabs the reader's attention.

## Thesis Statement
Clearly state the main point or argument of this chapter.

## Roadmap
Briefly outline what this chapter will cover:
- First key point
- Second key point
- Third key point

## Transition
End with a smooth transition to the first main section.`,
    category: 'predefined' as const,
  },
  {
    id: 'body',
    name: 'Body Chapter',
    description: 'Main content with structured sections',
    content: `# Chapter Title

## Introduction
- Set the context for this chapter
- Connect to previous chapter

## Main Point 1
### Sub-point
- Supporting detail
- Example or evidence

## Main Point 2
### Sub-point
- Supporting detail
- Example or evidence

## Main Point 3
### Sub-point
- Supporting detail
- Example or evidence

## Conclusion
- Summarize key points
- Transition to next chapter`,
    category: 'predefined' as const,
  },
  {
    id: 'conclusion',
    name: 'Conclusion',
    description: 'Summary and final thoughts',
    content: `# Conclusion

## Summary
- Recap main points covered in this chapter
- Restate thesis in a new way

## Key Takeaways
- Most important lesson or insight
- Practical application for the reader

## Final Thoughts
- Closing statement that resonates
- Connection to next chapter or book conclusion`,
    category: 'predefined' as const,
  },
];
