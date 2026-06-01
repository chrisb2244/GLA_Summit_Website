// supabase/seeds/seed-storage.ts

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

/**
 * =========================
 * Config
 * =========================
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SECRET_SUPABASE_SERVICE_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error("Set SECRET_SUPABASE_SERVICE_KEY before running the avatar storage seed.");
}

const BUCKET = "avatars";

const MODULE_DIR =
  typeof __dirname === "string"
    ? __dirname
    : path.join(process.cwd(), "supabase", "seeds");

const SEED_SQL_PATH = path.join(MODULE_DIR, "seed.sql");

/**
 * Local source images.
 *
 * Any avatar URL with a matching filename here
 * will upload the real image instead of generating one.
 */
const SOURCE_IMAGE_DIR = path.join(MODULE_DIR, "images");

/**
 * Temp/generated files
 */
const GENERATED_DIR = path.join(MODULE_DIR, ".generated");

fs.mkdirSync(GENERATED_DIR, { recursive: true });

/**
 * =========================
 * Types
 * =========================
 */

type AvatarUploadDetails = {
  bucket: string;
  objectPath: string;
  contentType: string;
  sourceImageFile?: string;
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type ImageFormat = {
  ext: string;
  contentType: string;
};

function getImageFormat(filename: string): ImageFormat {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".png")) return { ext: "png", contentType: "image/png" };
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return { ext: "jpg", contentType: "image/jpeg" };
  if (lower.endsWith(".webp")) return { ext: "webp", contentType: "image/webp" };

  return { ext: "jpg", contentType: "image/jpeg" };
}

/**
 * =========================
 * Avatar URL Mapping
 * =========================
 *
**/
function mapAvatarUrlToUploadDetails(avatarUrl: string): AvatarUploadDetails {
  // Expected url is like "ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1_0.17697691211485256.png"
  const { contentType } = getImageFormat(avatarUrl);

  return {
    bucket: BUCKET,
    objectPath: avatarUrl,
    contentType,
  };
}

/**
 * =========================
 * SQL Parsing
 * =========================
 */

