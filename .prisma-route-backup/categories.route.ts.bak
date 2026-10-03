import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/http";

function buildTree(rows: Array<{ id: number; parentId: number | null } & Record<string, unknown>>) {
  const map = new Map<number, (typeof rows)[number] & { children: Array<Record<string, unknown>> }>();

  for (const row of rows) {
    map.set(row.id, { ...row, children: [] });
  }

  const roots: Array<Record<string, unknown>> = [];
  for (const row of map.values()) {
    if (!row.parentId) {
      roots.push(row);
      continue;
    }

    const parent = map.get(row.parentId);
    if (parent) {
      parent.children.push(row);
    } else {
      roots.push(row);
    }
  }

  return roots;
}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const tree = searchParams.get("tree") === "true";

    const categories = await prisma.category.findMany({
      where: { available: true },
      orderBy: [{ level: "asc" }, { order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        imageUrl: true,
        imageAlt: true,
        iconUrl: true,
        seoTitle: true,
        seoDescription: true,
        level: true,
        order: true,
      },
    });

    if (tree) {
      return ok(buildTree(categories), { total: categories.length, tree: true });
    }

    return ok(categories, { total: categories.length, tree: false });
  });
}
