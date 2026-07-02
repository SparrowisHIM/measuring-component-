"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  compactValue,
  followers,
  formatValue,
  interpolateValue,
  monthDelta,
  reachedMilestone,
  seriesMax,
  type MetricSeries,
} from "@/lib/metric";
import { useGrowthController } from "./useGrowthController";
import { Atmosphere } from "./Atmosphere";
import { Embers } from "./Embers";
import { GrowthLine } from "./GrowthLine";
import { ProfileCard } from "./ProfileCard";
import { RollingNumber } from "./RollingNumber";
import { TapeScrubber } from "./TapeScrubber";

export type GrowthCardProps = {
  /** The growth series to display. */
  data?: MetricSeries;
  /** Visual voice: "lime" signal (default) or warm "brass" instrument. */
  theme?: "lime" | "brass";
  /** Extra classes for the outer card. */
  className?: string;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function MilestoneChip({ value, lit }: { value: number; lit: boolean }) {
  return (
    <motion.span
      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 ${
        lit ? "border-accent/50 bg-accent/10 text-accent-hot" : "border-edge text-ink-faint"
      }`}
      initial={false}
      animate={{ scale: lit ? [1, 1.18, 1] : 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {compactValue(value)}
    </motion.span>
  );
}

/**
 * A self-contained, data-driven growth card. It counts up once when it
 * scrolls into view — the month tape streaming past the fixed reading head —
 * then you drag the tape (or the knob, or arrow keys) to inspect any month.
 */
export function GrowthCard({ data = followers, theme = "lime", className = "" }: GrowthCardProps) {
  const reduce = useReducedMotion();
  const last = data.points.length - 1;
  const goal = seriesMax(data);

  // One quiet "arrival" pulse the first time the count-up completes.
  const [arrived, setArrived] = useState(false);
  const [settled, setSettled] = useState(false);
  const arrive = useCallback(() => {
    setSettled(true);
    setArrived(true);
    window.setTimeout(() => setArrived(false), 1100);
  }, []);

  const { progress, rootRef, scrubTo, revealing } = useGrowthController(arrive);
  const value = useTransform(progress, (p) => interpolateValue(data, p));

  // Below this width the card stacks: readout on top, tape along the bottom.
  const [horizontal, setHorizontal] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHorizontal(entry.contentRect.width < 620));
    ro.observe(el);
    return () => ro.disconnect();
  }, [rootRef]);

  // Live month under the reading head.
  const [idx, setIdx] = useState(() => Math.round(clamp01(progress.get()) * last));
  useMotionValueEvent(progress, "change", (p) => {
    const i = Math.round(clamp01(p) * last);
    setIdx((prev) => (prev === i ? prev : i));
  });

  // Milestones: chips light as the reading passes them; upward crossings burst.
  const initialReached = reachedMilestone(data, interpolateValue(data, progress.get()));
  const prevReached = useRef<number | null>(initialReached);
  const [lit, setLit] = useState(initialReached);
  const [burstKey, setBurstKey] = useState(0);
  useMotionValueEvent(value, "change", (v) => {
    const m = reachedMilestone(data, v);
    if (m === prevReached.current) return;
    if (m !== null && (prevReached.current === null || m > prevReached.current)) {
      setBurstKey((k) => k + 1);
    }
    prevReached.current = m;
    setLit(m);
  });

  const [interacted, setInteracted] = useState(false);
  const onInteract = useCallback(() => setInteracted(true), []);
  const hint = (settled || !!reduce) && !interacted;

  // A faint accent sheen trailing the cursor — desktop pointer only.
  const [hovering, setHovering] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sheenX = useSpring(mx, { stiffness: 140, damping: 22, mass: 0.5 });
  const sheenY = useSpring(my, { stiffness: 140, damping: 22, mass: 0.5 });
  const sheen = useMotionTemplate`radial-gradient(560px circle at ${sheenX}px ${sheenY}px, color-mix(in oklab, var(--gc-accent) 6%, transparent), transparent 60%)`;
  const onSheenMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      const rect = e.currentTarget.getBoundingClientRect();
      mx.set(e.clientX - rect.left);
      my.set(e.clientY - rect.top);
      setHovering(true);
    },
    [mx, my],
  );
  const onSheenLeave = useCallback(() => setHovering(false), []);

  const label = data.points[idx].label;
  const delta = monthDelta(data, idx);

  const readout = (
    <div className="relative flex flex-col items-start gap-5">
      <ProfileCard owner={data.owner} />
      <motion.div
        className="flex flex-col items-start"
        animate={{ scale: arrived && !reduce ? [1, 1.03, 1] : 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <RollingNumber value={value} max={goal} className="text-[clamp(3.25rem,9vw,8.75rem)]" />
        <span className="mt-3 font-display text-lg font-medium tracking-wide text-ink-dim sm:text-xl">
          {data.label}
        </span>
        <span className="panel-label mt-1.5">
          as of {label}
          {idx > 0 && ` · +${formatValue(delta)} this month`}
        </span>
      </motion.div>
      <div className="flex gap-2">
        {data.milestones.map((m) => (
          <MilestoneChip key={m} value={m} lit={lit !== null && m <= lit} />
        ))}
      </div>

      {/* Milestone crossing — a single expanding ring behind the number */}
      <AnimatePresence>
        {burstKey > 0 && !reduce && (
          <motion.span
            key={burstKey}
            className="pointer-events-none absolute left-[34%] top-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: "24vmin",
              height: "24vmin",
              borderColor: "color-mix(in oklab, var(--gc-accent-hot) 55%, transparent)",
            }}
            initial={{ scale: 0.4, opacity: 0.6 }}
            animate={{ scale: 1.7, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onPointerMove={onSheenMove}
      onPointerLeave={onSheenLeave}
      className={`gc-${theme} relative w-full overflow-hidden rounded-[var(--radius)] border border-edge/70 bg-card shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] ${
        horizontal ? "aspect-[4/5] max-w-[560px]" : "aspect-video max-w-[1180px]"
      } ${className}`}
    >
      <Atmosphere progress={progress} variant={theme} />

      {horizontal ? (
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex flex-1 flex-col justify-center px-7 pt-7">{readout}</div>
          <div className="pointer-events-none relative mx-5 h-14 shrink-0">
            <GrowthLine series={data} progress={progress} />
          </div>
          <div className="px-3 pb-4 pt-2">
            <TapeScrubber
              horizontal
              series={data}
              progress={progress}
              onScrub={scrubTo}
              onInteract={onInteract}
              hint={hint}
            />
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex h-full items-stretch">
          <div className="h-full shrink-0 py-4 pl-4 sm:pl-6">
            <TapeScrubber
              series={data}
              progress={progress}
              onScrub={scrubTo}
              onInteract={onInteract}
              hint={hint}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center px-7 lg:px-12">{readout}</div>
        </div>
      )}

      {/* Progressive growth line along the card's floor */}
      {!horizontal && (
        <div className="pointer-events-none absolute inset-x-8 bottom-6 h-[22%]">
          <GrowthLine series={data} progress={progress} />
        </div>
      )}

      {/* Embers lift off the line and feed the number — only during the reveal */}
      <Embers series={data} progress={progress} active={revealing} />

      {/* Cursor sheen */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{ background: sheen }}
        initial={false}
        animate={{ opacity: hovering ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 55% 44%, transparent 55%, rgba(0,0,0,0.5) 100%)" }}
      />
    </motion.div>
  );
}
