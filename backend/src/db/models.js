import { makeRepo } from "./repo.js";
import { TABLES } from "../appwrite/client.js";
import { JSON_FIELDS } from "../appwrite/schema.js";

// One repository per table. Controllers use these instead of Mongoose models.
export const Users = makeRepo(TABLES.users, { json: JSON_FIELDS[TABLES.users] });
export const Vendors = makeRepo(TABLES.vendors, {
  json: JSON_FIELDS[TABLES.vendors],
  virtual: ["rating"], // computed-only; stored as ratingAverage/ratingCount columns
  // re-expose flattened rating columns as the nested shape the frontends expect
  transform: (v) => ({
    ...v,
    rating: { average: v.ratingAverage ?? 0, count: v.ratingCount ?? 0 },
  }),
});
export const Products = makeRepo(TABLES.products, { json: JSON_FIELDS[TABLES.products] });
export const Orders = makeRepo(TABLES.orders, { json: JSON_FIELDS[TABLES.orders] });
export const OrderGroups = makeRepo(TABLES.orderGroups, { json: JSON_FIELDS[TABLES.orderGroups] });
export const Carts = makeRepo(TABLES.carts, { json: JSON_FIELDS[TABLES.carts] });
export const Reviews = makeRepo(TABLES.reviews, { json: JSON_FIELDS[TABLES.reviews] });
export const RFQs = makeRepo(TABLES.rfqs, { json: JSON_FIELDS[TABLES.rfqs] });
export const Quotes = makeRepo(TABLES.quotes, { json: JSON_FIELDS[TABLES.quotes] });
export const Conversations = makeRepo(TABLES.conversations, {
  json: JSON_FIELDS[TABLES.conversations],
});
export const Messages = makeRepo(TABLES.messages, { json: JSON_FIELDS[TABLES.messages] });
