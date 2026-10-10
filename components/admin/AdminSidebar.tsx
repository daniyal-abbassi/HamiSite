"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Boxes,
  Building2,
  FolderTree,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Store,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useModalDialog } from "@/components/ui/useModalDialog";
import {
  CurveDrawer,
  CurveDrawerClose,
  CurveDrawerContent,
  CurveDrawerHeader,
  CurveDrawerTitle,
  CurveDrawerTrigger,
} from "@/components/curve-drawer-primitives";
import { cn } from "@/lib/utils";

/** The one nav model. The desktop rail maps all of it, the phone maps `RAIL_HREFS`
 * into the bottom rail and the rest into the «همه» sheet. A destination is declared
 * here and nowhere else — a second list is how a section quietly stops being
 * reachable on one of the two breakpoints. */
const DESTINATIONS = [
  { href: "/admin", label: "داشبورد", short: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/orders", label: "سفارش‌ها", short: "سفارش", icon: Package },
  { href: "/admin/products", label: "محصولات", short: "محصول", icon: Boxes },
  { href: "/admin/users", label: "کاربران", short: "کاربر", icon: Users },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", short: "دسته", icon: FolderTree },
  { href: "/admin/brands", label: "برندها", short: "برند", icon: Building2 },
  { href: "/admin/coupons", label: "کوپن‌ها", short: "کوپن", icon: BadgePercent },
];

/** The four sections an operator visits daily. Everything else is configuration and
 * lives behind «همه» — a seven-slot thumb rail at 360px is a 45px slot with a
 * truncated label, which is the bug this replaced. */
const RAIL_HREFS = ["/admin", "/admin/orders", "/admin/products", "/admin/users"];

const RAIL_ITEMS = DESTINATIONS.filter((destination) => RAIL_HREFS.includes(destination.href));
const SHEET_ONLY_ITEMS = DESTINATIONS.filter((destination) => !RAIL_HREFS.includes(destination.href));

function isCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
}

/** One row recipe, shared by the rail, the sheet, and the utility links below the
 * hairline, so the frame has one button-look instead of four that drift apart.
 * Height and inset stay at the call site: a desktop row is 44px, a thumb row is 56px. */
const ROW_BASE = "relative flex items-center gap-3 rounded-md text-[13px] transition-colors duration-fast";
const ROW_ACTIVE = "bg-foreground/10 font-black text-foreground";
const ROW_QUIET = "font-bold text-muted-foreground hover:bg-foreground/5 hover:text-foreground";
const ROW_DESTRUCTIVE = "font-bold text-destructive hover:bg-destructive/10";

/** The phone rail's five slots — same recipe for the four links and the «همه» button,
 * because they are the same thing in the operator's hands. `text-xs` rather than the
 * 10px the desktop scale uses: the phone chrome is live up to 1023px, and the
 * `@media (max-width: 767px)` size bump in `globals.css` does not cover that band, so
 * a 10px label here would render at true 10px on a tablet.
 */
const RAIL_SLOT = "flex min-h-16 flex-col items-center gap-1 pt-1 pb-2 text-xs transition-colors duration-fast";
const RAIL_SLOT_ACTIVE = "font-black text-foreground";
const RAIL_SLOT_QUIET = "font-bold text-muted-foreground";

/** Held at `invisible`, not unrendered, so an inactive slot keeps the exact box an
 * active one has and the row of icons never shifts when you navigate. */
function Marker({ active }: { active: boolean }) {
  return <span aria-hidden="true" className={cn("h-0.5 w-8 rounded-full", active ? "bg-champagne" : "invisible")} />;
}

/** `max-w-full` + the `min-w-0` on the slot: without them a flex item's automatic
 * minimum lets a long label push its own slot wider than its four siblings, which in
 * a fixed rail is how the bar starts overflowing the viewport. */
function RailLabel({ children }: { children: React.ReactNode }) {
  return <span className="max-w-full truncate px-1">{children}</span>;
}

/** The row a section sits in, at the two places that have room for a label: the desktop
 * rail and the sheet. Active is carried by four redundant channels there — assistive
 * state, weight, a start-edge marker, a surface fill — so it survives greyscale and
 * colour blindness. The phone thumb rail has three (no fill: a filled slot among five
 * reads as a key, not a location); see `RAIL_SLOT`. Colour alone is never a state. */
