export type VoiceCommand = "next" | "back" | "repeat" | "start_timer" | "pause_timer" | "exit";

// Checked in order, so the more specific phrases ("stop timer") win over general ones ("stop").
const RULES: ReadonlyArray<readonly [VoiceCommand, RegExp]> = [
  ["pause_timer", /\b(pause|stop|hold)( the)? timer\b/],
  ["start_timer", /\b(start|begin|set|run)( the| a)? timer\b|^timer$/],
  ["exit", /\b(exit|close|quit|stop cooking|end cook mode)\b/],
  ["back", /\b(go back|back|previous|last step)\b/],
  ["repeat", /\b(repeat|again|say that again|what was that|read it|read step)\b/],
  ["next", /\b(next|continue|go on|forward|move on)\b/],
];

/** Turn what the speech recognizer heard into a cook-mode command, or null if it is not one. */
export function parseCommand(transcript: string): VoiceCommand | null {
  const text = transcript
    .toLowerCase()
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  for (const [command, pattern] of RULES) {
    if (pattern.test(text)) return command;
  }
  return null;
}

export const VOICE_HINT = "Say “next”, “back”, “repeat”, “start timer”, “pause timer”, or “exit”.";
