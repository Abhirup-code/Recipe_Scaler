import { render } from "@testing-library/react";
import { ServiceWorker } from "@/components/ServiceWorker";

// CI builds for GitHub Pages under /<repo-name>, so the worker lives under that path there.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

describe("ServiceWorker", () => {
  afterEach(() => Reflect.deleteProperty(navigator, "serviceWorker"));

  it("registers the offline worker when enabled", () => {
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    render(<ServiceWorker enabled />);
    expect(register).toHaveBeenCalledWith(`${base}/sw.js`, { scope: `${base}/` });
  });

  it("does nothing in development or unsupported browsers", () => {
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    render(<ServiceWorker enabled={false} />);
    expect(register).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, "serviceWorker");
    expect(() => render(<ServiceWorker enabled />)).not.toThrow();
  });

  it("ignores registration failures", async () => {
    const register = vi.fn().mockRejectedValue(new Error("blocked"));
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    render(<ServiceWorker enabled />);
    await Promise.resolve();
    expect(register).toHaveBeenCalled();
  });
});
