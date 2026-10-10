"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotionPreference } from "devignerui/hooks";
import { cn } from "cn";
import { IconSpinner } from "@devigner-ui/icons";
import { SPRING_LAYOUT, SPRING_PRESS, SPRING_SWAP } from "devignerui/motion";
import { useControllableState } from "devignerui/hooks";

/** Lid pivot, in the glyph's own 24px units. */
const LID_HINGE = "9.244px 7.147px";
const LID_OPEN = -20.57;
/** Offsets the swung lid, both in the glyph's own 24px units, so they scale
 *  with the icon rather than the viewport. Sideways drift off the hinge... */
const LID_RECENTER = -2;
/** ...and clearance over the bin's rim. */
const LID_LIFT = -1.25;

const BIN =
  "M18.834 8.5l-.46 6.9c-.177 2.654-.266 3.981-1.13 4.79-.866.81-2.196.81-4.857.81h-.773c-2.661 0-3.992 0-4.857-.81-.865-.809-.953-2.136-1.13-4.79l-.46-6.9";
const TICKS = "M9.5 11l.5 5M14.5 11l-.5 5";
const CHECK = "M5.5 12.6 9.7 17 18.5 7";
const CLOSE = "M7.7 7.7 16.3 16.3M16.3 7.7 7.7 16.3";

/** Seconds for one glyph to draw on or retract. Linear: a pen moves at a
 *  constant speed, and an ease-out swallows the tail of the stroke. */
const DRAW = 0.32;
const DRAW_EASE = "linear" as const;
/** Overlap between the outgoing and incoming glyph of a swap. */
const HANDOFF = 0.14;
/** Grace period before the spinner fades in, so a fast delete never flashes it. */
const PENDING_DELAY = 0.12;

/** Inner radius = outer minus the shell's p-1, or the corners stop looking nested. */
const RADIUS = 24;
const INSET = 4;
const INNER_RADIUS = RADIUS - INSET;

export type DeleteButtonStatus = "idle" | "armed" | "pending" | "done";

const glyph = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function DrawnPath({
  show,
  d,
  reverse = false,
}: {
  show: boolean;
  d: string;
  reverse?: boolean;
}) {
  const reduced = useReducedMotionPreference();
  const drawing = {
    duration: DRAW,
    ease: DRAW_EASE,
    delay: show ? HANDOFF : 0,
  };
  return (
    <motion.path
      d={d}
      initial={false}
      animate={{
        pathLength: show || reduced ? 1 : 0,
        pathOffset: reverse && !show && !reduced ? 1 : 0,
        opacity: show ? 1 : 0,
      }}
      transition={
        reduced
          ? { duration: 0.15 }
          : {
              pathLength: drawing,
              pathOffset: drawing,
              opacity: { duration: 0, delay: show ? HANDOFF : DRAW },
            }
      }
    />
  );
}

function TrashGlyph({
  show,
  open,
  mirror = false,
}: {
  show: boolean;
  open: boolean;
  mirror?: boolean;
}) {
  return (
    <svg
      {...glyph}
      // The lid pivots out of the 24-unit box; SVG roots clip by default.
      className={cn(
        "col-start-1 row-start-1 size-6 overflow-visible",
        // The glyph is symmetric, so a flip is the whole mirror: lid opens
        // toward the actions whichever side they sit on.
        mirror && "-scale-x-100",
      )}
      strokeWidth={1.5}
    >
      <DrawnPath show={show} reverse d={BIN} />
      <DrawnPath show={show} d={TICKS} />
      <motion.g
        style={{ transformOrigin: LID_HINGE }}
        animate={{
          rotate: open ? LID_OPEN : 0,
          x: open ? LID_RECENTER : 0,
          y: open ? LID_LIFT : 0,
        }}
        transition={SPRING_SWAP}
      >
        <DrawnPath show={show} d="M3.5 6h17" />
        <DrawnPath
          show={show}
          d="M6.5 6h.11a2 2 0 0 0 1.83-1.32l.034-.103.097-.291c.083-.249.125-.373.18-.479a1.5 1.5 0 0 1 1.094-.788C9.962 3 10.093 3 10.355 3h3.29c.262 0 .393 0 .51.019a1.5 1.5 0 0 1 1.094.788c.055.106.097.23.18.479l.097.291A2 2 0 0 0 17.5 6"
        />
      </motion.g>
    </svg>
  );
}

