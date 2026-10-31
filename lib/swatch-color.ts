/**
 * The colour a variant's name stands for, as a CSS colour. The catalogue names colours in Persian, and
 * sometimes in a compound («تیتانیوم مشکی», «سفید نقره‌ای»), so a name is matched by the first keyword it
 * contains, most specific first. A name nothing matches gets a neutral grey, never a guess at a hue.
 */
const SWATCHES: ReadonlyArray<readonly [string, string]> = [
  ["آبی روشن", "#8fb7d9"], ["سرمه", "#27344f"], ["ناوی", "#27344f"], ["navy", "#27344f"],
  ["سبز یشمی", "#6fae93"], ["زیتونی", "#7d8156"], ["olive", "#7d8156"], ["سبزخاکستری", "#7b8a7c"],
  ["مشکی", "#292526"], ["black", "#292526"], ["ذغالی", "#4a4a4d"], ["charcoal", "#4a4a4d"],
  ["سفید", "#f7f5f2"], ["white", "#f7f5f2"],
  ["صورتی", "#dfabb8"], ["pink", "#dfabb8"], ["بنفش", "#8b6bb0"], ["purple", "#8b6bb0"],
  ["یاسی", "#c3b1e1"], ["lavender", "#c3b1e1"],
  ["نارنجی", "#e07a3f"], ["orange", "#e07a3f"], ["قرمز", "#a83242"], ["red", "#a83242"],
  ["زرد", "#d1ac3d"], ["yellow", "#d1ac3d"],
  ["گلد", "#b99a58"], ["طلایی", "#b99a58"], ["gold", "#b99a58"],
  ["تیتانیوم", "#9a9893"], ["titanium", "#9a9893"],
  ["نقره", "#b9bdc3"], ["silver", "#b9bdc3"],
  ["خاکستری", "#8d9298"], ["gray", "#8d9298"], ["grey", "#8d9298"],
  ["آبی", "#566b82"], ["blue", "#566b82"], ["سبز", "#617660"], ["green", "#617660"],
];

export function swatchColor(value: string): string {
  const normalized = value.replace(/‌/g, " ").trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized;
  return SWATCHES.find(([keyword]) => normalized.includes(keyword))?.[1] ?? "#a9a4a4";
}
