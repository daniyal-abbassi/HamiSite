/*
 * What the phone department actually serves, read from the HTML rather than from a
 * hydrated DOM: T061's task A is only "three interactions" if the product the
 * shopper is looking for is on the page the door opens — so the first card's name is
 * the thing to check, and a browser is unnecessary for it.
 */
const slug = encodeURIComponent("موبایل-و-تبلت");
const html = await (await fetch(`http://localhost:3000/categories/${slug}`)).text();
const links = [...html.matchAll(/href="(\/shop\/[^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
const names = [...html.matchAll(/>([^<>]*شیائومی[^<>]*)</g)].map((m) => m[1].trim());
console.log("product links:", links.length, "— unique:", new Set(links).size);
console.log("first card:", links[0] ?? null);
console.log("Xiaomi-named strings in the served HTML:", names.length, "— first:", names[0]?.slice(0, 60) ?? null);
