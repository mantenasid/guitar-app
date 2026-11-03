import { CHORD_GROUPS } from "./chords";
import { SCALE_GROUPS } from "./scales";
import { STRUM_LEVELS } from "./strumming";
import { TRANSITION_SECTIONS } from "./transitions";
import type { Chord, Scale, StrumPattern } from "./types";

export { CHORD_GROUPS, SCALE_GROUPS, STRUM_LEVELS, TRANSITION_SECTIONS };

export const ALL_CHORDS: Chord[] = CHORD_GROUPS.flatMap(g => g.sections.flatMap(s => s.chords));
export const CHORD_BY_KEY: Record<string, Chord> = Object.fromEntries(ALL_CHORDS.map(c => [c.key, c]));

export const ALL_SCALES: Scale[] = SCALE_GROUPS.flatMap(g => g.scales);
export const SCALE_BY_ID: Record<string, Scale> = Object.fromEntries(ALL_SCALES.map(s => [s.id, s]));

export const ALL_PATTERNS: StrumPattern[] = STRUM_LEVELS.flatMap(l => l.patterns);

/** Group title for a scale, e.g. "Minor Blues". */
export function scaleGroupOf(id: string) {
  return SCALE_GROUPS.find(g => g.scales.some(s => s.id === id));
}
