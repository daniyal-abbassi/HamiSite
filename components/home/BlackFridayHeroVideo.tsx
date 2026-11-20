import Link from "next/link";

const VIDEO = "absolute inset-0 h-full w-full object-cover";

/* Two cuts, one per screen shape: the wide banner is unreadable at phone
   width, so phones get a portrait 4:5 version. The hidden one never plays. */
export function BlackFridayHeroVideo() {
  return (
    <section aria-label="بلک‌فرایدی حامی همراه" className="relative w-full overflow-hidden bg-black">
      <Link href="/shop" aria-label="مشاهده محصولات بلک‌فرایدی" className="absolute inset-0 z-10" />
      <div className="relative hidden w-full md:block" style={{ aspectRatio: "1920 / 800" }}>
        <video className={VIDEO} src="/videos/black-friday/hero.mp4" poster="/videos/black-friday/hero-poster.png"
          autoPlay muted loop playsInline preload="none" aria-hidden="true" />
      </div>
      <div className="relative w-full md:hidden" style={{ aspectRatio: "1080 / 1350" }}>
        <video className={VIDEO} src="/videos/black-friday/hero-mobile.mp4" poster="/videos/black-friday/hero-mobile-poster.png"
          autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      </div>
    </section>
  );
}
