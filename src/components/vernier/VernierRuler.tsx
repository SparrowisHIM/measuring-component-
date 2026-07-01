"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import type { MetricSeries } from "@/lib/metric";
import { TRACK_H, yFor } from "./geometry";

const STEP = 58; // vertical spacing between month ticks
const MINORS = 4; // minor graduations per month

export function VernierRuler({
  series,
  progress,
}: {
  series: MetricSeries;
  progress: MotionValue<number>;
}) {
  const last = series.points.length - 1;

  // Scroll the scale so the active month sits exactly on the knob's reading line.
  const translate = useTransform(progress, (p) => yFor(p) - p * last * STEP);
  const readingY = useTransform(progress, (p) => yFor(p) - 1);

  // Track the active index, but only re-render when it actually changes.
  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    const idx = Math.round(p * last);
    setActive((prev) => (prev === idx ? prev : idx));
  });

  return (
    <div
      className="relative h-[340px] overflow-hidden"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)",
      }}
    >
      {/* Reading line — the fixed index the scale is read against, riding the knob. */}
      <motion.div
        className="pointer-events-none absolute right-0 z-10 flex items-center gap-1.5"
        style={{ top: 0, y: readingY }}
      >
        <span className="h-px w-6 bg-brass/70" />
        <span
          className="h-1.5 w-1.5 rotate-45"
          style={{ background: "var(--brass-hot)", boxShadow: "0 0 8px var(--brass-hot)" }}
        />
      </motion.div>

      <motion.div className="absolute inset-x-0 top-0" style={{ y: translate }}>
        {series.points.map((pt, i) => {
          const isActive = i === active;
          return (
            <div key={pt.label}>
              {/* Major graduation + engraved month label */}
              <div
                className="absolute right-0 flex items-center justify-end gap-3"
                style={{ top: i * STEP, transform: "translateY(-50%)" }}
              >
                <span
                  className={`font-mono text-[13px] tracking-tight transition-colors duration-200 ${
                    isActive ? "text-bone" : "text-bone-dim/70"
                  }`}
                >
                  {pt.label}
                </span>
                <span
                  className="h-px transition-all duration-200"
                  style={{
                    width: isActive ? 22 : 16,
                    background: isActive ? "var(--brass)" : "var(--bone-faint)",
                  }}
                />
              </div>

              {/* Minor graduations between months */}
              {i < last &&
                Array.from({ length: MINORS - 1 }, (_, k) => (
                  <span
                    key={k}
                    className="absolute right-0 h-px w-2 bg-bone-faint/50"
                    style={{ top: i * STEP + ((k + 1) * STEP) / MINORS }}
                  />
                ))}
            </div>
          );
        })}
      </motion.div>

      {/* baseline so the fade math reads against the full height */}
      <div className="pointer-events-none absolute inset-0" style={{ height: TRACK_H }} />
    </div>
  );
}
