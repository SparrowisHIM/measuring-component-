"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { formatValue, seriesMax, type MetricSeries } from "@/lib/metric";

/*
 * The instrument's signature: the reading head never moves — the timeline is
 * a ruler tape that scrolls past it. The wire is a taut string and the knob a
 * puck pressing through it, so the wire deforms around the knob's silhouette.
 */

const MINOR = 4; // minor tick subdivisions per month

type Geo = {
  step: number; // px of tape per month
  railCross: number; // rail size across the tape axis
  wire: number; // resting wire position (cross axis)
  knobOffset: number; // knob centre, past the wire (cross axis)
  knobR: number;
  labelEnd: number; // labels sit before this cross-axis line
  tickFrom: number;
  tickMinor: number; // minor tick length
  tickMajor: number;
};

const VERTICAL: Geo = {
  step: 64,
  railCross: 204,
  wire: 148,
  knobOffset: 16,
  knobR: 30,
  labelEnd: 92,
  tickFrom: 100,
  tickMinor: 12,
  tickMajor: 24,
};

const HORIZONTAL: Geo = {
  step: 88,
  railCross: 118,
  wire: 34,
  knobOffset: 15,
  knobR: 24,
  labelEnd: 118, // labels hang below the ticks
  tickFrom: 68,
  tickMinor: 8,
  tickMajor: 16,
};

const GAP = 6; // breathing room between wire and knob edge

// The tape travels faster than the finger, so a light pull covers months
// without hauling the pointer the tape's full physical length.
const DRAG_GAIN = 1.6;