function CheckGlyph({
  show = true,
  className = "size-5",
}: {
  show?: boolean;
  className?: string;
}) {
  return (
    <svg {...glyph} className={className} strokeWidth={2.5}>
      <DrawnPath show={show} d={CHECK} />
    </svg>
  );
}

const MotionSpinner = motion.create(IconSpinner);

function SpinnerGlyph({ show }: { show: boolean }) {
  return (
    <MotionSpinner
      aria-hidden
      className="col-start-1 row-start-1 size-5.5"
      strokeWidth={2.5}
      style={{ transformOrigin: "50% 50%" }}
      initial={false}
      animate={{ rotate: show ? 360 : 0, opacity: show ? 1 : 0 }}
      transition={{
        rotate: show
          ? { duration: 0.9, ease: "linear", repeat: Infinity }
          : { duration: 0 },
        opacity: { duration: 0.15, delay: show ? PENDING_DELAY : 0 },
      }}
    />
  );
}

function CloseGlyph() {
  return (
    <svg {...glyph} className="size-5" strokeWidth={2.5}>
      <DrawnPath show d={CLOSE} />
    </svg>
  );
}

/** React's drag and animation handlers collide with Motion's own. */
type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export interface DeleteButtonClassNames {
  root?: string;
  tile?: string;
  confirmation?: string;
}

export interface DeleteButtonSlotProps {
  root?: Pick<React.HTMLAttributes<HTMLDivElement>, "id" | "title">;
}

export interface DeleteConfirmationRenderProps {
  status: DeleteButtonStatus;
}

export interface DeleteButtonProps extends DivProps {
  /** Return a promise and the tile waits on it: spinner, then tick, or back to
   *  the trash if it rejects. */
  onConfirm?: () => void | Promise<unknown>;
  /** Controlled confirmation state. */
  status?: DeleteButtonStatus;
  /** Initial confirmation state when uncontrolled. */
  defaultStatus?: DeleteButtonStatus;
  /** Fires whenever the confirmation state requests a transition. */
  onStatusChange?: (status: DeleteButtonStatus) => void;
  /** Cancel, Escape, or a second press on the tile. */
  onCancel?: () => void;
  /** Handles a rejected `onConfirm`. Without it the rejection is re-thrown. */
  onError?: (error: unknown) => void;
  /** Tile's accessible name, open or closed. */
  label?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Announced, and the tile's label, while a returned promise runs. */
  pendingLabel?: string;
  /** Announced, and the tile's label, once the delete has landed. */
  doneLabel?: string;
  /** ms the tick holds before returning to the trash. 0 keeps the tick. */
  resetAfter?: number;
  /** Actions sit right of the trash by default; `left` flips them. Mutually
   *  exclusive, an explicit `right` wins. */
  left?: boolean;
  right?: boolean;
  disabled?: boolean;
  /** Custom content rendered beside the preset confirmation actions. */
  renderConfirmation?: (
    props: DeleteConfirmationRenderProps,
  ) => React.ReactNode;
  classNames?: DeleteButtonClassNames;
  slotProps?: DeleteButtonSlotProps;
}

