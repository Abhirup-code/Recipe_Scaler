import { formatAmount, formatDecimal, formatFraction, unitLabel } from "@/lib/format";

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
