/** Slow drifting light behind every page, like smoke under the studio spotlights on the home photo. */
export function Haze() {
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* A spotlight from above the page. */}
      <div className="absolute top-[-35vh] left-1/2 h-[85vh] w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,var(--glow-strong),transparent_70%)]" />
      {/* Two banks of smoke that wander past each other. */}
      <div className="absolute top-[5vh] left-[-25vw] size-[75vmax] animate-drift-a rounded-full bg-[radial-gradient(circle,var(--glow),transparent_62%)] blur-2xl motion-reduce:animate-none" />
      <div className="absolute top-[30vh] right-[-30vw] size-[65vmax] animate-drift-b rounded-full bg-[radial-gradient(circle,var(--glow),transparent_60%)] blur-2xl motion-reduce:animate-none" />
      <div className="absolute inset-0 bg-(image:--image-grain) opacity-(--grain-opacity)" />
    </div>
  );
}
