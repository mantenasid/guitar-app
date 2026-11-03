// Ear training stages, easiest first: major or minor, then chord quality, then naming
// your own open chords, then hearing where a change goes in a key.

export type EarStageId = "major-minor" | "quality" | "chords" | "changes";

export interface EarStage {
  id: EarStageId;
  title: string;
  tag: string;
  tip: string;
}

export const EAR_STAGES: EarStage[] = [
  { id: "major-minor", title: "Major or minor", tag: "Two choices, any key",
    tip: "Major sounds bright and settled. Minor sounds darker, a little sad." },
  { id: "quality", title: "Major, minor or 7", tag: "Three choices, any key",
    tip: "A dominant 7 sounds like major with an itch: it wants to move somewhere." },
  { id: "chords", title: "Name the chord", tag: "Your open chords",
    tip: "Listen to the lowest note first: E chords sit lowest, then G and A, then C and D. Then decide major or minor." },
  { id: "changes", title: "Hear the change", tag: "Home chord, then IV, V or vi",
    tip: "The first chord is home. IV lifts and opens out, V is tense and wants to go home, vi is home's sad cousin." },
];

export const EAR_STAGE_BY_ID: Record<string, EarStage> = Object.fromEntries(EAR_STAGES.map(s => [s.id, s]));
