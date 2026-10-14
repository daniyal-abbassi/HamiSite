import { revalidatePath } from "next/cache";

/** Invalidate the ISR homepage after a write that changes its catalog-backed content. */
export function revalidateHomepage() {
  try {
    revalidatePath("/");
  } catch {
    // Outside of a live Next.js request/store context (e.g. in test runners),
    // revalidatePath throws Invariant: static generation store missing.
  }
}
