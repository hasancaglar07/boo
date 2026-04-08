"use client";

import { useEffect } from "react";
import type { KeyboardShortcutsConfig } from "@/types/writing";

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const { shortcuts, enabled = true, disabledInInputs = true } = config;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Check if we're in an input field
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.contentEditable === 'true';

      if (isInInput && disabledInInputs) return;

      // Find matching shortcut
      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = !!s.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!s.shift === event.shiftKey;
        const altMatch = !!s.alt === event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, disabledInInputs]);
}

export const SHORTCUTS = {
  SAVE: {
    key: 's',
    ctrl: true,
    description: 'Save book',
  },
  QUICK_SAVE: {
    key: 's',
    ctrl: true,
    shift: true,
    description: 'Quick save',
  },
  NEW_CHAPTER: {
    key: 'n',
    ctrl: true,
    description: 'New chapter',
  },
};
