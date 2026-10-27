import type { ListEntry } from "./shoppingList";
import { createStore } from "./store";
import type { UnitSystem } from "./types";

export const unitSystemStore = createStore<UnitSystem>("recipe-scaler:units", "us");
export const shoppingListStore = createStore<ListEntry[]>("recipe-scaler:list", []);
export const checkedStore = createStore<string[]>("recipe-scaler:checked", []);
export const savedStore = createStore<string[]>("recipe-scaler:saved", []);
/** Ingredients you have at home, by pantryKey. */
export const pantryStore = createStore<string[]>("recipe-scaler:pantry", []);
