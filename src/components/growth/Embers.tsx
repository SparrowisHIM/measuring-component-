"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";
import { pointFractions, type MetricSeries } from "@/lib/metric";

type Ember = { id: number; x: number; drift: number; delay: number; size: number };

const INSET = 4.5; // horizontal inset (%) matching the timeline rail
const RAIL_Y = 84; // start height (%) at the rail
const NUMBER_Y = 42; // convergence height (%) at the number
const NUMBER_X = 62; // convergence x (%) — over the readout

/**
 * The signature: each time a timeline node ignites, embers lift off the rail
 * and converge into the number — growth made visible as light feeding the count.
 */
export function Embers({
  series,
  progress,
  active,
}: {
  series: MetricSeries;
  progress: MotionValue<number>;
  /** Only lift embers while the reveal is playing — calm during inspection. */
  active: boolean;
}) {
  const reduce = useReducedMotion();
  const fractions = pointFractions(series);
  const last = series.points.length - 1;
  const prevLit = useRef(0);
  const nextId = useRef(0);
  const [embers, setEmbers] = useState<Ember[]>([]);

  useMotionValueEvent(progress, "change", (p) => {
    if (reduce || !active) return;
    const clamped = Math.min(1, Math.max(0, p));

    // Reset the counter when the loop rewinds.
    if (clamped < 0.02) {
      prevLit.current = 0;
      return;
    }

    const lit = Math.floor(clamped * last + 1e-6);
    if (lit <= prevLit.current) return;

    const created: Ember[] = [];
    for (let i = prevLit.current + 1; i <= lit; i++) {
      // Sparse: not every node emits, and only one ember when it does.
      if (Math.random() > 0.7) continue;
      const id = ++nextId.current;
      created.push({
        id,
        x: INSET + fractions[i] * (100 - 2 * INSET),
        drift: (Math.random() - 0.5) * 10,
        delay: 0,
        size: 2.5 + Math.random() * 2.5,
      });
      window.setTimeout(() => setEmbers((list) => list.filter((e) => e.id !== id)), 1400);
    }
    prevLit.current = lit;
    if (created.length) setEmbers((list) => [...list, ...created].slice(-16));
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <AnimatePresence>
        {embers.map((e) => (
          <motion.span
            key={e.id}
            className="absolute rounded-full"
            style={{
              width: e.size,
              height: e.size,
              background: "var(--brass-hot)",
              boxShadow: "0 0 8px 1px var(--ember)",
            }}
            initial={{ left: `${e.x}%`, top: `${RAIL_Y}%`, opacity: 0, scale: 1 }}
            animate={{
              left: `${NUMBER_X + e.drift}%`,
              top: `${NUMBER_Y}%`,
              opacity: [0, 0.95, 0],
              scale: [1, 0.85, 0.2],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.25, ease: "easeOut", delay: e.delay, times: [0, 0.25, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
