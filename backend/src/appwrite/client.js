import { Client, TablesDB, Storage, ID, Query, Permission, Role } from "node-appwrite";
import { ENV } from "../config/env.js";

// Server-side Appwrite client (admin access via API key). Bypasses row
// permissions, so the Express layer mediates all access — fitting our
// "auth temporarily off" dev setup.
const client = new Client()
  .setEndpoint(ENV.APPWRITE_ENDPOINT)
  .setProject(ENV.APPWRITE_PROJECT_ID)
  .setKey(ENV.APPWRITE_API_KEY);

export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);
export const DB = ENV.APPWRITE_DATABASE_ID;
export const BUCKET = ENV.APPWRITE_BUCKET_ID;
export { ID, Query, Permission, Role, client };

// Stable table (collection) ids — used directly as Appwrite tableId.
export const TABLES = {
  users: "users",
  vendors: "vendors",
  products: "products",
  orders: "orders",
  orderGroups: "order_groups",
  carts: "carts",
  reviews: "reviews",
  rfqs: "rfqs",
  quotes: "quotes",
  conversations: "conversations",
  messages: "messages",
};
