"use client";

import { BarChart3, BookOpen, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Chapter } from "@/lib/dashboard-api";
import { calculateWritingStats, formatWordCount } from "@/lib/writing-utils";
import { cn } from "@/lib/utils";

interface WritingDashboardProps {
  chapters: Chapter[];
  targetWords?: number;
}

export function WritingDashboard({ chapters, targetWords = 2000 }: WritingDashboardProps) {
  const stats = calculateWritingStats(chapters);

  const statCards = [
    {
      icon: TrendingUp,
      value: formatWordCount(stats.totalWords),
      label: "Total Words",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: BookOpen,
      value: `${stats.completedChapters}/${stats.totalChapters}`,
      label: "Chapters Done",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: BarChart3,
      value: formatWordCount(stats.avgWordsPerChapter),
      label: "Avg Words/Chapter",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      icon: Flame,
      value: `${stats.writingStreak}`,
      label: "Day Streak",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Writing Progress</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your writing statistics and goals
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-border/60 bg-background/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg p-2", stat.bgColor)}>
                    <Icon className={cn("size-4", stat.color)} />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Book Completion</span>
            <span className="font-semibold text-foreground">{stats.completionPercentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Chapter Progress List */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Chapter Progress</div>
          <div className="space-y-1">
            {chapters.map((chapter, index) => {
              const wordCount = chapter.content ? chapter.content.split(/\s+/).filter(Boolean).length : 0;
              const progress = Math.min((wordCount / targetWords) * 100, 100);
              const isCompleted = chapter.state === 'done';

              return (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-24 shrink-0 truncate text-muted-foreground">
                    Ch. {index + 1}
                  </div>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isCompleted ? "bg-green-500" : progress >= 100 ? "bg-blue-500" : "bg-amber-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="w-16 shrink-0 text-right text-muted-foreground">
                    {wordCount > 0 ? `${Math.round(progress)}%` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
