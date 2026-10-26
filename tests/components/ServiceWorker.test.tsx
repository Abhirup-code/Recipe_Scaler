import { render } from "@testing-library/react";
import { ServiceWorker } from "@/components/ServiceWorker";

describe("ServiceWorker", () => {
  afterEach(() => Reflect.deleteProperty(navigator, "serviceWorker"));

  it("registers the offline worker when enabled", () => {
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    render(<ServiceWorker enabled />);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
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
