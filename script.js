/* =========================================================
   Rande web – logika
   ---------------------------------------------------------
   👉 Všechno, co budeš chtít měnit (jména, klíč, texty,
      hlášky, aktivity), je hned tady nahoře.
   ========================================================= */

/* ---------- 1) ÚDAJE K DOPLNĚNÍ ---------- */
const CONFIG = {
  herName: "Klára",                            // 1. pád – do e-mailu („Klára řekla ANO“)
  herNameVocative: "Klári",                    // oslovení v otázce („Klári, půjdeš…“)
  myName: "Filip",
  myEmail: "filipmayer7@gmail.com",            // sem přijde odpověď – přes FormSubmit.co, funguje na GitHub Pages
  apiUrl: "",                                  // alternativa: vlastní server (api/send.js + .env) – NEfunguje na GitHub Pages
  googleScriptUrl: "",                         // alternativa: URL z Google Apps Script (…/exec)
  web3formsKey: "",                            // alternativa přes Web3Forms
  photoPath: "assets/photo.jpg",               // fotka na začátku (čtverec)
  photoEndPath: "assets/photo-end.jpg"         // fotka na úplném konci (na výšku 4:5)
};

/* ---------- 2) TEXTY NA STRÁNCE ----------
   {jmeno}  = CONFIG.herName
   {jmeno5} = CONFIG.herNameVocative (nebo herName)
   {ja}     = CONFIG.myName                                  */
const TEXTS = {
  question: "{jmeno5}, půjdeš se mnou na rande? 🥺",
  tauntStart: "Nápověda: správná odpověď je ta růžová 😇",
  yesButton: "ANO 💖",
  noButton: "NE",
  photoAlt: "Naše fotka 💕",
  photoCaption: "DO BAGAA 🤍",                     // ručně psaný popisek pod fotkou

  step2Title: "Věděl jsem to! 🎉\nTak kdy?",        // \n = nový řádek
  timeLabel: "Nejdřív den, pak čas ⏰",
  timeLabelWithDate: "{datum} – v kolik?",
  datePast: "Do minulosti zatím cestovat neumím 🕰️ Vyber jiný den.",
  timePast: "Tenhle čas už utekl ⏰ (skoro tak rychle jako tlačítko NE)",

  step3Title: "Na co máš chuť? 😋",
  step3Subtitle: "Klikni na něco, nebo mi to prostě napiš 👇",
  otherIdeaLabel: "Nebo napiš, co by se ti líbilo ✍️",
  otherIdeaPlaceholder: "Třeba bowling, zmrzlina, výlet na kolech…",
  messageLabel: "Vzkaz pro mě 💌 (nepovinné, ale potěší)",

  step4Title: "Takže je to domluvené 📝",
  sendButton: "Odeslat 💌",
  sending: "Posílám poštovního holuba… 🕊️",
  retryButton: "Zkusit znovu 💌",
  sendError: "Holub se cestou ztratil 🥺 Zkus to prosím znovu.",
  missingKey: "Chybí adresa pro odeslání 🔑 Doplň CONFIG.apiUrl ve script.js.",

  thanksTitle: "Těším se! 💕",
  thanksSubtitle: "Odpověď už letí za mnou. Teď už nemůžeš couvnout 😌",
  thanksSignature: "FILIP (TRUBKA)",

  continue: "Pokračovat →",
  back: "← Zpět",

  // Email
  emailSubject: "💌 {jmeno} řekla ANO na rande!",
  emailFromName: "Rande web 💕"
};

/* ---------- 3) HLÁŠKY PO ÚTĚKU TLAČÍTKA NE ----------
   {pokusy} = kolikrát už to zkusila                         */
