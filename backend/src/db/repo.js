import { tablesDB, DB, ID, Query } from "../appwrite/client.js";

// node-appwrite is mid-rename (documents -> rows). Be tolerant of both shapes.
function rowsOf(res) {
  return res?.rows ?? res?.documents ?? [];
}

const SYSTEM_FIELDS = [
  "$id",
  "$createdAt",
  "$updatedAt",
  "$permissions",
  "$databaseId",
  "$collectionId",
  "$tableId",
  "$sequence",
];

/**
 * Build a repository over an Appwrite table.
 * @param {string} tableId
 * @param {{ json?: string[] }} opts  `json` fields are nested objects/arrays-of-objects
 *   stored as JSON strings (Appwrite has no embedded-object columns).
 *
 * Rows are mapped to plain objects exposing `_id` (= Appwrite `$id`) plus
 * `createdAt`/`updatedAt`, so existing controllers and the frontends keep
 * working with `_id` unchanged.
 */
export function makeRepo(tableId, { json = [], transform = null, virtual = [] } = {}) {
  const toRow = (data) => {
    const out = { ...data };
    for (const f of json) if (out[f] !== undefined) out[f] = JSON.stringify(out[f] ?? null);
    // never send synthetic / system / virtual keys back to Appwrite
    delete out._id;
    delete out.id;
    delete out.createdAt;
    delete out.updatedAt;
    for (const k of SYSTEM_FIELDS) delete out[k];
    for (const k of virtual) delete out[k];
    return out;
  };

  const fromRow = (row) => {
    if (!row) return null;
    const out = { ...row };
    out._id = row.$id;
    out.id = row.$id;
    out.createdAt = row.$createdAt;
    out.updatedAt = row.$updatedAt;
    for (const f of json) {
      if (typeof out[f] === "string") {
        try {
          out[f] = JSON.parse(out[f]);
        } catch {
          out[f] = null;
        }
      }
    }
    for (const k of SYSTEM_FIELDS) delete out[k];
    return transform ? transform(out) : out;
  };

  return {
    _map: fromRow,
    async create(data, id = ID.unique()) {
      const row = await tablesDB.createRow({ databaseId: DB, tableId, rowId: id, data: toRow(data) });
      return fromRow(row);
    },
    async get(id) {
      try {
        return fromRow(await tablesDB.getRow({ databaseId: DB, tableId, rowId: id }));
      } catch (e) {
        if (e?.code === 404) return null;
        throw e;
      }
    },
    async list(queries = []) {
      const res = await tablesDB.listRows({ databaseId: DB, tableId, queries });
      return rowsOf(res).map(fromRow);
    },
    async listPage(queries = []) {
      const res = await tablesDB.listRows({ databaseId: DB, tableId, queries });
      return { rows: rowsOf(res).map(fromRow), total: res.total ?? rowsOf(res).length };
    },
    async findOne(queries = []) {
      const res = await tablesDB.listRows({
        databaseId: DB,
        tableId,
        queries: [...queries, Query.limit(1)],
      });
      const items = rowsOf(res);
      return items.length ? fromRow(items[0]) : null;
    },
    async update(id, data) {
      const row = await tablesDB.updateRow({ databaseId: DB, tableId, rowId: id, data: toRow(data) });
      return fromRow(row);
    },
    async remove(id) {
      await tablesDB.deleteRow({ databaseId: DB, tableId, rowId: id });
    },
    async count(queries = []) {
      const res = await tablesDB.listRows({
        databaseId: DB,
        tableId,
        queries: [...queries, Query.limit(1)],
      });
      return res.total ?? rowsOf(res).length;
    },
    // read-modify-write numeric increment (Appwrite has no atomic $inc)
    async incr(id, field, by = 1) {
      const row = await tablesDB.getRow({ databaseId: DB, tableId, rowId: id });
      const next = (row[field] || 0) + by;
      return fromRow(
        await tablesDB.updateRow({ databaseId: DB, tableId, rowId: id, data: { [field]: next } })
      );
    },
  };
}
