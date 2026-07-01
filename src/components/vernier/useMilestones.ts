"use client";

import { useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { interpolateValue, reachedMilestone, type MetricSeries } from "@/lib/metric";

export type Pulse = { id: number; value: number };

/**
 * Drives two reactive channels off the live reading:
 *  - the ambient `--heat` CSS variable the whole page warms to,
 *  - discrete pulses each time the reading crosses a new milestone upward.
 */
export function useMilestones(series: MetricSeries, progress: MotionValue<number>): Pulse[] {
  const prev = useRef<number | null>(null);
  const nextId = useRef(0);
  const [pulses, setPulses] = useState<Pulse[]>([]);

  useMotionValueEvent(progress, "change", (p) => {
    document.documentElement.style.setProperty("--heat", p.toFixed(4));

    const reached = reachedMilestone(series, interpolateValue(series, p));
    if (reached === prev.current) return;

    if (reached !== null && (prev.current === null || reached > prev.current)) {
      const id = ++nextId.current;
      setPulses((list) => [...list, { id, value: reached }]);
      navigator.vibrate?.(12);
      window.setTimeout(() => setPulses((list) => list.filter((x) => x.id !== id)), 1000);
    }
    prev.current = reached;
  });

  return pulses;
}
