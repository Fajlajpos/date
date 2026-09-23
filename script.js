/* =========================================================
   Rande web – logika
   ---------------------------------------------------------
   👉 Všechno, co budeš chtít měnit (jména, klíč, texty,
      hlášky, aktivity), je hned tady nahoře.
   ========================================================= */

/* ---------- 1) ÚDAJE K DOPLNĚNÍ ---------- */
const CONFIG = {
  herName: "[JMÉNO HOLKY]",                    // 1. pád – „Eliška“ (do emailu: „Eliška řekla ANO“)
  herNameVocative: "",                         // 5. pád – „Eliško“ (oslovení v otázce). Prázdné = použije se herName
  myName: "[MOJE JMÉNO]",
  apiUrl: "api/send",                          // vlastní server (server.js lokálně / Vercel) – posílá přes Gmail, heslo je v .env
  googleScriptUrl: "",                         // alternativa: URL z Google Apps Script (…/exec) – použije se, když apiUrl je prázdné
  myEmail: "",                                 // alternativa přes FormSubmit.co (e-mail by byl vidět v kódu)
  web3formsKey: "",                            // alternativa přes Web3Forms
  photoPath: "assets/photo.jpg"
};

/* ---------- 2) TEXTY NA STRÁNCE ----------
   {jmeno}  = CONFIG.herName
   {jmeno5} = CONFIG.herNameVocative (nebo herName)
   {ja}     = CONFIG.myName                                  */
const TEXTS = {
  question: "{jmeno5}, půjdeš se mnou na rande? 🥺",
  tauntStart: "Vyber si moudře 😇",
  yesButton: "ANO 💖",
  noButton: "NE",
  photoAlt: "Fotka pro tebe 💕",

  step2Title: "Yay! 🎉 Tak kdy?",
  step2Subtitle: "Vyber den a čas, který se ti hodí.",
  dateLabel: "Datum",
  timeLabel: "Čas",
  datePast: "Tohle datum už bylo 🙈 Vyber prosím dnešek nebo později.",
  timePast: "Tenhle čas už dneska proběhl ⏰ Zkus pozdější.",

  step3Title: "Na co máš chuť? 😋",
  step3Subtitle: "Klidně vyber víc možností.",
  otherIdeaLabel: "Nebo mě napadá něco jiného… (nepovinné)",
  messageLabel: "Vzkaz pro mě 💌 (nepovinné)",

  step4Title: "Tak to shrneme 📝",
  sendButton: "Odeslat 💌",
  sending: "Odesílám…",
  retryButton: "Zkusit znovu 💌",
  sendError: "Něco se pokazilo, zkus to prosím znovu 🥺",
  missingKey: "Chybí adresa pro odeslání 🔑 Doplň CONFIG.apiUrl ve script.js.",

  thanksTitle: "Těším se! 💕",
  thanksSubtitle: "Odpověď už letí za mnou 💌",
  thanksSignature: "— {ja}",

  continue: "Pokračovat →",
  back: "← Zpět",

  // Email
  emailSubject: "💌 {jmeno} řekla ANO na rande!",
  emailFromName: "Rande web 💕"
};

/* ---------- 3) HLÁŠKY PO ÚTĚKU TLAČÍTKA NE ---------- */
const TAUNTS = [
  "Ale no tak… 🥺",
  "Zkus to ještě jednou 😏",
  "Tlačítko NE je dnes na dovolené 🏝️",
  "Vážně? 💔",
  "Tak to už je trochu podezřelé 👀",
  "Ono to fakt nejde, co? 😇",
  "ANO je přece hned vedle 💖",
  "Tohle tlačítko je jen na ozdobu ✨",
  "Já ti dám NE! 😤",
  "Pořád čekám na správnou odpověď 🥰"
];

/* ---------- 4) AKTIVITY (karty v kroku 3) ---------- */
const ACTIVITIES = [
  { id: "kino",       emoji: "🎬", label: "Kino" },
  { id: "fastfood",   emoji: "🍔", label: "Fast food" },
  { id: "sushi",      emoji: "🍣", label: "Sushi" },
  { id: "prochazka",  emoji: "🌸", label: "Jít ven / procházka" },
  { id: "projizdka",  emoji: "🚗", label: "Projížďka autem" },
  { id: "pizza",      emoji: "🍕", label: "Pizza" }
];

