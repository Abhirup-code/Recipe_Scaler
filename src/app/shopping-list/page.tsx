import type { Metadata } from "next";
import { ShoppingListView } from "@/components/ShoppingListView";

export const metadata: Metadata = {
  title: "Shopping list",
  description: "Everything you need for the recipes you picked, combined into one list.",
  robots: { index: false, follow: true },
};

export default function ShoppingListPage() {
  return (
    <>
      <h1>Shopping list</h1>
      <ShoppingListView />
    </>
  );
}
