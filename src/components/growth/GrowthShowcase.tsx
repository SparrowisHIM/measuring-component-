"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { followers, stars } from "@/lib/metric";
import { GrowthCard } from "./GrowthCard";

const VOICES = [
  { id: "lime", name: "Signal", accent: "#a3e635", data: followers },
  { id: "brass", name: "Vernier", accent: "#d9a441", data: stars },
] as const;

type Voice = (typeof VOICES)[number];

/** Where the wash starts (the clicked switch, relative to the card area) and
 *  how far it must reach to swallow the whole card. All in px. */
type WashOrigin = { x: number; y: number; r: number };

const WASH_S = 0.85;
const WASH_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

/**
 * Clips the incoming card to a circle growing from the clicked switch, with
 * a burning rim of the new accent riding the wavefront. The card arrives
 * overdriven — bright and oversaturated — and cools as the wash completes.
 * With no origin (first mount) or reduced motion it renders plainly.
 */
function VoiceWash({
  origin,
  accent,
  children,
}: {
  origin: WashOrigin | null;
  accent: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const live = !!origin && !reduce;
  const t = useMotionValue(live ? 0 : 1);
  const [washing, setWashing] = useState(live);

  useEffect(() => {
    if (!live) return;
    const ctrl = animate(t, 1, {
      duration: WASH_S,
      ease: WASH_EASE,
      onComplete: () => setWashing(false),
    });
    return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radius = useTransform(t, (v) => (origin ? v * origin.r : 0));
  const clip = useMotionTemplate`circle(${radius}px at ${origin?.x ?? 0}px ${origin?.y ?? 0}px)`;
  const diameter = useTransform(radius, (r) => r * 2);
  const rimOpacity = useTransform(t, [0, 0.1, 0.8, 1], [0, 0.9, 0.5, 0]);
  const brightness = useTransform(t, [0, 0.7, 1], [1.3, 1.16, 1]);
  const saturation = useTransform(t, [0, 1], [1.25, 1]);
  const hot = useMotionTemplate`brightness(${brightness}) saturate(${saturation})`;

  return (
    <motion.div
      className="relative flex w-full min-w-0 justify-center"
      style={washing ? { clipPath: clip } : undefined}
    >
      <motion.div
        className="flex w-full min-w-0 justify-center"
        style={washing ? { filter: hot } : undefined}
      >
        {children}
      </motion.div>

      {/* The wavefront: a rim of the incoming accent hugging the clip edge.
          The clip itself cuts it in half, leaving a glowing inner edge. */}
      {washing && (
        <motion.span
          className="pointer-events-none absolute rounded-full"
          style={{
            left: origin!.x,
            top: origin!.y,
            x: "-50%",
            y: "-50%",
            width: diameter,
            height: diameter,
            opacity: rimOpacity,
            border: `2.5px solid ${accent}`,
            boxShadow: `0 0 42px 12px ${accent}59, inset 0 0 36px 8px ${accent}40`,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * Demo chrome: one card, one switch. Swapping the voice sends a wash from
 * the clicked button over the old card — a glowing wavefront in the new
 * accent, the new card counting up hot inside it while the old voice drains
 * to grayscale beneath. Same component both times; that's the point.
 */
export function GrowthShowcase() {
  const reduce = useReducedMotion();
  const areaRef = useRef<HTMLDivElement>(null);
  const [voice, setVoice] = useState<Voice>(VOICES[0]);
  const [origin, setOrigin] = useState<WashOrigin | null>(null);

  const switchVoice = (v: Voice, e: React.MouseEvent<HTMLButtonElement>) => {
    if (v.id === voice.id) return;
    const area = areaRef.current?.getBoundingClientRect();
    if (area) {
      const btn = e.currentTarget.getBoundingClientRect();
      const x = btn.x + btn.width / 2 - area.x;
      const y = btn.y + btn.height / 2 - area.y;
      // Reach the farthest corner of the card area, with a little spare.
      const r =
        1.04 *
        Math.max(
          Math.hypot(x, y),
          Math.hypot(area.width - x, y),
          Math.hypot(x, area.height - y),
          Math.hypot(area.width - x, area.height - y),
        );
      setOrigin({ x, y, r });
    }
    setVoice(v);
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-10">
      <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
        {VOICES.map((v) => {
          const on = v.id === voice.id;
          return (
            <motion.button
              key={v.id}
              type="button"
              aria-pressed={on}
              onClick={(e) => switchVoice(v, e)}
              whileTap={{ scale: 0.94 }}
              className={`relative rounded-full px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 ${
                on ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {on && (
                <motion.span
                  layoutId="voice-pill"
                  className="absolute inset-0 rounded-full bg-white/10"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {/* Trigger ping: the switch visibly fires the wash */}
              {on && !reduce && (
                <motion.span
                  key={`ping-${voice.id}`}
                  className="pointer-events-none absolute inset-0 rounded-full border"
                  style={{ borderColor: v.accent }}
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: v.accent, boxShadow: `0 0 6px ${v.accent}` }}
                />
                {v.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div ref={areaRef} className="relative flex w-full min-w-0 justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={voice.id}
            className="flex w-full min-w-0 justify-center"
            initial={false}
            animate={{ zIndex: 1, scale: 1, filter: "grayscale(0) brightness(1)" }}
            // The old voice drains beneath the wash: color pulled out,
            // dimming and receding until the circle has swallowed it.
            exit={{
              zIndex: 0,
              scale: 0.98,
              filter: "grayscale(1) brightness(0.55)",
              transition: { duration: reduce ? 0 : WASH_S, ease: "easeOut" },
            }}
          >
            <VoiceWash origin={origin} accent={voice.accent}>
              <GrowthCard data={voice.data} theme={voice.id} />
            </VoiceWash>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
