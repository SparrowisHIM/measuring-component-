"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { followers, stars } from "@/lib/metric";
import { GrowthCard } from "./GrowthCard";

const VOICES = [
  { id: "lime", name: "Signal", accent: "#a3e635", data: followers },
  { id: "brass", name: "Vernier", accent: "#d9a441", data: stars },
] as const;

// The wash grows from just above the card's top edge — where the switch sits.
const WASH_CLOSED = "circle(0% at 50% -8%)";
const WASH_OPEN = "circle(155% at 50% -8%)";

/**
 * Demo chrome: one card, one switch. Swapping the voice washes the new theme
 * over the old card in an expanding circle from the switch — the new card
 * counts up inside the wash while the old reality dims and recedes under it.
 * Same component both times; that's the point.
 */
export function GrowthShowcase() {
  const reduce = useReducedMotion();
  const [voice, setVoice] = useState<(typeof VOICES)[number]>(VOICES[0]);

  return (
    <div className="relative flex w-full flex-col items-center gap-10">
      <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
        {VOICES.map((v) => {
          const on = v.id === voice.id;
          return (
            <motion.button
              key={v.id}
              type="button"
              aria-pressed={on}
              onClick={() => setVoice(v)}
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

      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={voice.id}
          className="flex w-full justify-center"
          style={{ zIndex: 1 }}
          initial={reduce ? false : { clipPath: WASH_CLOSED }}
          animate={{ clipPath: WASH_OPEN }}
          // The old card holds beneath the wash, dimming and receding until
          // the circle has fully covered it.
          exit={{
            zIndex: 0,
            scale: 0.98,
            filter: "brightness(0.6)",
            transition: { duration: reduce ? 0 : 0.8, ease: "easeOut" },
          }}
          transition={{ duration: reduce ? 0 : 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <GrowthCard data={voice.data} theme={voice.id} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
