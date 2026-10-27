"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Lets cook mode start and pause the timer by voice. */
export interface StepTimerHandle {
  start(): void;
  pause(): void;
}

/** Countdown for a cooking step. Announces "Time's up" to screen readers and vibrates if it can. */
export function StepTimer({ minutes, ref }: { minutes: number; ref?: Ref<StepTimerHandle> }) {
  const total = Math.round(minutes * 60);
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      start: () => setRunning(left > 0),
      pause: () => setRunning(false),
    }),
    [left],
  );

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          navigator.vibrate?.([200, 100, 200]);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  return (
    <div className="timer">
      <span className="timer-time" role="timer" aria-live="off">
        {fmt(left)}
      </span>
      <span className="sr-only" aria-live="assertive">
        {left === 0 ? "Time's up" : ""}
      </span>
      {left === 0 ? (
        <strong className="timer-done">Time&apos;s up!</strong>
      ) : (
        <button type="button" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : left === total ? `Start ${minutes} min timer` : "Resume"}
        </button>
      )}
      {left !== total && (
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setLeft(total);
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
}
