import { StockType } from "@prisma/client";

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && value !== null && "toString" in value) {
    return Number((value as { toString(): string }).toString());
  }
  return Number(value);
}

export function serializeStockType(stockType: StockType) {
  switch (stockType) {
    case StockType.UNLIMITED:
      return "unlimited";
    case StockType.LIMITED:
      return "limited";
    case StockType.OUT_OF_STOCK:
      return "out_of_stock";
    case StockType.CALL:
      return "call";
    default:
      return "limited";
  }
}

export function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}
