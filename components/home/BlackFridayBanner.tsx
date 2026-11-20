"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Headphones, BatteryCharging, Smartphone } from "lucide-react";
import { categoryLinks } from "@/lib/content/home";
import styles from "./BlackFridayBanner.module.css";

const choices = [
  { label: "گوشی", question: "دنبال گوشی تازه‌ای؟", href: categoryLinks.mobile, image: "/images/categories/v3/phone.png", icon: Smartphone },
  { label: "هدفون", question: "صدای خوب می‌خوای؟", href: categoryLinks.audio, image: "/images/categories/v3/audio.png", icon: Headphones },
  { label: "پاوربانک", question: "شارژت همیشه کمه؟", href: categoryLinks.power, image: "/images/categories/v3/powerbank.jpg", icon: BatteryCharging },
] as const;

// Sale opens Saturday 21 Nov 2026, 12:00 Tehran time (UTC+3:30, no DST).
const SALE_START = Date.parse("2026-11-21T12:00:00+03:30");
const fa = (n: number) => n.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false });

function Countdown() {
  const [now, setNow] = useState<number | null>(null); // null until mounted: server and client markup must match
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = now === null ? null : Math.max(0, SALE_START - now);
  if (left === 0) return <p className={styles.live}>بلک‌فرایدی شروع شد!</p>;
  const s = Math.floor((left ?? 0) / 1000);
  const units = [["روز", Math.floor(s / 86400)], ["ساعت", Math.floor(s / 3600) % 24], ["دقیقه", Math.floor(s / 60) % 60], ["ثانیه", s % 60]] as const;
  return (
    <div className={styles.countdown} role="timer" aria-label="زمان باقی‌مانده تا شروع بلک‌فرایدی" style={{ visibility: left === null ? "hidden" : "visible" }}>
      {units.map(([label, value]) => (
        <div key={label} className={styles.unit}><strong>{fa(value)}</strong><span>{label}</span></div>
      ))}
    </div>
  );
}

export function BlackFridayBanner() {
  const [selected, setSelected] = useState(0);
  const current = choices[selected];

  return (
    <section className={styles.banner} aria-labelledby="black-friday-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.kicker}>حامی همراه / بلک‌فرایدی ۱۴۰۵</p>
          <h2 id="black-friday-title">شنبه ظهر، <span>نوبت انتخاب توئه.</span></h2>
          <Countdown />
          <p className={styles.intro}>از کجا شروع کنیم؟ یکی رو انتخاب کن.</p>
          <div className={styles.choices} role="group" aria-label="انتخاب دسته محصول">
            {choices.map((choice, index) => {
              const Icon = choice.icon;
              return (
                <button key={choice.label} type="button" onClick={() => setSelected(index)}
                  className={`${styles.choice} ${selected === index ? styles.active : ""}`}
                  aria-pressed={selected === index}>
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />{choice.label}
                </button>
              );
            })}
          </div>
          <div className={styles.answer} aria-live="polite">
            <p>{current.question}</p>
            <Link href={current.href} className={styles.cta}>
              دیدن {current.label}‌ها <ArrowLeft size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.halo} />
          <Image key={current.image} src={current.image} alt="" fill sizes="(max-width: 700px) 90vw, 45vw"
            className={styles.product} />
          <span className={styles.outline}>BLACK<br />FRIDAY</span>
        </div>
      </div>
      <p className={styles.foot}>شنبه ۳۰ آبان، ساعت ۱۲ ظهر · آنلاین و حضوری در مشهد</p>
    </section>
  );
}
