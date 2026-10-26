type Win = Window & { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] };

async function load(gaId: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_ID", gaId);
  return import("@/lib/analytics");
}

describe("analytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as Win).gtag;
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: null });
    Reflect.deleteProperty(navigator, "globalPrivacyControl");
  });

  it("does nothing without a GA4 ID", async () => {
    const { track, trackingAllowed } = await load("");
    const gtag = vi.fn();
    (window as Win).gtag = gtag;
    track("save_recipe");
    expect(trackingAllowed()).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("sends events when a GA4 ID is set", async () => {
    const { track } = await load("G-TEST123");
    const gtag = vi.fn();
    (window as Win).gtag = gtag;
    track("start_cook_mode", { recipe: "x", variant: "B" });
    expect(gtag).toHaveBeenCalledWith("event", "start_cook_mode", { recipe: "x", variant: "B" });
  });

  it("respects Do Not Track and Global Privacy Control", async () => {
    const { trackingAllowed } = await load("G-TEST123");
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "1" });
    expect(trackingAllowed()).toBe(false);
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: null });
    Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: true });
    expect(trackingAllowed()).toBe(false);
  });

  it("never throws, even if gtag does", async () => {
    const { track } = await load("G-TEST123");
    (window as Win).gtag = () => {
      throw new Error("blocked by an ad blocker");
    };
    expect(() => track("print_recipe")).not.toThrow();
  });

  it("loads the GA4 script only when allowed", async () => {
    const { render } = await import("@testing-library/react");
    await load("G-TEST123");
    const { Analytics } = await import("@/components/Analytics");
    render(<Analytics />);
    const script = document.head.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-TEST123"]');
    expect(script).not.toBeNull();
    expect((window as Win).dataLayer?.length).toBeGreaterThan(0);
    script?.remove();
  });

  it("does not load the script when Do Not Track is on", async () => {
    const { render } = await import("@testing-library/react");
    await load("G-TEST123");
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "1" });
    const { Analytics } = await import("@/components/Analytics");
    render(<Analytics />);
    expect(document.head.querySelector('script[src*="googletagmanager"]')).toBeNull();
  });
});
