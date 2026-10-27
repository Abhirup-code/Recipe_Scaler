"use client";

import { useEffect, useRef, useState } from "react";
import { getSpeechRecognition, isSpeaking } from "./speech";
import { parseCommand, type VoiceCommand } from "./voiceCommands";

interface VoiceState {
  listening: boolean;
  heard: string | null;
  error: string | null;
}

const BLOCKED = "Microphone access is blocked. Allow it in your browser settings to use voice.";

/**
 * Listens for cook-mode commands while `enabled` is true. Recognition keeps restarting
 * (browsers stop after a pause in speech) until it is turned off or the mic is blocked.
 * Anything heard while the app itself is reading a step aloud is ignored.
 */
export function useVoiceControl(enabled: boolean, onCommand: (command: VoiceCommand) => void) {
  const [state, setState] = useState<VoiceState>({ listening: false, heard: null, error: null });
  const handler = useRef(onCommand);

  useEffect(() => {
    handler.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!enabled || !Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    let active = true;

    recognition.onstart = () => setState((s) => ({ ...s, listening: true, error: null }));
    recognition.onresult = (event) => {
      if (isSpeaking()) return;
      const latest = event.results[event.results.length - 1];
      const transcript = latest?.[0]?.transcript.trim() ?? "";
      if (!transcript) return;
      setState((s) => ({ ...s, heard: transcript }));
      const command = parseCommand(transcript);
      if (command) handler.current(command);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        active = false;
        setState((s) => ({ ...s, listening: false, error: BLOCKED }));
      }
    };
    recognition.onend = () => {
      if (!active) return;
      try {
        recognition.start();
      } catch {
        // Already restarting.
      }
    };

    try {
      recognition.start();
    } catch {
      // Some browsers throw if a previous session is still closing; onend will retry.
    }

    return () => {
      active = false;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Already stopped.
      }
    };
  }, [enabled]);

  return {
    supported: getSpeechRecognition() !== null,
    listening: enabled && state.listening,
    heard: enabled ? state.heard : null,
    error: enabled ? state.error : null,
  };
}