function NavRow({
  destination,
  pathname,
  onActivate,
  variant,
}: {
  destination: (typeof DESTINATIONS)[number];
  pathname: string;
  onActivate?: () => void;
  variant: "rail" | "sheet";
}) {
  const active = isCurrent(pathname, destination.href);
  const { label, href, icon: Icon } = destination;

  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onActivate}
        className={cn(
          ROW_BASE,
          variant === "rail" ? "h-11 px-3" : "min-h-14 px-4",
          active ? ROW_ACTIVE : ROW_QUIET,
        )}
      >
        {active && <span aria-hidden="true" className="absolute inset-y-3 start-0 w-0.5 rounded-full bg-champagne" />}
        <Icon className="size-5 shrink-0" />
        <span className="min-w-0 truncate">{label}</span>
      </Link>
    </li>
  );
}

/** Thumb-reachable sheet for the sections that do not fit the rail.
 * Same open/Escape/scroll-lock conventions as `components/ui/dialog.tsx`, in sheet
 * geometry: a centred glass modal is the wrong shape for a phone at work. */
function DestinationSheet({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const { dialogRef, backdropProps } = useModalDialog(open, onClose);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="admin-sheet-title"
      {...backdropProps}
      className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground backdrop:bg-ink/85 lg:hidden"
    >
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-line bg-ink-2 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-deep",
          "animate-in slide-in-from-bottom-5 fade-in-0 duration-normal",
        )}
      >
        <span aria-hidden="true" className="mx-auto mt-3 block h-1 w-10 rounded-full bg-champagne/25" />

        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
          <h2 id="admin-sheet-title" className="text-sm font-black">
            همه بخش‌ها
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            autoFocus
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="سایر بخش‌های مدیریت">
          <ul className="px-2">
            {SHEET_ONLY_ITEMS.map((destination) => (
              <NavRow
                key={destination.href}
                destination={destination}
                pathname={pathname}
                variant="sheet"
                onActivate={onClose}
              />
            ))}
          </ul>
        </nav>

        <div className="my-2 h-px bg-line" />

        <Link
          href="/"
          onClick={onClose}
          className={cn(ROW_BASE, "mx-2 min-h-14 px-4", ROW_QUIET)}
        >
          <Store className="size-5 shrink-0" />
          مشاهده فروشگاه
        </Link>
      </div>
    </dialog>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTriggerRef = useRef<HTMLButtonElement>(null);

  // A sheet opened on a phone must not survive the resize to desktop, where the
  // rail is already on screen and the modal has nothing left to say.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setSheetOpen(false);
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    // Every way of leaving the sheet — the backdrop, Escape, the ✕, or choosing a
    // section — puts focus back on «همه». Without this the panel unmounts with focus
    // inside it, focus lands on <body>, and the next Tab restarts from the top of the
    // document (WCAG 2.4.3).
    sheetTriggerRef.current?.focus();
  }, []);

  const onRailSection = RAIL_ITEMS.some((destination) => isCurrent(pathname, destination.href));
  const currentSection = DESTINATIONS.find((destination) => isCurrent(pathname, destination.href));

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* ---- Phone: top bar with curve drawer hamburger menu ---- */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2.5 border-b border-line bg-ink-2 px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] lg:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <CurveDrawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen} handleOnly>
            <CurveDrawerTrigger asChild>
              <button
                type="button"
                aria-label="باز کردن منوی مدیریت"
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-ink-2/80 text-foreground transition-colors hover:bg-foreground/5 active:scale-95"
              >
                <Menu className="size-5" />
              </button>
            </CurveDrawerTrigger>
            <CurveDrawerContent curveSide="right" className="bg-ink-2 text-foreground">
              <CurveDrawerHeader className="flex-row items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-md bg-champagne/10 text-xs font-black text-champagne"
                  >
                    ح
                  </span>
                  <div className="min-w-0">
                    <CurveDrawerTitle className="text-sm font-black text-foreground">
                      منوی مدیریت
                    </CurveDrawerTitle>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      دسترسی سریع به تمام بخش‌ها
                    </span>
                  </div>
                </div>
                <CurveDrawerClose asChild>
                  <button
                    type="button"
                    aria-label="بستن منو"
                    className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    <X className="size-5" />
                  </button>
                </CurveDrawerClose>
              </CurveDrawerHeader>

              <nav aria-label="تمام بخش‌های مدیریت" className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-1">
                  {DESTINATIONS.map((destination) => (
                    <NavRow
                      key={destination.href}
                      destination={destination}
                      pathname={pathname}
                      variant="sheet"
                      onActivate={() => setDrawerOpen(false)}
                    />
                  ))}
                </ul>

                <div className="my-3 h-px bg-line" />

                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(ROW_BASE, "min-h-12 px-4", ROW_QUIET)}
                >
                  <Store className="size-5 shrink-0" />
                  <span>مشاهده فروشگاه</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    void logout();
                  }}
                  className={cn(ROW_BASE, "mt-1 w-full min-h-12 px-4", ROW_DESTRUCTIVE)}
                >
                  <LogOut className="size-5 shrink-0" />
                  <span>خروج از حساب</span>
                </button>
              </nav>
            </CurveDrawerContent>
          </CurveDrawer>

          <div className="min-w-0">
            <span className="block truncate text-[13px] font-black leading-5">حامی همراه</span>
            <span className="block truncate text-xs leading-4 text-muted-foreground">
              {currentSection?.label ?? "پنل مدیریت"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold text-destructive transition-colors duration-fast hover:bg-destructive/10"
        >
          <LogOut className="size-4 shrink-0" />
          خروج
        </button>
      </div>

      {/* ---- Desktop: a quiet rail, flat, no glass and no glow ---- */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line bg-ink-2 p-4 lg:flex">
        <Link href="/admin" className="flex min-h-11 items-center gap-2.5 rounded-md px-1">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-md bg-champagne/10 text-sm font-black text-champagne"
          >
            ح
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-black leading-5">حامی همراه</span>
            <span className="block truncate text-xs leading-4 text-muted-foreground">پنل مدیریت</span>
          </span>
        </Link>

        <nav aria-label="بخش‌های مدیریت" className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          <ul>
            {DESTINATIONS.map((destination) => (
              <NavRow key={destination.href} destination={destination} pathname={pathname} variant="rail" />
            ))}
          </ul>
        </nav>

        <div className="my-3 h-px bg-line" />

        <Link href="/" className={cn(ROW_BASE, "h-11 px-3", ROW_QUIET)}>
          <Store className="size-5 shrink-0" />
          <span className="min-w-0 truncate">مشاهده فروشگاه</span>
        </Link>
        <button type="button" onClick={() => void logout()} className={cn(ROW_BASE, "h-11 px-3", ROW_DESTRUCTIVE)}>
          <LogOut className="size-5 shrink-0" />
          <span className="min-w-0 truncate">خروج</span>
        </button>
      </aside>

      {/* ---- Phone: thumb rail. Five slots, every one at thumb height ---- */}
      <nav
        aria-label="بخش‌های مدیریت"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink-2 px-[max(0.5rem,env(safe-area-inset-left),env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {/* Capped so a tablet in portrait (768–1023px, which still gets this chrome)
            keeps a thumb-width cluster instead of five 167px slots. The cap is never
            reached at 360px, so the mandated width is unaffected. */}
        <ul className="mx-auto flex w-full max-w-md items-stretch">
          {RAIL_ITEMS.map((destination) => {
            const active = isCurrent(pathname, destination.href);
            const { short, href, icon: Icon } = destination;
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(RAIL_SLOT, active ? RAIL_SLOT_ACTIVE : RAIL_SLOT_QUIET)}
                >
                  <Marker active={active} />
                  <Icon className="size-5 shrink-0" />
                  <RailLabel>{short}</RailLabel>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 flex-1">
            <button
              ref={sheetTriggerRef}
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              aria-haspopup="dialog"
              className={cn(RAIL_SLOT, !onRailSection ? RAIL_SLOT_ACTIVE : RAIL_SLOT_QUIET)}
            >
              <Marker active={!onRailSection} />
              <LayoutGrid className="size-5 shrink-0" />
              <RailLabel>همه</RailLabel>
            </button>
          </li>
        </ul>
      </nav>

      <DestinationSheet open={sheetOpen} onClose={closeSheet} pathname={pathname} />
    </>
  );
}
