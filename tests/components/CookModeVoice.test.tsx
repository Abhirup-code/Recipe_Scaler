import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookMode } from "@/components/CookMode";
import type { SpeechRecognitionLike } from "@/lib/speech";

const steps = [{ text: "Chop the onion." }, { text: "Fry it.", minutes: 1 }, { text: "Serve." }];

class FakeRecognition implements SpeechRecognitionLike {
  static instances: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = true;
  onstart: SpeechRecognitionLike["onstart"] = null;
  onresult: SpeechRecognitionLike["onresult"] = null;
  onerror: SpeechRecognitionLike["onerror"] = null;
  onend: SpeechRecognitionLike["onend"] = null;
  started = 0;
  aborted = false;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.started += 1;
    this.onstart?.();
  }
  abort() {
    this.aborted = true;
  }
  say(transcript: string, isFinal = true) {
    act(() => this.onresult?.({ results: [Object.assign([{ transcript }], { isFinal })] }));
  }
}

const latest = () => FakeRecognition.instances[FakeRecognition.instances.length - 1]!;
const spoken: string[] = [];
type FakeUtterance = { text: string; onend: (() => void) | null };
let holdSpeech = false;
let pending: FakeUtterance | null = null;

beforeEach(() => {
  FakeRecognition.instances = [];
  spoken.length = 0;
  holdSpeech = false;
  pending = null;
  Object.assign(window, { webkitSpeechRecognition: FakeRecognition });
  Object.assign(window, {
    speechSynthesis: {
      speaking: false,
      cancel: vi.fn(),
      speak: (u: FakeUtterance) => {
        spoken.push(u.text);
        if (holdSpeech) pending = u;
        else u.onend?.();
      },
    },
    SpeechSynthesisUtterance: class {
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(window, "webkitSpeechRecognition");
  Reflect.deleteProperty(window, "speechSynthesis");
  Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
});

async function openWithVoice() {
  const user = userEvent.setup();
  render(<CookMode title="Test" steps={steps} />);
  await user.click(screen.getByRole("button", { name: "Start cook mode" }));
  await user.click(screen.getByRole("button", { name: "Hands-free" }));
  return user;
}

describe("CookMode hands-free voice", () => {
  it("hides the voice button where the browser has no speech recognition", async () => {
    Reflect.deleteProperty(window, "webkitSpeechRecognition");
    const user = userEvent.setup();
    render(<CookMode title="Test" steps={steps} />);
    await user.click(screen.getByRole("button", { name: "Start cook mode" }));
    expect(screen.queryByRole("button", { name: "Hands-free" })).not.toBeInTheDocument();
  });

  it("starts listening, reads the step aloud, and shows the commands", async () => {
    await openWithVoice();
    expect(screen.getByRole("button", { name: "Voice on" })).toHaveAttribute("aria-pressed", "true");
    expect(latest().continuous).toBe(true);
    expect(latest().lang).toBe("en-US");
    expect(screen.getByRole("status")).toHaveTextContent("Listening.");
    expect(screen.getByRole("status")).toHaveTextContent("start timer");
    expect(spoken).toEqual(["Chop the onion."]);
  });

  it("moves between steps and repeats on command", async () => {
    await openWithVoice();
    latest().say("next");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 2 of 3");
    expect(spoken.at(-1)).toBe("Fry it.");
    expect(screen.getByRole("status")).toHaveTextContent("Heard: “next”");
    latest().say("say that again");
    expect(spoken.at(-1)).toBe("Fry it.");
    latest().say("go back");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 1 of 3");
    latest().say("back");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 1 of 3");
  });

  it("ignores speech that is not a command", async () => {
    await openWithVoice();
    latest().say("these onions smell amazing");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 1 of 3");
    expect(screen.getByRole("status")).toHaveTextContent("Heard: “these onions smell amazing”");
  });

  it("ignores what it hears while it is reading a step aloud, then listens again", async () => {
    holdSpeech = true;
    await openWithVoice();
    latest().say("next");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 1 of 3");
    act(() => pending?.onend?.());
    latest().say("next");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 2 of 3");
  });

  it("is not fooled by a speaking flag the browser leaves stuck on", async () => {
    await openWithVoice();
    Object.assign(window.speechSynthesis, { speaking: true });
    latest().say("next");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 2 of 3");
  });

  it("stops ignoring the mic even if the browser never says it finished speaking", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      holdSpeech = true;
      await openWithVoice();
      await act(async () => {
        vi.advanceTimersByTime(5_000);
      });
      latest().say("next");
      expect(screen.getByRole("dialog")).toHaveTextContent("Step 2 of 3");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows words as they are heard but acts only on the final result", async () => {
    await openWithVoice();
    latest().say("nex", false);
    expect(screen.getByRole("status")).toHaveTextContent("Heard: “nex”");
    latest().say("next", false);
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 1 of 3");
    latest().say("next");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 2 of 3");
  });

  it("explains when it keeps hearing silence, and clears once it hears you", async () => {
    await openWithVoice();
    const recognition = latest();
    act(() => recognition.onerror?.({ error: "no-speech" }));
    expect(screen.getByRole("status")).toHaveTextContent("Listening.");
    act(() => recognition.onerror?.({ error: "no-speech" }));
    expect(screen.getByRole("status")).toHaveTextContent("I can't hear anything");
    recognition.say("next");
    expect(screen.getByRole("status")).toHaveTextContent("Listening.");
  });

  it.each([
    ["audio-capture", "No microphone found"],
    ["network", "needs an internet connection"],
  ])("explains a %s error and stops retrying", async (error, message) => {
    await openWithVoice();
    const recognition = latest();
    act(() => recognition.onerror?.({ error }));
    act(() => recognition.onend?.());
    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(recognition.started).toBe(1);
  });

  it("starts and pauses the step timer by voice", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await openWithVoice();
      latest().say("next");
      latest().say("start timer");
      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      latest().say("pause timer");
      expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
      expect(screen.getByRole("timer")).not.toHaveTextContent("1:00");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does nothing when asked to start a timer on a step without one", async () => {
    await openWithVoice();
    latest().say("start timer");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("exits cook mode and stops listening", async () => {
    await openWithVoice();
    const recognition = latest();
    recognition.say("exit");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(recognition.aborted).toBe(true);
  });

  it("keeps listening after the browser ends a session", async () => {
    await openWithVoice();
    const recognition = latest();
    expect(recognition.started).toBe(1);
    act(() => recognition.onend?.());
    expect(recognition.started).toBe(2);
  });

  it("explains when the microphone is blocked and stops retrying", async () => {
    await openWithVoice();
    const recognition = latest();
    act(() => recognition.onerror?.({ error: "not-allowed" }));
    act(() => recognition.onend?.());
    expect(screen.getByRole("status")).toHaveTextContent("Microphone access is blocked");
    expect(recognition.started).toBe(1);
  });

  it("turns off from the same button", async () => {
    const user = await openWithVoice();
    const recognition = latest();
    await user.click(screen.getByRole("button", { name: "Voice on" }));
    expect(recognition.aborted).toBe(true);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hands-free" })).toHaveAttribute("aria-pressed", "false");
  });
});
