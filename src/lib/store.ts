import { readJson, writeJson } from "./storage";

/**
 * A tiny localStorage-backed store for React's useSyncExternalStore. The server and the
 * first client render both use the fallback, so there is no hydration mismatch; saved
 * values appear right after, and every open tab stays in sync through "storage" events.
 */
export function createStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue = fallback;

  const notify = () => listeners.forEach((l) => l());
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) notify();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot(): T {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(key);
      } catch {
        raw = null;
      }
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = readJson(key, fallback);
      }
      return cachedValue;
    },
    getServerSnapshot(): T {
      return fallback;
    },
    set(value: T) {
      writeJson(key, value);
      notify();
    },
  };
}