const TAUNTS = [
  "Ale no tak… 🥺",
  "Tohle tlačítko je jen na ozdobu 💅",
  "Chyba systému: odpověď NE nenalezena 🤖",
  "Tlačítko NE si vzalo dovolenou 🏝️",
  "Skóre: tlačítko {pokusy}, {jmeno5} 0 😎",
  "Máma říkala, že NE není odpověď 🙅",
  "Trénovalo na olympiádu, nemáš šanci 🏃",
  "Každý pokus vidím, jen aby bylo jasno 👀",
  "ANO je větší, protože je lepší 💖",
  "Programoval jsem to dvě hodiny, tak ať to stojí za to 😤",
  "Už {pokusy} pokusů… obdivuju tu vytrvalost 😅",
  "Pořád čekám na správnou odpověď 🥰"
];

/* ---------- 4) AKTIVITY (karty v kroku 3) ---------- */
const ACTIVITIES = [
  { id: "kino",       emoji: "🎬", label: "Kino" },
  { id: "fastfood",   emoji: "🍔", label: "Fast food" },
  { id: "netflix",    emoji: "📺", label: "Netflix" },
  { id: "prochazka",  emoji: "🌸", label: "Procházka" },
  { id: "projizdka",  emoji: "🚗", label: "Projížďka autem" },
  { id: "testoviny",  emoji: "🍝", label: "Těstoviny" }
];

/* ---------- 5) ČASY A KALENDÁŘ (krok 2) ---------- */
const TIME_FROM = "10:00";      // první nabízený čas
const TIME_TO = "22:00";        // poslední nabízený čas
const TIME_STEP = 30;           // po kolika minutách
const TIME_PREFERRED = "17:00"; // na tenhle čas se řada časů na začátku posune
const MONTHS_AHEAD = 12;        // kolik měsíců dopředu jde v kalendáři listovat

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
    .replaceAll("{ja}", CONFIG.myName)
    // nezlomitelná mezera před emoji, ať nikdy nezůstane samo na řádku
    .replace(/ ([\p{Extended_Pictographic}️‍]+)/gu, " $1");
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
    img.src = frame.dataset.photo === "end" ? CONFIG.photoEndPath : CONFIG.photoPath;
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

  if (step === 2) onEnterStep2();
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
  tauntEl.textContent = fill(TAUNTS[tauntIndex]).replaceAll("{pokusy}", state.noAttempts);
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
const calGrid = $("#cal-grid");
const calMonth = $("#cal-month");
const calPrev = $("#cal-prev");
const calNext = $("#cal-next");
const timeLabel = $("#time-label");
const timeChips = $("#time-chips");
const dateTimeError = $("#datetime-error");
const toStep3Btn = $("#to-step-3");

/** Zobrazený měsíc v kalendáři { y, m } (m = 0–11). */
let calView = null;

function pad2(n) { return String(n).padStart(2, "0"); }

