/** Shared geometry so the elastic track, knob, and month ruler stay aligned. */

export const TRACK_W = 112;
export const TRACK_H = 400;
export const KNOB_R = 22;
export const TRAVEL_TOP = KNOB_R + 10;
export const TRAVEL_BOTTOM = TRACK_H - KNOB_R - 10;

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Screen Y of the reading line for a progress value — bottom is 0, top is 1. */
export const yFor = (p: number) => TRAVEL_BOTTOM - clamp01(p) * (TRAVEL_BOTTOM - TRAVEL_TOP);

/** Inverse of yFor: a pointer Y (within the track) back to a 0..1 progress. */
export const progressForY = (y: number) =>
  clamp01((TRAVEL_BOTTOM - y) / (TRAVEL_BOTTOM - TRAVEL_TOP));
