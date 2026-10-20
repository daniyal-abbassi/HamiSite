import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAs(user: { username: string; password: string }) {
  const account = await prisma.user.findUniqueOrThrow({ where: { username: user.username } });
  const { token } = await createSession(account.id, "Vitest helper");
  return `${SESSION_COOKIE_NAME}=${token}`;
}

export function jsonRequest(url: string, method: string, body: unknown, cookie?: string) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

export function getRequest(url: string, cookie?: string) {
  return new Request(url, { headers: cookie ? { cookie } : {} });
}

/**
 * Route context in the shape Next 15 hands to a route handler.
 *
 * Next 15 made `params` a Promise, and `withAuth` now awaits it (see
 * lib/auth.ts). Tests call the wrapped handlers directly, so they have to
 * supply the same shape Next would — including for param-less routes, where
 * the context is `{ params: Promise<{}> }` rather than absent.
 */
export function ctx<P extends Record<string, string> = Record<string, never>>(params?: P) {
  return { params: Promise.resolve((params ?? {}) as P) };
}
