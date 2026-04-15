"use client";

import { Keyboard } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Shortcut {
  key: string;
  descriptionKey: string;
}

const shortcuts: Shortcut[] = [
  { key: "Ctrl + S", descriptionKey: "shortcutSave" },
  { key: "Ctrl + N", descriptionKey: "shortcutNewChapter" },
  { key: "Esc", descriptionKey: "shortcutClose" },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  const t = useTranslations("KeyboardShortcutsHelp");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5" />
            {t("dialogTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                {t(shortcut.descriptionKey as Parameters<typeof t>[0])}
              </span>
              <Badge className="font-mono text-xs">
                {shortcut.key}
              </Badge>
            </div>
          ))}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {t("openHelpHint", { key: "?" })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