/* ---------- Konstanty chování ---------- */
const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const FORMSUBMIT_URL = "https://formsubmit.co/ajax/";
const NO_PROXIMITY = 120;   // px – jak blízko může kurzor k NE, než uteče
const NO_EDGE = 16;         // px – minimální okraj od kraje obrazovky
const YES_SCALE_STEP = 0.08;
const YES_SCALE_MAX = 1.6;

/* =========================================================
   Odtud dál už nic měnit nemusíš 🙂
   ========================================================= */

/* ---------- Stav aplikace (žádný localStorage) ---------- */
const state = {
  step: 1,
  noAttempts: 0,
  date: "",
  time: "",
  activities: new Set(),
  otherIdea: "",
  message: "",
  sending: false,
  sent: false
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Je hodnota v CONFIG ještě placeholder typu „[NĚCO]“? */
function isPlaceholder(value) {
  return !value || /^\s*\[.*\]\s*$/.test(String(value));
}

/** Doplní {jmeno}, {jmeno5} a {ja} do textu. */
function fill(text) {
  const vocative = CONFIG.herNameVocative && !isPlaceholder(CONFIG.herNameVocative)
    ? CONFIG.herNameVocative
    : CONFIG.herName;
  return String(text)
    .replaceAll("{jmeno5}", vocative)
    .replaceAll("{jmeno}", CONFIG.herName)
    .replaceAll("{ja}", CONFIG.myName);
}

/* =========================================================
   Inicializace
   ========================================================= */
function init() {
  checkConfig();
  applyTexts();
  setupPhotos();
  createBackground();
  setupStep1();
  setupStep2();
  setupStep3();
  setupStep4();

  // Tlačítka „← Zpět“
  $$("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => goTo(state.step - 1));
  });
}

/** Upozorní v konzoli, co ještě chybí doplnit. */
function checkConfig() {
  if (!buildRequest()) {
    console.error(
      "[Rande web] ❌ Není kam odeslat odpověď! Doplň CONFIG.apiUrl (nebo googleScriptUrl) ve script.js."
    );
  }
  if (isPlaceholder(CONFIG.herName)) {
    console.warn("[Rande web] ⚠️ Doplň jméno do CONFIG.herName ve script.js.");
  }
  if (isPlaceholder(CONFIG.myName)) {
    console.warn("[Rande web] ⚠️ Doplň svoje jméno do CONFIG.myName ve script.js.");
  }
}

/** Vloží texty z TEXTS do prvků s atributem data-text. */
function applyTexts() {
  $$("[data-text]").forEach((el) => {
    const key = el.dataset.text;
    if (key in TEXTS) el.textContent = fill(TEXTS[key]);
  });
  $$("[data-text-alt]").forEach((el) => {
    const key = el.dataset.textAlt;
    if (key in TEXTS) el.alt = fill(TEXTS[key]);
  });
}

/* =========================================================
   Fotka – když neexistuje, ukáže se 🥰
   ========================================================= */
function setupPhotos() {
  $$("[data-photo]").forEach((frame) => {
    const img = $("img", frame);
    img.addEventListener("load", () => {
      frame.classList.remove("no-photo");
      frame.classList.add("has-photo");
    });
    img.addEventListener("error", () => {
      frame.classList.remove("has-photo");
      frame.classList.add("no-photo");
    });
    img.src = CONFIG.photoPath;
  });
}

/* =========================================================
   Přepínání kroků
   ========================================================= */
function goTo(step) {
  if (step < 1 || step > 5 || step === state.step) return;
  const dir = step > state.step ? "forward" : "back";
  state.step = step;

  $$(".step").forEach((section) => {
    const active = Number(section.dataset.step) === step;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
    section.dataset.dir = dir;
  });

  // Tlačítko NE žije mimo kartu – ukazuje se jen v kroku 1
  noBtn.hidden = step !== 1;
  if (step === 1) {
    yesBtn.disabled = false;
    if (noEscaped) requestAnimationFrame(() => placeNo({ animate: false }));
  }

  if (step === 4) renderSummary();

  window.scrollTo(0, 0);
  const heading = $(`.step[data-step="${step}"] [tabindex="-1"]`);
  if (heading) heading.focus({ preventScroll: true });
}

