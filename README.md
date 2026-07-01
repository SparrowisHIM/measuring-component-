# Vernier — a measuring instrument

An interactive component that measures a metric over time and lets you **scrub
through it like a precision instrument**. Grab the knob and drag, scroll, or
arrow‑key your way along the timeline: an engraved brass wire rubber‑bands
around the handle, a mechanical odometer rolls the reading, and the whole
instrument runs hotter as the value climbs toward its milestone.

Reworked from a reference concept into a metrology aesthetic — brass engraving
on warm slate that heats toward incandescent, rather than the usual neon‑on‑black.

## Highlights

- **One synchronized system.** A single spring‑driven `progress` value (0–1)
  feeds the ruler, the elastic track, the odometer, and the ambient heat, so
  everything moves as one.
- **Elastic vernier track.** The wire deforms into a gaussian notch around the
  knob; the notch overshoots with scrub velocity and springs back to rest.
- **Continuous odometer.** Each digit wheel rotates proportional to how often
  the wheel below it wraps, driven by the unrounded reading for a smooth roll.
- **Reactive atmosphere.** A `--heat` CSS channel blooms a brass halo and
  ignites an incandescent crown on the final approach; milestone crossings fire
  a ring pulse and a light haptic tap.
- **Fully interactive** via drag, wheel, and keyboard, with an auto‑play intro.
- **Accessible.** Exposes a `slider` role with live `aria-valuetext`, full
  keyboard control, visible focus, and `prefers-reduced-motion` support.

## Controls

| Input | Action |
| --- | --- |
| Drag / scroll | Scrub the timeline |
| `↑` `→` / `↓` `←` | Step the reading up / down |
| `Page Up` / `Page Down` | Larger step |
| `Home` / `End` | Jump to the start / the goal |

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run lint     # eslint
```

## Customizing the measurement

The component is generic — swap the series to measure anything over time. Edit
[`src/lib/metric.ts`](src/lib/metric.ts) or pass your own `series` to
`<VernierInstrument />`:

```ts
const revenue: MetricSeries = {
  label: "MRR",
  owner: { name: "Atlas", handle: "@atlas", verified: true },
  milestones: [10_000, 50_000, 100_000],
  points: [
    { label: "Jan 2025", value: 4_200 },
    // …low to high…
    { label: "Dec 2025", value: 100_000 },
  ],
};
```

The odometer, ruler, milestones, and heat channel all derive from the series
automatically.

## Architecture

| File | Role |
| --- | --- |
| `lib/metric.ts` | Generic time‑series model, sampling, and milestones |
| `vernier/useScrub.ts` | Spring‑backed progress engine (the source of truth) |
| `vernier/VernierInstrument.tsx` | Owns progress; unifies drag / wheel / keyboard input |
| `vernier/VernierTrack.tsx` | Elastic brass wire + draggable knob |
| `vernier/VernierRuler.tsx` | Engraved, scrolling timeline scale |
| `vernier/Odometer.tsx` + `VernierReadout.tsx` | Rolling readout and owner card |
| `vernier/useMilestones.ts` | Heat channel + milestone pulses |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion (`motion`).
