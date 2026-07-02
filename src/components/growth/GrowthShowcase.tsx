"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { followers, stars } from "@/lib/metric";
import { GrowthCard } from "./GrowthCard";

const VOICES = [
  { id: "lime", name: "Signal", accent: "#a3e635", data: followers },
  { id: "brass", name: "Vernier", accent: "#d9a441", data: stars },
] as const;

/**
 * Demo chrome: one card, one switch. Swapping the voice remounts the card
 * with a different theme and dataset, replaying the count-up reveal — the
 * point being that it's the same component both times.
 */
export function GrowthShowcase() {
  const [voice, setVoice] = useState<(typeof VOICES)[number]>(VOICES[0]);

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
        {VOICES.map((v) => {
          const on = v.id === voice.id;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={on}
              onClick={() => setVoice(v)}
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
            </button>
          );
        })}
      </div>

      <GrowthCard key={voice.id} data={voice.data} theme={voice.id} />
    </div>
  );
}
