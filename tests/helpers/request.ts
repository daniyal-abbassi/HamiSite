import { POST as login } from "@/app/api/auth/login/route";

export async function loginAs(user: { username: string; password: string }) {
  const res = await login(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: user.username, password: user.password }),
    }),
  );

  if (res.status !== 200) {
    throw new Error(`loginAs failed with status ${res.status}`);
  }

  return res.headers.get("set-cookie")!.split(";")[0];
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