function extractAvatarUrlsFromSeedSql(sql: string): string[] {
  /**
   * Assumes INSERT statements into public.profiles
   * containing avatar_url column.
   *
   * This intentionally uses a pragmatic regex
   * rather than a full SQL parser.
   */

  const avatarUrls = new Set<string>();

  for (const { columnsRaw, valuesRaw } of extractProfileInsertBlocks(sql)) {

    const columns = columnsRaw
      .split(",")
      .map((c) => c.trim().replace(/"/g, ""));

    const avatarIndex = columns.indexOf("avatar_url");

    if (avatarIndex === -1) {
      continue;
    }

    for (const tuple of splitSqlTuples(valuesRaw)) {
      const values = splitSqlTupleValues(tuple);

      const avatarValue = values[avatarIndex];

      if (!avatarValue || avatarValue.toUpperCase() === "NULL") {
        continue;
      }

      const cleaned = avatarValue
        .replace(/^'/, "")
        .replace(/'$/, "")
        .replace(/''/g, "'");

      avatarUrls.add(cleaned);
    }
  }

  return [...avatarUrls];
}

function extractProfileInsertBlocks(sql: string): Array<{
  columnsRaw: string;
  valuesRaw: string;
}> {
  const blocks: Array<{ columnsRaw: string; valuesRaw: string }> = [];
  const headerRegex =
    /INSERT\s+INTO\s+(?:"public"|public)\s*\.\s*(?:"profiles"|profiles)\s*\(([\s\S]*?)\)\s*VALUES\s*/gi;

  let headerMatch: RegExpExecArray | null;

  while ((headerMatch = headerRegex.exec(sql)) !== null) {
    const columnsRaw = headerMatch[1];
    const valuesStart = headerRegex.lastIndex;
    const valuesEnd = findSqlStatementEnd(sql, valuesStart);

    if (valuesEnd === -1) {
      continue;
    }

    blocks.push({
      columnsRaw,
      valuesRaw: sql.slice(valuesStart, valuesEnd),
    });

    headerRegex.lastIndex = valuesEnd + 1;
  }

  return blocks;
}

function findSqlStatementEnd(sql: string, startIndex: number): number {
  let inString = false;
  let depth = 0;

  for (let i = startIndex; i < sql.length; i++) {
    const char = sql[i];

    if (char === "'") {
      if (inString && sql[i + 1] === "'") {
        i++;
        continue;
      }

      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "(") {
      depth++;
      continue;
    }

    if (char === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (char === ";" && depth === 0) {
      return i;
    }
  }

  return -1;
}

function splitSqlTuples(valuesRaw: string): string[] {
  const tuples: string[] = [];
  let inString = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < valuesRaw.length; i++) {
    const char = valuesRaw[i];

    if (char === "'") {
      // SQL escaped single quote: ''
      if (inString && valuesRaw[i + 1] === "'") {
        i++;
        continue;
      }

      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "(") {
      if (depth === 0) {
        start = i + 1;
      }

      depth++;
      continue;
    }

    if (char === ")") {
      depth--;

      if (depth === 0 && start !== -1) {
        tuples.push(valuesRaw.slice(start, i));
        start = -1;
      }
    }
  }

  return tuples;
}

function splitSqlTupleValues(tuple: string): string[] {
  const values: string[] = [];
  let inString = false;
  let token = "";

  for (let i = 0; i < tuple.length; i++) {
    const char = tuple[i];

    if (char === "'") {
      token += char;

      // SQL escaped single quote: ''
      if (inString && tuple[i + 1] === "'") {
        token += tuple[i + 1];
        i++;
        continue;
      }

      inString = !inString;
      continue;
    }

    if (char === "," && !inString) {
      values.push(token.trim());
      token = "";
      continue;
    }

    token += char;
  }

  if (token.length > 0) {
    values.push(token.trim());
  }

  return values;
}

/**
 * =========================
 * Image Helpers
 * =========================
 */

function findExistingSourceImage(avatarUrl: string): string | null {
  /**
   * Strategy:
   * - derive basename from avatar URL
   * - look for matching file in SOURCE_IMAGE_DIR
   */

  const baseName = path.basename(avatarUrl);

  const candidate = path.join(SOURCE_IMAGE_DIR, baseName);

  if (fs.existsSync(candidate)) {
    return candidate;
  }

  return null;
}

async function generatePlaceholderImage(avatarUrl: string): Promise<string> {
  /**
   * Deterministic pseudo-color from avatar URL
   */

  let hash = 0;

  for (const char of avatarUrl) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const r = hash & 255;
  const g = (hash >> 8) & 255;
  const b = (hash >> 16) & 255;

  const { ext, contentType } = getImageFormat(avatarUrl);

  const outputPath = path.join(
    GENERATED_DIR,
    `${sanitizeFileName(path.parse(avatarUrl).name)}.${ext}`,
  );

  const sharpInstance = sharp({
    create: {
      width: 128,
      height: 128,
      channels: 3,
      background: { r, g, b },
    },
  });

  if (contentType === "image/png") {
    await sharpInstance.png().toFile(outputPath);
  } else if (contentType === "image/webp") {
    await sharpInstance.webp({ quality: 70 }).toFile(outputPath);
  } else {
    await sharpInstance.jpeg({ quality: 70 }).toFile(outputPath);
  }

  return outputPath;
}

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-zA-Z0-9-_]/g, "_");
}

/**
 * Mirrors fullUrlToIconUrl from frontend/src/lib/utils.tsx.
 * e.g. "abc_0.12345.png" → "abc_0.12345-icon.webp"
 */
function iconUrlFromAvatarUrl(avatarUrl: string): string {
  const parts = avatarUrl.split(".");
  return parts.slice(0, -1).join(".") + "-icon.webp";
}

async function generateAndUploadIcon(avatarUrl: string, sourcePath: string) {
  const iconObjectPath = iconUrlFromAvatarUrl(avatarUrl);
  const iconLocalPath = path.join(
    GENERATED_DIR,
    `${sanitizeFileName(path.parse(avatarUrl).name)}-icon.webp`,
  );

  await sharp(sourcePath)
    .resize(128, 128, { fit: "cover", position: "centre" })
    .webp({ quality: 80 })
    .toFile(iconLocalPath);

  const buffer = fs.readFileSync(iconLocalPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(iconObjectPath, buffer, {
      upsert: true,
      contentType: "image/webp",
    });

  if (error) throw error;
  console.log(`[storage-seed] uploaded ${iconObjectPath}`);
}

/**
 * =========================
 * Upload
 * =========================
 */

async function ensureBucketExists(bucket: string) {
  const { data } = await supabase.storage.listBuckets();

  const exists = data?.some((b) => b.name === bucket);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
    });

    if (error) {
      throw error;
    }
  }
}

async function uploadAvatar(avatarUrl: string) {
  const details = mapAvatarUrlToUploadDetails(avatarUrl);

  await ensureBucketExists(details.bucket);

  const existingImage = findExistingSourceImage(avatarUrl);

  const sourcePath =
    existingImage ?? (await generatePlaceholderImage(avatarUrl));

  const buffer = fs.readFileSync(sourcePath);

  const { error } = await supabase.storage
    .from(details.bucket)
    .upload(details.objectPath, buffer, {
      upsert: true,
      contentType: details.contentType,
    });

  if (error) {
    throw error;
  }

  console.log(`[storage-seed] uploaded ${details.objectPath}`);

  await generateAndUploadIcon(avatarUrl, sourcePath);
}

/**
 * =========================
 * Main
 * =========================
 */

async function main() {
  const sql = fs.readFileSync(SEED_SQL_PATH, "utf8");

  const avatarUrls = extractAvatarUrlsFromSeedSql(sql);

  console.log(`[storage-seed] found ${avatarUrls.length} avatar URLs`);

  for (const avatarUrl of avatarUrls) {
    await uploadAvatar(avatarUrl);
  }

  console.log("[storage-seed] complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
