// What each chord actually sounds like on this player's guitar and mic,
// learned from a strum and kept between sessions.
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Prints {
  /** Learned 12-value chroma per chord key. */
  prints: Record<string, number[]>;
  save: (key: string, chroma: ArrayLike<number>) => void;
  forget: (key: string) => void;
}

export const usePrints = create<Prints>()(
  persist(
    (set, get) => ({
      prints: {},
      save: (key, chroma) => set({ prints: { ...get().prints, [key]: Array.from(chroma) } }),
      forget: key => {
        const { [key]: _gone, ...rest } = get().prints;
        set({ prints: rest });
      },
    }),
    { name: "gp-chord-prints", version: 1 },
  ),
);
