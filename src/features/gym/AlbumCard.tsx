// A gym area shown as a record album: on hover the sleeve swings open and the record slides out, spinning.
import { Link } from "react-router";
import { CoverArt, type Art, type Palette } from "./covers";

interface Props {
  to: string;
  num: number;
  title: string;
  blurb: string;
  art: Art;
  palette: Palette;
  done: number;
  total: number;
  /** Position in the page, to stagger the albums rising in. */
  index: number;
}

/** The record behind the sleeve: grooves, a coloured label and a static glint. */
function Record({ label }: { label: string }) {
  return (
    <div className="grid size-full [&>*]:[grid-area:1/1]">
      <svg viewBox="0 0 100 100" className="size-full motion-safe:group-hover:animate-record motion-safe:group-focus-visible:animate-record" aria-hidden>
        <circle cx="50" cy="50" r="49.5" className="fill-[#0b0b0c]" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx="50" cy="50" r={20 + i * 2.4} fill="none" stroke="white" strokeOpacity={i % 3 ? 0.05 : 0.1} strokeWidth=".4" />
        ))}
        <circle cx="50" cy="50" r="16" className={label} />
        <path d="M50 38 a12 12 0 0 1 11 7" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="50" cy="50" r="1.6" className="fill-[#0b0b0c]" />
      </svg>
      <div className="rounded-full bg-[conic-gradient(from_200deg,transparent_0deg,rgb(255_255_255/0.12)_30deg,transparent_60deg,transparent_180deg,rgb(255_255_255/0.08)_210deg,transparent_240deg)]" />
    </div>
  );
}

export function AlbumCard({ to, num, title, blurb, art, palette, done, total, index }: Props) {
  return (
    <Link
      to={to}
      className="group relative z-0 flex min-w-0 animate-rise flex-col gap-3 outline-none hover:z-10 focus-visible:z-10 motion-reduce:animate-none"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* The sleeve is 82% wide so the record has room to slide out to its right. */}
      <div className="grid w-[82%] [perspective:900px] [&>*]:[grid-area:1/1]">
        <div className="aspect-square translate-x-[7%] transition-transform duration-500 ease-in-out group-hover:translate-x-[48%] group-focus-visible:translate-x-[48%] motion-reduce:transition-none">
          <Record label={palette.label} />
        </div>
        <div
          className={`@container relative grid aspect-square origin-left overflow-hidden rounded-[6px] bg-linear-to-br ${palette.bg} ${palette.ink} shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)] ring-1 ring-white/10 transition duration-500 ease-in-out group-hover:shadow-[0_24px_50px_-16px_rgb(0_0_0/0.8)] group-hover:[transform:rotateY(-18deg)_translateZ(8px)] group-focus-visible:[transform:rotateY(-18deg)_translateZ(8px)] group-focus-visible:ring-2 group-focus-visible:ring-white/60 motion-reduce:transition-none [&>*]:[grid-area:1/1]`}
        >
          {/* A spotlight from the top, like the studio photo. */}
          <div className="bg-[radial-gradient(ellipse_at_30%_0%,rgb(255_255_255/0.22),transparent_60%)]" />
          <CoverArt art={art} />
          <div className="bg-(image:--image-grain) opacity-30 mix-blend-overlay" />
          <div className="flex flex-col justify-between p-[7cqw]">
            <span className="text-[6cqw] font-[600] tracking-[0.18em] uppercase opacity-70">No. {String(num).padStart(2, "0")}</span>
            <span className="text-[12cqw] leading-[0.95] font-[750] tracking-[-0.03em] text-balance text-white drop-shadow-md">{title}</span>
          </div>
          {/* A sheen that sweeps across as the sleeve opens. */}
          <div className="-translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full motion-reduce:hidden" />
          {/* The spine darkens as it turns away from the light. */}
          <div className="bg-linear-to-r from-black/0 to-black/0 transition duration-500 ease-in-out group-hover:to-black/30" />
        </div>
      </div>
      <div className="min-w-0 pr-[18%]">
        <h3 className="text-[15px] font-[620] tracking-[-0.01em] text-ink">{title}</h3>
        <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{blurb}</p>
        {total > 0 && (
          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-good" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <span className="tabular-nums">
              <b className="font-[550] text-ink">{done}</b>/{total}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
