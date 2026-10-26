"use client";

import { useEffect } from "react";
import { GA_ID, trackingAllowed } from "@/lib/analytics";

/** Loads Google Analytics 4 after the page is interactive, only when allowed. */
export function Analytics() {
  useEffect(() => {
    if (!trackingAllowed()) return;
    const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function gtag() {
      // GA4 expects the arguments object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer?.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", GA_ID);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(script);
  }, []);
  return null;
}
