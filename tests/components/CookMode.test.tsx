import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookMode } from "@/components/CookMode";

const steps = [{ text: "Chop the onion." }, { text: "Fry it.", minutes: 1 }, { text: "Serve." }];

describe("CookMode", () => {
  it("walks through steps one at a time and closes", async () => {
    const user = userEvent.setup();
    render(<CookMode title="Test" steps={steps} />);
    await user.click(screen.getByRole("button", { name: "Start cook mode" }));
    const dialog = screen.getByRole("dialog", { name: "Cook mode: Test" });
    expect(dialog).toHaveTextContent("Step 1 of 3");
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next step" }));
    expect(dialog).toHaveTextContent("Fry it.");
    expect(screen.getByRole("timer")).toHaveTextContent("1:00");
    await user.click(screen.getByRole("button", { name: "Next step" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start cook mode" })).toHaveFocus();
  });

  it("supports arrow keys and Escape", async () => {
    const user = userEvent.setup();
    render(<CookMode title="Test" steps={steps} />);
    await user.click(screen.getByRole("button", { name: "Start cook mode" }));
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 3 of 3");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 2 of 3");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the screen awake when the browser allows it, and releases it on exit", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: vi.fn().mockResolvedValue({ release }) },
    });
    const user = userEvent.setup();
    render(<CookMode title="Test" steps={steps} />);
    await user.click(screen.getByRole("button", { name: "Start cook mode" }));
    expect(await screen.findByText(/screen stays on/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exit" }));
    expect(release).toHaveBeenCalled();
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  it("still works when the wake lock is refused", async () => {
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const user = userEvent.setup();
    render(<CookMode title="Test" steps={steps} />);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Start cook mode" }));
    });
    expect(screen.getByRole("dialog")).not.toHaveTextContent("screen stays on");
    Reflect.deleteProperty(navigator, "wakeLock");
  });
});
