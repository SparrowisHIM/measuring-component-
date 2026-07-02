"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

/*
 * The card's ambience, keyed to the theme's voice and warming with the
 * reading. Lime ("signal"): bokeh blobs bleeding in from the right edge with
 * a halftone dot matrix inside the glow. Brass ("vernier"): an engraved
 * drafting grid under film grain with a warm ember glow behind the readout.
 */
export function Atmosphere({
  progress,
  variant,
}: {
  progress: MotionValue<number>;
  variant: "lime" | "brass";
}) {
  const glowOpacity = useTransform(progress, [0, 1], [0.3, 0.95]);
  const glowScale = useTransform(progress, [0, 1], [0.88, 1.08]);
  const coreOpacity = useTransform(progress, (p) => Math.max(0, (p - 0.6) / 0.4) * 0.65);

  if (variant === "brass") {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="engraved-grid absolute inset-0 opacity-70" />
        <div className="film-grain absolute inset-0" />
        <motion.div
          className="absolute left-[60%] top-[46%] h-[85%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{
            opacity: glowOpacity,
            scale: glowScale,
            background: "radial-gradient(circle, color-mix(in oklab, var(--gc-flare) 30%, transparent), transparent 66%)",
          }}
        />
        <motion.div
          className="absolute left-[60%] top-[44%] h-[46%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
          style={{
            opacity: coreOpacity,
            background: "radial-gradient(circle, color-mix(in oklab, var(--gc-peak) 50%, transparent), transparent 62%)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* Bokeh bleeding in from the right edge */}
      <motion.div
        className="absolute -right-[14%] top-[8%] h-[110%] w-[42%] rounded-full blur-[110px]"
        style={{
          opacity: glowOpacity,
          scale: glowScale,
          background:
            "radial-gradient(circle at 70% 40%, color-mix(in oklab, var(--gc-accent) 42%, transparent), transparent 68%)",
        }}
      />
      <motion.div
        className="absolute -right-[8%] top-[45%] h-[70%] w-[30%] rounded-full blur-[90px]"
        style={{
          opacity: glowOpacity,
          background:
            "radial-gradient(circle at 75% 50%, color-mix(in oklab, var(--gc-flare) 46%, transparent), transparent 66%)",
        }}
      />
      <motion.div
        className="absolute -right-[6%] -top-[15%] h-[55%] w-[24%] rounded-full blur-[80px]"
        style={{
          opacity: coreOpacity,
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--gc-peak) 45%, transparent), transparent 60%)",
        }}
      />
      {/* Halftone matrix living inside the glow */}
      <motion.div className="halftone absolute inset-0" style={{ opacity: glowOpacity }} />
    </div>
  );
}
