import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { stopPlayback } from "@/audio/playback";
import { db, localDate } from "@/progress/db";
import { applyTheme, useSettings, type Theme } from "@/progress/settings";
import { useProgress } from "@/progress/hooks";
import { DAILY_XP_GOAL, playerLevel } from "@/skills/progress";
import { Toasts } from "./Toasts";

/** Pages that belong to the gym, so its tab stays lit on them. */
const GYM_PATHS = ["/gym", "/path", "/play", "/chords", "/transitions", "/strumming", "/scales", "/fretboard", "/warmups", "/fingerpicking", "/arpeggios", "/progressions"];

const LINKS = [
  { to: "/", label: "Home", paths: ["/"] },
  { to: "/tuner", label: "Tuner", paths: ["/tuner"] },
  { to: "/gym", label: "Gym", paths: GYM_PATHS },
  { to: "/ear", label: "Ear training", paths: ["/ear"] },
];

const isUnder = (pathname: string, paths: string[]) => paths.some(p => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")));

export function formatDuration(sec: number) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** Seconds on the running timer, re-rendering every second while it runs. */
export function useRunningSeconds() {
  const start = useSettings(s => s.timerStart);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!start) return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [start]);
  return start ? (Date.now() - start) / 1000 : 0;
}

function PracticeTimer() {
  const running = useSettings(s => s.timerStart !== null);
  const toggle = useSettings(s => s.toggleTimer);
  const seconds = useRunningSeconds();
  const saved = useLiveQuery(async () => (await db.practice.get(localDate()))?.seconds ?? 0, [], 0);
  return (
    <button
      onClick={toggle}
      title={running ? "Pause practice timer" : "Start practice timer"}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-surface-2 ${running ? "text-accent" : "text-muted"}`}
    >
      <span aria-hidden="true">{running ? "■" : "▶"}</span>
      <span className={`tabular-nums ${running ? "text-accent" : "text-ink"}`}>{formatDuration(seconds)}</span>
      <span className="hidden text-faint sm:inline">· {formatDuration(saved + seconds)} today</span>
    </button>
  );
}

/** Player level, with a ring that fills towards today's XP goal. */
function XpChip() {
  const { xp, xpToday } = useProgress();
  const { level } = playerLevel(xp);
  const pct = Math.min(1, xpToday / DAILY_XP_GOAL);
  const c = 2 * Math.PI * 8;
  return (
    <NavLink to="/path" title={`Level ${level} · ${xp} XP · ${xpToday}/${DAILY_XP_GOAL} XP today`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-2">
      <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--line-2)" strokeWidth="2.5" />
        <circle cx="10" cy="10" r="8" fill="none" stroke={pct >= 1 ? "var(--good)" : "var(--accent)"} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} />
      </svg>
      <span className="font-[550] tabular-nums">Lv {level}</span>
      <span className="hidden tabular-nums text-faint sm:inline">{xpToday}/{DAILY_XP_GOAL}</span>
    </NavLink>
  );
}

const THEMES: Theme[] = ["auto", "light", "dark"];
const THEME_ICON: Record<Theme, string> = { auto: "◐", light: "☀︎", dark: "☾" };

function ThemeToggle() {
  const theme = useSettings(s => s.theme);
  const setTheme = useSettings(s => s.setTheme);
  useEffect(() => applyTheme(theme), [theme]);
  return (
    <button
      onClick={() => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]!)}
      title={`Theme: ${theme} (click to change)`}
      className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted hover:bg-surface-2 hover:text-ink"
    >
      {THEME_ICON[theme]}
    </button>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  // Leaving a screen stops whatever it was playing.
  useEffect(() => {
    stopPlayback();
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="mx-auto max-w-[1080px] overflow-x-clip px-4 pb-24 sm:px-7">
      <nav className="no-print mb-7 flex flex-wrap items-center gap-x-7 border-b border-line pt-3 sm:mb-10 sm:h-16 sm:flex-nowrap sm:pt-0">
        <NavLink to="/" className="whitespace-nowrap text-[15px] font-[650] tracking-[-0.01em]">
          Guitar Practice
        </NavLink>
        <div className="no-scrollbar order-3 flex w-full gap-5 overflow-x-auto sm:order-none sm:w-auto sm:flex-1 sm:gap-[22px]">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={`whitespace-nowrap border-b-2 py-3 text-sm sm:pt-[21px] sm:pb-[19px] ${isUnder(pathname, l.paths) ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <XpChip />
          <PracticeTimer />
          <ThemeToggle />
        </div>
      </nav>
      <Outlet />
      <Toasts />
    </div>
  );
}
