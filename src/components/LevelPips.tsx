import { MAX_LEVEL } from "@/skills/registry";

/** Small bars showing a skill's level, one per level (four unless `max` says otherwise). */
export function LevelPips({ level, max = MAX_LEVEL, className = "" }: { level: number; max?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-[3px] ${className}`} aria-label={`Level ${level} of ${max}`} title={level >= max ? "Mastered" : `Level ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={`h-1.5 w-3 rounded-full ${i < level ? (level >= max ? "bg-good" : "bg-accent") : "bg-line-2"}`} />
      ))}
    </span>
  );
}
