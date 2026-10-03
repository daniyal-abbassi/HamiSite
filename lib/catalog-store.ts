import { readFileSync } from "node:fs";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type JsonCatalog = {
  meta?: Record<string, unknown>;
  categories: Array<{ id: number; name: string; slug: string; parent_id: number | null; level?: number; [key: string]: unknown }>;
  brands: Array<{ id: number; name: string; slug?: string; product_count?: number; [key: string]: unknown }>;
  products: Array<Record<string, any> & { id: number; slug: string; name: string }>;
};

export function catalogFilePath() {
  return path.resolve(process.env.CATALOG_JSON_PATH || path.join(process.cwd(), "data/hami-products.json"));
}

export function readCatalogSync(): JsonCatalog {
  return JSON.parse(readFileSync(catalogFilePath(), "utf8")) as JsonCatalog;
}

let writeQueue: Promise<unknown> = Promise.resolve();

/** Serialize and atomically replace the authoritative JSON catalogue. */
export function updateCatalog<T>(change: (catalog: JsonCatalog) => T | Promise<T>): Promise<T> {
  const operation = writeQueue.then(async () => {
    const file = catalogFilePath();
    await mkdir(path.dirname(file), { recursive: true });
    const lockPath = `${file}.lock`;
    let lock;
    const deadline = Date.now() + 10_000;
    while (!lock) {
      try {
        lock = await open(lockPath, "wx");
        await lock.writeFile(`${process.pid}\n${new Date().toISOString()}\n`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        try {
          const info = await stat(lockPath);
          if (Date.now() - info.mtimeMs > 30_000) await rm(lockPath, { force: true });
        } catch (statError) {
          if ((statError as NodeJS.ErrnoException).code !== "ENOENT") throw statError;
        }
        if (Date.now() >= deadline) throw new Error("Timed out waiting for catalogue write lock");
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }
    try {
      const catalog = JSON.parse(await readFile(file, "utf8")) as JsonCatalog;
      const result = await change(catalog);
      const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
      await rename(temporary, file);
      return result;
    } finally {
      await lock.close();
      await rm(lockPath, { force: true });
    }
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}
