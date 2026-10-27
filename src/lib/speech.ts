/** Minimal types for the Web Speech API, which TypeScript's DOM library does not include. */
export interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

/** The browser's speech recognizer (Chrome, Edge, and Safari), or null where unsupported. */
export function getSpeechRecognition(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Read text aloud with the browser's built-in voice. Does nothing where unsupported. */
export function speak(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
    synth.cancel();
    synth.speak(new SpeechSynthesisUtterance(text));
  } catch {
    // Reading aloud is a bonus; the step is still on screen.
  }
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Nothing to stop.
  }
}

export function isSpeaking(): boolean {
  try {
    return window.speechSynthesis?.speaking === true;
  } catch {
    return false;
  }
}
