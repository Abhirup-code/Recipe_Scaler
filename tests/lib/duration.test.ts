import { humanDuration, isoDuration } from "@/lib/duration";

describe("durations", () => {
  it.each([
    [0, "PT0M"],
    [25, "PT25M"],
    [60, "PT1H"],
    [75, "PT1H15M"],
  ])("ISO 8601 for %s minutes is %s", (m, iso) => {
    expect(isoDuration(m)).toBe(iso);
  });

  it("reads naturally", () => {
    expect(humanDuration(40)).toBe("40 min");
    expect(humanDuration(60)).toBe("1 hr");
    expect(humanDuration(75)).toBe("1 hr 15 min");
  });
});