/** "Mar 2024" -> "Mar '24". */
const shortLabel = (label: string) => {
  const [m, y] = label.split(" ");
  return `${m} '${y.slice(2)}`;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Wire deflection at distance d from the head — a flat-bottomed pocket that
 *  hugs the knob's circular silhouette, easing smoothly back to straight. */
function pocket(d: number, depth: number, r: number): number {
  const s = r * 0.85;
  return depth * Math.exp(-(((d * d) / (2 * s * s)) ** 1.35));
}

/** Milestone shockwave: a wavefront that rolls from the head toward both
 *  ends of the wire, fading as it travels. `t` runs 0 -> 1; 1 is at rest. */
function shockwave(d: number, len: number, head: number, t: number): number {
  if (t >= 1) return 0;
  const span = Math.max(head, len - head);
  const front = t * span;
  const amp = 9 * (1 - t);
  const w = 26;
  return amp * Math.exp(-((Math.abs(d) - front) ** 2) / (2 * w * w));
}

function buildWirePath(
  geo: Geo,
  len: number,
  head: number,
  depth: number,
  horizontal: boolean,
  pulse = 1,
): string {
  const pts: Array<[number, number]> = [];
  const push = (main: number, cross: number) =>
    pts.push(horizontal ? [main, cross] : [cross, main]);

  // Sample the full wire — dense enough for the pocket, cheap enough to
  // rebuild every frame — so the shockwave can travel its whole length.
  const steps = Math.max(56, Math.round(len / 9));
  for (let i = 0; i <= steps; i++) {
    const main = (len * i) / steps;
    const d = main - head;
    push(main, geo.wire - pocket(d, depth, geo.knobR) - shockwave(d, len, head, pulse));
  }

  return pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

export function TapeScrubber({
  series,
  progress,
  onScrub,
  onRelease,
  onInteract,
  pulseKey = 0,
  horizontal = false,
  hint = false,
}: {
  series: MetricSeries;
  progress: MotionValue<number>;
  /** Continuous while dragging; snapped to a month on taps/keys. */
  onScrub: (fraction: number) => void;
  /** Letting go of a drag — the controller carries the momentum from here.
   *  `velocity` is in progress-fractions per second. */
  onRelease: (fraction: number, velocity: number) => void;
  /** First pointer/key interaction — used to retire the drag hint. */
  onInteract?: () => void;
  /** Bump to fire a shockwave down the wire (milestone crossings). */
  pulseKey?: number;
  horizontal?: boolean;
  hint?: boolean;
}) {
  const reduce = useReducedMotion();
  const uid = useId();
  const geo = horizontal ? HORIZONTAL : VERTICAL;
  const last = series.points.length - 1;

  // Measured main-axis length; the head sits at a fixed anchor within it.
  const railRef = useRef<HTMLDivElement>(null);
  const [len, setLen] = useState(480);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setLen(Math.round(horizontal ? box.width : box.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [horizontal]);
  const head = len * (horizontal ? 0.5 : 0.46);

  // Tape layout: horizontally time runs left -> right; vertically the scale
  // climbs — later months (higher values) sit toward the top, like a fader.
  const tapePos = useCallback(
    (months: number) => (horizontal ? months : last - months) * geo.step,
    [horizontal, last, geo.step],
  );

  // Past either end the tape doesn't stop dead — it stretches against a
  // rubber limit (saturating at just over a month) and snaps back with a
  // wobble on release. The reading itself stays clamped to real months.
  const overF = useMotionValue(0);
  const rubber = useCallback(
    (x: number) => {
      const limit = 1.25 / last;
      return limit * Math.tanh(x / limit);
    },
    [last],
  );

  // The active month is pinned under the head. Progress is deliberately not
  // clamped here: the fling's end-of-tape bounce lives just outside 0..1.
  const tapeOffset = useTransform(() => head - tapePos((progress.get() + overF.get()) * last));

  // Pocket depth = base hug + a squeeze that grows with scrub velocity + a
  // click as each detent passes at speed + a slow idle breath while the hint
  // is up. Spring-smoothed.
  const baseDepth = geo.knobR + GAP - geo.knobOffset;
  const velocity = useVelocity(progress);
  const idle = useMotionValue(0);
  const click = useMotionValue(0);
  const depthTarget = useTransform(
    () => baseDepth + Math.min(Math.abs(velocity.get()) * 26, 14) + idle.get() + click.get() * 7,
  );
  const depth = useSpring(depthTarget, { stiffness: 260, damping: 22, mass: 0.6 });

  // Elastic give: the knob leans into the drag direction and springs back,
  // so it answers your finger while the tape does the actual travel. At the
  // ends it strains against the overstretch instead.
  const nudgeTarget = useTransform(() => {
    const lean = -velocity.get() * 60;
    const strain = -overF.get() * geo.step * last;
    return Math.max(-30, Math.min(30, lean + strain));
  });
  const nudge = useSpring(nudgeTarget, { stiffness: 280, damping: 22, mass: 0.55 });

  // Cartoon lean: at speed the tape shears slightly into its direction of
  // travel — like print on rubber — and relaxes upright as it settles.
  const shearTarget = useTransform(() => Math.max(-3.5, Math.min(3.5, velocity.get() * 9)));
  const shear = useSpring(shearTarget, { stiffness: 320, damping: 30 });

  useEffect(() => {
    if (!hint || reduce) return;
    const breath = animate(idle, [0, 5, 0], {
      duration: 2.2,
      repeat: Infinity,
      repeatDelay: 1.1,
      ease: "easeInOut",
    });
    return () => {
      breath.stop();
      idle.set(0);
    };
  }, [hint, reduce, idle]);

  // The wire path is written imperatively — no React render per frame. The
  // pocket follows the nudged knob so the wire stays wrapped around it.
  const pulse = useMotionValue(1);
  const wireRef = useRef<SVGPathElement>(null);
  const initialPath = useMemo(
    () => buildWirePath(geo, len, head, baseDepth, horizontal),
    [geo, len, head, baseDepth, horizontal],
  );
  const rebuildWire = useCallback(() => {
    wireRef.current?.setAttribute(
      "d",
      buildWirePath(geo, len, head + nudge.get(), depth.get(), horizontal, pulse.get()),
    );
  }, [geo, len, head, nudge, depth, pulse, horizontal]);
  useMotionValueEvent(depth, "change", rebuildWire);
  useMotionValueEvent(nudge, "change", rebuildWire);
  useMotionValueEvent(pulse, "change", rebuildWire);

  // Each milestone crossing rings the wire once.
  useEffect(() => {
    if (!pulseKey || reduce) return;
    pulse.jump(0);
    const wave = animate(pulse, 1, { duration: 0.8, ease: "easeOut" });
    return () => wave.stop();
  }, [pulseKey, reduce, pulse]);

  // Active month index — drives label emphasis and the slider semantics.
  // Crossing a month at speed clicks: a quick extra squeeze of the pocket
  // and a pop of the knob, like the tape ticking through a detent.
  const [active, setActive] = useState(() => Math.round(clamp01(progress.get()) * last));
  const prevActive = useRef(active);
  useMotionValueEvent(progress, "change", (p) => {
    const idx = Math.round(clamp01(p) * last);
    if (idx === prevActive.current) return;
    prevActive.current = idx;
    if (Math.abs(velocity.get()) > 0.45 && !reduce) {
      click.jump(1);
      animate(click, 0, { duration: 0.18, ease: "easeOut" });
    }
    setActive(idx);
  });
  const knobScale = useTransform(click, (c) => 1 + c * 0.05);

  /* ------------------------------ dragging ------------------------------ */

  // `trail` keeps ~100ms of recent positions so release velocity comes from
  // the finger's actual final motion, not a single frame delta.
  const drag = useRef<{
    startPos: number;
    startP: number;
    moved: number;
    trail: Array<{ p: number; t: number }>;
  } | null>(null);

  const mainPos = (e: React.PointerEvent) => {
    const rect = railRef.current!.getBoundingClientRect();
    return horizontal ? e.clientX - rect.left : e.clientY - rect.top;
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!railRef.current) return;
      onInteract?.();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const startP = clamp01(progress.get());
      drag.current = {
        startPos: mainPos(e),
        startP,
        moved: 0,
        trail: [{ p: startP, t: e.timeStamp }],
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onInteract, progress, horizontal],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const pos = mainPos(e);
      d.moved = Math.max(d.moved, Math.abs(pos - d.startPos));
      // Pulling the tape toward the past drags the reading back in time;
      // anything past the ends becomes rubbery overstretch.
      const raw = d.startP + (DRAG_GAIN * (d.startPos - pos)) / (geo.step * last);
      d.trail.push({ p: raw, t: e.timeStamp });
      while (d.trail.length > 2 && e.timeStamp - d.trail[0].t > 100) d.trail.shift();
      onScrub(clamp01(raw));
      overF.set(rubber(raw - clamp01(raw)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScrub, rubber, overF, geo.step, last, horizontal],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (!d) return;
      // Let any overstretch snap back — springy enough to wobble like rubber.
      if (overF.get() !== 0) {
        animate(overF, 0, { type: "spring", stiffness: 360, damping: 16 });
      }
      if (d.moved < 5) {
        // A tap reads the tape where it was touched: jump to that month.
        const off = (mainPos(e) - head) / geo.step;
        const idx = Math.round(d.startP * last + (horizontal ? off : -off));
        onScrub(Math.min(last, Math.max(0, idx)) / last);
      } else {
        // Hand the drag off with its momentum — a flick keeps spooling.
        // Velocity comes from the trail's window; a stale trail (finger
        // paused before lifting) reads as zero and simply settles in place.
        const raw = d.startP + (DRAG_GAIN * (d.startPos - mainPos(e))) / (geo.step * last);
        let velocity = 0;
        const fresh = d.trail.filter((s) => e.timeStamp - s.t <= 120);
        if (fresh.length > 0) {
          const dt = (e.timeStamp - fresh[0].t) / 1000;
          if (dt > 0.008) velocity = (raw - fresh[0].p) / dt;
        }
        onRelease(raw, velocity);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScrub, onRelease, overF, geo.step, last, head, horizontal],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = Math.round(clamp01(progress.get()) * last);
      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          onScrub(Math.min(last, idx + 1) / last);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          onScrub(Math.max(0, idx - 1) / last);
          break;
        case "Home":
          onScrub(0);
          break;
        case "End":
          onScrub(1);
          break;
        default:
          return;
      }
      onInteract?.();
      e.preventDefault();
    },
    [last, progress, onScrub, onInteract],
  );

  /* ------------------------------ rendering ----------------------------- */

  const activePoint = series.points[active];
  const gradientId = `${uid}-wire`;

  // Knob rests where the pocket floor is — pressed into the wire — and
  // rides its elastic nudge along the tape axis.
  const knobMain = useTransform(() => head + nudge.get() - geo.knobR);
  const haloMain = useTransform(() => head + nudge.get() - geo.knobR * 1.8);
  const knobCross = geo.wire + geo.knobOffset - geo.knobR;

  const fadeMask = horizontal
    ? "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)"
    : "linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)";

  return (
    <div
      ref={railRef}
      role="slider"
      tabIndex={0}
      aria-label={`Scrub through ${series.owner.name}'s ${series.label.toLowerCase()} timeline`}
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      aria-valuemin={series.points[0].value}
      aria-valuemax={seriesMax(series)}
      aria-valuenow={activePoint.value}
      aria-valuetext={`${formatValue(activePoint.value)} ${series.label} in ${activePoint.label}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="relative shrink-0 cursor-grab touch-none outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-accent/60"
      style={
        horizontal
          ? { height: geo.railCross, width: "100%" }
          : { width: geo.railCross, height: "100%" }
      }
    >
      {/* The tape: month chips + ruler ticks, scrolling past the head */}
      <div className="absolute inset-0 overflow-hidden" style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}>
        <motion.div
          className="absolute inset-0"
          style={horizontal ? { x: tapeOffset, skewX: shear } : { y: tapeOffset, skewY: shear }}
        >
          {series.points.map((pt, i) => {
            const on = i === active;
            return (
              <div
                key={pt.label}
                className={
                  horizontal
                    ? "absolute flex -translate-x-1/2 flex-col items-center gap-1.5"
                    : "absolute flex -translate-y-1/2 items-center justify-end gap-2"
                }
                style={
                  horizontal
                    ? { left: tapePos(i), top: geo.tickFrom }
                    : { top: tapePos(i), right: geo.railCross - geo.labelEnd - geo.tickMajor - 8 }
                }
              >
                {!horizontal && (
                  <span
                    className={`whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px] tracking-tight transition-colors duration-200 ${
                      on ? "border-edge bg-surface/80 text-ink" : "border-transparent text-ink-dim/70"
                    }`}
                  >
                    {shortLabel(pt.label)}
                  </span>
                )}
                <span
                  className="transition-all duration-200"
                  style={{
                    background: on ? "var(--gc-accent)" : "var(--gc-ink-faint)",
                    ...(horizontal
                      ? { width: 1.5, height: on ? geo.tickMajor + 4 : geo.tickMajor }
                      : { height: 1.5, width: on ? geo.tickMajor + 4 : geo.tickMajor }),
                  }}
                />
                {horizontal && (
                  <span
                    className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-tight transition-colors duration-200 ${
                      on ? "border-edge bg-surface/80 text-ink" : "border-transparent text-ink-dim/70"
                    }`}
                  >
                    {shortLabel(pt.label)}
                  </span>
                )}
              </div>
            );
          })}

          {/* Minor ticks — the ruler's fine graduation */}
          {series.points.slice(0, -1).map((pt, i) =>
            Array.from({ length: MINOR - 1 }, (_, k) => {
              const at = tapePos(i + (k + 1) / MINOR);
              return (
                <span
                  key={`${pt.label}-${k}`}
                  className="absolute bg-ink-faint/50"
                  style={
                    horizontal
                      ? { left: at, top: geo.tickFrom + 2, width: 1, height: geo.tickMinor }
                      : { top: at, right: geo.railCross - geo.labelEnd - geo.tickMajor - 8, height: 1, width: geo.tickMinor }
                  }
                />
              );
            }),
          )}
        </motion.div>
      </div>

      {/* Dark halo grounding the knob against the tape */}
      <motion.span
        className="pointer-events-none absolute rounded-full"
        style={{
          width: geo.knobR * 3.6,
          height: geo.knobR * 3.6,
          ...(horizontal
            ? { left: 0, top: geo.wire + geo.knobOffset - geo.knobR * 1.8, x: haloMain }
            : { top: 0, left: geo.wire + geo.knobOffset - geo.knobR * 1.8, y: haloMain }),
          background: "radial-gradient(circle, rgba(0,0,0,0.75) 30%, transparent 70%)",
        }}
      />

      {/* The wire */}
      <svg
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={horizontal ? len : geo.railCross}
        height={horizontal ? geo.railCross : len}
        viewBox={`0 0 ${horizontal ? len : geo.railCross} ${horizontal ? geo.railCross : len}`}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={horizontal ? 0 : geo.wire}
            y1={horizontal ? geo.wire : 0}
            x2={horizontal ? len : geo.wire}
            y2={horizontal ? geo.wire : len}
          >
            <stop offset="0" stopColor="var(--gc-edge)" />
            <stop offset={Math.max(0, head / len - 0.16)} stopColor="color-mix(in oklab, var(--gc-accent) 45%, var(--gc-edge))" />
            <stop offset={head / len} stopColor="var(--gc-accent-hot)" />
            <stop offset={Math.min(1, head / len + 0.22)} stopColor="var(--gc-accent)" />
            <stop offset="1" stopColor="color-mix(in oklab, var(--gc-accent) 25%, var(--gc-edge))" />
          </linearGradient>
        </defs>
        <path
          ref={wireRef}
          d={initialPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 7px color-mix(in oklab, var(--gc-accent) 55%, transparent))" }}
        />
      </svg>

      {/* The knob — a puck pressed through the string */}
      <motion.div
        className="pointer-events-none absolute flex items-center justify-center rounded-full border border-edge"
        style={{
          width: geo.knobR * 2,
          height: geo.knobR * 2,
          scale: knobScale,
          ...(horizontal ? { left: 0, top: knobCross, x: knobMain } : { top: 0, left: knobCross, y: knobMain }),
          background: "radial-gradient(circle at 38% 30%, var(--gc-surface), var(--gc-bg) 78%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 30px rgba(0,0,0,0.65), 0 0 0 1px color-mix(in oklab, var(--gc-accent) 18%, transparent)",
        }}
      >
        <svg width={geo.knobR * 0.9} height={geo.knobR * 0.9} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 13l6-5 6 5" stroke="var(--gc-accent-hot)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 18.5l6-5 6 5" stroke="var(--gc-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      {/* Drag affordance — retired on first touch */}
      <AnimatePresence>
        {hint && (
          <motion.span
            key="hint"
            className="panel-label pointer-events-none absolute text-[10px]"
            style={
              horizontal
                ? { left: head + geo.knobR + 14, top: geo.wire + geo.knobOffset - 7 }
                : { top: head + geo.knobR + 14, left: geo.wire + geo.knobOffset - 16 }
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            drag
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
