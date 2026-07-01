/**
 * The measured series. Generic on purpose: swap `label`, `unit`, and `points`
 * to measure anything over time (followers, MRR, a streak). The instrument
 * reads a single normalized progress value (0..1) across these points.
 */

export type MetricPoint = {
  /** Short month label engraved on the main scale, e.g. "Mar 2024". */
  label: string;
  /** The measured value at this tick. */
  value: number;
};

export type MetricSeries = {
  /** What is being measured, e.g. "Followers". */
  label: string;
  /** Owner of the reading, shown on the readout card. */
  owner: {
    name: string;
    handle: string;
    verified: boolean;
  };
  /** Ordered scale points, low to high. */
  points: MetricPoint[];
  /** Round numbers worth celebrating as the reading crosses them. */
  milestones: number[];
};

export const followers: MetricSeries = {
  label: "Followers",
  owner: { name: "Praha", handle: "@praha", verified: true },
  milestones: [1000, 5000, 10000],
  points: [
    { label: "Mar 2024", value: 461 },
    { label: "Apr 2024", value: 690 },
    { label: "May 2024", value: 1020 },
    { label: "Jun 2024", value: 1480 },
    { label: "Jul 2024", value: 2100 },
    { label: "Aug 2024", value: 2760 },
    { label: "Sep 2024", value: 3540 },
    { label: "Oct 2024", value: 4460 },
    { label: "Nov 2024", value: 5500 },
    { label: "Dec 2024", value: 6640 },
    { label: "Jan 2025", value: 7800 },
    { label: "Feb 2025", value: 8760 },
    { label: "Mar 2025", value: 9460 },
    { label: "Apr 2025", value: 9820 },
    { label: "May 2025", value: 9970 },
    { label: "Jun 2025", value: 10000 },
  ],
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export type Sample = {
  /** Interpolated, rounded reading. */
  value: number;
  /** Fractional index into the points array. */
  position: number;
  /** Nearest lower point index. */
  index: number;
  /** Label at the nearest lower point. */
  label: string;
};

/** Sample the series at a normalized progress value (0..1). */
export function sampleSeries(series: MetricSeries, progress: number): Sample {
  const pts = series.points;
  const last = pts.length - 1;
  const position = clamp01(progress) * last;
  const index = Math.min(last - 1, Math.floor(position));
  const frac = position - index;
  const value = Math.round(pts[index].value + (pts[index + 1].value - pts[index].value) * frac);
  return { value, position, index, label: pts[Math.round(position)].label };
}

/** Highest milestone the reading has reached at this value. */
export function reachedMilestone(series: MetricSeries, value: number): number | null {
  let reached: number | null = null;
  for (const m of series.milestones) if (value >= m) reached = m;
  return reached;
}

const grouper = new Intl.NumberFormat("en-US");
export const formatValue = (n: number) => grouper.format(n);
