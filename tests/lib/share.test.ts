import { readSharedView, shareUrl } from "@/lib/share";

describe("share links", () => {
  it("builds a link at the current servings and units, dropping anything else", () => {
    expect(shareUrl("https://example.com/r/dal/?utm=x#steps", 6, "metric")).toBe(
      "https://example.com/r/dal/?servings=6&units=metric",
    );
    expect(shareUrl("https://example.com/r/dal/", 6.31578947, "us")).toBe(
      "https://example.com/r/dal/?servings=6.32&units=us",
    );
  });

  it("reads servings and units back", () => {
    expect(readSharedView("?servings=6&units=metric")).toEqual({ servings: 6, units: "metric" });
    expect(readSharedView("?servings=2.5")).toEqual({ servings: 2.5 });
    expect(readSharedView("?units=us")).toEqual({ units: "us" });
    expect(readSharedView("")).toEqual({});
  });

  it.each(["?servings=0", "?servings=-3", "?servings=49", "?servings=abc", "?servings=", "?servings=Infinity"])(
    "ignores out-of-range or malformed servings in %s",
    (search) => {
      expect(readSharedView(search).servings).toBeUndefined();
    },
  );

  it("ignores unknown units", () => {
    expect(readSharedView("?units=imperial").units).toBeUndefined();
  });
});