/* =========================================================
   KROK 1 – otázka a utíkající NE
   ========================================================= */
const yesBtn = $("#yes-btn");
const noBtn = $("#no-btn");
const questionEl = $("#question");
const tauntEl = $("#taunt");

let noEscaped = false;       // už je NE „na útěku“ (position: fixed v <body>)?
let noPos = null;            // cílová pozice NE { x, y } (levý horní roh)
let yesScale = 1;
let tauntIndex = -1;
let lastEscapeAt = 0;
let lastPointer = null;
let proximityFrame = 0;

function setupStep1() {
  // --- Desktop: útěk, když se kurzor přiblíží ---
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || state.step !== 1) return;
    lastPointer = { x: e.clientX, y: e.clientY };
    if (!proximityFrame) proximityFrame = requestAnimationFrame(checkProximity);
  }, { passive: true });

  // --- Mobil / dotyk: útěk hned při dotyku ---
  noBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    escapeNo({ x: e.clientX, y: e.clientY });
  });
  noBtn.addEventListener("touchstart", (e) => {
    e.preventDefault(); // zabrání „click“ po tapnutí
    const t = e.touches[0];
    escapeNo(t ? { x: t.clientX, y: t.clientY } : null);
  }, { passive: false });

  // --- Pojistka: klik (i Enter/Mezerník z klávesnice) ---
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    escapeNo(null);
  });

  // --- Klávesnice: focus přes Tab ---
  noBtn.addEventListener("focus", () => {
    if (noBtn.matches(":focus-visible")) escapeNo(null);
  });

  // --- ANO ---
  yesBtn.addEventListener("click", onYes);

  // --- Změna velikosti / otočení / scroll: NE musí zůstat na obrazovce ---
  // Přesouvá se jen když je potřeba (jinak by poskakovalo i při schování adresního řádku)
  const reposition = () => {
    if (noEscaped && state.step === 1 && !isNoPositionValid()) placeNo({ animate: false });
  };
  window.addEventListener("resize", reposition);
  window.addEventListener("orientationchange", () => setTimeout(reposition, 250));
  if (window.visualViewport) window.visualViewport.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, { passive: true });
}

/** Je NE celé na obrazovce a nic nepřekrývá? */
function isNoPositionValid() {
  const r = noRect();
  const inset = getSafeInsets();
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const inside =
    r.left >= inset.left + NO_EDGE - 1 &&
    r.top >= inset.top + NO_EDGE - 1 &&
    r.right <= vw - inset.right - NO_EDGE + 1 &&
    r.bottom <= vh - inset.bottom - NO_EDGE + 1;
  return inside && !overlapsForbidden(r);
}

/** Kontrola vzdálenosti kurzoru od NE (1× za snímek). */
function checkProximity() {
  proximityFrame = 0;
  if (!lastPointer || state.step !== 1 || noBtn.hidden) return;
  const dNo = distanceToRect(lastPointer, noRect());
  if (dNo >= NO_PROXIMITY) return;
  // Když je kurzor blíž k ANO (míří na ANO), NE neutíká – nepočítá se to jako pokus
  const dYes = distanceToRect(lastPointer, yesLayoutRect(yesScale));
  if (dNo <= dYes) escapeNo(lastPointer, { cooldown: 200 });
}

/**
 * Útěk tlačítka NE.
 * @param pointer  kde je prst/kurzor (aby NE uteklo daleko od něj)
 */
function escapeNo(pointer, { cooldown = 120 } = {}) {
  if (state.step !== 1) return;
  const now = performance.now();
  // Jeden dotyk vyvolá pointerdown + touchstart (+ focus) → počítáme jen jednou
  if (now - lastEscapeAt < cooldown) return;
  lastEscapeAt = now;

  state.noAttempts += 1;
  showNextTaunt();
  yesScale = Math.min(YES_SCALE_MAX, 1 + state.noAttempts * YES_SCALE_STEP);

  if (!noEscaped) detachNo();
  yesBtn.style.scale = String(yesScale);
  placeNo({ pointer });
}

