"use client";
import { useEffect, useState } from "react";

/**
 * Prototype loading state — mock data is synchronous, so this briefly flips
 * `loading` true on mount to exercise skeleton states the way a real fetch would.
 */
export function useSimulatedLoad(ms = 600): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
