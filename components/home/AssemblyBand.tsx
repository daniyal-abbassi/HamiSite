import "./assembly-band.css";

import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { AssemblyMotion } from "@/components/home/AssemblyMotion";
import { TrustGlyph } from "@/components/home/primitives";
import { storeContact } from "@/lib/content/contact";
import { categoryLinks, finalConversionCopy, trustFeatures } from "@/lib/content/home";
import { storeWarranty, trustFacts } from "@/lib/content/verified-facts";

const DIGITAL_SERVICES = ["Apple ID", "رجیستری", "VPN", "پیام‌رسان‌ها"];
const STORE_FACT = trustFacts.find((fact) => fact.key === "store")?.label;

/** Digital services, wholesale and the case for the shop, closing as one arch.
 *
 * Server-rendered in its finished arrangement. Only `AssemblyMotion` knows the scattered state, so a
 * shopper without the script, or with reduced motion, simply reads the assembled panel. */
export function AssemblyBand() {
  return (
    <section id="store-experience" className="assembly" aria-labelledby="assembly-title">
      <AssemblyMotion>
        <div className="assembly__stage">
          <div className="assembly__panel">
            <span className="assembly__frame" data-assembly-frame="" aria-hidden="true" />

            <header className="assembly__piece assembly__piece--title" data-piece="">
              <h2 id="assembly-title">
                {`${finalConversionCopy.titleLead}،`} <em>{finalConversionCopy.titleTail}</em>
              </h2>
              <p>{finalConversionCopy.subtitle}</p>
            </header>

            <Link href={categoryLinks.services} className="assembly__piece assembly__piece--digital" data-piece="">
              <span className="assembly__kicker">خدمات آنلاین</span>
              <h3>خدمات دیجیتال، یک نگاه.</h3>
              <ul role="list">
                {DIGITAL_SERVICES.map((service) => <li key={service}>{service}</li>)}
              </ul>
              <span className="assembly__go">مشاهده خدمات <ArrowLeft aria-hidden="true" /></span>
            </Link>

            <Link href="/partners" className="assembly__piece assembly__piece--trade" data-piece="">
              <span className="assembly__kicker">همکاری عمده</span>
              <h3>برای همکاران، فراتر از فروش.</h3>
              <p>قیمت همکاری، استعلام موجودی و ثبت سفارش.</p>
              <span className="assembly__go">ثبت‌نام همکاری <ArrowLeft aria-hidden="true" /></span>
            </Link>

            {trustFeatures.map((feature) => (
              <article key={feature.key} className="assembly__piece assembly__piece--trust" data-piece="">
                <span className="assembly__glyph"><TrustGlyph name={feature.key} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}

            <div className="assembly__piece assembly__piece--store" data-piece="">
              <div>
                <h3>{STORE_FACT}</h3>
                <p>{storeContact.hours} · {storeWarranty.label}</p>
              </div>
              <div className="assembly__actions">
                <a href={storeContact.phoneHref} className="assembly__call" dir="ltr">
                  <Phone aria-hidden="true" />
                  <span>{storeContact.phoneDisplay}</span>
                </a>
                <Link href="/shop" className="assembly__shop">
                  مشاهده محصولات <ArrowLeft aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AssemblyMotion>

      {/* Ground anchor for the `close` stage: a div, never a second landmark. */}
      <div id="band-settled" />
    </section>
  );
}
