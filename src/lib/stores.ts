import type { ListEntry } from "./shoppingList";
import { createStore } from "./store";
import type { UnitSystem } from "./types";

export const unitSystemStore = createStore<UnitSystem>("recipe-scaler:units", "us");
export const shoppingListStore = createStore<ListEntry[]>("recipe-scaler:list", []);
export const checkedStore = createStore<string[]>("recipe-scaler:checked", []);
