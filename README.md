# Growth — 100 → 10,000 followers

A cinematic, self‑playing growth component. The follower count builds from
**100 to 10,000** as the timeline lights up month by month, embers lift off the
rail and feed into the number, and the whole frame runs warmer the higher it
climbs — pausing on a satisfying payoff before looping cleanly.

Built as a stop‑scroll social/dashboard moment: dark, premium, warm gold, with
the number as the hero and light as the story.

## The idea

Growth told as one take, in three acts:

1. **Start small** — the profile and a quiet `100` fade in.
2. **Build momentum** — the growth line draws left→right, month nodes ignite in
   sequence, embers rise into the number, and the count surges (the data is an
   S‑curve, so it *feels* like acceleration, not a linear tick).
3. **Arrive** — at **10,000** a warm bloom swells and holds, the number takes a
   breath, and the reading settles to **10,000 Followers · as of Jun 2025**
   before a dimmed, intentional loop.

## Highlights

- **Number as light.** A `--heat`‑style channel brightens the glow and ignites
  an incandescent core on the final approach — the signature that keeps it from
  reading as a generic dark‑mode card.
- **Embers feed the count.** Each igniting node lifts embers that converge into
  the number.
- **Premium rolling digits.** Fixed‑width tabular wheels roll forward with no
  seam, no clip, and no layout shift; leading digits and the separator slide in
  only as the count grows into them.
- **One synchronized system.** A single normalized timeline value drives the
  number, line, nodes, embers, and glow.
- **Showcase mode** (`?showcase`) drops all chrome, hides the cursor, and fills
  the viewport for recording.
- **Accessible & reduced‑motion aware.** Rests on the final state and drops the
  pulses when reduced motion is requested; conveys the result to screen readers.

## Getting started

```bash
npm install
npm run dev                       # http://localhost:3000
# recording-ready, chrome-free:
#                                   http://localhost:3000/?showcase
```

```bash
npm run build   # production build
npm run lint    # eslint
```

## Recording for X / social

1. Open `http://localhost:3000/?showcase` (fills the viewport, no cursor/chrome).
2. Size the window to your target — **16:9** is the default framing.
3. Screen‑record one full loop (~9s). It restarts cleanly, so any single loop is
   a complete clip.

## Customizing the story

The component is generic — swap the series to tell any growth story. Edit
[`src/lib/metric.ts`](src/lib/metric.ts) or pass your own `series` to
`<GrowthShowcase />`. Keep the points **low → high**; the number, line, nodes,
milestones, and glow all derive from them.

## Architecture

| File | Role |
| --- | --- |
| `lib/metric.ts` | Generic time‑series model, sampling, milestones |
| `growth/useGrowthPlayback.ts` | The looping intro → grow → payoff → outro director |
| `growth/GrowthShowcase.tsx` | Composition, reactive glow, payoff, showcase mode |
| `growth/RollingNumber.tsx` | Fixed‑width forward‑rolling digit reels |
| `growth/GrowthLine.tsx` | Growth curve that draws in with a playhead |
| `growth/Timeline.tsx` | Rail, igniting month nodes, playhead |
| `growth/Embers.tsx` | Embers rising from nodes into the number |
| `growth/ProfileCard.tsx` | Owner card |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion (`motion`).
