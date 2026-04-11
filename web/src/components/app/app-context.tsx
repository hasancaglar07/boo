"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loadBooks, type Book } from "@/lib/dashboard-api";

type AppContextType = {
  books: Book[];
  loadingBooks: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  refreshBooks: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

/** Throws if no AppContextProvider ancestor — use inside /app/app/* layout only. */
export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppContextProvider");
  return ctx;
}

/** Safe version — returns null when used outside AppContextProvider (e.g. /start/* routes). */
export function useOptionalAppContext(): AppContextType | null {
  return useContext(AppContext);
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const loaded = await loadBooks();
      setBooks(loaded);
    } catch {
      // silent — sidebar shows empty / cached state
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    void refreshBooks();
  }, [refreshBooks]);

  const value = useMemo(
    () => ({ books, loadingBooks, drawerOpen, setDrawerOpen, refreshBooks }),
    [books, loadingBooks, drawerOpen, refreshBooks],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
