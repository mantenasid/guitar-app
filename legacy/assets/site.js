// Shared behaviour: theme toggle, practice timer, "learned" ticks.
// Everything is saved in this browser's localStorage only.
const GPH = (() => {
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("gph-" + key); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("gph-" + key, JSON.stringify(value)); } catch { /* storage blocked */ }
    }
  };

  // ---------- Theme (runs before first paint to avoid a flash) ----------
  const THEMES = ["auto", "light", "dark"];
  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  applyTheme(store.get("theme", "auto"));

  // ---------- Practice log ----------
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function log() { return store.get("log", {}); }
  function addSeconds(sec) {
    if (sec <= 0) return;
    const l = log();
    l[today()] = (l[today()] || 0) + Math.round(sec);
    store.set("log", l);
  }
  function timerStart() { return store.get("timer-start", null); }
  function runningSeconds() { const s = timerStart(); return s ? (Date.now() - s) / 1000 : 0; }
  function todaySeconds() { return (log()[today()] || 0) + runningSeconds(); }
  function streak() {
    const l = log();
    let n = 0;
    const d = new Date();
    if (!(l[today()] > 0) && !timerStart()) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (l[k] > 0 || (k === today() && timerStart())) { n++; d.setDate(d.getDate() - 1); } else break;
    }
    return n;
  }
  function fmt(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
  }
  function toggleTimer() {
    const s = timerStart();
    if (s) { addSeconds((Date.now() - s) / 1000); store.set("timer-start", null); }
    else store.set("timer-start", Date.now());
    renderTimer();
  }

  // ---------- Learned ticks ----------
  function learned() { return store.get("learned", {}); }
  function isLearned(id) { return !!learned()[id]; }
  function setLearned(id, on) {
    const l = learned();
    if (on) l[id] = today(); else delete l[id];
    store.set("learned", l);
  }
  function countLearned(prefix) { return Object.keys(learned()).filter(k => k.startsWith(prefix)).length; }
  function tickHTML(id, label = "") {
    return `<button type="button" class="tick-btn${isLearned(id) ? " done" : ""}" data-tick="${id}" title="Mark as learned" aria-label="Mark as learned">${label}</button>`;
  }
  function refreshTicks(root = document) {
    root.querySelectorAll("[data-tick]").forEach(b => {
      const on = isLearned(b.dataset.tick);
      b.classList.toggle("done", on);
      b.closest(".card, .row")?.classList.toggle("learned", on);
    });
  }

  // ---------- Nav tools ----------
  let timerChip, themeChip;
  function renderTimer() {
    if (!timerChip) return;
    const running = !!timerStart();
    timerChip.classList.toggle("on", running);
    timerChip.innerHTML = `${running ? "■" : "▶"} <span class="t">${fmt(runningSeconds())}</span><span class="sub">· ${fmt(todaySeconds())} today</span>`;
    timerChip.title = running ? "Pause practice timer" : "Start practice timer";
  }
  function renderTheme() {
    const t = store.get("theme", "auto");
    themeChip.textContent = { auto: "◐", light: "☀︎", dark: "☾" }[t];
    themeChip.title = `Theme: ${t} (click to change)`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".global-nav");
    if (nav) {
      const tools = document.createElement("div");
      tools.className = "gph-tools";
      timerChip = document.createElement("button");
      timerChip.type = "button";
      timerChip.className = "gph-chip";
      timerChip.addEventListener("click", toggleTimer);
      themeChip = document.createElement("button");
      themeChip.type = "button";
      themeChip.className = "gph-chip";
      themeChip.addEventListener("click", () => {
        const next = THEMES[(THEMES.indexOf(store.get("theme", "auto")) + 1) % THEMES.length];
        store.set("theme", next);
        applyTheme(next);
        renderTheme();
      });
      tools.append(timerChip, themeChip);
      nav.appendChild(tools);
      renderTimer();
      renderTheme();
      setInterval(renderTimer, 1000);
    }
    refreshTicks();
  });

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-tick]");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    setLearned(b.dataset.tick, !isLearned(b.dataset.tick));
    refreshTicks();
    document.dispatchEvent(new CustomEvent("gph:learned"));
  });

  // Another tab started or stopped the timer.
  window.addEventListener("storage", () => { renderTimer(); refreshTicks(); });

  return { store, today, log, todaySeconds, streak, fmt, tickHTML, refreshTicks, isLearned, countLearned };
})();
