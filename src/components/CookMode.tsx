"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Step } from "@/lib/types";
import { StepTimer } from "./StepTimer";

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

/**
 * Full-screen, one-step-at-a-time view for cooking. Big text for reading from across the
 * counter, arrow keys or buttons to move, timers on timed steps, and the screen kept awake.
 */
export function CookMode({ title, steps }: { title: string; steps: Step[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [awake, setAwake] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const lock = useRef<WakeLockSentinelLike | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    lock.current?.release().catch(() => undefined);
    lock.current = null;
    setAwake(false);
    openerRef.current?.focus();
  }, []);

  async function start() {
    setIndex(0);
    setOpen(true);
    try {
      const wakeLock = (navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> } }).wakeLock;
      if (wakeLock) {
        lock.current = await wakeLock.request("screen");
        setAwake(true);
      }
    } catch {
      setAwake(false); // Not allowed (low battery, unsupported browser): cook mode still works.
    }
  }

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(steps.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, steps.length]);

  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <>
      <button ref={openerRef} type="button" className="button primary" onClick={start}>
        Start cook mode
      </button>
      {open && step && (
        <div
          ref={dialogRef}
          className="cook-mode"
          role="dialog"
          aria-modal="true"
          aria-label={`Cook mode: ${title}`}
          tabIndex={-1}
        >
          <div className="cook-top">
            <p className="muted">
              Step {index + 1} of {steps.length}
              {awake && " · screen stays on"}
            </p>
            <button type="button" className="link-button" onClick={close}>
              Exit
            </button>
          </div>
          <progress max={steps.length} value={index + 1} aria-label="Progress" />
          <p className="cook-step" aria-live="polite">
            {step.text}
          </p>
          {step.minutes !== undefined && <StepTimer key={index} minutes={step.minutes} />}
          <div className="cook-nav">
            <button type="button" className="button" onClick={() => setIndex(index - 1)} disabled={index === 0}>
              Back
            </button>
            {last ? (
              <button type="button" className="button primary" onClick={close}>
                Done
              </button>
            ) : (
              <button type="button" className="button primary" onClick={() => setIndex(index + 1)}>
                Next step
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
