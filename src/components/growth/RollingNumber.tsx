"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";

// 0-9 then a trailing 0 so the forward roll wraps seamlessly (9 -> 0).
const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const CELL_W = "0.62em";
const COMMA_W = "0.3em";

/** One forward-rolling digit wheel, driven continuously and unit-free (%). */
function Wheel({
  value,
  place,
  active,
}: {
  value: MotionValue<number>;
  place: number;
  active: boolean;
}) {
  const power = 10 ** place;
  // Position 0..10 within the 11-cell strip; % keeps it size-independent.
  const y = useTransform(value, (v) => {
    const pos = (((v / power) % 10) + 10) % 10;
    return `${-(pos / STRIP.length) * 100}%`;
  });

  return (
    <motion.span
      className="relative inline-block overflow-hidden"
      style={{ width: CELL_W, height: "1em" }}
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : "-24%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-hidden
    >
      <motion.span className="absolute left-0 top-0 flex w-full flex-col" style={{ y }}>
        {STRIP.map((d, i) => (
          <span key={i} className="flex h-[1em] items-center justify-center leading-none">
            {d}
          </span>
        ))}
      </motion.span>
    </motion.span>
  );
}

function Comma({ active }: { active: boolean }) {
  return (
    <motion.span
      className="relative inline-flex h-[1em] items-end justify-center leading-none"
      style={{ width: COMMA_W }}
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-hidden
    >
      ,
    </motion.span>
  );
}

/**
 * Fixed-width tabular reel. Reserves the full width of the largest value so
 * digits never shift; leading digits and the separator fade in only as the
 * count grows into them. Purely visual — the value is announced elsewhere.
 */
export function RollingNumber({ value, max }: { value: MotionValue<number>; max: number }) {
  const places = Math.max(1, String(Math.round(max)).length);

  const [digits, setDigits] = useState(() => String(Math.round(value.get())).length);
  useMotionValueEvent(value, "change", (v) => {
    const n = String(Math.max(1, Math.round(v))).length;
    setDigits((prev) => (prev === n ? prev : n));
  });

  const cells: React.ReactNode[] = [];
  for (let p = places - 1; p >= 0; p--) {
    cells.push(<Wheel key={`w${p}`} value={value} place={p} active={p < digits} />);
    if (p > 0 && p % 3 === 0) {
      cells.push(<Comma key={`c${p}`} active={digits > p} />);
    }
  }

  return (
    <span
      className="tabular flex items-center justify-center font-semibold leading-none text-bone"
      style={{ fontSize: "clamp(3.5rem, 13vw, 10rem)", letterSpacing: "-0.03em" }}
      aria-hidden
    >
      {cells}
    </span>
  );
}
