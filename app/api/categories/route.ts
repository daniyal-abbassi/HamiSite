import { listCategories } from "@/lib/catalog";
import { ok, withErrorHandling } from "@/lib/http";

type Row = {
  id: number;
  name: string;
  slug: string;
  description: null;
  parentId: number | null;
  imageUrl: null;
  imageAlt: null;
  iconUrl: null;
  level: number;
  children?: Row[];
};

/** Nest by parentId, keeping orphans at the root rather than dropping them. */
function buildTree(rows: Row[]): Row[] {
  const map = new Map<number, Row>();
  for (const row of rows) map.set(row.id, { ...row, children: [] });

  const roots: Row[] = [];
  for (const row of map.values()) {
    const parent = row.parentId != null ? map.get(row.parentId) : undefined;
    if (parent) parent.children!.push(row);
    else roots.push(row);
  }
  return roots;
}

/**
 * Categories, from the JSON catalogue export. See the brands route for why —
 * the shop page's category filter was empty against the drained database.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const tree = new URL(request.url).searchParams.get("tree") === "true";

    const rows: Row[] = listCategories().map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: null,
      parentId: c.parentId,
      imageUrl: null,
      imageAlt: null,
      iconUrl: null,
      level: c.level,
    }));

    const data = tree ? buildTree(rows) : rows;
    return ok(data, { total: rows.length, tree });
  });
}