function ActionButton({
  label,
  delay,
  className,
  children,
  ...rest
}: { label: string; delay: number } & React.ComponentProps<
  typeof motion.button
>) {
  const scale = useReducedMotionPreference() ? 1 : 0.9;
  return (
    <motion.button
      type="button"
      aria-label={label}
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1, transition: { ...SPRING_SWAP, delay } }}
      exit={{ opacity: 0, scale }}
      whileTap={{ scale: 0.97, transition: SPRING_PRESS }}
      transition={SPRING_SWAP}
      className={cn(
        "inline-grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-background text-foreground shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function DeleteButton({
  onConfirm,
  status,
  defaultStatus = "idle",
  onStatusChange,
  onCancel,
  onError,
  label = "Delete",
  confirmLabel = "Confirm delete",
  cancelLabel = "Keep",
  pendingLabel = "Deleting",
  doneLabel = "Deleted",
  resetAfter = 1400,
  left = false,
  right = false,
  disabled = false,
  renderConfirmation,
  classNames,
  slotProps,
  className,
  style,
  ...rest
}: DeleteButtonProps) {
  const [phase, setPhase] = useControllableState({
    value: status,
    defaultValue: defaultStatus,
    onValueChange: onStatusChange,
  });
  const onLeft = left && !right;
  const reduced = useReducedMotionPreference();
  const tile = React.useRef<HTMLButtonElement>(null);
  const pillId = React.useId();
  // `pointer-events-none` leaves the pill's buttons tabbable, so a disabled
  // control has to stop rendering the prompt entirely.
  const armed = phase === "armed" && !disabled;
  const busy = phase === "pending";
  const tileLabel = busy ? pendingLabel : phase === "done" ? doneLabel : label;

  // Closing unmounts whatever inside the pill had focus; take it back or it
  // lands on <body>.
  const close = () => {
    setPhase("idle");
    tile.current?.focus();
    onCancel?.();
  };

  // The cleanup stops a stale timer closing a pill that was just reopened.
  React.useEffect(() => {
    if (phase !== "done" || resetAfter <= 0) return;
    const id = setTimeout(() => setPhase("idle"), resetAfter);
    return () => clearTimeout(id);
  }, [phase, resetAfter]);

  // Otherwise re-enabling the control reopens a prompt the user never raised.
  React.useEffect(() => {
    if (disabled) setPhase("idle");
  }, [disabled]);

  return (
    <motion.div
      {...slotProps?.root}
      layout={!reduced}
      transition={SPRING_LAYOUT}
      className={cn(
        "relative inline-flex w-fit items-center bg-background p-1 text-foreground shadow-elevated",
        onLeft && "flex-row-reverse",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      style={{ borderRadius: RADIUS, ...style }}
      {...rest}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        if (e.key !== "Escape" || !armed) return;
        e.stopPropagation();
        close();
      }}
    >
      <span aria-live="polite" className="sr-only">
        {busy ? pendingLabel : phase === "done" ? doneLabel : ""}
      </span>
      <motion.button
        ref={tile}
        type="button"
        layout={!reduced}
        transition={SPRING_LAYOUT}
        aria-label={tileLabel}
        aria-expanded={armed}
        aria-controls={armed ? pillId : undefined}
        aria-busy={busy}
        disabled={disabled}
        onClick={() => {
          if (busy || phase === "done") return;
          if (armed) return close();
          setPhase("armed");
        }}
        whileTap={{ scale: 0.94, transition: SPRING_PRESS }}
        style={{ borderRadius: INNER_RADIUS }}
        className={cn(
          "relative grid size-12 shrink-0 cursor-pointer place-items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          phase === "done" ? "text-emerald-500" : "text-foreground",
          classNames?.tile,
        )}
      >
        <TrashGlyph
          show={phase === "idle" || armed}
          open={armed && !reduced}
          mirror={onLeft}
        />
        <SpinnerGlyph show={busy} />
        <CheckGlyph
          show={phase === "done"}
          className="col-start-1 row-start-1 size-6"
        />
      </motion.button>

      <AnimatePresence mode="popLayout">
        {armed && (
          <motion.div
            key="actions"
            id={pillId}
            layout={!reduced}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING_SWAP}
            style={{ borderRadius: INNER_RADIUS }}
            className={cn(
              "relative flex h-12 items-center gap-2.5 bg-secondary px-3",
              onLeft && "flex-row-reverse",
              classNames?.confirmation,
            )}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-1/2 h-4 w-2 -translate-y-1/2 bg-secondary",
                onLeft
                  ? "-right-1.5 [clip-path:polygon(0_0,100%_50%,0_100%)]"
                  : "-left-1.5 [clip-path:polygon(100%_0,0_50%,100%_100%)]",
              )}
            />
            {renderConfirmation?.({ status: phase })}
            <ActionButton
              label={confirmLabel}
              delay={0}
              onClick={() => {
                if (phase !== "armed") return;
                // Confirming unmounts the pill along with this button; the
                // tile has to claim focus first or it lands on <body>.
                tile.current?.focus();
                let result: void | Promise<unknown>;
                try {
                  result = onConfirm?.();
                } catch (error) {
                  setPhase("idle");
                  if (onError) onError(error);
                  else throw error;
                  return;
                }
                if (!result || typeof result.then !== "function") {
                  setPhase("done");
                  return;
                }
                setPhase("pending");
                Promise.resolve(result).then(
                  () => setPhase((p) => (p === "pending" ? "done" : p)),
                  (error: unknown) => {
                    setPhase((p) => (p === "pending" ? "idle" : p));
                    if (onError) onError(error);
                    else throw error;
                  },
                );
              }}
              className="text-red-500"
            >
              <CheckGlyph />
            </ActionButton>
            <ActionButton
              label={cancelLabel}
              delay={reduced ? 0 : 0.07}
              autoFocus
              onClick={() => {
                if (phase !== "armed") return;
                close();
              }}
            >
              <CloseGlyph />
            </ActionButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
