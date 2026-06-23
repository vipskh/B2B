import { InputFile } from "node-appwrite/file";
import { storage, BUCKET, ID } from "../appwrite/client.js";
import { ENV } from "../config/env.js";

// Upload multer disk files to Appwrite Storage and return public view URLs.
// The bucket is created with Role.any() read in setup.js, so these URLs render
// without auth.
export async function uploadImages(files) {
  const urls = [];
  for (const f of files) {
    const created = await storage.createFile({
      bucketId: BUCKET,
      fileId: ID.unique(),
      file: InputFile.fromPath(f.path, f.originalname || "image"),
    });
    urls.push(
      `${ENV.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET}/files/${created.$id}/view?project=${ENV.APPWRITE_PROJECT_ID}`
    );
  }
  return urls;
}
