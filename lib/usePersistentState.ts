"use client";
import { useEffect, useRef, useState } from "react";

/**
 * useState backed by localStorage — remembers UX preferences (view mode,
 * calendar scope, etc.) across reloads and route changes, per user's browser.
 *
 * The initial render always returns `initial` (so server and first client
 * paint match); the stored value is applied on mount to avoid hydration drift.
 */
export function usePersistentState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore malformed storage */
    }
    hydrated.current = true;
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — preference just won't persist */
    }
  }, [key, value]);

  return [value, setValue];
}