/**
 * Při prvním úniku přesune NE z karty přímo do <body>.
 * (position: fixed uvnitř prvku s transform by se počítal od karty, ne od obrazovky)
 * ANO se plynule posune doprostřed (FLIP animace).
 */
function detachNo() {
  const noStart = noBtn.getBoundingClientRect();
  const yesBefore = yesLayoutRect(1);
  const hadFocus = document.activeElement === noBtn;

  // Zachovej rozměr – po přesunu už nebude v řádku
  noBtn.style.width = `${noStart.width}px`;
  document.body.appendChild(noBtn);
  if (hadFocus) noBtn.focus({ preventScroll: true }); // přesun v DOM by vzal focus z klávesnice
  noBtn.classList.add("is-escaping");
  noBtn.style.transition = "none";
  setNoTransform(noStart.left, noStart.top);
  noPos = { x: noStart.left, y: noStart.top };

  const yesAfter = yesLayoutRect(1);
  const dx = yesBefore.left - yesAfter.left;
  yesBtn.style.transition = "none";
  yesBtn.style.translate = `${dx}px 0`;

  void noBtn.offsetWidth; // vynutí přepočet, aby se transition spustila až teď
  noBtn.style.transition = "";
  yesBtn.style.transition = "";
  yesBtn.style.translate = "0px 0";
  noEscaped = true;
}

function setNoTransform(x, y) {
  noBtn.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

/** Najde nové místo pro NE a přesune ho tam. */
function placeNo({ pointer = null, animate = true } = {}) {
  if (!noEscaped) return;
  const pos = findNoPosition(pointer);
  if (!animate) noBtn.style.transition = "none";
  setNoTransform(pos.x, pos.y);
  noPos = pos;
  if (!animate) {
    void noBtn.offsetWidth;
    noBtn.style.transition = "";
  }
}

/**
 * Vybere náhodné místo, které:
 *  - je celé na obrazovce (okraj ≥ 16 px + safe-area),
 *  - nepřekrývá ANO, otázku ani hlášku,
 *  - je dost daleko od předchozí pozice i od prstu/kurzoru.
 */
function findNoPosition(pointer) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const inset = getSafeInsets();
  const bw = noBtn.offsetWidth;
  const bh = noBtn.offsetHeight;

  const minX = NO_EDGE + inset.left;
  const maxX = vw - bw - NO_EDGE - inset.right;
  const minY = NO_EDGE + inset.top;
  const maxY = vh - bh - NO_EDGE - inset.bottom;

  // Extrémně malé okno – aspoň ať je vidět
  if (maxX < minX || maxY < minY) {
    return { x: Math.max(0, (vw - bw) / 2), y: Math.max(0, (vh - bh) / 2) };
  }

  const forbidden = getForbiddenRects();
  const prevCenter = noPos
    ? { x: noPos.x + bw / 2, y: noPos.y + bh / 2 }
    : { x: vw / 2, y: vh / 2 };
  const minJump = Math.min(170, Math.max(90, Math.min(vw, vh) * 0.3));
  const minFromPointer = NO_PROXIMITY + 30;

  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < 120; i++) {
    const x = rand(minX, maxX);
    const y = rand(minY, maxY);
    const rect = { left: x, top: y, right: x + bw, bottom: y + bh };
    if (forbidden.some((f) => intersects(rect, f))) continue;

    const center = { x: x + bw / 2, y: y + bh / 2 };
    const dPrev = distance(center, prevCenter);
    const dPointer = pointer ? distanceToRect(pointer, rect) : Infinity;

    if (dPrev >= minJump && dPointer >= minFromPointer) return { x, y };

    const score = Math.min(dPrev, dPointer);
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  }
  if (best) return best;

  // Záloha: rohy obrazovky, které nic nepřekrývají, co nejdál od předchozí pozice
  const corners = [
    { x: minX, y: minY }, { x: maxX, y: minY },
    { x: minX, y: maxY }, { x: maxX, y: maxY }
  ].filter((c) => !forbidden.some((f) => intersects(
    { left: c.x, top: c.y, right: c.x + bw, bottom: c.y + bh }, f
  )));
  corners.sort((a, b) =>
    distance({ x: b.x + bw / 2, y: b.y + bh / 2 }, prevCenter) -
    distance({ x: a.x + bw / 2, y: a.y + bh / 2 }, prevCenter)
  );
  return corners[0] || { x: minX, y: minY };
}

