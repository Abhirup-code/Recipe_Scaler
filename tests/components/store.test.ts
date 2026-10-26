import { createStore } from "@/lib/store";

describe("createStore", () => {
  it("returns a stable snapshot until the value changes, and notifies subscribers", () => {
    const store = createStore("t", { n: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    store.set({ n: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ n: 1 });
    expect(store.getServerSnapshot()).toEqual({ n: 0 });
    unsubscribe();
  });

  it("syncs changes made in another tab", () => {
    const store = createStore("sync", 0);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    window.localStorage.setItem("sync", "5");
    window.dispatchEvent(new StorageEvent("storage", { key: "sync" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(5);
    unsubscribe();
  });

  it("falls back when storage cannot be read", () => {
    const store = createStore("blocked", "fallback");
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(store.getSnapshot()).toBe("fallback");
    spy.mockRestore();
  });
});
