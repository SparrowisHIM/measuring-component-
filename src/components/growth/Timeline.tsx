"use client";

import { useState } from "react";
import { motion, useMotionTemplate, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { pointFractions, type MetricSeries } from "@/lib/metric";

/** Short month token, e.g. "Mar 2024" -> "Mar". */
const shortMonth = (label: string) => label.split(" ")[0];

export function Timeline({
  series,
  progress,
}: {
  series: MetricSeries;
  progress: MotionValue<number>;
}) {
  const fractions = pointFractions(series);
  const last = series.points.length - 1;

  // How many nodes have been reached; only re-render when it changes.
  const [lit, setLit] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    const idx = Math.floor(Math.min(1, Math.max(0, p)) * last + 1e-6);
    setLit((prev) => (prev === idx ? prev : idx));
  });

  const pct = useTransform(progress, (p) => Math.min(1, Math.max(0, p)) * 100);
  const fillWidth = useMotionTemplate`${pct}%`;
  const headLeft = useMotionTemplate`${pct}%`;

  return (
    <div className="absolute inset-x-6 bottom-5 sm:inset-x-10 sm:bottom-6">
      {/* Rail */}
      <div className="relative h-px w-full bg-edge">
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            width: fillWidth,
            background: "linear-gradient(90deg, color-mix(in oklab, var(--brass) 30%, transparent), var(--brass-hot))",
            boxShadow: "0 0 8px color-mix(in oklab, var(--ember) 60%, transparent)",
          }}
        />

        {/* Nodes */}
        {fractions.map((f, i) => {
          const on = i <= lit;
          return (
            <span
              key={i}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-out"
              style={{
                left: `${f * 100}%`,
                height: on ? 8 : 5,
                width: on ? 8 : 5,
                background: on ? "var(--brass-hot)" : "var(--bone-faint)",
                boxShadow: on ? "0 0 10px color-mix(in oklab, var(--ember) 75%, transparent)" : "none",
              }}
            />
          );
        })}

        {/* Playhead */}
        <motion.span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: headLeft,
            background: "var(--incandescent)",
            boxShadow: "0 0 12px 2px var(--ember)",
          }}
        />
      </div>

      {/* Labels — thinned on small screens to avoid collisions */}
      <div className="relative mt-3 h-4">
        {series.points.map((pt, i) => {
          const key = i === 0 || i === last || pt.label.startsWith("Jan");
          return (
            <span
              key={pt.label}
              className={`panel-label absolute -translate-x-1/2 text-[10px] transition-colors duration-300 ${
                key ? "" : "hidden sm:block"
              }`}
              style={{ left: `${fractions[i] * 100}%`, color: i <= lit ? "var(--brass-hot)" : undefined }}
            >
              {shortMonth(pt.label)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
