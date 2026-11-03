// Small preferences and the running practice timer, kept in localStorage.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addPractice } from "./db";

export type Theme = "auto" | "light" | "dark";

interface Settings {
  theme: Theme;
  strum: { bpm: number; chord: string; click: boolean; sound: boolean };
  drillPair: [string, string];
  /** Microphone listening: on/off and the loudness (dBFS) below which sound is ignored. */
  listen: { on: boolean; gate: number };
  /** When the practice timer was started (ms), or null when stopped. */
  timerStart: number | null;
  setTheme: (t: Theme) => void;
  setStrum: (s: Partial<Settings["strum"]>) => void;
  setDrillPair: (p: [string, string]) => void;
  setListen: (l: Partial<Settings["listen"]>) => void;
  toggleTimer: () => void;
}

export const useSettings = create<Settings>()(
  persist(
    (set, get) => ({
      theme: "auto",
      strum: { bpm: 80, chord: "G", click: true, sound: true },
      drillPair: ["A", "D"],
      listen: { on: false, gate: -48 },
      timerStart: null,
      setTheme: theme => set({ theme }),
      setStrum: s => set({ strum: { ...get().strum, ...s } }),
      setDrillPair: drillPair => set({ drillPair }),
      setListen: l => set({ listen: { ...get().listen, ...l } }),
      toggleTimer: () => {
        const start = get().timerStart;
        if (start) {
          void addPractice((Date.now() - start) / 1000);
          set({ timerStart: null });
        } else set({ timerStart: Date.now() });
      },
    }),
    {
      name: "gp-settings",
      version: 2,
      // Version 1 had no listening settings; keep everything else.
      migrate: state => ({ listen: { on: false, gate: -48 }, ...(state as object) }) as Settings,
    },
  ),
);

export function applyTheme(theme: Theme) {
  if (theme === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
