/** Minimal types for the Web Speech API, which TypeScript's DOM library does not include. */
export interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
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

// Tracks our own reading-aloud, not speechSynthesis.speaking: Chrome can leave that flag
// stuck on, which would make every command look like an echo of the app's own voice.
let talking = false;
let talkTimer: ReturnType<typeof setTimeout> | undefined;

function doneTalking() {
  talking = false;
  clearTimeout(talkTimer);
}

/** Read text aloud with the browser's built-in voice. Does nothing where unsupported. */
export function speak(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    talking = true;
    utterance.onend = doneTalking;
    utterance.onerror = doneTalking;
    // Safety net in case the browser never reports the end: about 12 characters a second.
    clearTimeout(talkTimer);
    talkTimer = setTimeout(doneTalking, Math.min(20_000, 1_000 + text.length * 85));
    synth.speak(utterance);
  } catch {
    doneTalking(); // Reading aloud is a bonus; the step is still on screen.
  }
}

export function stopSpeaking(): void {
  doneTalking();
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Nothing to stop.
  }
}

/** True while the app is reading a step aloud, so the mic does not act on its own voice. */
export function isSpeaking(): boolean {
  return talking;
}
