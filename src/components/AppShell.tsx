import { Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import { NavLink, Outlet, useLocation } from "react-router";
import { stopPlayback } from "@/audio/playback";
import { preloadHomePhotos } from "@/features/home/HomePage";
import { SessionBar } from "@/features/practice/SessionBar";
import { applyTheme, useDark, useSettings } from "@/progress/settings";
import { Haze } from "./Haze";
import { glassClass } from "./ui";
import { Toasts } from "./Toasts";

/** Pages that belong to the gym, so its tab stays lit on them. */
const GYM_PATHS = ["/gym", "/ear", "/play", "/chords", "/transitions", "/strumming", "/scales", "/fretboard", "/warmups", "/fingerpicking", "/arpeggios", "/progressions"];

const LINKS = [
  { to: "/", label: "Home", paths: ["/"] },
  { to: "/practice", label: "Practice", paths: ["/practice"] },
  { to: "/gym", label: "Gym", paths: GYM_PATHS },
  { to: "/tuner", label: "Tuner", paths: ["/tuner"] },
];

/** Pull in the menu's pages and the home photos once the first screen has settled, so tapping a tab never waits on the network. */
function warmUp() {
  void import("@/features/practice/PracticePage");
  void import("@/features/gym/GymPage");
  void import("@/features/tuner/TunerPage");
  preloadHomePhotos();
}

const isUnder = (pathname: string, paths: string[]) => paths.some(p => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")));

export function formatDuration(sec: number) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** A guitar pick in polished gold, tilted the way it sits between finger and thumb. Same drawing as public/icon.svg, without the tile. */
function PickMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.35)]" aria-hidden>
      <defs>
        <linearGradient id="pick-gold" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#fff1c2" />
          <stop offset=".35" stopColor="#e8bb58" />
          <stop offset=".7" stopColor="#c9952f" />
          <stop offset="1" stopColor="#8a5a14" />
        </linearGradient>
      </defs>
      <g transform="rotate(-14 12 12)">
        <path fill="url(#pick-gold)" d="M12 22c-1.5 0-8.3-8.6-8.3-13.4C3.7 4.6 7.2 2.3 12 2.3s8.3 2.3 8.3 6.3C20.3 13.4 13.5 22 12 22Z" />
        <path fill="none" stroke="#fff6d6" strokeOpacity=".55" strokeWidth=".9" strokeLinecap="round" d="M7 6.3C8.3 5.4 10 4.9 12 4.9" />
      </g>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[19px]" fill="currentColor" aria-hidden>
      <path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11Z" />
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
    const next = nextDark === systemDark ? "auto" : nextDark ? "dark" : "light";
    const swap = () => {
      flushSync(() => setTheme(next));
      applyTheme(next);
    };
    // Crossfade the whole page from one look to the other rather than snapping every colour at once.
    const root = document.documentElement;
    if (!document.startViewTransition) return swap();
    root.classList.add("theme-swap");
    document.startViewTransition(swap).finished.finally(() => root.classList.remove("theme-swap"));
  };
  return (
    <button
      onClick={flip}
      title={dark ? "Switch to day" : "Switch to night"}
      aria-label={dark ? "Switch to day" : "Switch to night"}
      className="flex size-9 items-center justify-center rounded-lg text-ink-2 transition duration-200 ease-in-out hover:bg-surface-2 hover:text-ink"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** How visible the nav should be. Scrolling down fades it in step with the page, reaching nothing just as the page's
 * first line meets the bar's bottom edge; any scroll up brings it straight back. */
function useNavOpacity(nav: RefObject<HTMLElement | null>) {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    let last = window.scrollY;
    let up = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== last) up = y < last;
      last = y;
      const bar = nav.current;
      const first = document.querySelector("main")?.firstElementChild;
      if (!bar || !first) return;
      // How far down the page that first line touches the bar.
      const meet = first.getBoundingClientRect().top + y - bar.offsetHeight;
      setOpacity(up ? 1 : Math.min(1, Math.max(0, 1 - y / Math.max(meet, 1))));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [nav]);
  return opacity;
}

export function AppShell() {
  const { pathname } = useLocation();
  // Leaving a screen stops whatever it was playing and turns the mic off.
  useEffect(() => {
    stopPlayback();
    useSettings.getState().setListen({ on: false });
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const id = window.requestIdleCallback ? window.requestIdleCallback(warmUp) : window.setTimeout(warmUp, 1500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, []);

  const home = pathname === "/";
  const navRef = useRef<HTMLElement>(null);
  const opacity = useNavOpacity(navRef);
  const nav = (
    <header
      ref={navRef}
      style={home ? undefined : { opacity }}
      className={`no-print z-20 px-3 [view-transition-name:site-nav] pt-3 sm:px-6 sm:pt-4 ${
        // On home the bar floats over the photo; elsewhere it sticks to the top as the page scrolls under it.
        // Over the bright day photo the glass is smoked and the text cream, so the sky can't wash the links out.
        home
          ? "self-start [grid-area:1/1] [--bg:#1e2a22] [--glass-rim:rgb(255_255_255/0.22)] [--glass:rgb(28_34_30/0.62)] [&_nav]:backdrop-blur-3xl [--ink:#f6f1e4] [--muted:rgb(246_241_228/0.78)] [--surface-2:rgb(255_255_255/0.16)]"
          : `sticky top-0 transition-opacity duration-200 ease-out focus-within:pointer-events-auto focus-within:opacity-100! ${opacity === 0 ? "pointer-events-none" : ""}`
      }`}
    >
      <nav className={`mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-6 rounded-2xl px-3 ${glassClass} sm:h-14 sm:flex-nowrap sm:pr-2.5 sm:pl-4`}>
        <NavLink to="/" viewTransition className="flex h-12 items-center gap-2 whitespace-nowrap font-brand text-[20px] font-[600] tracking-[-0.02em] text-ink sm:h-auto">
          <PickMark />
          Woodshed
        </NavLink>
        <div className="no-scrollbar order-3 -mx-1 flex w-full gap-1 overflow-x-auto pb-2 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:justify-center sm:pb-0">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              viewTransition
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition duration-200 ease-in-out ${isUnder(pathname, l.paths) ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );

  // Home is a full-screen photo with the nav laid over it; every other page sits in the reading column.
  return home ? (
    <div className="grid h-svh min-h-[480px] grid-rows-[minmax(0,1fr)] overflow-hidden">
      {nav}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
      <SessionBar />
      <Toasts />
    </div>
  ) : (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Haze />
      {nav}
      <main className="mx-auto w-full max-w-[1080px] px-4 pt-7 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-7 sm:pt-10">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <SessionBar />
      <Toasts />
    </div>
  );
}
