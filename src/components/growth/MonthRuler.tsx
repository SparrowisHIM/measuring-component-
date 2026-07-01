"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { pointFractions, type MetricSeries } from "@/lib/metric";
import { TRACK_H, yFor } from "./trackGeo";

/** "Mar 2024" -> "Mar '24". */
const shortLabel = (label: string) => {
  const [m, y] = label.split(" ");
  return `${m} '${y.slice(2)}`;
};

export function MonthRuler({
  series,
  progress,
}: {
  series: MetricSeries;
  progress: MotionValue<number>;
}) {
  const fractions = pointFractions(series);
  const last = series.points.length - 1;

  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    const idx = Math.round(Math.min(1, Math.max(0, p)) * last);
    setActive((prev) => (prev === idx ? prev : idx));
  });

  const caretY = useTransform(progress, (p) => yFor(p) - 1);

  return (
    <div className="relative shrink-0" style={{ width: 78, height: TRACK_H }}>
      {series.points.map((pt, i) => {
        const on = i === active;
        return (
          <div
            key={pt.label}
            className="absolute right-0 flex items-center justify-end gap-2"
            style={{ top: yFor(fractions[i]), transform: "translateY(-50%)" }}
          >
            <span
              className={`font-mono text-[11px] tracking-tight transition-colors duration-200 ${
                on ? "text-bone" : "text-bone-dim/60"
              }`}
            >
              {shortLabel(pt.label)}
            </span>
            <span
              className="h-px transition-all duration-200"
              style={{
                width: on ? 12 : 7,
                background: on ? "var(--brass)" : "var(--bone-faint)",
              }}
            />
          </div>
        );
      })}

      {/* Reading caret riding the knob's line */}
      <motion.span
        className="pointer-events-none absolute right-0 flex items-center"
        style={{ top: 0, y: caretY }}
      >
        <span
          className="h-1.5 w-1.5 rotate-45"
          style={{ background: "var(--brass-hot)", boxShadow: "0 0 8px var(--brass-hot)" }}
        />
      </motion.span>
    </div>
  );
}
