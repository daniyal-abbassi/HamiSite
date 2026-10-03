import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MEDIA_DIR = path.resolve(process.env.CATALOG_MEDIA_DIR || path.join(process.cwd(), "data/uploads/catalog-images"));
const CONTENT_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[0-9a-f-]+\.(jpg|png|webp|avif)$/i.test(filename)) return new NextResponse(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(MEDIA_DIR, filename));
    const extension = filename.split(".").at(-1)!.toLowerCase();
    return new NextResponse(bytes, { headers: { "Content-Type": CONTENT_TYPES[extension], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
