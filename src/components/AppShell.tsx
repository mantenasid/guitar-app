import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { stopPlayback } from "@/audio/playback";
import { applyTheme, useSettings, type Theme } from "@/progress/settings";
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
  // Leaving a screen stops whatever it was playing and turns the mic off.
  useEffect(() => {
    stopPlayback();
    useSettings.getState().setListen({ on: false });
    window.scrollTo(0, 0);
  }, [pathname]);

  const home = pathname === "/";
  const nav = (
    <nav
      className={`no-print mx-4 flex flex-wrap items-center gap-x-7 border-b border-line pt-3 sm:mx-auto sm:h-16 sm:w-[calc(100%-3.5rem)] sm:max-w-[1024px] sm:flex-nowrap sm:pt-0 ${
        // On home the nav floats over the photo, so it always uses light text whatever the theme.
        home ? "z-10 self-start [--ink:#f4f4f5] [--line:rgb(255_255_255/0.12)] [--muted:#c4c4c8] [--surface-2:rgb(255_255_255/0.1)] [grid-area:1/1]" : ""
      }`}
    >
      <NavLink to="/" className="whitespace-nowrap text-[15px] font-[650] tracking-[-0.01em] text-ink">
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
        <ThemeToggle />
      </div>
    </nav>
  );

  // Home is a full-screen photo with the nav laid over it; every other page sits in the reading column.
  return home ? (
    <div className="grid h-svh min-h-[480px] grid-rows-[minmax(0,1fr)] overflow-hidden">
      {nav}
      <Outlet />
      <Toasts />
    </div>
  ) : (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      {nav}
      <main className="mx-auto w-full max-w-[1080px] px-4 pt-7 pb-24 sm:px-7 sm:pt-10">
        <Outlet />
      </main>
      <Toasts />
    </div>
  );
}
