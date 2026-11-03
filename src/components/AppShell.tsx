import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { stopPlayback } from "@/audio/playback";
import { db, localDate } from "@/progress/db";
import { applyTheme, useSettings, type Theme } from "@/progress/settings";

const LINKS = [
  { to: "/chords", label: "Chords" },
  { to: "/transitions", label: "Transitions" },
  { to: "/strumming", label: "Strumming" },
  { to: "/scales", label: "Scales" },
];

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
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 py-3 text-sm sm:pt-[21px] sm:pb-[19px] ${isActive ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <PracticeTimer />
          <ThemeToggle />
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
