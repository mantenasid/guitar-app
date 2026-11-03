import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { stopPlayback } from "@/audio/playback";
import { applyTheme, useDark, useSettings } from "@/progress/settings";
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

/** The Divje Babe bone flute, the oldest instrument we know of, traced from the museum photo at the angle it's held there and flattened into polished gold.
 * Same drawing as public/icon.svg, without the tile, so the header shows through its two finger holes. */
function FluteMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.35)]" aria-hidden>
      <defs>
        {/* Bands across the bone, like light on a polished rod. */}
        <linearGradient id="flute-gold" x1="0" y1=".8" x2=".8" y2="0">
          <stop offset="0" stopColor="#6e450e" />
          <stop offset=".2" stopColor="#c9952f" />
          <stop offset=".38" stopColor="#fff1c2" />
          <stop offset=".5" stopColor="#e8bb58" />
          <stop offset=".78" stopColor="#946318" />
          <stop offset="1" stopColor="#d7a84c" />
        </linearGradient>
      </defs>
      <path
        fill="url(#flute-gold)"
        fillRule="evenodd"
        d="M6.5 1.6C6.9 1.5 6.9 1.5 7.4 1.9C7.8 2.3 7.6 1.7 9.1 3.9C10.5 6 14.3 12.4 15.9 14.8C17.4 17.2 17.4 17.1 18.3 18.3C19.3 19.4 21 20.9 21.5 21.6C22.1 22.2 22.1 22.2 21.7 22.2C21.3 22.2 19.8 21.7 19.1 21.3C18.4 20.9 18.1 20.3 17.6 20C17.1 19.7 16.6 19.6 16.3 19.6C15.9 19.6 15.7 19.5 15.3 20C15 20.4 14.6 21.7 14.1 22.1C13.7 22.5 12.9 22.4 12.6 22.4C12.3 22.3 12.2 22.4 12 22C11.3 20.5 9.3 15.4 8.2 13.2C7.1 10.9 6.2 9.9 5.6 8.6C5 7.4 5 6.7 4.4 5.8C3.9 4.9 2.6 3.9 2.3 3.4C2 2.8 2.3 2.9 2.7 2.7C3.1 2.5 4 2.5 4.7 2.4C5.3 2.2 6 1.7 6.5 1.6ZM9.1 6.9C9.3 6.8 9.4 6.9 9.6 7.1C9.8 7.2 10.1 7.6 10.2 7.9C10.3 8.1 10.4 8.5 10.3 8.7C10.3 8.9 10.2 9 10 9.1C9.8 9.1 9.3 9.1 9 9C8.8 8.8 8.5 8.5 8.4 8.3C8.3 8.1 8.3 7.9 8.4 7.7C8.5 7.5 8.9 7 9.1 6.9ZM13.3 14.5C13.5 14.4 13.7 14.4 13.9 14.5C14 14.6 14.3 14.9 14.4 15.1C14.5 15.2 14.6 15.4 14.6 15.6C14.6 15.7 14.5 16 14.3 16.1C14.1 16.1 13.6 16.1 13.3 16C13 15.9 12.6 15.5 12.4 15.3C12.3 15.1 12.3 14.9 12.4 14.7C12.5 14.6 13 14.5 13.3 14.5Z"
      />
    </svg>
  );
}

function ThemeToggle() {
  const theme = useSettings(s => s.theme);
  const setTheme = useSettings(s => s.setTheme);
  const dark = useDark();
  useEffect(() => applyTheme(theme), [theme]);
  // Every click swaps day and night; landing on the system's own look goes back to following it.
  const flip = () => {
    // Read the system now rather than trusting the last change event, so a click is never swallowed.
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = !(theme === "auto" ? systemDark : theme === "dark");
    setTheme(nextDark === systemDark ? "auto" : nextDark ? "dark" : "light");
  };
  return (
    <button
      onClick={flip}
      title={dark ? "Switch to day" : "Switch to night"}
      aria-label={dark ? "Switch to day" : "Switch to night"}
      className="rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition duration-200 ease-in-out hover:bg-surface-2 hover:text-ink"
    >
      {dark ? "☀︎" : "☾"}
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
        // Over the bright day photo the glass is smoked and the text cream, so the sky can't wash the links out.
        home
          ? "self-start [grid-area:1/1] [--bg:#1e2a22] [--glass-rim:rgb(255_255_255/0.22)] [--glass:rgb(28_34_30/0.42)] [--ink:#f6f1e4] [--muted:rgb(246_241_228/0.78)] [--surface-2:rgb(255_255_255/0.16)]"
          : "sticky top-0"
      }`}
    >
      <nav className={`mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-6 rounded-2xl px-3 ${glassClass} sm:h-14 sm:flex-nowrap sm:pr-2.5 sm:pl-4`}>
        <NavLink to="/" className="flex h-12 items-center gap-2.5 whitespace-nowrap font-brand text-[17px] font-bold tracking-[-0.02em] text-ink sm:h-auto">
          <FluteMark />
          Woodshed
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
