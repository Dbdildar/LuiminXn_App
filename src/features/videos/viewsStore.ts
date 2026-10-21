import {useSyncExternalStore} from 'react';

const counts = new Map<string, number>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());

export function subscribeViews(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Instantly +1 a video's view count (shared by Home cards and Detail). */
export function bumpViews(id: string, currentViews: number) {
  const next = Math.max(counts.get(id) ?? 0, currentViews ?? 0) + 1;
  counts.set(id, next);
  emit();
  return next;
}

export function useViewCount(id: string, base: number | undefined) {
  const override = useSyncExternalStore(
    subscribeViews,
    () => counts.get(id),
    () => undefined,
  );
  return Math.max(base ?? 0, override ?? 0);
}

/** For tests. */
export function resetViewsStore() {
  counts.clear();
  emit();
}