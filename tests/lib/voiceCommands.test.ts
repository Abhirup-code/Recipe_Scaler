import { parseCommand } from "@/lib/voiceCommands";

describe("parseCommand", () => {
  it.each([
    ["next", "next"],
    ["Next step please", "next"],
    ["okay continue", "next"],
    ["move on", "next"],
    ["back", "back"],
    ["go back", "back"],
    ["previous", "back"],
    ["repeat", "repeat"],
    ["say that again", "repeat"],
    ["what was that?", "repeat"],
    ["start timer", "start_timer"],
    ["start the timer", "start_timer"],
    ["Set a timer.", "start_timer"],
    ["timer", "start_timer"],
    ["pause timer", "pause_timer"],
    ["stop the timer", "pause_timer"],
    ["exit", "exit"],
    ["stop cooking", "exit"],
    ["close", "exit"],
  ])("understands %j", (heard, command) => {
    expect(parseCommand(heard)).toBe(command);
  });

  it.each(["", "   ", "the onions look great", "nextdoor neighbour", "background music", "stop"])(
    "ignores %j",
    (heard) => {
      expect(parseCommand(heard)).toBeNull();
    },
  );

  it("prefers the timer command over exit when both words appear", () => {
    expect(parseCommand("stop timer")).toBe("pause_timer");
  });
});
