import { Product } from "@/types";

// Client-side mirror of the server's wholesale pricing so the cart & product
// pages can preview tier prices. The server still recomputes at checkout.
export function resolveUnitPrice(product: Pick<Product, "price" | "priceTiers">, quantity: number) {
  const tiers = product.priceTiers ?? [];
  let unit = product.price;
  for (const tier of [...tiers].sort((a, b) => a.minQty - b.minQty)) {
    if (quantity >= tier.minQty) unit = tier.price;
  }
  return unit;
}

// "$0.60 – $28.50" style range across all price breaks
export function priceRange(product: Pick<Product, "price" | "priceTiers">) {
  const prices = [product.price, ...(product.priceTiers ?? []).map((t) => t.price)];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, isRange: min !== max };
}
