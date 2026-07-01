/** Shared instrument geometry so the track, knob, and ruler stay in lockstep. */

export const TRACK_W = 120;
export const TRACK_H = 340;
export const KNOB_R = 24;

export const TRAVEL_TOP = KNOB_R + 6;
export const TRAVEL_BOTTOM = TRACK_H - KNOB_R - 6;

/** Screen-space Y of the reading line for a given progress (0..1). */
export const yFor = (p: number) => TRAVEL_TOP + p * (TRAVEL_BOTTOM - TRAVEL_TOP);
