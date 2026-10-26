import { readJson, writeJson } from "@/lib/storage";

describe("safe storage", () => {
  it("round-trips JSON", () => {
    writeJson("k", { a: 1 });
    expect(readJson("k", null)).toEqual({ a: 1 });
  });

  it("falls back on missing or corrupt data", () => {
    expect(readJson("missing", [])).toEqual([]);
    window.localStorage.setItem("bad", "{not json");
    expect(readJson("bad", "fallback")).toBe("fallback");
  });

  it("does not throw when storage is blocked", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => writeJson("k", 1)).not.toThrow();
    spy.mockRestore();
  });
});
