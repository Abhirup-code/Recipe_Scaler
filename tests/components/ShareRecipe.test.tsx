import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipePanel } from "@/components/RecipePanel";
import { getRecipe } from "@/data/recipes";
import { unitSystemStore } from "@/lib/stores";

const dal = getRecipe("kolkata-masoor-dal")!;
const PAGE = "/recipes/kolkata-masoor-dal/";

beforeEach(() => {
  unitSystemStore.set("us");
  window.history.replaceState(null, "", PAGE);
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "share");
  window.history.replaceState(null, "", "/");
});

describe("Sharing a scaled recipe", () => {
  it("opens a shared link at its servings and units without changing your saved units", async () => {
    window.history.replaceState(null, "", `${PAGE}?servings=8&units=metric`);
    await act(async () => {
      render(<RecipePanel recipe={dal} />);
    });
    expect(screen.getByText("8 servings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Metric" })).toHaveAttribute("aria-pressed", "true");
    expect(unitSystemStore.getSnapshot()).toBe("us");
  });

  it("goes back to your own units choice once you pick one", async () => {
    window.history.replaceState(null, "", `${PAGE}?units=metric`);
    const user = userEvent.setup();
    await act(async () => {
      render(<RecipePanel recipe={dal} />);
    });
    await user.click(screen.getByRole("button", { name: "US" }));
    expect(screen.getByRole("button", { name: "US" })).toHaveAttribute("aria-pressed", "true");
    expect(unitSystemStore.getSnapshot()).toBe("us");
  });

  it("ignores a bad link and shows the recipe as written", async () => {
    window.history.replaceState(null, "", `${PAGE}?servings=500&units=imperial`);
    await act(async () => {
      render(<RecipePanel recipe={dal} />);
    });
    expect(screen.getByText("4 servings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "US" })).toHaveAttribute("aria-pressed", "true");
  });

  it("uses the phone's share sheet when there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    const user = userEvent.setup();
    render(<RecipePanel recipe={dal} />);
    await user.click(screen.getByRole("button", { name: "More servings" }));
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(share).toHaveBeenCalledWith({
      title: "Kolkata-Style Masoor Dal",
      text: "Kolkata-Style Masoor Dal, scaled for 5 servings",
      url: `${window.location.origin}${PAGE}?servings=5&units=us`,
    });
  });

  it("does nothing more when you close the share sheet", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("closed", "AbortError"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<RecipePanel recipe={dal} />);
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link where there is no share sheet", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<RecipePanel recipe={dal} />);
    await user.click(screen.getByRole("button", { name: "Metric" }));
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}${PAGE}?servings=4&units=metric`);
    expect(screen.getByText(/Link copied/)).toBeInTheDocument();
  });

  it("shows the link to copy by hand if copying is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("blocked"));
    render(<RecipePanel recipe={dal} />);
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.getByText(/Could not copy/)).toBeInTheDocument();
    expect(screen.getByLabelText("Link to share")).toHaveValue(`${window.location.origin}${PAGE}?servings=4&units=us`);
  });

  it("shows a QR code that follows the servings on screen", async () => {
    const user = userEvent.setup();
    render(<RecipePanel recipe={dal} />);
    await user.click(screen.getByRole("button", { name: "QR code" }));
    expect(screen.getByRole("img", { name: /QR code linking to .* 4 servings/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide QR code" })).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "More servings" }));
    expect(screen.getByRole("img", { name: /QR code linking to .* 5 servings/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hide QR code" }));
    expect(screen.queryByRole("img", { name: /QR code/ })).not.toBeInTheDocument();
  });
});
