"use client";

import { motion, useMotionTemplate, useTransform, type MotionValue } from "motion/react";
import type { MetricSeries } from "@/lib/metric";
import { curvePoints, smoothPath, type Pt } from "./curve";

const W = 1000;
const H = 100;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Curve Y at a fractional position along the timeline (0..1). */
function yAt(pts: Pt[], t: number): number {
  const pos = clamp01(t) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(pos));
  const f = pos - i;
  return pts[i].y + (pts[i + 1].y - pts[i].y) * f;
}

export function GrowthLine({
  series,
  progress,
}: {
  series: MetricSeries;
  progress: MotionValue<number>;
}) {
  const pts = curvePoints(series, W);
  const line = smoothPath(pts);
  const area = `${line} L ${W},${H} L 0,${H} Z`;

  const revealW = useTransform(progress, (p) => clamp01(p) * W);
  const tipPct = useTransform(progress, (p) => clamp01(p) * 100);
  const tipYPct = useTransform(progress, (p) => yAt(pts, p));
  const tipLeft = useMotionTemplate`${tipPct}%`;
  const tipTop = useMotionTemplate`${tipYPct}%`;

  return (
    <div className="absolute inset-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="line-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--brass) 60%, transparent)" />
            <stop offset="60%" stopColor="var(--brass-hot)" />
            <stop offset="100%" stopColor="var(--ember)" />
          </linearGradient>
          <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--ember) 22%, transparent)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <clipPath id="reveal">
            <motion.rect x={0} y={-20} height={H + 40} style={{ width: revealW }} />
          </clipPath>
        </defs>

        <g clipPath="url(#reveal)">
          <path d={area} fill="url(#line-fill)" />
          <path
            d={line}
            fill="none"
            stroke="url(#line-stroke)"
            strokeWidth={2.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--ember) 55%, transparent))" }}
          />
        </g>
      </svg>

      {/* Playhead — the bright tip riding the drawn line */}
      <motion.span
        className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: tipLeft,
          top: tipTop,
          background: "var(--incandescent)",
          boxShadow: "0 0 10px 2px var(--ember)",
        }}
      />
    </div>
  );
}
