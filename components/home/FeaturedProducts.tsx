"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { featuredTabs, type FeaturedTabKey } from "@/lib/content/home";
import type { RailProduct } from "@/lib/home-rails";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/home/Reveal";
import { type ProductCardData } from "@/components/shop/ProductCard";
import { ProductRail } from "@/components/shop/ProductRail";

/** One tab and the records already resolved for it, from the seam on the server. */
export type FeaturedRailTab = { key: FeaturedTabKey; label: string; products: RailProduct[] };

/** Both tabs control this one region; see the panel for why it is not duplicated per tab. */
const PANEL_ID = "featured-panel";

/*
 * Both rails arrive already resolved. This section used to fetch `/api/products`
 * on mount and again on every tab change, so the served homepage held no products
 * at all — the round-trip Constitution III forbids for browsing. What is left here
 * is the tab, which is genuinely client state.
 *
 * The default tab deliberately does not duplicate NewArrivals, which shows the
 * bare six-record feed two sections below: «جدیدترین‌ها» here means newest *special
 * offers*, a curation rather than a second copy of the feed.
 */
export function FeaturedProducts({ tabs }: { tabs: FeaturedRailTab[] }) {
  const [tab, setTab] = useState<FeaturedTabKey>(tabs[0]?.key ?? "newest");
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  const products = active?.products ?? [];

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /**
   * Arrow keys move the selection, and selection follows focus.
   *
   * **`ArrowLeft` advances, `ArrowRight` goes back.** This document is RTL, so reading forward runs to
   * the left; the physical mapping would be a bug, not a preference. It is the same rule feature 005
   * ships for the categories carousel (FR-028, contract K2) — two RTL surfaces on one page disagreeing
   * about which arrow means "next" is the worse outcome, whatever the manuals say.
   *
   * Selection moves with focus rather than waiting for Enter. The rails are already resolved on the
   * server, so there is no fetch to defer and no reason to make a keyboard user press twice for what a
   * pointer user gets in one click.
   */
  const onTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = featuredTabs.length;
    const at = featuredTabs.findIndex((t) => t.key === tab);
    const current = at === -1 ? 0 : at;
    const moveTo = (index: number) => {
      const next = ((index % count) + count) % count;
      const target = featuredTabs[next];
      if (!target) return;
      setTab(target.key);
      // Focus has to land on the tab that is now selected, or the roving tabindex and what the shopper
      // is pressing disagree and the next arrow acts on a different tab than the one highlighted.
      tabRefs.current[next]?.focus();
    };
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        moveTo(current + 1);
        return;
      case "ArrowRight":
        event.preventDefault();
        moveTo(current - 1);
        return;
      case "Home":
        event.preventDefault();
        moveTo(0);
        return;
      case "End":
        event.preventDefault();
        moveTo(count - 1);
        return;
      default:
      // Enter and Space activate the focused tab natively; nothing to intercept.
    }
  };

  return (
    <section id="featured" className="wrap py-16 md:py-20" aria-labelledby="featured-title">
      <div className="container">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow"><i /> ویترین منتخب</span>
              <h2 id="featured-title" className="mt-4 text-3xl font-black tracking-normal md:text-4xl">
                محصولات <span className="emphasis">منتخب.</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                انتخابی از محبوب‌ترین و تازه‌ترین محصولات حامی همراه
              </p>
            </div>
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-aqua hover:underline">
              مشاهده همه محصولات <ArrowLeft className="size-4" />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* The field runs wider than the text column above it, so the tray reads
          as a surface the goods are laid on rather than another content box.
          `max-w` + padding rather than negative margins: a negative margin wide
          enough to matter overflows the viewport at exactly the width where the
          container stops growing, which is the horizontal-scrollbar trap this
          hero has already hit twice. */}
      <Reveal delay={80} className="mx-auto mt-10 w-full max-w-[1560px] px-3 sm:px-4">
        <div className="tray-field">
          <div className="flex justify-center sm:justify-start pb-6">
            <div
              className="inline-flex items-center gap-1.5 p-1 rounded-full border border-champagne/25 bg-ink shadow-card"
              role="tablist"
              aria-label="فیلتر محصولات منتخب"
              onKeyDown={onTabListKeyDown}
            >
              {featuredTabs.map((t, index) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`featured-tab-${t.key}`}
                    aria-selected={active}
                    // Roving tabindex: the tablist is one stop on the page, and where it lands is the
                    // selected tab. Two stops that both answer to Tab would make the pair a set of
                    // buttons wearing a tablist's clothes, which is what T095 was about.
                    tabIndex={active ? 0 : -1}
                    aria-controls={PANEL_ID}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "relative rounded-full px-5 py-2 text-xs md:text-sm font-bold transition-colors duration-normal",
                      active ? "text-[#110408]" : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="featured-tab-fill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFFDF9] via-[#E5D3B3] to-[#C5A059] shadow-[0_2px_12px_rgba(229,211,179,0.35)]"
                        transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.7 }}
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* One panel, not two. Both tabs control the same region and only one has content at a
              time, so `aria-controls` can point at a node that always exists — a tab whose panel is
              absent is the same broken reference as one with no id. The panel is labelled by the
              selected tab rather than by a string that could drift from it, and it is itself
              focusable so a keyboard user can step from the tablist into the rail. */}
          <div
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={`featured-tab-${active?.key ?? featuredTabs[0]?.key ?? "newest"}`}
            tabIndex={0}
            className="rounded-2xl outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--aqua)]"
          >
            {products.length === 0 && (
              <div className="rounded-2xl border border-line bg-ink-3/80 p-8 text-center text-foreground" role="status">
                <b className="block font-extrabold">محصولی برای نمایش در این انتخاب وجود ندارد.</b>
                <p className="mt-2 text-sm text-muted-foreground">محصولات جدید به‌زودی به این بخش اضافه می‌شوند.</p>
                <Link href="/shop" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-aqua hover:underline">
                  مشاهده همه محصولات <ArrowLeft className="size-3.5" />
                </Link>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <ProductRail products={products as unknown as ProductCardData[]} label={active?.label ?? "محصولات"} />
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}