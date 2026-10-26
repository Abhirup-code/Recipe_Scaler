import { bestVolumeUnit, convert, isCountUnit, kindOf, toBase } from "@/lib/units";

describe("units", () => {
  it("classifies units", () => {
    expect(kindOf("cup")).toBe("volume");
    expect(kindOf("lb")).toBe("weight");
    expect(kindOf("clove")).toBe("count");
    expect(isCountUnit("can")).toBe(true);
    expect(isCountUnit("g")).toBe(false);
  });

  it("converts to base units", () => {
    expect(toBase(1, "cup")).toBeCloseTo(236.588);
    expect(toBase(1, "lb")).toBeCloseTo(453.592);
    expect(toBase(3, "piece")).toBe(3);
  });

  it("picks natural US volume units", () => {
    expect(bestVolumeUnit(5, "us")).toBe("tsp");
    expect(bestVolumeUnit(30, "us")).toBe("tbsp");
    expect(bestVolumeUnit(120, "us")).toBe("cup");
    expect(bestVolumeUnit(1500, "metric")).toBe("l");
  });

  it("rolls 3 teaspoons up into 1 tablespoon", () => {
    const r = convert({ qty: 3, unit: "tsp" }, "us");
    expect(r.unit).toBe("tbsp");
    expect(r.qty).toBeCloseTo(1, 2);
  });

  it("converts cups to millilitres and pounds to grams", () => {
    expect(convert({ qty: 2, unit: "cup" }, "metric")).toEqual({ qty: expect.closeTo(473.18, 1), unit: "ml" });
    const lb = convert({ qty: 1.5, unit: "lb" }, "metric");
    expect(lb.unit).toBe("g");
    expect(lb.qty).toBeCloseTo(680.4, 1);
    expect(convert({ qty: 3, unit: "lb" }, "metric").unit).toBe("kg");
  });

  it("converts grams back to ounces and pounds for US", () => {
    expect(convert({ qty: 200, unit: "g" }, "us").unit).toBe("oz");
    expect(convert({ qty: 500, unit: "g" }, "us").unit).toBe("lb");
  });

  it("shows flour by weight in metric when its density is known", () => {
    const flour = convert({ qty: 2, unit: "cup" }, "metric", 125);
    expect(flour).toEqual({ qty: expect.closeTo(250, 5), unit: "g" });
  });

  it("leaves counted items alone", () => {
    expect(convert({ qty: 2, unit: "clove" }, "metric")).toEqual({ qty: 2, unit: "clove" });
  });
});
