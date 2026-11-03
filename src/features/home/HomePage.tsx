import { Link } from "react-router";
import { StudioScene } from "./StudioScene";

export function HomePage() {
  return (
    // Fills the rest of the screen under the nav.
    <section className="grid min-h-[420px] grow basis-0 grid-rows-[minmax(0,1fr)] bg-black">
      <div className="min-h-0 [grid-area:1/1]">
        <StudioScene />
      </div>
      <div className="flex items-end justify-center pb-[6vh] [grid-area:1/1]">
        <Link
          to="/gym"
          className="rounded-full border border-white/20 px-5 py-2 text-[14px] font-[560] tracking-wide text-white/80 transition duration-200 ease-in-out hover:border-white/50 hover:text-white"
        >
          Pick it up →
        </Link>
      </div>
    </section>
  );
}
