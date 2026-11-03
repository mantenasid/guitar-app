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

/** The Divje Babe bone flute, the oldest instrument we know of, flattened into polished gold at the angle it's held in the museum photo.
 * Same drawing as public/icon.svg, without the tile, so the header shows through its two finger holes. */
function FluteMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.35)]" aria-hidden>
      <defs>
        {/* Bands across the bone, like light on a polished rod. */}
        <linearGradient id="flute-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a4f12" />
          <stop offset=".2" stopColor="#d9ac4a" />
          <stop offset=".36" stopColor="#fff3c8" />
          <stop offset=".52" stopColor="#e3b452" />
          <stop offset=".8" stopColor="#9c6b1c" />
          <stop offset="1" stopColor="#d2a24a" />
        </linearGradient>
      </defs>
      <g transform="translate(12 12) rotate(-42) scale(1.02 .88)">
        <path
          fill="url(#flute-gold)"
          fillRule="evenodd"
          d="M-3.4-11.4-2.3-12.8-.8-12.2.6-13.1 2-12.3 3.4-12.6C3.6-8 3-3 3.1 2 3.2 6 3.6 9 3.7 12.6L2.2 13.2Q.6 9.6-1 11.6L-2.2 12.9-3.4 12.3C-3.3 8-2.8 4-2.9 0-3-4-3.5-8-3.4-11.4ZM.1-6.1a1.2 1.45 0 1 0 .01 0ZM.2 1.6a1.4 1.7 0 1 0 .01 0Z"
        />
        {/* Specular glint down the length. */}
        <path d="M-1.6-11.2C-1.9-6-1.6 2-1.8 11" fill="none" stroke="#fffbe8" strokeOpacity=".55" strokeWidth=".35" strokeLinecap="round" />
      </g>
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
