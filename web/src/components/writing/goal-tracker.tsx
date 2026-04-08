"use client";

import { useState, useEffect } from "react";
import { Target, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { WritingGoal } from "@/types/advanced-features";
import type { Chapter } from "@/lib/dashboard-api";
import { calculateGoalProgress, updateGoalHistory, STORAGE_KEYS, saveToLocalStorage, loadFromLocalStorage, DEFAULT_GOAL } from "@/lib/advanced-utils";
import { cn } from "@/lib/utils";

interface GoalTrackerProps {
  slug: string;
  chapters: Chapter[];
}

export function GoalTracker({ slug, chapters }: GoalTrackerProps) {
  const [goal, setGoal] = useState<WritingGoal>(() =>
    loadFromLocalStorage<WritingGoal>(STORAGE_KEYS.goals(slug), DEFAULT_GOAL)
  );
  const [showSettings, setShowSettings] = useState(false);
  const [newDailyTarget, setNewDailyTarget] = useState(goal.dailyTarget.toString());
  const [newDeadline, setNewDeadline] = useState("");
  const [newDeadlineChapter, setNewDeadlineChapter] = useState("0");

  // Update goal history when chapters change
  useEffect(() => {
    const updated = updateGoalHistory(goal, chapters);
    setGoal(updated);
  }, [chapters]);

  // Save goal to localStorage
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.goals(slug), goal);
  }, [goal, slug]);

  const progress = calculateGoalProgress(chapters, goal);
  const isGoalComplete = progress.dailyPercentage >= 100;

  function updateDailyTarget() {
    const target = parseInt(newDailyTarget);
    if (target > 0) {
      setGoal((prev) => ({ ...prev, dailyTarget: target }));
      setShowSettings(false);
    }
  }

  function setChapterDeadline() {
    const chapterIndex = parseInt(newDeadlineChapter);
    if (newDeadline && chapterIndex >= 0 && chapterIndex < chapters.length) {
      setGoal((prev) => ({
        ...prev,
        deadlines: { ...prev.deadlines, [chapterIndex]: newDeadline },
      }));
      setNewDeadline("");
      setShowSettings(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Writing Goals</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your progress and hit your targets
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? "Done" : "Settings"}
          </Button>
        </div>

        {/* Daily Goal Progress */}
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className={cn("size-4", isGoalComplete && "text-green-500")} />
              <div className="text-sm font-medium text-foreground">Daily Target</div>
            </div>
            {isGoalComplete && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="size-3" />
                Complete!
              </Badge>
            )}
          </div>

          <div className="text-3xl font-semibold text-foreground mb-2">
            {progress.dailyAchieved} / {goal.dailyTarget}
          </div>

          <div className="space-y-2">
            <Progress value={Math.min(progress.dailyPercentage, 100)} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.dailyPercentage}% complete</span>
              <span>{goal.dailyTarget - progress.dailyAchieved} words to go</span>
            </div>
          </div>

          {/* Celebration */}
          {isGoalComplete && (
            <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                🎉 Congratulations! You've hit your daily goal!
              </div>
            </div>
          )}
        </div>

        {/* Chapter Progress */}
        <div>
          <div className="text-sm font-medium text-foreground mb-3">Chapter Progress</div>
          <div className="space-y-2">
            {chapters.map((chapter, index) => {
              const chapterProgress = progress.chapterProgress[index];
              if (!chapterProgress) return null;

              const isComplete = chapterProgress.percentage >= 100;
              const hasDeadline = goal.deadlines[index] !== undefined;

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 bg-background/50 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Ch. {index + 1}
                      </span>
                      {isComplete && (
                        <CheckCircle2 className="size-4 text-green-500" />
                      )}
                      {hasDeadline && (
                        <Calendar className="size-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chapterProgress.achieved} / {chapterProgress.target}
                    </div>
                  </div>
                  <Progress value={Math.min(chapterProgress.percentage, 100)} className="h-1.5" />
                  {hasDeadline && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Due: {new Date(goal.deadlines[index]).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {progress.upcomingDeadlines.length > 0 && (
          <div>
            <div className="text-sm font-medium text-foreground mb-3">Upcoming Deadlines</div>
            <div className="space-y-2">
              {progress.upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.chapterIndex}
                  className="flex items-center justify-between text-sm rounded-lg border border-border/60 bg-background/50 p-2"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span className="text-foreground">
                      Ch. {deadline.chapterIndex + 1}
                    </span>
                  </div>
                  <Badge variant={deadline.daysUntil <= 3 ? "destructive" : "secondary"}>
                    {deadline.daysUntil === 0
                      ? "Today"
                      : deadline.daysUntil === 1
                      ? "Tomorrow"
                      : `${deadline.daysUntil} days`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal History Trend */}
        {goal.history.length > 1 && (
          <div>
            <div className="text-sm font-medium text-foreground mb-3">7-Day Trend</div>
            <div className="flex items-end gap-1 h-16">
              {goal.history.slice(-7).map((entry, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                >
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      entry.completed ? "bg-green-500" : "bg-blue-500"
                    )}
                    style={{ height: `${Math.min((entry.achieved / entry.target) * 100, 100)}%` }}
                  />
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4 rounded-lg border border-border/60 bg-background/50 p-4">
            <div>
              <Label>Daily Word Count Target</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={newDailyTarget}
                  onChange={(e) => setNewDailyTarget(e.target.value)}
                  placeholder="2000"
                />
                <Button onClick={updateDailyTarget}>Set</Button>
              </div>
            </div>

            <div>
              <Label>Set Chapter Deadline</Label>
              <div className="flex gap-2 mt-1">
                <select
                  value={newDeadlineChapter}
                  onChange={(e) => setNewDeadlineChapter(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {chapters.map((_, index) => (
                    <option key={index} value={index.toString()}>
                      Chapter {index + 1}
                    </option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
                <Button onClick={setChapterDeadline}>Set</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
