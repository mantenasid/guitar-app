/** A slot as you'd draw it on a chart: arrows for the hand, letters for the special strokes. */
export function StrumToken({ t }: { t: string }) {
  if (t === "·") return <span className="size-1 rounded-full bg-line-2" />;
  const accent = t.endsWith(">");
  const mark = t.startsWith("D") ? "↓" : t === "U" ? "↑" : t === "X" ? "×" : t === "P" ? "PM" : t;
  const tone = t === "U" ? "text-accent" : t === "B" ? "text-good" : t === "X" || t === "P" ? "text-muted" : "text-ink";
  return (
    <span className={`flex flex-col items-center leading-none ${tone} ${t === "P" ? "text-[13px]" : ""}`}>
      {accent && <span className="-mt-1 text-[10px]">&gt;</span>}
      {mark}
    </span>
  );
}
