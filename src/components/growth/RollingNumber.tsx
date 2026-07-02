"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";

// Descending, with a leading 0, so counting up rolls the wheel *downward*
// (each higher digit drops in from the top) and 9 -> 0 wraps without a seam.
const STRIP = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const CELL_W = "0.62em";
const COMMA_W = "0.34em";
// Tight cell height: digits are sliced hard at the cell edge mid-roll, which
// is what makes it read as a mechanical odometer.
const CELL_H = "0.84em";

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
  // k = 10 - pos maps onto the descending strip so higher digits enter from top.
  const y = useTransform(value, (v) => {
    const pos = (((v / power) % 10) + 10) % 10;
    const k = 10 - pos;
    return `${-(k / STRIP.length) * 100}%`;
  });

  return (
    <motion.span
      className="relative inline-block overflow-hidden"
      style={{ height: CELL_H }}
      initial={false}
      // Collapse unused leading wheels so the number stays a tight,
      // left-aligned block; a new wheel expands as the count grows into it.
      animate={{ width: active ? CELL_W : "0em", opacity: active ? 1 : 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      aria-hidden
    >
      <motion.span
        className="absolute left-0 top-0 flex flex-col"
        style={{ y, width: CELL_W }}
      >
        {STRIP.map((d, i) => (
          <span
            key={i}
            className="flex items-center justify-center leading-none"
            style={{ height: CELL_H }}
          >
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
      className="relative inline-flex items-end justify-center overflow-hidden leading-none"
      style={{ height: CELL_H }}
      initial={false}
      animate={{ width: active ? COMMA_W : "0em", opacity: active ? 1 : 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      aria-hidden
    >
      ,
    </motion.span>
  );
}

/**
 * Odometer readout. Wheels clip hard at their cell edges (the mechanical
 * charm); leading wheels take no width until the count grows into them.
 * Purely visual — the value is announced by the slider's aria-valuetext.
 */
export function RollingNumber({
  value,
  max,
  className = "",
}: {
  value: MotionValue<number>;
  max: number;
  className?: string;
}) {
  const places = Math.max(1, String(Math.round(max)).length);

  const [digits, setDigits] = useState(() => String(Math.max(1, Math.round(value.get()))).length);
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
      className={`tabular flex items-center font-semibold leading-none text-ink ${className}`}
      style={{ letterSpacing: "-0.03em" }}
      aria-hidden
    >
      {cells}
    </span>
  );
}
