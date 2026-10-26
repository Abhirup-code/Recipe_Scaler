"use client";

import { useEffect } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Registers the offline service worker in production builds. */
export function ServiceWorker({ enabled = process.env.NODE_ENV === "production" }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch(() => {
      // Offline support is a bonus; the site works without it.
    });
  }, [enabled]);
  return null;
}
