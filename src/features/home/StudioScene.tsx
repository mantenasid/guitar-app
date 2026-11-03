// The home screen: a dark studio, one spotlight on a guitar, amp and drums waiting in the shadows.

/** Dust in the beam, placed by a fixed seed so it never jumps between renders. */
const MOTES = (() => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 34 }, () => {
    const y = 40 + rand() * 560;
    // The cone widens from 80 wide at the lamp to 600 wide at the floor.
    const half = 40 + (y / 640) * 260;
    return { x: 600 + (rand() * 2 - 1) * half * 0.8, y, r: 0.6 + rand() * 1.6, dur: 3 + rand() * 4, delay: rand() * 4 };
  });
})();

/** Frets get closer together towards the body, like the real thing. */
const FRETS = Array.from({ length: 14 }, (_, i) => 212 + 220 * (1 - Math.pow(2, -(i + 1) / 12)) * 1.9);

export function StudioScene() {
  return (
    <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" role="img" aria-label="A dark studio with a spotlight on an electric guitar, an amp, a microphone and a drum kit" className="block size-full">
      <defs>
        <linearGradient id="studio-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id="studio-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="studio-magenta" cx="0" cy="1" r="0.6">
          <stop offset="0" stopColor="#c026d3" stopOpacity="0.32" />
          <stop offset="1" stopColor="#c026d3" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="studio-blue" cx="1" cy="0.95" r="0.55">
          <stop offset="0" stopColor="#2563eb" stopOpacity="0.3" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="studio-vignette" cx="0.5" cy="0.55" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="studio-sunburst" cx="0.5" cy="0.55" r="0.6">
          <stop offset="0" stopColor="#f2b35a" />
          <stop offset="0.55" stopColor="#b4521f" />
          <stop offset="1" stopColor="#2a0c06" />
        </radialGradient>
        <linearGradient id="studio-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#262626" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="studio-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141414" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <pattern id="studio-grille" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#121212" />
          <path d="M0 6L6 0" stroke="#1f1f1f" strokeWidth="1.2" />
        </pattern>
        <filter id="studio-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="studio-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="studio-smoke" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>

      {/* Room, coloured haze, floor */}
      <rect width="1200" height="700" fill="#000" />
      <rect width="1200" height="700" fill="url(#studio-magenta)" />
      <rect width="1200" height="700" fill="url(#studio-blue)" />
      <rect y="640" width="1200" height="60" fill="url(#studio-floor)" />
      <line x1="0" y1="640" x2="1200" y2="640" stroke="#fff" strokeOpacity="0.06" />

      {/* Drum kit, back right, mostly in shadow */}
      <g opacity="0.75">
        <line x1="1085" y1="452" x2="1085" y2="640" stroke="#2a2a2a" strokeWidth="3" />
        {/* Ride still swaying from the last hit */}
        <ellipse cx="1085" cy="450" rx="62" ry="7" fill="#3d3420">
          <animateTransform attributeName="transform" type="rotate" values="-3 1085 452;3 1085 452;-3 1085 452" dur="1.6s" repeatCount="indefinite" />
        </ellipse>
        <line x1="925" y1="476" x2="925" y2="640" stroke="#2a2a2a" strokeWidth="3" />
        <ellipse cx="925" cy="474" rx="34" ry="5" fill="#3d3420" />
        <ellipse cx="925" cy="481" rx="34" ry="5" fill="#2e2718" />
        <circle cx="1020" cy="582" r="58" fill="#0e0e0e" stroke="#2c2c2c" strokeWidth="3" />
        <circle cx="1020" cy="582" r="44" fill="none" stroke="#1d1d1d" strokeWidth="2" />
        <rect x="948" y="532" width="76" height="26" rx="3" fill="#161616" />
        <ellipse cx="986" cy="532" rx="38" ry="8" fill="#2b2b2b" />
        <line x1="986" y1="558" x2="986" y2="640" stroke="#242424" strokeWidth="3" />
        <rect x="1030" y="496" width="62" height="34" rx="4" fill="#141414" />
        <ellipse cx="1061" cy="496" rx="31" ry="7" fill="#262626" />
        {/* A stick left leaning on the kick */}
        <line x1="958" y1="640" x2="990" y2="548" stroke="#a88d5a" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Amp, left */}
      <g>
        <rect x="170" y="430" width="230" height="210" rx="6" fill="url(#studio-cab)" />
        <rect x="186" y="468" width="198" height="158" rx="3" fill="url(#studio-grille)" />
        <rect x="176" y="380" width="218" height="48" rx="5" fill="#1b1b1b" />
        <rect x="176" y="380" width="218" height="48" rx="5" fill="none" stroke="#fff" strokeOpacity="0.1" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <circle key={i} cx={206 + i * 28} cy="404" r="5.5" fill="#3a3a3a" stroke="#555" strokeWidth="1" />
        ))}
        <circle cx="372" cy="404" r="6" fill="#ff2d55" filter="url(#studio-glow)" />
        <circle cx="372" cy="404" r="3" fill="#ff6b86" />
        <line x1="172" y1="431" x2="398" y2="431" stroke="#fff" strokeOpacity="0.12" />
        {/* Half-drunk coffee, still warm */}
        <path d="M222 346L226 380L250 380L254 346Z" fill="#e7e2d8" />
        <rect x="221" y="342" width="34" height="6" rx="2" fill="#cfc8bb" />
        <rect x="223" y="358" width="30" height="9" fill="#7a4a2a" />
        {[0, 1].map(i => (
          <path key={i} d={`M${232 + i * 12} 336c-6-10 6-16 0-26s6-16 0-24`} fill="none" stroke="#fff" strokeOpacity="0" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="stroke-opacity" values="0;0.25;0" dur="4s" begin={`${i * 2}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -16" dur="4s" begin={`${i * 2}s`} repeatCount="indefinite" />
          </path>
        ))}
      </g>

      {/* Mic stand, right of the guitar */}
      <g stroke="#2e2e2e" strokeLinecap="round">
        <line x1="840" y1="640" x2="870" y2="618" strokeWidth="4" />
        <line x1="900" y1="640" x2="870" y2="618" strokeWidth="4" />
        <line x1="870" y1="618" x2="870" y2="430" strokeWidth="5" />
        <line x1="870" y1="436" x2="790" y2="368" strokeWidth="4" />
        <rect x="764" y="344" width="40" height="15" rx="7.5" transform="rotate(-40 784 352)" fill="#444" stroke="#666" strokeWidth="1" />
      </g>

      {/* The beam itself, behind the guitar */}
      <polygon points="560,0 640,0 900,640 300,640" fill="url(#studio-beam)" filter="url(#studio-soft)">
        <animate attributeName="opacity" values="0.92;1;0.95;1;0.92" dur="7s" repeatCount="indefinite" />
      </polygon>
      <ellipse cx="600" cy="642" rx="330" ry="40" fill="url(#studio-pool)" />
      <circle cx="600" cy="0" r="46" fill="#fff" opacity="0.7" filter="url(#studio-soft)" />
      <rect x="566" y="-10" width="68" height="18" rx="4" fill="#1a1a1a" />

      {/* Left on the floor: setlist, pick, a dropped stick, and the cable still plugged in */}
      <g transform="rotate(-8 430 668)">
        <rect x="392" y="650" width="76" height="40" rx="1" fill="#e9e6df" opacity="0.8" />
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1="400" y1={659 + i * 8} x2={448 - (i % 2) * 14} y2={659 + i * 8} stroke="#222" strokeWidth="2" />
        ))}
        <line x1="398" y1="675" x2="452" y2="667" stroke="#c0262d" strokeWidth="1.5" />
      </g>
      <path d="M548 668l12-4 2 10z" fill="#d9772b" />
      <line x1="716" y1="676" x2="806" y2="664" stroke="#c8a86b" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M384 416C430 424 418 600 450 640S560 690 640 668S760 610 690 566" fill="none" stroke="#0d0d0d" strokeWidth="4" strokeLinecap="round" />
      <path d="M384 416C430 424 418 600 450 640S560 690 640 668S760 610 690 566" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="384" cy="416" r="4" fill="#777" />

      {/* Guitar on its stand */}
      <g>
        <line x1="600" y1="586" x2="552" y2="640" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        <line x1="600" y1="586" x2="648" y2="640" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        <path d="M600 214L600 300" stroke="#333" strokeWidth="4" />
        <path
          d="M600 600C540 600 510 575 512 535C514 505 532 492 528 470C524 450 508 440 515 420C522 402 548 404 560 418C570 430 580 432 590 428L610 428C620 432 632 428 642 414C654 398 680 398 686 418C692 440 674 452 670 472C666 494 690 508 690 538C690 578 660 600 600 600Z"
          fill="url(#studio-sunburst)"
          stroke="#000"
          strokeOpacity="0.5"
        />
        <rect x="590" y="200" width="20" height="236" rx="2" fill="#2b1a10" />
        {FRETS.map(y => (
          <line key={y} x1="590" y1={y} x2="610" y2={y} stroke="#c9c9c9" strokeOpacity="0.45" strokeWidth="1" />
        ))}
        <path d="M590 202L587 158C587 148 595 142 604 142L615 147L611 202Z" fill="#2b1a10" />
        {[0, 1, 2].map(i => (
          <circle key={i} cx="589" cy={156 + i * 14} r="2.5" fill="#bbb" />
        ))}
        <rect x="577" y="468" width="46" height="13" rx="2" fill="#151515" stroke="#444" />
        <rect x="577" y="504" width="46" height="13" rx="2" fill="#151515" stroke="#444" />
        <rect x="580" y="544" width="40" height="9" rx="1.5" fill="#9a9a9a" />
        <circle cx="650" cy="556" r="6" fill="#d8d8d8" opacity="0.75" />
        <circle cx="664" cy="578" r="6" fill="#d8d8d8" opacity="0.75" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={i} x1={594.5 + i * 2.2} y1="150" x2={589 + i * 4.4} y2="549" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.7" />
        ))}
        {/* Rim light from above */}
        <path d="M515 420C522 402 548 404 560 418M642 414C654 398 680 398 686 418" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
      </g>

      {/* Dust drifting through the light */}
      {MOTES.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={m.r} fill="#fff" opacity="0">
          <animate attributeName="opacity" values="0;0.7;0" dur={`${m.dur}s`} begin={`${m.delay}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${m.y};${m.y - 14}`} dur={`${m.dur}s`} begin={`${m.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Smoke still hanging in the air */}
      <g filter="url(#studio-smoke)">
        {[
          { cx: 420, cy: 300, rx: 220, ry: 50, dx: 60, dur: 26 },
          { cx: 760, cy: 220, rx: 260, ry: 44, dx: -70, dur: 32 },
          { cx: 600, cy: 470, rx: 300, ry: 56, dx: 50, dur: 22 },
        ].map(s => (
          <ellipse key={s.cx} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#d6c8ff" opacity="0.07">
            <animateTransform attributeName="transform" type="translate" values={`0 0;${s.dx} -10;0 0`} dur={`${s.dur}s`} repeatCount="indefinite" />
          </ellipse>
        ))}
      </g>

      <rect width="1200" height="700" fill="url(#studio-vignette)" />
    </svg>
  );
}
