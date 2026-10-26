import { createStore } from "./store";

/**
 * A simple A/B test: each visitor is randomly and permanently placed in one variant,
 * remembered in localStorage. Events include the variant, so results can be compared
 * in Google Analytics (for example, how often each variant starts cook mode).
 */
export const COOK_BUTTON_EXPERIMENT = {
  name: "cook_button_label",
  variants: { A: "Start cook mode", B: "Cook step by step" },
} as const;

export type Variant = keyof typeof COOK_BUTTON_EXPERIMENT.variants;

export const cookButtonVariantStore = createStore<Variant | null>("recipe-scaler:exp:cook_button_label", null);

export function assignVariant(random: () => number = Math.random): Variant {
  return random() < 0.5 ? "A" : "B";
}
