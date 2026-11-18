import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { getCardToCardEnabled, setCardToCardEnabled } from "@/lib/site-settings";

const bodySchema = z.object({ enabled: z.boolean() }).strict();

export const GET = withAuth(
  async () => withErrorHandling(async () => ok({ enabled: await getCardToCardEnabled() })),
  { roles: [Role.ADMIN] },
);

export const PUT = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const parsed = bodySchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      await setCardToCardEnabled(parsed.data.enabled);
      return ok({ enabled: parsed.data.enabled });
    });
  },
  { roles: [Role.ADMIN] },
);
