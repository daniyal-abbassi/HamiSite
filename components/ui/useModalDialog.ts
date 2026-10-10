"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

/** Keep React's open state in sync with the browser's modal top layer. */
export function useModalDialog(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const backdropPointerDown = useRef(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };

    dialog.addEventListener("cancel", handleCancel);
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open]);

  const backdropProps = {
    onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
      backdropPointerDown.current = event.target === event.currentTarget;
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      if (backdropPointerDown.current && event.target === event.currentTarget) onCloseRef.current();
      backdropPointerDown.current = false;
    },
  };

  return { dialogRef, backdropProps };
}