/** Oblasti, kam NE nesmí (s rezervou). */
function getForbiddenRects() {
  return [
    expandRect(yesLayoutRect(yesScale), 14),
    expandRect(textRect(questionEl), 10),
    expandRect(textRect(tauntEl), 6)
  ].filter(Boolean);
}

/** Obdélník ANO po dokončení animace zvětšení (bez ohledu na rozběhnutou transition). */
function yesLayoutRect(scale) {
  const parent = yesBtn.offsetParent;
  const p = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
  const w = yesBtn.offsetWidth;
  const h = yesBtn.offsetHeight;
  const cx = p.left + yesBtn.offsetLeft + w / 2;
  const cy = p.top + yesBtn.offsetTop + h / 2;
  return {
    left: cx - (w * scale) / 2,
    right: cx + (w * scale) / 2,
    top: cy - (h * scale) / 2,
    bottom: cy + (h * scale) / 2
  };
}

/** Obdélník skutečného textu (ne celé šířky bloku). */
function textRect(el) {
  if (!el.textContent.trim()) return null;
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  return r.width ? r : el.getBoundingClientRect();
}

/** Aktuální (cílový) obdélník NE. */
function noRect() {
  if (!noEscaped || !noPos) return noBtn.getBoundingClientRect();
  return {
    left: noPos.x,
    top: noPos.y,
    right: noPos.x + noBtn.offsetWidth,
    bottom: noPos.y + noBtn.offsetHeight
  };
}

function overlapsForbidden(rect) {
  return getForbiddenRects().some((f) => intersects(rect, f));
}

function showNextTaunt() {
  tauntIndex = (tauntIndex + 1) % TAUNTS.length;
  tauntEl.textContent = TAUNTS[tauntIndex];
  tauntEl.classList.remove("is-new");
  void tauntEl.offsetWidth;
  tauntEl.classList.add("is-new");
}

/** Safe-area insety (výřez displeje) z pomocného prvku. */
function getSafeInsets() {
  const s = getComputedStyle($("#safe-area-probe"));
  return {
    top: parseFloat(s.paddingTop) || 0,
    right: parseFloat(s.paddingRight) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
    left: parseFloat(s.paddingLeft) || 0
  };
}

/* --- geometrické pomocníky --- */
function rand(min, max) { return min + Math.random() * (max - min); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
function expandRect(r, pad) {
  if (!r) return null;
  return { left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: r.bottom + pad };
}
function distanceToRect(p, r) {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right);
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
  return Math.hypot(dx, dy);
}

/* ---------- ANO! ---------- */
async function onYes() {
  if (state.step !== 1) return;
  yesBtn.disabled = true;
  noBtn.hidden = true;
  await celebrate(yesBtn);
  goTo(2);
}

/**
 * Konfety + padající srdíčka na <canvas>, bez knihoven.
 * Vrátí Promise, který se splní, až je čas přejít na další krok
 * (konfety ještě chvíli dopadávají přes krok 2).
 */
function celebrate(originEl) {
  if (prefersReducedMotion.matches) return Promise.resolve();

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const colors = ["#ff7eb3", "#d23c77", "#ffb3cf", "#b99cf2", "#ffb89a", "#ffd166"];
  const r = originEl.getBoundingClientRect();
  const ox = r.left + r.width / 2;
  const oy = r.top + r.height / 2;
  const count = W < 500 ? 90 : 140;

  const particles = Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 6 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 6 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length],
      heart: i % 3 === 0,
      life: 0
    };
  });

  const DURATION = 2200;
  const start = performance.now();
  let last = start;

  function frame(now) {
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = t > DURATION - 500 ? Math.max(0, (DURATION - t) / 500) : 1;

    for (const p of particles) {
      p.vy += 0.28 * dt;          // gravitace
      p.vx *= Math.pow(0.985, dt); // odpor vzduchu
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.heart) drawHeart(ctx, p.size * 1.3);
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    if (t < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);

  return new Promise((resolve) => setTimeout(resolve, 900));
}

