# Extractable components

Candidates for Superdesign `DraftComponent` extraction. Props listed are ONLY
state/navigation props that change per page — icons, labels, and CSS are
hardcoded and must stay that way.

## Layout components (appear on most pages)

## Header
- Source: `components/layout/Header.tsx`
- Category: layout
- Description: Full site chrome — marquee ticker strip, brand mark, desktop nav, search, user menu, cart, partner CTA. Server component; composes three client children.
- Extractable props: activeHref (string, default: "/") — no active state exists today, the nav links have no current-page styling
- Hardcoded: `hami-mark.png` logo (Brand Asset — must render, never initials/text), nav labels (خانه / فروشگاه), ticker items from `lib/content/home.ts`, search action `/shop`, CTA label ثبت‌نام همکار, all CSS
- Structure: `<header>` → `<Ticker/>` + `.site-header > .container.flex.h-[72px]` → MobileNav · BrandMark · nav (`hidden md:flex`) · search form (`hidden lg:block w-64`) · UserMenu + CartButton · partner Button

## MobileNav
- Source: `components/layout/MobileNav.tsx`
- Category: layout
- Description: `md:hidden` hamburger opening an RTL slide-over panel (start-anchored, `animate-slide-in-end`). Client component, local `open` state, no Radix.
- Extractable props: links (NavLink[], default: home/shop/cart/partners), activeHref (string)
- Hardcoded: Menu/X lucide icons, brand text حامی همراه, login CTA ورود / ثبت‌نام, glass panel CSS
- Note: `role="dialog" aria-modal="true"` present, but no Escape handler and no focus trap.

## CartButton
- Source: `components/layout/CartButton.tsx`
- Category: layout
- Description: Cart icon with item-count badge, reads CartProvider.
- Extractable props: badgeCount (number, default: 0)
- Hardcoded: icon, badge CSS

## UserMenu
- Source: `components/layout/UserMenu.tsx`
- Category: layout
- Description: Account entry point; swaps between guest and authenticated state via AuthProvider.
- Extractable props: isAuthenticated (boolean, default: false)
- Hardcoded: icon, menu labels

## Footer
- Source: `components/layout/Footer.tsx`
- Category: layout
- Description: Multi-column footer — brand blurb, quick links, branch info, legal strip.
- Extractable props: (none — fully static)
- Hardcoded: all groups, logo, copy

## AdminSidebar
- Source: `components/admin/AdminSidebar.tsx`
- Category: layout
- Description: `/admin` panel sidebar navigation.
- Extractable props: activeItem (string)
- Hardcoded: item labels and icons

## Basic components (used across pages)

## Button
- Source: `components/ui/button.tsx`
- Category: basic
- Description: CVA pill button. Variants include `default` (gold), `oxblood`, `ghost`; sizes sm/default/lg.
- Extractable props: variant (string, default: "default"), size (string, default: "default")
- Hardcoded: all variant CSS, the shared motion curve

## Card
- Source: `components/ui/card.tsx`
- Category: basic
- Description: Glass surface with Header/Title/Description/Content/Footer parts.
- Extractable props: (none)
- Hardcoded: glass material, 22px radius

## Input
- Source: `components/ui/input.tsx`
- Category: basic
- Description: Form field with gold focus ring.
- Extractable props: placeholder (string), type (string, default: "text")
- Hardcoded: focus-visible ring, border, radius

## Badge
- Source: `components/ui/badge.tsx`
- Category: basic
- Description: Pill tag/status chip.
- Extractable props: variant (string, default: "default")
- Hardcoded: all variant CSS

## Skeleton
- Source: `components/ui/skeleton.tsx`
- Category: basic
- Description: Loading placeholder used by every data-fetching home section.
- Extractable props: (none)
- Hardcoded: pulse animation

## Reveal
- Source: `components/home/Reveal.tsx`
- Category: basic
- Description: IntersectionObserver scroll-reveal wrapper used by nearly every home section.
- Extractable props: delay (number, default: 0)
- Hardcoded: `.reveal` / `.reveal--visible` CSS, threshold
