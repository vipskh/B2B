import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3000,
  CLIENT_URL: process.env.CLIENT_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,

  // ---- Appwrite ----
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID || "marketplace",
  APPWRITE_BUCKET_ID: process.env.APPWRITE_BUCKET_ID || "product-images",
};
