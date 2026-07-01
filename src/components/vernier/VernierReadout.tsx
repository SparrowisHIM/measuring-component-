"use client";

import { useTransform, type MotionValue } from "motion/react";
import {
  formatValue,
  interpolateValue,
  seriesMax,
  type MetricSeries,
} from "@/lib/metric";
import { useSample } from "./useSample";
import { Odometer } from "./Odometer";

export function VernierReadout({
  series,
  progress,
}: {
  series: MetricSeries;
  progress: MotionValue<number>;
}) {
  const value = useTransform(progress, (p) => interpolateValue(series, p));
  const sample = useSample(series, progress);
  const initial = series.owner.name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      {/* Owner */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-semibold text-void"
          style={{
            background: "linear-gradient(140deg, var(--brass-hot), var(--brass))",
            boxShadow: "0 0 0 1px color-mix(in oklab, var(--brass) 40%, transparent)",
          }}
          aria-hidden
        >
          {initial}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-display text-base font-semibold text-bone">
            {series.owner.name}
          </span>
          {series.owner.verified && (
            <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Verified">
              <path
                d="M12 2l2.3 1.7 2.8-.3 1 2.6 2.4 1.5-.7 2.8.7 2.8-2.4 1.5-1 2.6-2.8-.3L12 22l-2.3-1.7-2.8.3-1-2.6L3.5 16l.7-2.8-.7-2.8 2.4-1.5 1-2.6 2.8.3z"
                fill="var(--brass)"
              />
              <path
                d="M8.5 12l2.3 2.3 4.7-4.7"
                fill="none"
                stroke="var(--void)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>

      {/* Reading */}
      <div className="flex flex-col gap-2">
        <Odometer
          value={value}
          max={seriesMax(series)}
          formatted={formatValue(sample.value)}
          label={series.label}
        />
        <div className="flex items-baseline gap-2">
          <span className="panel-label">{series.label}</span>
          <span className="font-mono text-xs text-bone-dim">· as of {sample.label}</span>
        </div>
      </div>
    </div>
  );
}