/** YYYY-MM-DD v místním čase (ne UTC). */
function toISO(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function todayISO() { return toISO(new Date()); }
function nowHHMM() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Všechny nabízené časy podle TIME_FROM / TIME_TO / TIME_STEP. */
function buildTimeSlots() {
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const slots = [];
  for (let t = toMin(TIME_FROM); t <= toMin(TIME_TO); t += TIME_STEP) {
    slots.push(`${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`);
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

/** Dneska už nejde vybrat žádný čas (je moc pozdě)? */
function isTodayTooLate() {
  return nowHHMM() >= TIME_SLOTS[TIME_SLOTS.length - 1];
}

/** O kolik měsíců je {y, m} dál než aktuální měsíc. */
function monthOffset(y, m) {
  const now = new Date();
  return (y - now.getFullYear()) * 12 + (m - now.getMonth());
}

function setupStep2() {
  const now = new Date();
  calView = { y: now.getFullYear(), m: now.getMonth() };

  calPrev.addEventListener("click", () => shiftMonth(-1));
  calNext.addEventListener("click", () => shiftMonth(1));
  calGrid.addEventListener("click", (e) => {
    const day = e.target.closest(".cal-day");
    if (day && !day.disabled) selectDate(day.dataset.date);
  });
  calGrid.addEventListener("keydown", onCalendarKey);

  // Časy
  TIME_SLOTS.forEach((time) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "time-chip";
    chip.dataset.time = time;
    chip.textContent = time;
    chip.setAttribute("aria-pressed", "false");
    timeChips.appendChild(chip);
  });
  timeChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".time-chip");
    if (!chip || chip.disabled) return;
    state.time = chip.dataset.time;
    updateTimeChips();
    validateDateTime();
  });
  // Na počítači: kolečko myši posouvá řadu časů do strany
  timeChips.addEventListener("wheel", (e) => {
    const canScroll = timeChips.scrollWidth > timeChips.clientWidth;
    if (canScroll && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      timeChips.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  toStep3Btn.addEventListener("click", () => {
    if (validateDateTime()) goTo(3);
  });

  renderCalendar();
  updateTimeChips();
}

/** Volá se při každém vstupu do kroku 2 (mohla mezitím uběhnout půlnoc). */
function onEnterStep2() {
  renderCalendar();
  updateTimeChips();
  validateDateTime();
  // Řada časů je při skrytém kroku 0 px široká – posuň ji až teď
  requestAnimationFrame(() => {
    const target =
      timeChips.querySelector('.time-chip[aria-pressed="true"]') ||
      timeChips.querySelector(`.time-chip[data-time="${TIME_PREFERRED}"]:not(:disabled)`) ||
      timeChips.querySelector(".time-chip:not(:disabled)");
    if (target) timeChips.scrollLeft = target.offsetLeft - timeChips.offsetLeft - 12;
  });
}

function shiftMonth(delta) {
  const next = new Date(calView.y, calView.m + delta, 1);
  const offset = monthOffset(next.getFullYear(), next.getMonth());
  if (offset < 0 || offset >= MONTHS_AHEAD) return;
  calView = { y: next.getFullYear(), m: next.getMonth() };
  calGrid.dataset.dir = delta > 0 ? "next" : "prev";
  renderCalendar();
}

/** Vykreslí dny zobrazeného měsíce. */
function renderCalendar(focusISO = "") {
  const { y, m } = calView;
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // týden začíná pondělím
  const today = todayISO();
  const todayClosed = isTodayTooLate();

  calMonth.textContent = first.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

  const frag = document.createDocumentFragment();
  for (let i = 0; i < lead; i++) {
    const empty = document.createElement("span");
    empty.className = "cal-empty";
    frag.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const iso = toISO(date);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day";
    btn.dataset.date = iso;
    btn.tabIndex = -1;
    btn.setAttribute("aria-label", date.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" }));
    btn.innerHTML = `<span class="cal-day__num">${d}</span>`;

    if (iso < today || (iso === today && todayClosed)) btn.disabled = true;
    if (iso === today) {
      btn.classList.add("is-today");
      btn.setAttribute("aria-current", "date");
    }
    if ((date.getDay() + 6) % 7 >= 5) btn.classList.add("is-weekend");

    btn.setAttribute("aria-pressed", String(iso === state.date));
    frag.appendChild(btn);
  }

  calGrid.replaceChildren(frag);
  calGrid.classList.remove("is-turning");
  void calGrid.offsetWidth; // restart animace listování
  calGrid.classList.add("is-turning");

  // Roving tabindex: Tabem se jde jen na jeden den, šipkami po ostatních
  const tabTarget =
    (focusISO && calGrid.querySelector(`.cal-day[data-date="${focusISO}"]:not(:disabled)`)) ||
    calGrid.querySelector('.cal-day[aria-pressed="true"]') ||
    calGrid.querySelector(".cal-day.is-today:not(:disabled)") ||
    calGrid.querySelector(".cal-day:not(:disabled)");
  if (tabTarget) {
    tabTarget.tabIndex = 0;
    if (focusISO) tabTarget.focus();
  }

  calPrev.disabled = monthOffset(y, m) <= 0;
  calNext.disabled = monthOffset(y, m) >= MONTHS_AHEAD - 1;
}

function selectDate(iso) {
  state.date = iso;
  $$(".cal-day", calGrid).forEach((btn) => {
    const selected = btn.dataset.date === iso;
    btn.setAttribute("aria-pressed", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  updateTimeChips();
  validateDateTime();
}

/** Šipky / Home / End v kalendáři. */
function onCalendarKey(e) {
  const day = e.target.closest(".cal-day");
  if (!day) return;
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  const [y, m, d] = day.dataset.date.split("-").map(Number);
  let target;
  if (e.key in moves) target = new Date(y, m - 1, d + moves[e.key]);
  else if (e.key === "Home") target = new Date(y, m - 1, d - ((new Date(y, m - 1, d).getDay() + 6) % 7));
  else if (e.key === "End") target = new Date(y, m - 1, d + (6 - ((new Date(y, m - 1, d).getDay() + 6) % 7)));
  else return;
  e.preventDefault();

  const iso = toISO(target);
  const offset = monthOffset(target.getFullYear(), target.getMonth());
  if (iso < todayISO() || offset >= MONTHS_AHEAD) return;

  if (target.getMonth() !== calView.m || target.getFullYear() !== calView.y) {
    calGrid.dataset.dir = target > new Date(y, m - 1, d) ? "next" : "prev";
    calView = { y: target.getFullYear(), m: target.getMonth() };
    renderCalendar(iso);
    return;
  }
  const next = calGrid.querySelector(`.cal-day[data-date="${iso}"]`);
  if (!next || next.disabled) return;
  $$(".cal-day", calGrid).forEach((btn) => { btn.tabIndex = -1; });
  next.tabIndex = 0;
  next.focus();
}

/** Zakáže časy, které dneska už proběhly, a označí vybraný. */
function updateTimeChips() {
  const isToday = state.date === todayISO();
  const now = nowHHMM();
  $$(".time-chip", timeChips).forEach((chip) => {
    const past = isToday && chip.dataset.time <= now;
    chip.disabled = past;
    if (past && state.time === chip.dataset.time) state.time = "";
  });
  $$(".time-chip", timeChips).forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.time === state.time));
  });
  timeLabel.textContent = state.date
    ? TEXTS.timeLabelWithDate.replace("{datum}", formatDateCz(state.date))
    : TEXTS.timeLabel;
}

/** Kontrola před pokračováním (např. když stránka zůstala otevřená přes noc). */
function validateDateTime() {
  let error = "";
  if (state.date && state.date < todayISO()) {
    error = TEXTS.datePast;
  } else if (state.date === todayISO() && state.time && state.time <= nowHHMM()) {
    error = TEXTS.timePast;
  }

  dateTimeError.textContent = error;
  dateTimeError.hidden = !error;

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
      updateStep3Button();
    });
    activityGrid.appendChild(card);
  });

  otherIdeaInput.placeholder = TEXTS.otherIdeaPlaceholder;
  otherIdeaInput.addEventListener("input", () => {
    state.otherIdea = otherIdeaInput.value;
    updateStep3Button();
  });
  messageInput.addEventListener("input", () => { state.message = messageInput.value; });

  toStep4Btn.addEventListener("click", () => {
    if (hasActivityChoice()) goTo(4);
  });
}

/** Stačí vybrat kartu, NEBO napsat vlastní nápad. */
function hasActivityChoice() {
  return state.activities.size > 0 || state.otherIdea.trim().length > 0;
}

function updateStep3Button() {
  toStep4Btn.disabled = !hasActivityChoice();
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
    { icon: "💗", label: "Program", value: selectedActivityLabels().join(", ") },
    { icon: "✍️", label: "Tvůj nápad", value: state.otherIdea.trim() },
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
    ["✍️ Její nápad", state.otherIdea.trim()],
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
