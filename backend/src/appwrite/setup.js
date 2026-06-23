// Idempotent Appwrite provisioning: creates the database, storage bucket, and
// every table (columns + indexes) from the declarative SCHEMA.
// Run once with:  npm run appwrite:setup
import { tablesDB, storage, DB, BUCKET, Permission, Role } from "./client.js";
import { SCHEMA } from "./schema.js";
import { ENV } from "../config/env.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ignore409 = (e) => {
  if (e?.code === 409) return; // already exists
  throw e;
};

async function createColumn(tableId, col) {
  const data = { databaseId: DB, tableId, key: col.name, required: !!col.required };
  if (col.array) data.array = true;
  // Appwrite forbids a default on required or array columns
  if (!col.required && !col.array && col.default !== undefined) data.default = col.default;

  try {
    switch (col.type) {
      case "integer":
        return await tablesDB.createIntegerColumn(data);
      case "float":
        return await tablesDB.createFloatColumn(data);
      case "boolean":
        return await tablesDB.createBooleanColumn(data);
      case "datetime":
        return await tablesDB.createDatetimeColumn(data);
      default: // string
        if (col.size > 16383) return await tablesDB.createTextColumn(data);
        return await tablesDB.createVarcharColumn({ ...data, size: col.size });
    }
  } catch (e) {
    ignore409(e);
  }
}

async function waitAvailable(tableId, keys) {
  for (let i = 0; i < 60; i++) {
    const res = await tablesDB.listColumns({ databaseId: DB, tableId });
    const cols = res.columns ?? res.attributes ?? [];
    const status = Object.fromEntries(cols.map((c) => [c.key, c.status]));
    if (keys.every((k) => status[k] === "available")) return;
    if (keys.some((k) => status[k] === "failed")) {
      const failed = keys.filter((k) => status[k] === "failed");
      throw new Error(`Columns failed on ${tableId}: ${failed.join(", ")}`);
    }
    await sleep(800);
  }
  console.warn(`⚠️  Timed out waiting for columns on ${tableId} (continuing)`);
}

async function run() {
  if (!ENV.APPWRITE_ENDPOINT || !ENV.APPWRITE_PROJECT_ID || !ENV.APPWRITE_API_KEY) {
    console.error("❌ Missing APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY in .env");
    process.exit(1);
  }

  // database — the free plan caps databases at 1, so only create if missing
  const dbs = await tablesDB.list().catch(() => ({ databases: [] }));
  if (!(dbs.databases || []).some((d) => d.$id === DB)) {
    console.log(`→ Creating database "${DB}"`);
    await tablesDB.create({ databaseId: DB, name: "Marketplace" });
  } else {
    console.log(`→ Database "${DB}" exists`);
  }

  // storage bucket — only create if missing
  const buckets = await storage.listBuckets().catch(() => ({ buckets: [] }));
  if (!(buckets.buckets || []).some((b) => b.$id === BUCKET)) {
    console.log(`→ Creating bucket "${BUCKET}"`);
    await storage.createBucket({
      bucketId: BUCKET,
      name: "Product Images",
      permissions: [Permission.read(Role.any())],
      fileSecurity: false,
    });
  } else {
    console.log(`→ Bucket "${BUCKET}" exists`);
  }

  for (const [tableId, def] of Object.entries(SCHEMA)) {
    // create the table only if missing (limit checks can mask 409s)
    const tables = await tablesDB.listTables({ databaseId: DB }).catch(() => ({ tables: [] }));
    if (!(tables.tables || []).some((t) => t.$id === tableId)) {
      await tablesDB.createTable({ databaseId: DB, tableId, name: tableId });
    }

    // only create columns/indexes that don't already exist
    const existingCols = await tablesDB
      .listColumns({ databaseId: DB, tableId })
      .then((r) => new Set((r.columns ?? r.attributes ?? []).map((c) => c.key)))
      .catch(() => new Set());

    const toCreate = def.columns.filter((c) => !existingCols.has(c.name));
    for (const col of toCreate) await createColumn(tableId, col);
    if (toCreate.length) await waitAvailable(tableId, toCreate.map((c) => c.name));

    const existingIdx = await tablesDB
      .listIndexes({ databaseId: DB, tableId })
      .then((r) => new Set((r.indexes ?? []).map((i) => i.key)))
      .catch(() => new Set());
    for (const idx of def.indexes) {
      if (existingIdx.has(idx.key)) continue;
      await tablesDB
        .createIndex({ databaseId: DB, tableId, key: idx.key, type: idx.type, columns: idx.columns })
        .catch(ignore409);
    }
    console.log(`→ ${tableId}: +${toCreate.length} columns`);
  }

  console.log("\n✅ Appwrite schema ready");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Setup failed:", e?.message || e);
  process.exit(1);
});
