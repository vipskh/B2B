// Shared wholesale pricing helpers (1688-style tiered pricing + MOQ).
// Used by checkout (payment.controller) and anywhere a line total is computed,
// so the server is always the single source of truth for prices.

/**
 * Resolve the per-unit price for a product at a given quantity.
 * Picks the highest tier whose minQty is <= quantity; falls back to base price.
 * @param {{ price: number, priceTiers?: {minQty:number, price:number}[] }} product
 * @param {number} quantity
 * @returns {number} unit price
 */
export function resolveUnitPrice(product, quantity) {
  const tiers = Array.isArray(product.priceTiers) ? product.priceTiers : [];
  let unitPrice = product.price;

  // tiers are stored ascending by minQty; take the last one we qualify for
  for (const tier of [...tiers].sort((a, b) => a.minQty - b.minQty)) {
    if (quantity >= tier.minQty) unitPrice = tier.price;
  }

  return unitPrice;
}

/**
 * Validate a requested quantity against the product's minimum order quantity.
 * @returns {{ ok: boolean, message?: string }}
 */
export function checkMoq(product, quantity) {
  const moq = product.moq || 1;
  if (quantity < moq) {
    return {
      ok: false,
      message: `Minimum order quantity for "${product.name}" is ${moq} ${product.unit || "piece"}(s)`,
    };
  }
  return { ok: true };
}

// platform-wide checkout constants (kept here so they live in one place)
export const SHIPPING_PER_VENDOR = 10.0; // flat $10 shipping charged per vendor
export const TAX_RATE = 0.08; // 8%
