import { revalidatePath } from "next/cache";

/** Invalidate the ISR homepage after a write that changes its catalog-backed content. */
export function revalidateHomepage() {
  revalidatePath("/");
}
