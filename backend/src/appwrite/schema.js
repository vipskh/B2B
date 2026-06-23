import { TABLES } from "./client.js";

// Declarative schema for all marketplace tables. `setup.js` materializes this in
// Appwrite (tables + columns + indexes). `json` lists nested fields stored as
// JSON strings (Appwrite has no embedded-object columns); the repo (de)serializes
// them automatically.
//
// Column types: string (varchar/text by size), integer, float, boolean, datetime.
// Arrays of primitives use { array: true }. Refs to other tables are string ids.

const S = (name, size, opts = {}) => ({ name, type: "string", size, ...opts });
const I = (name, opts = {}) => ({ name, type: "integer", ...opts });
const F = (name, opts = {}) => ({ name, type: "float", ...opts });
const D = (name, opts = {}) => ({ name, type: "datetime", ...opts });

const JSON_BIG = 1000000; // large string => Appwrite stores off-page (text)

export const SCHEMA = {
  [TABLES.users]: {
    json: ["addresses"],
    columns: [
      S("email", 255, { required: true }),
      S("name", 255, { required: true }),
      S("imageUrl", 2048),
      S("role", 32, { default: "buyer" }),
      S("vendor", 64),
      S("clerkId", 255),
      S("stripeCustomerId", 255),
      S("addresses", JSON_BIG),
      S("wishlist", 64, { array: true }),
    ],
    indexes: [
      { key: "email_idx", type: "key", columns: ["email"] },
      { key: "role_idx", type: "key", columns: ["role"] },
    ],
  },

  [TABLES.vendors]: {
    json: [],
    columns: [
      S("owner", 64, { required: true }),
      S("companyName", 255, { required: true }),
      S("slug", 255, { required: true }),
      S("logo", 2048),
      S("banner", 2048),
      S("description", 5000),
      S("businessType", 64, { default: "other" }),
      S("country", 255),
      S("province", 255),
      S("city", 255),
      S("addressLine", 255),
      I("yearEstablished"),
      S("contactName", 255),
      S("contactEmail", 255),
      S("contactPhone", 255),
      S("verificationStatus", 32, { default: "unverified" }),
      D("verifiedAt"),
      S("badges", 64, { array: true }),
      F("ratingAverage", { default: 0 }),
      I("ratingCount", { default: 0 }),
      I("responseRate", { default: 0 }),
      I("responseTimeHours", { default: 0 }),
      I("totalProducts", { default: 0 }),
      I("totalOrders", { default: 0 }),
      S("status", 32, { default: "pending" }),
      S("stripeAccountId", 255),
    ],
    indexes: [
      { key: "slug_idx", type: "unique", columns: ["slug"] },
      { key: "owner_idx", type: "key", columns: ["owner"] },
      { key: "status_idx", type: "key", columns: ["status"] },
      { key: "company_search", type: "fulltext", columns: ["companyName"] },
    ],
  },

  [TABLES.products]: {
    json: ["priceTiers", "variantOptions", "variants"],
    columns: [
      S("vendor", 64, { required: true }),
      S("name", 255, { required: true }),
      S("description", 5000, { required: true }),
      F("price", { required: true }),
      S("priceTiers", JSON_BIG),
      // SKU variants: variantOptions = [{name, values[]}], variants = [{id, options{}, price, stock, image}]
      S("variantOptions", JSON_BIG),
      S("variants", JSON_BIG),
      I("moq", { default: 1 }),
      S("unit", 32, { default: "piece" }),
      I("stock", { default: 0 }),
      S("category", 64, { required: true }),
      S("images", 2048, { array: true }),
      S("status", 32, { default: "active" }),
      I("discountPercent", { default: 0 }), // flash-deal % off the base price
      F("averageRating", { default: 0 }),
      I("totalReviews", { default: 0 }),
    ],
    indexes: [
      { key: "vendor_idx", type: "key", columns: ["vendor"] },
      { key: "category_idx", type: "key", columns: ["category"] },
      { key: "status_idx", type: "key", columns: ["status"] },
      { key: "price_idx", type: "key", columns: ["price"] },
      { key: "name_search", type: "fulltext", columns: ["name"] },
    ],
  },

  [TABLES.orders]: {
    json: ["orderItems", "shippingAddress", "paymentResult"],
    columns: [
      S("orderGroup", 64),
      S("vendor", 64, { required: true }),
      S("user", 64, { required: true }),
      S("clerkId", 255),
      S("orderItems", JSON_BIG, { required: true }),
      S("shippingAddress", JSON_BIG, { required: true }),
      S("paymentResult", JSON_BIG),
      F("subtotal", { default: 0 }),
      F("shippingPrice", { default: 0 }),
      F("taxPrice", { default: 0 }),
      F("totalPrice", { required: true }),
      S("status", 32, { default: "pending" }),
      D("deliveredAt"),
      D("shippedAt"),
    ],
    indexes: [
      { key: "vendor_idx", type: "key", columns: ["vendor"] },
      { key: "user_idx", type: "key", columns: ["user"] },
      { key: "group_idx", type: "key", columns: ["orderGroup"] },
      { key: "status_idx", type: "key", columns: ["status"] },
    ],
  },

  [TABLES.orderGroups]: {
    json: ["shippingAddress", "paymentResult"],
    columns: [
      S("user", 64, { required: true }),
      S("clerkId", 255),
      S("orders", 64, { array: true }),
      S("shippingAddress", JSON_BIG, { required: true }),
      F("itemsPrice", { default: 0 }),
      F("shippingPrice", { default: 0 }),
      F("taxPrice", { default: 0 }),
      F("grandTotal", { required: true }),
      S("paymentStatus", 32, { default: "pending" }),
      S("paymentResult", JSON_BIG),
    ],
    indexes: [{ key: "user_idx", type: "key", columns: ["user"] }],
  },

  [TABLES.carts]: {
    json: ["items"],
    columns: [
      S("user", 64, { required: true }),
      S("clerkId", 255),
      S("items", JSON_BIG),
    ],
    indexes: [{ key: "user_idx", type: "unique", columns: ["user"] }],
  },

  [TABLES.reviews]: {
    json: [],
    columns: [
      S("productId", 64, { required: true }),
      S("userId", 64, { required: true }),
      S("orderId", 64, { required: true }),
      S("vendorId", 64),
      I("rating", { required: true }),
      S("comment", 2000),
    ],
    indexes: [
      { key: "product_idx", type: "key", columns: ["productId"] },
      { key: "vendor_idx", type: "key", columns: ["vendorId"] },
    ],
  },

  [TABLES.rfqs]: {
    json: [],
    columns: [
      S("buyer", 64, { required: true }),
      S("clerkId", 255),
      S("title", 255, { required: true }),
      S("description", 5000, { required: true }),
      S("category", 64),
      I("quantity", { required: true }),
      S("unit", 32, { default: "piece" }),
      F("targetPrice"),
      S("images", 2048, { array: true }),
      S("status", 32, { default: "open" }),
      I("quotesCount", { default: 0 }),
      D("expiresAt"),
    ],
    indexes: [
      { key: "buyer_idx", type: "key", columns: ["buyer"] },
      { key: "status_idx", type: "key", columns: ["status"] },
    ],
  },

  [TABLES.quotes]: {
    json: [],
    columns: [
      S("rfq", 64, { required: true }),
      S("vendor", 64, { required: true }),
      F("price", { required: true }),
      I("moq", { default: 1 }),
      I("leadTimeDays"),
      S("message", 2000),
      S("status", 32, { default: "submitted" }),
    ],
    indexes: [
      { key: "rfq_idx", type: "key", columns: ["rfq"] },
      { key: "vendor_idx", type: "key", columns: ["vendor"] },
    ],
  },

  [TABLES.conversations]: {
    json: [],
    columns: [
      S("buyer", 64, { required: true }),
      S("vendor", 64, { required: true }),
      S("product", 64),
      S("lastMessage", 2000),
      D("lastMessageAt"),
      I("buyerUnread", { default: 0 }),
      I("vendorUnread", { default: 0 }),
    ],
    indexes: [
      { key: "buyer_idx", type: "key", columns: ["buyer"] },
      { key: "vendor_idx", type: "key", columns: ["vendor"] },
    ],
  },

  [TABLES.messages]: {
    json: [],
    columns: [
      S("conversation", 64, { required: true }),
      S("sender", 64, { required: true }),
      S("senderRole", 16, { required: true }),
      S("text", 5000),
      S("images", 2048, { array: true }),
      D("readAt"),
    ],
    indexes: [{ key: "conversation_idx", type: "key", columns: ["conversation"] }],
  },
};

// json-field map (tableId -> string[]) for the repositories
export const JSON_FIELDS = Object.fromEntries(
  Object.entries(SCHEMA).map(([table, def]) => [table, def.json])
);
