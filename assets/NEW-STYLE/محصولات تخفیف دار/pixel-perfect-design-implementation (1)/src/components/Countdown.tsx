import { useEffect, useMemo, useState } from "react";

const pad = (n: number) => n.toString().padStart(2, "0");
const toFa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/** Deadline: a fixed window from first mount so the timer always counts down. */
export default function Countdown() {
  const deadline = useMemo(
    () => Date.now() + (1000 * 60 * 60 * 23 + 1000 * 60 * 41 + 1000 * 18),
    []
  );
  const [left, setLeft] = useState(deadline - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft(Math.max(0, deadline - Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  const total = Math.floor(left / 1000);
  const units = [
    { label: "ثانیه", value: total % 60 },
    { label: "دقیقه", value: Math.floor(total / 60) % 60 },
    { label: "ساعت", value: Math.floor(total / 3600) % 24 },
    { label: "روز", value: Math.floor(total / 86400) },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2 sm:gap-2.5">
          {i > 0 && (
            <span className="-mt-3 text-[17px] font-bold text-gold-300/50">:</span>
          )}
          <div className="flex w-[52px] flex-col items-center gap-1 sm:w-[58px]">
            <div className="relative grid h-[52px] w-full place-items-center overflow-hidden rounded-2xl border border-gold-400/30 bg-gradient-to-b from-wine-900/80 to-wine-950/90 shadow-[inset_0_1px_0_rgba(248,236,201,0.18)] backdrop-blur-sm sm:h-[56px]">
              <span
                key={u.value}
                className="tick-flip bg-gradient-to-b from-gold-100 to-gold-400 bg-clip-text text-[22px] font-black tabular-nums text-transparent sm:text-[24px]"
              >
                {toFa(pad(u.value))}
              </span>
              <span className="absolute inset-x-2 top-1/2 h-px bg-wine-950/50" />
            </div>
            <span className="text-[10.5px] font-semibold text-cream-100/50">
              {u.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