function drawHeart(ctx, s) {
  const h = s / 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.6);
  ctx.bezierCurveTo(-h * 1.2, -h * 0.2, -h * 0.6, -h * 1.2, 0, -h * 0.45);
  ctx.bezierCurveTo(h * 0.6, -h * 1.2, h * 1.2, -h * 0.2, 0, h * 0.6);
  ctx.fill();
}

/* =========================================================
   KROK 2 – datum a čas
   ========================================================= */
const dateInput = $("#date-input");
const timeInput = $("#time-input");
const dateTimeError = $("#datetime-error");
const toStep3Btn = $("#to-step-3");

/** Dnešní datum ve formátu YYYY-MM-DD (místní čas, ne UTC). */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function nowHHMM() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function pad2(n) { return String(n).padStart(2, "0"); }

function setupStep2() {
  dateInput.min = todayISO();
  ["input", "change", "blur"].forEach((type) => {
    dateInput.addEventListener(type, validateDateTime);
    timeInput.addEventListener(type, validateDateTime);
  });
  toStep3Btn.addEventListener("click", () => {
    if (validateDateTime()) goTo(3);
  });
}

/** iOS Safari ignoruje `min`, proto kontrolujeme i v JS. */
function validateDateTime() {
  state.date = dateInput.value;
  state.time = timeInput.value;

  let error = "";
  if (state.date && state.date < todayISO()) {
    error = TEXTS.datePast;
  } else if (state.date === todayISO() && state.time && state.time < nowHHMM()) {
    error = TEXTS.timePast;
  }

  dateTimeError.textContent = error;
  dateTimeError.hidden = !error;
  dateInput.setAttribute("aria-invalid", String(Boolean(error) && error === TEXTS.datePast));
  timeInput.setAttribute("aria-invalid", String(Boolean(error) && error === TEXTS.timePast));

  const ok = Boolean(state.date && state.time && !error);
  toStep3Btn.disabled = !ok;
  return ok;
}

/** „2026-09-27“ → „sobota 27. září“ */
function formatDateCz(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

/* =========================================================
   KROK 3 – aktivity
   ========================================================= */
const activityGrid = $("#activity-grid");
const otherIdeaInput = $("#other-idea");
const messageInput = $("#message");
const toStep4Btn = $("#to-step-4");

const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

function setupStep3() {
  ACTIVITIES.forEach((act) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "activity";
    card.dataset.id = act.id;
    card.setAttribute("aria-pressed", "false");
    card.innerHTML = `
      <span class="activity__check">${CHECK_ICON}</span>
      <span class="activity__emoji" aria-hidden="true"></span>
      <span class="activity__label"></span>`;
    $(".activity__emoji", card).textContent = act.emoji;
    $(".activity__label", card).textContent = act.label;

    card.addEventListener("click", () => {
      if (state.activities.has(act.id)) state.activities.delete(act.id);
      else state.activities.add(act.id);
      card.setAttribute("aria-pressed", String(state.activities.has(act.id)));
      toStep4Btn.disabled = state.activities.size === 0;
    });
    activityGrid.appendChild(card);
  });

  otherIdeaInput.addEventListener("input", () => { state.otherIdea = otherIdeaInput.value; });
  messageInput.addEventListener("input", () => { state.message = messageInput.value; });

  toStep4Btn.addEventListener("click", () => {
    if (state.activities.size > 0) goTo(4);
  });
}

function selectedActivityLabels() {
  // Pořadí podle ACTIVITIES, ať je to přehledné
  return ACTIVITIES.filter((a) => state.activities.has(a.id)).map((a) => a.label);
}

/* =========================================================
   KROK 4 – shrnutí a odeslání
   ========================================================= */
const summaryEl = $("#summary");
const sendBtn = $("#send-btn");
const sendLabel = $(".btn__label", sendBtn);
const sendError = $("#send-error");
const honeypot = $("#botcheck");

