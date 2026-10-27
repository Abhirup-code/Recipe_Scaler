import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackupControls } from "@/components/BackupControls";
import { backupJson, myRecipesStore, validMyRecipes } from "@/lib/myRecipes";
import type { Recipe } from "@/lib/types";

const TOAST: Recipe = {
  slug: "my-toast1",
  name: "Cheese Toast",
  description: "Imported by you.",
  cuisine: "Your recipe",
  category: "Imported",
  servings: 2,
  prepMinutes: 0,
  cookMinutes: 5,
  image: "",
  imageAlt: "",
  tags: ["mine"],
  datePublished: "2026-10-27",
  ingredients: [{ qty: 4, name: "bread slices" }],
  steps: [{ text: "Toast." }],
};
const SOUP = { ...TOAST, slug: "my-soup1", name: "Soup" };

const file = (text: string, name = "backup.json") => new File([text], name, { type: "application/json" });

beforeEach(() => myRecipesStore.set([]));

describe("BackupControls", () => {
  it("downloads a dated backup file of your recipes", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:backup");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<BackupControls recipes={[TOAST]} />);
    await user.click(screen.getByRole("button", { name: "Download backup" }));
    const blob = createObjectURL.mock.calls[0]![0] as Blob;
    expect(JSON.parse(await blob.text()).recipes).toEqual([TOAST]);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toMatch(/^recipe-scaler-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:backup");
    expect(screen.getByRole("status")).toHaveTextContent("Downloaded a backup of 1 recipe.");
  });

  it("cannot download an empty backup", () => {
    render(<BackupControls recipes={[]} />);
    expect(screen.getByRole("button", { name: "Download backup" })).toBeDisabled();
  });

  it("restores recipes from a backup file and says what happened", async () => {
    myRecipesStore.set([TOAST]);
    const user = userEvent.setup();
    render(<BackupControls recipes={[TOAST]} />);
    await user.upload(screen.getByLabelText("Restore from backup"), file(backupJson([TOAST, SOUP], new Date())));
    expect(validMyRecipes(myRecipesStore.getSnapshot()).map((r) => r.name)).toEqual(["Cheese Toast", "Soup"]);
    expect(screen.getByRole("status")).toHaveTextContent("Restored 1 recipe. 1 recipe already here.");
  });

  it("reports damaged entries it skipped", async () => {
    const user = userEvent.setup();
    render(<BackupControls recipes={[]} />);
    const text = JSON.stringify({ app: "recipe-scaler", version: 1, recipes: [SOUP, { junk: 1 }, { junk: 2 }] });
    await user.upload(screen.getByLabelText("Restore from backup"), file(text));
    expect(screen.getByRole("status")).toHaveTextContent("Restored 1 recipe. Skipped 2 damaged entries.");
  });

  it("explains a file that is not a backup, and changes nothing", async () => {
    myRecipesStore.set([TOAST]);
    const user = userEvent.setup();
    render(<BackupControls recipes={[TOAST]} />);
    await user.upload(screen.getByLabelText("Restore from backup"), file("{not json"));
    expect(screen.getByRole("status")).toHaveTextContent("not a Recipe Scaler backup");
    expect(screen.getByRole("status")).toHaveClass("field-error");
    expect(myRecipesStore.getSnapshot()).toEqual([TOAST]);
  });

  it("refuses a file that is far too big without reading it", async () => {
    const user = userEvent.setup();
    render(<BackupControls recipes={[]} />);
    const big = file("x");
    Object.defineProperty(big, "size", { value: 3_000_000 });
    const text = vi.spyOn(big, "text");
    await user.upload(screen.getByLabelText("Restore from backup"), big);
    expect(screen.getByRole("status")).toHaveTextContent("too large");
    expect(text).not.toHaveBeenCalled();
  });
});
