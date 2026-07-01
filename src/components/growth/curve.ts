import type { MetricSeries } from "@/lib/metric";

export type Pt = { x: number; y: number };

/** Curve points in a 0..W by 0..100 space (y inverted so growth rises). */
export function curvePoints(series: MetricSeries, w = 1000, top = 12, bottom = 88): Pt[] {
  const vals = series.points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const n = vals.length;
  const span = max - min || 1;
  return vals.map((v, i) => ({
    x: (i / (n - 1)) * w,
    y: bottom - ((v - min) / span) * (bottom - top),
  }));
}

/** Smooth Catmull-Rom path through the points. */
export function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}
