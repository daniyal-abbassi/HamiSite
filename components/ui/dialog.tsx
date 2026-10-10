"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalDialog } from "./useModalDialog";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** Lightweight glass modal — same pattern as CartDrawer
 * (backdrop + scroll-lock + Escape). No headless-ui dependency. */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const { dialogRef, backdropProps } = useModalDialog(open, onClose);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      {...backdropProps}
      className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none overflow-y-auto border-0 bg-transparent p-4 text-foreground open:grid open:place-items-center backdrop:bg-ink/80 backdrop:backdrop-blur-sm"
    >
      <div className={cn("glass relative mx-auto my-auto w-full max-w-lg animate-fade-up rounded-2xl p-6 shadow-deep", className)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-black">{title}</h2>
            {description && <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            autoFocus
            className="grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-fast hover:bg-foreground/10"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
