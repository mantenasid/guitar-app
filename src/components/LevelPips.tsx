import { MAX_LEVEL } from "@/skills/registry";

/** Four small bars showing a skill's level (0–4). */
export function LevelPips({ level, className = "" }: { level: number; className?: string }) {
  return (
    <span className={`inline-flex gap-[3px] ${className}`} aria-label={`Level ${level} of ${MAX_LEVEL}`} title={level >= MAX_LEVEL ? "Mastered" : `Level ${level} of ${MAX_LEVEL}`}>
      {Array.from({ length: MAX_LEVEL }, (_, i) => (
        <i key={i} className={`h-1.5 w-3 rounded-full ${i < level ? (level >= MAX_LEVEL ? "bg-good" : "bg-accent") : "bg-line-2"}`} />
      ))}
    </span>
  );
}
