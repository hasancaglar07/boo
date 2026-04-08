"use client";

import { Check, Clock, Disc, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  countdown?: number;
  onSave: () => void;
}

export function AutoSaveIndicator({
  isDirty,
  isSaving,
  lastSaved,
  countdown = 0,
  onSave,
}: AutoSaveIndicatorProps) {
  const formatLastSaved = (date?: Date): string => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const statusConfig = isSaving
    ? {
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950",
        icon: Loader2,
        iconSpin: true,
        text: "Saving...",
      }
    : isDirty
    ? {
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950",
        icon: Clock,
        iconSpin: false,
        text: countdown > 0 ? `Auto-save in ${countdown}s` : "Unsaved changes",
      }
    : {
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950",
        icon: Check,
        iconSpin: false,
        text: `Saved ${formatLastSaved(lastSaved)}`,
      };

  const config = statusConfig;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          config.bgColor,
          config.color
        )}
      >
        <Icon className={cn("size-4", config.iconSpin && "animate-spin")} />
        <span>{config.text}</span>
      </div>
      {(isDirty || isSaving) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="gap-1.5"
        >
          <Disc className="size-3.5" />
          Save
        </Button>
      )}
    </div>
  );
}