function renderSummary() {
  const rows = [
    { icon: "📅", label: "Datum", value: formatDateCz(state.date), cls: "is-date" },
    { icon: "🕖", label: "Čas", value: state.time },
    { icon: "💗", label: "Chce", value: selectedActivityLabels().join(", ") },
    { icon: "✍️", label: "Jiný nápad", value: state.otherIdea.trim() },
    { icon: "💌", label: "Vzkaz", value: state.message.trim() }
  ].filter((row) => row.value);

  summaryEl.replaceChildren();
  rows.forEach((row) => {
    const wrap = document.createElement("div");
    wrap.className = "summary__row";
    const icon = document.createElement("span");
    icon.className = "summary__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = row.icon;
    const dt = document.createElement("dt");
    dt.textContent = row.label;
    const dd = document.createElement("dd");
    dd.textContent = row.value;
    if (row.cls) dd.className = row.cls;
    wrap.append(icon, dt, dd);
    summaryEl.appendChild(wrap);
  });
}

/** Údaje do emailu jako dvojice [popisek, hodnota] (prázdné vynechá). */
function buildFields() {
  return [
    ["📅 Datum", formatDateCz(state.date)],
    ["🕖 Čas", state.time],
    ["💗 Chce", selectedActivityLabels().join(", ")],
    ["✍️ Jiný nápad", state.otherIdea.trim()],
    ["💌 Vzkaz", state.message.trim()],
    ["😏 Pokusů kliknout na NE", String(state.noAttempts)],
    ["🕐 Odpověděla", new Date().toLocaleString("cs-CZ")]
  ].filter(([, value]) => value);
}

/** Čitelný text emailu. */
function buildMessage() {
  const lines = buildFields().map(([label, value]) => `${label}: ${value}`);
  return [`${CONFIG.herName} řekla ANO! 🎉`, "", ...lines].join("\n");
}

/**
 * Kam se odpověď pošle (první vyplněné vyhrává):
 *  1. apiUrl          → vlastní server (api/send.js), pošle e-mail přes Gmail,
 *  2. googleScriptUrl → Google Apps Script, který pošle e-mail z tvého Gmailu,
 *  3. web3formsKey    → Web3Forms,
 *  4. myEmail         → FormSubmit.co (při úplně prvním odeslání chce aktivaci
 *                       kliknutím na „Activate Form“ v e-mailu).
 */
function buildRequest() {
  const isBot = honeypot.checked;
  const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

  if (!isPlaceholder(CONFIG.apiUrl)) {
    return {
      url: CONFIG.apiUrl.trim(),
      headers: JSON_HEADERS,
      body: {
        subject: fill(TEXTS.emailSubject),
        message: buildMessage(),
        botcheck: isBot ? "on" : ""
      }
    };
  }

  if (!isPlaceholder(CONFIG.googleScriptUrl)) {
    return {
      url: CONFIG.googleScriptUrl.trim(),
      // text/plain = „jednoduchý“ požadavek bez CORS preflightu, který Apps Script neumí
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: {
        subject: fill(TEXTS.emailSubject),
        message: buildMessage(),
        botcheck: isBot ? "on" : ""
      }
    };
  }

  if (!isPlaceholder(CONFIG.web3formsKey)) {
    return {
      url: WEB3FORMS_URL,
      headers: JSON_HEADERS,
      body: {
        access_key: CONFIG.web3formsKey,
        subject: fill(TEXTS.emailSubject),
        from_name: fill(TEXTS.emailFromName),
        message: buildMessage(),
        botcheck: isBot ? "on" : ""
      }
    };
  }

  if (!isPlaceholder(CONFIG.myEmail)) {
    return {
      url: FORMSUBMIT_URL + CONFIG.myEmail.trim(),
      headers: JSON_HEADERS,
      body: {
        _subject: fill(TEXTS.emailSubject),
        _template: "table",
        _captcha: "false",
        _honey: isBot ? "on" : "",
        "🎉": `${CONFIG.herName} řekla ANO!`,
        ...Object.fromEntries(buildFields())
      }
    };
  }

  return null;
}

