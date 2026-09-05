"use client";

import { Button } from "@/components/ui/button";
import { toFaDigits } from "@/lib/utils";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
};

/** Admin table pagination — prev/next + the usual operation-mode minimalism. */
export function Pagination({ page, pageSize, total, hasNextPage, onPageChange }: Props) {
  if (total <= pageSize) return null;

  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mt-6 flex items-center justify-center gap-4 text-xs">
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        قبلی
      </Button>
      <span className="font-mono text-muted-foreground">
        صفحه {toFaDigits(page)} از {toFaDigits(lastPage)}
        <span className="ms-2 text-muted-foreground/60">({toFaDigits(total)} رکورد)</span>
      </span>
      <Button variant="ghost" size="sm" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
        بعدی
      </Button>
    </div>
  );
}