import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { stopPlayback } from "@/audio/playback";
import { applyTheme, useSettings, type Theme } from "@/progress/settings";
import { Haze } from "./Haze";
import { glassClass } from "./ui";
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

/** A guitar pick with a soft light across it, for the brand. */
function PickMark() {
  return (
    <svg viewBox="0 0 20 22" className="size-5" aria-hidden>
      <defs>
        <linearGradient id="pick" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <path d="M10 21C6 17 1 10.5 1 6.5 1 3 4.5 1 10 1s9 2 9 5.5C19 10.5 14 17 10 21Z" fill="url(#pick)" />
      <path d="M5 5.5c1.5-1.3 3.4-1.8 6-1.6" stroke="white" strokeOpacity=".55" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ThemeToggle() {
  const theme = useSettings(s => s.theme);
  const setTheme = useSettings(s => s.setTheme);
  useEffect(() => applyTheme(theme), [theme]);
  return (
    <button
      onClick={() => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]!)}
      title={`Theme: ${theme} (click to change)`}
      className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition duration-200 ease-in-out hover:bg-surface-2 hover:text-ink"
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
    <header
      className={`no-print z-20 px-3 pt-3 sm:px-6 sm:pt-4 ${
        // On home the bar floats over the photo; elsewhere it sticks to the top as the page scrolls under it.
        home ? "self-start [grid-area:1/1]" : "sticky top-0"
      }`}
    >
      <nav className={`mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-6 rounded-2xl px-3 ${glassClass} sm:h-14 sm:flex-nowrap sm:pr-2.5 sm:pl-4`}>
        <NavLink to="/" className="flex h-12 items-center gap-2.5 whitespace-nowrap text-[15px] font-[650] tracking-[-0.01em] text-ink sm:h-auto">
          <PickMark />
          Guitar Practice
        </NavLink>
        <div className="no-scrollbar order-3 -mx-1 flex w-full gap-1 overflow-x-auto pb-2 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:justify-center sm:pb-0">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition duration-200 ease-in-out ${isUnder(pathname, l.paths) ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <NavLink
            to="/gym"
            className="rounded-lg bg-ink px-3.5 py-1.5 text-[13px] font-[560] whitespace-nowrap text-bg shadow-card transition duration-200 ease-in-out hover:opacity-85"
          >
            Practise
          </NavLink>
        </div>
      </nav>
    </header>
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
      <Haze />
      {nav}
      <main className="mx-auto w-full max-w-[1080px] px-4 pt-7 pb-24 sm:px-7 sm:pt-10">
        <Outlet />
      </main>
      <Toasts />
    </div>
  );
}
