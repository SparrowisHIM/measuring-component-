"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

const DIGIT_H = 56; // px, must match the digit line-box height below
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** One continuously-rotating digit wheel, odometer style. */
function Wheel({ value, place }: { value: MotionValue<number>; place: number }) {
  const power = 10 ** place;

  // The wheel rotates proportional to how many times the wheel below wraps.
  const y = useTransform(value, (v) => {
    const pos = (((v / power) % 10) + 10) % 10;
    return -pos * DIGIT_H;
  });

  // Fade in the leading digit only as the reading grows into it.
  const opacity = useTransform(value, (v) => {
    if (place === 0) return 1;
    if (v >= power) return 1;
    return clamp01(1 - (power - v) / (power * 0.12));
  });

  return (
    <motion.span
      className="relative inline-block overflow-hidden"
      style={{ height: DIGIT_H, width: "0.62em", opacity }}
      aria-hidden
    >
      <motion.span className="absolute left-0 top-0 flex flex-col items-center" style={{ y }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <span
            key={i}
            className="tabular flex items-center justify-center font-semibold"
            style={{ height: DIGIT_H, lineHeight: `${DIGIT_H}px` }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </motion.span>
  );
}

/** A comma that fades in once the reading is large enough to need it. */
function Comma({ value, threshold }: { value: MotionValue<number>; threshold: number }) {
  const opacity = useTransform(value, (v) =>
    v >= threshold ? 1 : clamp01(1 - (threshold - v) / (threshold * 0.12)),
  );
  return (
    <motion.span
      className="tabular flex items-end font-semibold"
      style={{ height: DIGIT_H, opacity }}
      aria-hidden
    >
      ,
    </motion.span>
  );
}

export function Odometer({ value, max }: { value: MotionValue<number>; max: number }) {
  const places = Math.max(1, String(Math.round(max)).length);
  const cells: React.ReactNode[] = [];
  for (let p = places - 1; p >= 0; p--) {
    cells.push(<Wheel key={`w${p}`} value={value} place={p} />);
    if (p > 0 && p % 3 === 0) {
      cells.push(<Comma key={`c${p}`} value={value} threshold={10 ** p} />);
    }
  }

  // Purely visual: the slider role announces the reading via aria-valuetext.
  return (
    <div className="text-[52px] leading-none text-bone" style={{ height: DIGIT_H }} aria-hidden>
      <div className="flex items-center" style={{ height: DIGIT_H }}>
        {cells}
      </div>
    </div>
  );
}
