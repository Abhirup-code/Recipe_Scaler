"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { getSpeechRecognition, speak, stopSpeaking } from "@/lib/speech";
import type { Step } from "@/lib/types";
import { useVoiceControl } from "@/lib/useVoiceControl";
import { VOICE_HINT, type VoiceCommand } from "@/lib/voiceCommands";
import { StepTimer, type StepTimerHandle } from "./StepTimer";

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

/**
 * Full-screen, one-step-at-a-time view for cooking. Big text for reading from across the
 * counter, arrow keys, buttons, or voice to move, timers on timed steps, and the screen kept awake.
 */
export function CookMode({
  title,
  steps,
  label = "Start cook mode",
  onStart,
  onFinish,
}: {
  title: string;
  steps: Step[];
  label?: string;
  onStart?: () => void;
  onFinish?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [awake, setAwake] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<StepTimerHandle>(null);
  const lock = useRef<WakeLockSentinelLike | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setVoiceOn(false);
    stopSpeaking();
    lock.current?.release().catch(() => undefined);
    lock.current = null;
    setAwake(false);
    openerRef.current?.focus();
  }, []);

  async function start() {
    setIndex(0);
    setOpen(true);
    setVoiceSupported(getSpeechRecognition() !== null);
    onStart?.();
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

  const goTo = useCallback(
    (next: number, readAloud: boolean) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, next));
      setIndex(clamped);
      if (readAloud && steps[clamped]) speak(steps[clamped].text);
    },
    [steps],
  );

  const onCommand = useCallback(
    (command: VoiceCommand) => {
      track("voice_command", { command });
      switch (command) {
        case "next":
          goTo(index + 1, true);
          break;
        case "back":
          goTo(index - 1, true);
          break;
        case "repeat":
          goTo(index, true);
          break;
        case "start_timer":
          timerRef.current?.start();
          break;
        case "pause_timer":
          timerRef.current?.pause();
          break;
        case "exit":
          close();
          break;
      }
    },
    [index, goTo, close],
  );

  const voice = useVoiceControl(open && voiceOn, onCommand);

  function toggleVoice() {
    if (voiceOn) {
      setVoiceOn(false);
      stopSpeaking();
      return;
    }
    setVoiceOn(true);
    track("enable_voice");
    if (steps[index]) speak(steps[index].text);
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
        {label}
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
            <div className="cook-actions">
              {voiceSupported && (
                <button
                  type="button"
                  className={voiceOn ? "button voice-on" : "button"}
                  aria-pressed={voiceOn}
                  onClick={toggleVoice}
                >
                  {voiceOn ? "Voice on" : "Hands-free"}
                </button>
              )}
              <button type="button" className="link-button" onClick={close}>
                Exit
              </button>
            </div>
          </div>
          {voiceOn && (
            <p className="voice-status" role="status">
              {voice.error ?? (
                <>
                  {voice.listening ? "Listening. " : "Starting the microphone. "}
                  {VOICE_HINT}
                  {voice.heard && <span className="voice-heard"> Heard: “{voice.heard}”</span>}
                </>
              )}
            </p>
          )}
          <progress max={steps.length} value={index + 1} aria-label="Progress" />
          <p className="cook-step" aria-live="polite">
            {step.text}
          </p>
          {step.minutes !== undefined && <StepTimer key={index} ref={timerRef} minutes={step.minutes} />}
          <div className="cook-nav">
            <button type="button" className="button" onClick={() => setIndex(index - 1)} disabled={index === 0}>
              Back
            </button>
            {last ? (
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  onFinish?.();
                  close();
                }}
              >
                Done
              </button>
            ) : (
              <button type="button" className="button primary" onClick={() => setIndex(index + 1)}>
                Next step
              </button>
            )}
          </div>
          {voiceSupported && !voiceOn && (
            <p className="muted voice-note">
              Hands-free uses your browser&apos;s speech recognition, which may send audio to the browser maker&apos;s speech service. This site never stores what you say.
            </p>
          )}
        </div>
      )}
    </>
  );
}
