import { Vendors, Users, Products } from "../db/models.js";

// Replacements for Mongoose `.populate()` — fetch related rows by id and attach.
// Uses an in-memory cache per call to avoid refetching the same vendor/user.

async function buildCache(ids, repo) {
  const unique = [...new Set(ids.filter(Boolean))];
  const rows = await Promise.all(unique.map((id) => repo.get(id)));
  return Object.fromEntries(unique.map((id, i) => [id, rows[i]]).filter(([, v]) => v));
}

function pick(obj, fields) {
  if (!obj || !fields) return obj;
  const out = { _id: obj._id };
  for (const f of fields) out[f] = obj[f];
  return out;
}

// Attach the vendor object onto each item's `field` (default "vendor").
export async function withVendor(items, { field = "vendor", select = null } = {}) {
  const list = Array.isArray(items) ? items : [items];
  const cache = await buildCache(list.map((i) => i?.[field]), Vendors);
  const mapped = list.map((i) =>
    i && cache[i[field]] ? { ...i, [field]: select ? pick(cache[i[field]], select) : cache[i[field]] } : i
  );
  return Array.isArray(items) ? mapped : mapped[0];
}

// Attach the user object onto each item's `field` (default "user").
export async function withUser(items, { field = "user", select = ["name", "email", "imageUrl"] } = {}) {
  const list = Array.isArray(items) ? items : [items];
  const cache = await buildCache(list.map((i) => i?.[field]), Users);
  const mapped = list.map((i) =>
    i && cache[i[field]] ? { ...i, [field]: pick(cache[i[field]], select) } : i
  );
  return Array.isArray(items) ? mapped : mapped[0];
}

// Attach product objects into orderItems[].product for an order (or array).
export async function withOrderItemProducts(orders) {
  const list = Array.isArray(orders) ? orders : [orders];
  const ids = list.flatMap((o) => (o.orderItems || []).map((it) => it.product));
  const cache = await buildCache(ids, Products);
  const mapped = list.map((o) => ({
    ...o,
    orderItems: (o.orderItems || []).map((it) => ({ ...it, product: cache[it.product] || it.product })),
  }));
  return Array.isArray(orders) ? mapped : mapped[0];
}
