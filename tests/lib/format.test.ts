import { formatAmount, formatDecimal, formatFraction, roundCount, unitLabel } from "@/lib/format";

describe("formatFraction", () => {
  it.each([
    [1, "1"],
    [1.5, "1½"],
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [2 / 3, "⅔"],
    [2.75, "2¾"],
    [0.125, "⅛"],
    [0.97, "1"],
    [3.02, "3"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatFraction(value)).toBe(expected);
  });

  it("describes amounts too small to measure", () => {
    expect(formatFraction(0.03)).toBe("a little");
    expect(formatFraction(0)).toBe("0");
  });
});

describe("formatDecimal", () => {
  it.each([
    [2.25, "2.3"],
    [12.4, "12"],
    [237, "235"],
    [0.02, "a little"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatDecimal(value)).toBe(expected);
  });
});

describe("unit labels and amounts", () => {
  it("pluralizes only when more than one", () => {
    expect(unitLabel("cup", 1)).toBe("cup");
    expect(unitLabel("cup", 1.5)).toBe("cups");
    expect(unitLabel("clove", 4)).toBe("cloves");
    expect(unitLabel("piece", 3)).toBe("");
  });

  it("uses fractions for US units and decimals for metric units", () => {
    expect(formatAmount(1.5, "cup", "us")).toBe("1½");
    expect(formatAmount(354.9, "ml", "metric")).toBe("355");
    expect(formatAmount(2, "piece", "metric")).toBe("2");
  });
});

describe("counted ingredients round like a cook would", () => {
  it.each([
    [0.1, 0.5],
    [0.6, 0.5],
    [0.8, 1],
    [1.2, 1],
    [1.3, 1.5],
    [1.625, 1.5],
    [1.8, 2],
    [2.4, 2],
    [3.125, 3],
    [6.33, 6],
    [6.5, 7],
  ])("rounds %s to %s", (value, expected) => {
    expect(roundCount(value)).toBe(expected);
  });

  it("never turns a real amount into nothing", () => {
    expect(roundCount(0.01)).toBe(0.5);
    expect(roundCount(0)).toBe(0);
  });

  it("formats counts with halves and whole numbers only, in both unit systems", () => {
    expect(formatAmount(1.625, "piece", "us")).toBe("1½");
    expect(formatAmount(3.125, "piece", "metric")).toBe("3");
    expect(formatAmount(6.33, "clove", "us")).toBe("6");
    expect(formatAmount(0.2, "can", "us")).toBe("½");
  });

  it("pluralizes by the rounded amount", () => {
    expect(unitLabel("clove", 1.2)).toBe("clove");
    expect(unitLabel("clove", 1.3)).toBe("cloves");
    expect(unitLabel("can", 0.6)).toBe("can");
  });

  it("leaves measured amounts precise", () => {
    expect(formatAmount(1.625, "tsp", "us")).toBe("1⅝");
    expect(formatAmount(1.625, "cup", "us")).toBe("1⅝");
  });
});
