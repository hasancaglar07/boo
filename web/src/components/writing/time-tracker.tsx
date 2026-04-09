"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { TimeSession, PomodoroSession } from "@/types/advanced-features";
import { formatDuration, calculateTotalTime, STORAGE_KEYS, saveToLocalStorage, loadFromLocalStorage, DEFAULT_POMODORO } from "@/lib/advanced-utils";
import { cn } from "@/lib/utils";

interface TimeTrackerProps {
  slug: string;
  chapterIndex: number;
  chapterTitle: string;
  onSessionComplete?: (session: TimeSession) => void;
}

export function TimeTracker({ slug, chapterIndex, chapterTitle, onSessionComplete }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<TimeSession[]>(() =>
    loadFromLocalStorage<TimeSession[]>(STORAGE_KEYS.sessions(slug), [])
  );
  const [wordsAtStart, setWordsAtStart] = useState(0);

  // Pomodoro state
  const [pomodoro, setPomodoro] = useState<PomodoroSession>(() =>
    loadFromLocalStorage<PomodoroSession>(STORAGE_KEYS.pomodoro(slug), {
      id: 'pomodoro-default',
      workDuration: DEFAULT_POMODORO.workDuration,
      breakDuration: DEFAULT_POMODORO.breakDuration,
      isActive: false,
      isBreak: false,
      timeRemaining: DEFAULT_POMODORO.workDuration * 60,
    })
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update stats when sessions change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.sessions(slug), sessions);
  }, [sessions, slug]);

  // Update pomodoro state
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.pomodoro(slug), pomodoro);
  }, [pomodoro, slug]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Pomodoro timer effect
  useEffect(() => {
    if (pomodoro.isActive) {
      intervalRef.current = setInterval(() => {
        setPomodoro((prev) => {
          if (prev.timeRemaining <= 1) {
            // Timer complete
            if (prev.isBreak) {
              // Break over, start work
              return {
                ...prev,
                isBreak: false,
                timeRemaining: prev.workDuration * 60,
              };
            } else {
              // Work over, start break
              return {
                ...prev,
                isBreak: true,
                timeRemaining: prev.breakDuration * 60,
              };
            }
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pomodoro.isActive]);

  function startTimer() {
    setIsRunning(true);
    setSessionStart(new Date());
    setWordsAtStart(0); // Will be updated when session completes
  }

  function stopTimer() {
    setIsRunning(false);
    if (sessionStart) {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - sessionStart.getTime()) / 1000);

      const newSession: TimeSession = {
        id: `session-${Date.now()}`,
        chapterIndex,
        startTime: sessionStart.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        wordsWritten: 0, // Will be calculated based on word count change
        sessionType: 'writing',
      };

      const updated = [...sessions, newSession];
      setSessions(updated);
      setSessionStart(null);
      setElapsed(0);

      onSessionComplete?.(newSession);
    }
  }

  function resetTimer() {
    setIsRunning(false);
    setElapsed(0);
    setSessionStart(null);
  }

  function togglePomodoro() {
    setPomodoro((prev) => ({
      ...prev,
      isActive: !prev.isActive,
      chapterIndex: prev.isActive ? prev.chapterIndex : chapterIndex,
    }));
  }

  function resetPomodoro() {
    setPomodoro((prev) => ({
      ...prev,
      isActive: false,
      isBreak: false,
      timeRemaining: prev.workDuration * 60,
    }));
  }

  const stats = calculateTotalTime(sessions);
  const currentChapterSessions = sessions.filter(s => s.chapterIndex === chapterIndex);
  const currentChapterStats = calculateTotalTime(currentChapterSessions);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Time Tracker</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your writing sessions and productivity
          </p>
        </div>

        {/* Active Session Timer */}
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-foreground">Session Timer</div>
              <div className="text-xs text-muted-foreground">Ch. {chapterIndex + 1}: {chapterTitle}</div>
            </div>
            <Badge className={isRunning ? "bg-default text-default-foreground" : "bg-secondary text-secondary-foreground"}>
              {isRunning ? "Active" : "Stopped"}
            </Badge>
          </div>

          <div className="text-3xl font-semibold text-foreground mb-4">
            {formatDuration(elapsed)}
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={startTimer} className="flex-1 gap-1.5">
                <Play className="size-4" />
                Start
              </Button>
            ) : (
              <>
                <Button onClick={stopTimer} variant="outline" className="flex-1 gap-1.5">
                  <Pause className="size-4" />
                  Stop
                </Button>
                <Button onClick={resetTimer} variant="ghost" size="icon">
                  <RotateCcw className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Pomodoro Timer */}
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className={cn("size-4", pomodoro.isActive && "text-orange-500")} />
              <div className="text-sm font-medium text-foreground">Pomodoro</div>
            </div>
            <Badge className={pomodoro.isBreak ? "bg-secondary text-secondary-foreground" : "bg-default text-default-foreground"}>
              {pomodoro.isBreak ? "Break" : "Focus"}
            </Badge>
          </div>

          <div className="text-3xl font-semibold text-foreground mb-4">
            {formatDuration(pomodoro.timeRemaining)}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={togglePomodoro}
              variant={pomodoro.isActive ? "outline" : "primary"}
              className="flex-1"
            >
              {pomodoro.isActive ? "Pause" : "Start"}
            </Button>
            <Button onClick={resetPomodoro} variant="ghost" size="icon">
              <RotateCcw className="size-4" />
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{pomodoro.workDuration}m work</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{pomodoro.breakDuration}m break</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="text-xs text-muted-foreground">Total Time</div>
            <div className="text-lg font-semibold text-foreground">{stats.totalHours}h</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="text-xs text-muted-foreground">Avg Session</div>
            <div className="text-lg font-semibold text-foreground">{formatDuration(stats.averageSessionDuration)}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="text-xs text-muted-foreground">Words/Hour</div>
            <div className="text-lg font-semibold text-foreground">{stats.wordsPerHour}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="text-xs text-muted-foreground">This Chapter</div>
            <div className="text-lg font-semibold text-foreground">{currentChapterStats.totalHours}h</div>
          </div>
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div>
            <div className="text-sm font-medium text-foreground mb-2">Recent Sessions</div>
            <div className="space-y-1">
              {sessions.slice(-5).reverse().map((session) => (
                <div key={session.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Ch. {session.chapterIndex + 1} · {new Date(session.startTime).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-foreground">{formatDuration(session.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
