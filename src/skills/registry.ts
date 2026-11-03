// Every practisable skill, typed and addressable by id.
// Phase 1 covers what the app teaches today; the skill tree and XP build on this.
import { ALL_CHORDS, ALL_PATTERNS, ALL_SCALES } from "@/content";
import { ALL_PAIRS, CHANGE_TARGET } from "./changes";

export type SkillKind = "chord" | "change" | "strum" | "scale";

export interface Skill {
  id: string;
  kind: SkillKind;
  title: string;
  /** A measurable objective, when the skill has one. */
  target?: { value: number; unit: string };
}

export const SKILLS: Skill[] = [
  ...ALL_CHORDS.map(c => ({ id: `chord:${c.key}`, kind: "chord" as const, title: c.name })),
  ...ALL_PAIRS.map(p => ({
    id: `change:${p.key}`,
    kind: "change" as const,
    title: `${p.a} ↔ ${p.b}`,
    target: { value: CHANGE_TARGET, unit: "changes/min" },
  })),
  ...ALL_PATTERNS.map(p => ({ id: `strum:${p.num}`, kind: "strum" as const, title: p.name })),
  ...ALL_SCALES.map(s => ({ id: `scale:${s.id}`, kind: "scale" as const, title: s.name })),
];

export const SKILL_BY_ID = new Map(SKILLS.map(s => [s.id, s]));

export function countByKind(kind: SkillKind) {
  return SKILLS.filter(s => s.kind === kind).length;
}