function setupStep4() {
  sendBtn.addEventListener("click", send);
}

function setSending(isSending, label) {
  sendBtn.disabled = isSending;
  sendBtn.setAttribute("aria-busy", String(isSending));
  sendLabel.textContent = label;
}

function showSendError(text) {
  sendError.textContent = text;
  sendError.hidden = false;
}

async function send() {
  if (state.sending || state.sent) return; // žádné dvojité odeslání
  sendError.hidden = true;

  const request = buildRequest();
  if (!request) {
    console.error("[Rande web] ❌ Nelze odeslat – chybí CONFIG.apiUrl (nebo googleScriptUrl / myEmail / web3formsKey).");
    showSendError(TEXTS.missingKey);
    return;
  }

  state.sending = true;
  setSending(true, TEXTS.sending);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // Apps Script se někdy chvíli „probouzí“

  try {
    const res = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    // FormSubmit vrací success jako text "true"/"false", Apps Script a Web3Forms jako boolean
    const ok = data.success === true || data.success === "true";
    if (!res.ok || !ok) {
      if (/activat/i.test(data.message || "")) {
        console.error(
          `[Rande web] ⚠️ FormSubmit čeká na aktivaci – otevři e-mail na ${CONFIG.myEmail} a klikni na „Activate Form“.`
        );
      }
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    state.sent = true;
    goTo(5);
  } catch (err) {
    console.error("[Rande web] Odeslání selhalo:", err);
    showSendError(TEXTS.sendError);
    setSending(false, TEXTS.retryButton);
  } finally {
    clearTimeout(timeout);
    state.sending = false;
  }
}

/* =========================================================
   Pozadí – plovoucí srdíčka a třpytky
   ========================================================= */
const HEART_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.2.4.8.4 1 0 .7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
const SPARKLE_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c.6 5.4 3.3 9.4 12 12-8.7 2.6-11.4 6.6-12 12-.6-5.4-3.3-9.4-12-12C8.7 9.4 11.4 5.4 12 0z"/></svg>';

function createBackground() {
  const layer = $("#bg-hearts");
  const colors = ["#ff9cc2", "#f7a8c9", "#c9b2f5", "#ffc2a8", "#ffb3cf"];
  const small = window.innerWidth < 500;
  const heartCount = small ? 9 : 14;
  const sparkleCount = small ? 6 : 10;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < heartCount; i++) {
    const el = document.createElement("span");
    el.className = "bg-heart";
    el.innerHTML = HEART_SVG;
    el.style.setProperty("--x", `${rand(0, 96).toFixed(1)}%`);
    el.style.setProperty("--y", `${rand(4, 92).toFixed(1)}%`);
    el.style.setProperty("--size", `${Math.round(rand(14, 34))}px`);
    el.style.setProperty("--dur", `${rand(11, 20).toFixed(1)}s`);
    el.style.setProperty("--delay", `${(-rand(0, 20)).toFixed(1)}s`);
    el.style.setProperty("--drift", `${Math.round(rand(-60, 60))}px`);
    el.style.setProperty("--o", rand(0.35, 0.7).toFixed(2));
    el.style.setProperty("--c", colors[i % colors.length]);
    frag.appendChild(el);
  }

  for (let i = 0; i < sparkleCount; i++) {
    const el = document.createElement("span");
    el.className = "bg-sparkle";
    el.innerHTML = SPARKLE_SVG;
    el.style.setProperty("--x", `${rand(2, 95).toFixed(1)}%`);
    el.style.setProperty("--y", `${rand(2, 95).toFixed(1)}%`);
    el.style.setProperty("--size", `${Math.round(rand(8, 16))}px`);
    el.style.setProperty("--dur", `${rand(2.5, 5).toFixed(1)}s`);
    el.style.setProperty("--delay", `${(-rand(0, 5)).toFixed(1)}s`);
    el.style.setProperty("--o", rand(0.5, 0.9).toFixed(2));
    el.style.setProperty("--c", i % 2 ? "#ffffff" : "#e7c6ff");
    frag.appendChild(el);
  }

  layer.appendChild(frag);
}

/* ---------- Start ---------- */
init();
