"use client";

import { useState, useEffect, useRef } from "react";

export interface ETACalculation {
  etaSeconds: number;
  etaFormatted: string;
  progressPercent: number;
  stagesRemaining: number;
  averageTimePerStage: number;
  isComplete: boolean;
}

export interface Stage {
  id: string;
  label: string;
  durationMs: number;
  completed: boolean;
  active: boolean;
}

export function useETAcalculator(stages: Stage[]) {
  const [eta, setETA] = useState<ETACalculation>({
    etaSeconds: 0,
    etaFormatted: "0s",
    progressPercent: 0,
    stagesRemaining: stages.length,
    averageTimePerStage: 0,
    isComplete: false,
  });

  const startTimeRef = useRef<number>(Date.now());
  const completedStagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Calculate total duration
    const totalDuration = stages.reduce((sum, stage) => sum + stage.durationMs, 0);

    // Calculate completed stages
    const completedStages = stages.filter((s) => s.completed);
    const activeStage = stages.find((s) => s.active);

    // Update completed stages tracking
    completedStages.forEach((stage) => {
      if (!completedStagesRef.current.has(stage.id)) {
        completedStagesRef.current.add(stage.id);
      }
    });

    // Calculate progress
    const completedDuration = completedStages.reduce(
      (sum, stage) => sum + stage.durationMs,
      0
    );

    // Add partial progress for active stage
    let activeProgress = 0;
    if (activeStage && !activeStage.completed) {
      // Estimate active stage progress based on time elapsed
      const activeElapsed = Date.now() - startTimeRef.current;
      activeProgress = Math.min(activeElapsed, activeStage.durationMs);
    }

    const totalElapsed = completedDuration + activeProgress;
    const progressPercent = Math.min(100, Math.round((totalElapsed / totalDuration) * 100));

    // Calculate ETA
    const remainingDuration = totalDuration - totalElapsed;
    const etaSeconds = Math.ceil(remainingDuration / 1000);

    // Calculate average time per stage (for completed stages)
    const averageTimePerStage =
      completedStages.length > 0
        ? completedDuration / completedStages.length / 1000
        : 0;

    // Format ETA
    let etaFormatted = "";
    if (etaSeconds >= 60) {
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = etaSeconds % 60;
      etaFormatted = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    } else {
      etaFormatted = `${etaSeconds}s`;
    }

    // Calculate stages remaining
    const stagesRemaining = stages.filter((s) => !s.completed).length;

    setETA({
      etaSeconds,
      etaFormatted,
      progressPercent,
      stagesRemaining,
      averageTimePerStage: Math.round(averageTimePerStage),
      isComplete: stagesRemaining === 0,
    });

    // Reset start time when stage changes
    if (activeStage && !completedStagesRef.current.has(activeStage.id)) {
      startTimeRef.current = Date.now();
    }
  }, [stages]);

  return eta;
}

// Helper function to generate actionable feedback
export function generateActionableFeedback(
  stage: Stage,
  eta: ETACalculation,
  totalStages: number
): string {
  if (eta.isComplete) {
    return "✨ Complete! Your book is ready.";
  }

  if (stage.active) {
    const tips: Record<string, string[]> = {
      cover: [
        "🎨 Designing cover... This usually takes 10-15 seconds",
        "🖼️ AI is creating your cover image...",
        "✨ Selecting the best visual for your cover...",
      ],
      chapter: [
        "📝 Writing first chapter... This is the longest stage",
        "✍️ AI is generating your content...",
        "📖 Adding chapter details...",
      ],
      full: [
        "📚 Assembling full book...",
        "🔄 Making final touches...",
        "⚡ Almost done!",
      ],
    };

    const stageTips = tips[stage.id] || ["İşleniyor..."];
    return stageTips[Math.floor(Math.random() * stageTips.length)];
  }

  if (eta.stagesRemaining > 0) {
    const nextStage = totalStages - eta.stagesRemaining;
    return `Next: ${eta.stagesRemaining} stages remaining`;
  }

  return "Preparing...";
}

// Helper function to get stage-specific messages
export function getStageMessage(stageId: string, progress: number): string {
  const messages: Record<string, string[]> = {
    cover: [
      "🎨 Creating cover...",
      "🖼️ Designing visual...",
      "✨ Adding details...",
    ],
    chapter: [
      "📝 Writing chapter...",
      "✍️ Generating content...",
      "📖 Adding paragraphs...",
    ],
    full: [
      "📚 Assembling...",
      "🔄 Making touches...",
      "⚡ Finalizing...",
    ],
  };

  const stageMessages = messages[stageId] || ["Processing..."];
  const index = Math.min(
    Math.floor(progress / (100 / stageMessages.length)),
    stageMessages.length - 1
  );

  return stageMessages[index];
}
