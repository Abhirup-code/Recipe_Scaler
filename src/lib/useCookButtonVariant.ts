"use client";

import { useEffect } from "react";
import { track } from "./analytics";
import { assignVariant, COOK_BUTTON_EXPERIMENT, cookButtonVariantStore, type Variant } from "./experiment";
import { useStore } from "./useStore";

/** The visitor's variant for the cook-mode button test. Shows the control (A) until assigned. */
export function useCookButtonVariant(): Variant {
  const stored = useStore(cookButtonVariantStore);

  useEffect(() => {
    // During hydration React renders with the server value (null), so check what is
    // actually saved before assigning. Otherwise returning visitors would be re-randomized.
    if (cookButtonVariantStore.getSnapshot() === null) {
      cookButtonVariantStore.set(assignVariant());
      return;
    }
    if (stored !== null) {
      track("experiment_exposure", { experiment: COOK_BUTTON_EXPERIMENT.name, variant: stored });
    }
  }, [stored]);

  return stored ?? "A";
}
