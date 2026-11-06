// LCP 令牌桶讲解图第 2 版：三个逻辑信道、可调参数、授权大小随时间变化。
// node build2.mjs [--light]，写出 lcp-three-channels[-light].html。模型在 model2.mjs，页面内用同一份代码重算。
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL = join(dirname(fileURLToPath(import.meta.url)), "vendor", "anatomy");
const k = await import(pathToFileURL(join(SKILL, "kit/iso-kit.mjs")).href);
const { kitScript } = await import(pathToFileURL(join(SKILL, "scripts/inline-kit.mjs")).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const MODEL_SRC = readFileSync(join(HERE, "model2.mjs"), "utf8").split("if (import.meta.url")[0].replace(/^export /gm, "");

const WIDTH = 660;
const HEIGHT = 470;

const PLATE = { x: -154, y: -84, w: 150, d: 136, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const PAD_H = 4;
const TANK_H = 64;
const TANKS = [-136, -96, -56].map((x) => ({ plan: { x, y: -66, w: 26, d: 24, r: 2 }, floor: PAD_H, H: TANK_H }));
const DECKS = TANKS.map((t) => ({ x: t.plan.x - 3, y: -30, w: 32, d: 11, r: 1.5 }));
const DECK_H = 5;
const BRICK_D = 7;
const BRICK_H = [4, 7, 5.5];
const BL = 0.04; // 每字节的长度
const TRAY = { x: -134, y: -6, d: 11 };
const TRAY_Z = 7;
const TRAY_H = 1.4;
const CONV = { x0: -140, x1: -134 + 2000 * BL + 8 };
const TERRAIN_Y = 34;
const TERRAIN_X = (i) => -140 + i * 3;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [TANKS[0].plan.x + 13, TANKS[0].plan.y - 7, TANK_H + PAD_H + 22], [TANKS[2].plan.x + 13, TANKS[2].plan.y - 7, TANK_H + PAD_H + 22]],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 64, elevation: 34 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // 「地面」：40 根小柱的底板，每根柱高 = 那一次授权的大小
  const bed = { x: TERRAIN_X(0) - 2, y: TERRAIN_Y - 3, w: 40 * 3 + 2, d: 7, r: 1 };
  out.push(S(k.slabOf(bed, 0, 1, P, 3, 0.3), { tone: "lo" }));
  return out.join("");
}

function inlet(t) {
  const { plan } = t;
  const cx = plan.x + plan.w / 2, py = plan.y - 7, top = t.floor + t.H + 14;
  const out = [];
  out.push(S(k.cylinder(cx, py, 3.8, 0, 2, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(cx, py, 2, 2, top - 2, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([0.35, 0.7].map((f) => k.sideArc(cx, py, 2, 2 + (top - 2) * f, P, 12)).join(""), { tone: "faint" }));
  out.push(S(k.slabOf({ x: cx - 2.2, y: py - 2.2, w: 4.4, d: plan.d / 2 + 2.2 + 7, r: 1.1 }, top, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(cx, plan.y + plan.d / 2, 1.6, top - 4, 4, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(cx, py, 3.2, top + 3, 3, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(cx, py, 3.2, top + 3, top + 6, 28, P), { tone: "lo" }));
  out.push(D([at([cx, py, top + 6])], { size: 0.5, tone: "hi" }));
  return out.join("");
}

function tankBack(t) {
  const { plan } = t;
  const out = [];
  const pad = k.insetPlan(plan, -3);
  out.push(`<path class="iso-halo" d="${k.haloOf(pad, 0, PAD_H, P)}"/>`);
  out.push(S(k.slabOf(pad, 0, PAD_H, P, 4, 0.6), { tone: "mid" }));
  out.push(D(k.corners(pad, 1.8).map(([x, y]) => at([x, y, PAD_H])), { size: 0.4, tone: "lo" }));
  out.push(S(k.slabOf({ x: plan.x, y: plan.y, w: plan.w, d: 1.2, r: 0.3 }, PAD_H, t.H, P, 2), { tone: "lo", crease: "none" }));
  out.push(S(k.slabOf({ x: plan.x, y: plan.y, w: 1.2, d: plan.d, r: 0.3 }, PAD_H, t.H, P, 2), { tone: "lo", crease: "none" }));
  out.push(S(k.cylinder(plan.x, plan.y, 1.3, PAD_H, t.H, P, 12), { tone: "mid", crease: "none" }));
  return out.join("");
}

function tankFront(t, index) {
  const { plan } = t;
  const out = [];
  const top = t.floor + t.H;
  for (const [x, y] of byDepth([[plan.x + plan.w, plan.y], [plan.x, plan.y + plan.d], [plan.x + plan.w, plan.y + plan.d]])) {
    out.push(S(k.cylinder(x, y, 1.3, PAD_H, t.H, P, 12), { tone: "mid", crease: "none" }));
  }
  const rim = [
    { x: plan.x - 1, y: plan.y - 1, w: plan.w + 2, d: 2.2, r: 0.5 },
    { x: plan.x - 1, y: plan.y - 1, w: 2.2, d: plan.d + 2, r: 0.5 },
    { x: plan.x + plan.w - 1.2, y: plan.y - 1, w: 2.2, d: plan.d + 2, r: 0.5 },
    { x: plan.x - 1, y: plan.y + plan.d - 1.2, w: plan.w + 2, d: 2.2, r: 0.5 },
  ];
  rim.forEach((r) => out.push(S(k.slabOf(r, top, 1.6, P, 2), { tone: "mid" })));
  out.push(D(k.corners({ x: plan.x - 1, y: plan.y - 1, w: plan.w + 2, d: plan.d + 2, r: 0 }, 1.1).map(([x, y]) => at([x, y, top + 1.6])), { size: 0.4, tone: "hi" }));
  const sp = { x: plan.x + plan.w + 1, y: plan.y + plan.d / 2 - 2.5, w: 6, d: 5, r: 1 };
  out.push(S(k.slabOf(sp, top - 3, 2.4, P, 2, 0.3), { tone: "mid" }));
  const cup = { x: sp.x, y: sp.y - 1.5, w: 7, d: 8, r: 1.5 };
  out.push(S(k.slabOf(cup, 0, 3, P, 3, 0.4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(cup, 1.2), 3, P, 3), { tone: "faint" }));
  const vx = plan.x + plan.w / 2, vy = plan.y + plan.d;
  out.push(S(k.slabOf({ x: vx - 3.5, y: vy, w: 7, d: 3, r: 0.8 }, PAD_H + 0.5, 6, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(vx, vy + 4.5, 2.4, PAD_H + 2, 2.4, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(vx, vy + 4.5, 2.4, PAD_H + 2, PAD_H + 4.4, 16, P), { tone: "lo" }));
  // 优先级铭牌：底座前沿的小板，上面的圆点数由页面按优先级画
  const tag = { x: plan.x + 1, y: plan.y + plan.d + 1.2, w: 7, d: 3.4, r: 0.6 };
  out.push(S(k.slabOf(tag, PAD_H, 0.6, P, 2), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([plan.x + plan.w - 4, plan.y + plan.d + 2.6], PAD_H, P, "x"), ["A", "B", "C"][index], { size: 2.6, tone: "mid", anchor: "middle" }));
  return out.join("");
}

function deck(i) {
  const plan = DECKS[i];
  const out = [];
  out.push(S(k.slabOf(plan, 0, DECK_H, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.lineOnTop([plan.x, plan.y + 2], [plan.x + plan.w - 2.5, plan.y + 2], DECK_H, P) + k.lineOnTop([plan.x, plan.y + plan.d - 2], [plan.x + plan.w - 2.5, plan.y + plan.d - 2], DECK_H, P), { tone: "faint" }));
  out.push(S(k.slabOf({ x: plan.x + plan.w - 2.5, y: plan.y + 0.5, w: 2, d: plan.d - 1, r: 0.4 }, DECK_H, 3, P, 2), { tone: "mid" }));
  out.push(D(k.corners(plan, 1.2).map(([x, y]) => at([x, y, DECK_H])), { size: 0.4, tone: "lo" }));
  return out.join("");
}

function conveyor() {
  const out = [];
  for (const y of [TRAY.y - 2.5, TRAY.y + TRAY.d + 0.5]) {
    out.push(S(k.slabOf({ x: CONV.x0, y, w: CONV.x1 - CONV.x0, d: 2, r: 0.5 }, 0, TRAY_Z - 0.4, P, 2, 0.3), { tone: "mid" }));
    const pins = [];
    for (let x = CONV.x0 + 4; x < CONV.x1 - 2; x += 9) pins.push(at([x, y + 1, TRAY_Z - 0.4]));
    out.push(D(pins, { size: 0.4, tone: "lo" }));
  }
  for (const x of [CONV.x0 - 3, CONV.x1]) out.push(S(k.slabOf({ x, y: TRAY.y - 3, w: 3, d: TRAY.d + 6, r: 0.8 }, 0, TRAY_Z + 3, P, 2, 0.4), { tone: "mid" }));
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Three glass tanks for three logical channels A, B and C. Each tank's water level is Bj, scaled so the brim is the bucket size PBR × BSD and a bright line marks Bj = 0; pips on a small plate show the priority. Taps refill each tank before every grant. SDU bricks wait on decks and are loaded onto a grant tray whose length is the grant size. A row of pillars along the front is the grant size over 40 grants, with the current one lit.",
  body: [
    plate(),
    `<g data-part="terrain"></g>`,
    ...TANKS.map((t) => inlet(t)),
    ...TANKS.flatMap((t, i) => [tankBack(t), `<g data-part="water-${i}"></g><g data-part="zero-${i}"></g><g data-part="flow-${i}"></g>`, tankFront(t, i), `<g data-part="pips-${i}"></g>`]),
    ...DECKS.map((_, i) => deck(i)),
    `<g data-part="head"></g>`,
    conveyor(),
    `<g data-part="tray"></g>`,
    `<g data-part="bricks"></g>`,
  ],
});

const live = `
${MODEL_SRC}
const P = ${JSON.stringify(P)};
const TANKS = ${JSON.stringify(TANKS)}, DECKS = ${JSON.stringify(DECKS)}, TRAY = ${JSON.stringify(TRAY)};
const BL = ${BL}, DECK_H = ${DECK_H}, BRICK_D = ${BRICK_D}, BRICK_H = ${JSON.stringify(BRICK_H)}, TRAY_Z = ${TRAY_Z}, TRAY_H = ${TRAY_H}, PAD_H = ${PAD_H}, TERRAIN_Y = ${TERRAIN_Y};
const TERRAIN_X = ${TERRAIN_X.toString()};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const water = [0, 1, 2].map((i) => part("water-" + i)), zero = [0, 1, 2].map((i) => part("zero-" + i)), flow = [0, 1, 2].map((i) => part("flow-" + i)), pips = [0, 1, 2].map((i) => part("pips-" + i));
const headLayer = part("head"), brickLayer = part("bricks"), trayLayer = part("tray"), terrainLayer = part("terrain");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const REFILL = 0.6, START = 0.8, EACH = 0.42, HOLD = 0.9, CLEAR = 0.4;

let lch = DEFAULT_LCH.map((c) => ({ ...c }));
let profile = "dip";
let SIM = [], k = 0, t = 0, playing = !still.matches, frame = 0, last = 0, visible = false, idle = 0;
const cache = { water: ["", "", ""], zero: ["", "", ""], flow: ["", "", ""], head: "", tray: "", terrain: "" };

const lengthOf = (step) => START + step.allocs.length * EACH + HOLD + CLEAR;
const lowOf = (c) => -lch[c].sdu;
const levelZ = (c, bj) => { const tk = TANKS[c], cap = lch[c].pbr * lch[c].bsd, low = lowOf(c); return tk.floor + clamp01((bj - low) / Math.max(cap - low, 1)) * tk.H; };

function brick(ch, bytes, x, y, z, round, alpha) {
  const plan = { x, y, w: Math.max(bytes * BL, 0.8), d: BRICK_D, r: 0.5 };
  const h = BRICK_H[ch];
  let s = solidSvg(slabOf(plan, z, h, P, 2, 0.3), { tone: round === 2 ? "lo" : "hi", crease: round === 2 ? "faint" : "lo" });
  if (plan.w > 6) s += faceTextSvg(topMatrix([x + plan.w / 2, y + BRICK_D / 2 + 1], z + h, P, "x"), lch[ch].name, { size: 2.4, tone: "mid", anchor: "middle" });
  const o = alpha * (round === 2 ? 0.5 : 1);
  return o < 1 ? '<g opacity="' + o.toFixed(2) + '">' + s + '</g>' : s;
}
const deckSpot = (ch, bytes) => [DECKS[ch].x + DECKS[ch].w - 3 - Math.min(bytes * BL, DECKS[ch].w - 4), DECKS[ch].y + 2, DECK_H];

function drawStatic() {
  const sizes = GRANT_PROFILES[profile].sizes;
  terrainLayer.innerHTML = sizes.map((g, i) => solidSvg(slabOf({ x: TERRAIN_X(i), y: TERRAIN_Y - 1.5, w: 2.2, d: 3, r: 0.4 }, 1, g / 100, P, 2), { tone: i + 1 === k ? "hi" : "lo", crease: "none", lit: i + 1 === k })).join("");
  for (let c = 0; c < 3; c++) {
    const tk = TANKS[c], { plan } = tk;
    const pr = lch[c].priority;
    const dots = [];
    for (let i = 0; i < 4 - pr; i++) dots.push(iso([plan.x + 2.4 + i * 1.8, plan.y + plan.d + 2.9, PAD_H + 0.6], P));
    pips[c].innerHTML = dotsSvg(dots, { size: 0.7, tone: "hi" });
  }
}

function draw() {
  const step = SIM[k], prev = SIM[Math.max(0, k - 1)];
  const level = [0, 1, 2].map((c) => (k === 0 ? step.bj[c] : prev.bj[c] + (step.pre[c] - prev.bj[c]) * ease(t / REFILL)));
  const pieces = [];
  let offset = 0;
  const heads = k === 0 ? [0, 0, 0] : step.head.slice();
  const clearing = ease((t - (START + step.allocs.length * EACH + HOLD)) / CLEAR);
  step.allocs.forEach((a, i) => {
    const s0 = START + i * EACH;
    const g = ease((t - s0) / (EACH * 0.85));
    if (a.round === 1) level[a.ch] -= a.bytes * g;
    if (t >= s0) heads[a.ch] = a.nextHead;
    if (t > s0) {
      const [dx, dy, dz] = deckSpot(a.ch, a.bytes);
      const tx = TRAY.x + 2 + offset + clearing * 20, ty = TRAY.y + 2, tz = TRAY_Z + TRAY_H;
      pieces.push(brick(a.ch, a.bytes, dx + (tx - dx) * g, dy + (ty - dy) * g, dz + (tz - dz) * g + 14 * Math.sin(Math.PI * g), a.round, 1 - clearing));
    }
    offset += a.bytes * BL;
  });
  brickLayer.innerHTML = pieces.join("");
  const head = [0, 1, 2].map((c) => (heads[c] ? brick(c, heads[c], ...deckSpot(c, heads[c]), 1, 1) : "")).join("");
  if (head !== cache.head) { headLayer.innerHTML = head; cache.head = head; }
  const tray = k === 0 ? "" : solidSvg(slabOf({ x: TRAY.x, y: TRAY.y, w: step.grant * BL + 4, d: TRAY.d, r: 1.2 }, TRAY_Z, TRAY_H, P, 3, 0.4), { tone: "hi", crease: "lo" });
  if (tray !== cache.tray) { trayLayer.innerHTML = tray; cache.tray = tray; }
  for (let c = 0; c < 3; c++) {
    const tk = TANKS[c], { plan } = tk;
    const z = levelZ(c, level[c]);
    const inner = { x: plan.x + 1.4, y: plan.y + 1.4, w: plan.w - 2.8, d: plan.d - 2.8, r: 1 };
    const w = solidSvg(slabOf(inner, tk.floor, Math.max(z - tk.floor, 0.3), P, 2), { tone: "hi", crease: "faint", lit: true });
    if (w !== cache.water[c]) { water[c].innerHTML = w; cache.water[c] = w; }
    const z0 = levelZ(c, 0);
    const zl = lineSvg(segment([plan.x, plan.y + plan.d, z0], [plan.x + plan.w, plan.y + plan.d, z0], P) + segment([plan.x + plan.w, plan.y, z0], [plan.x + plan.w, plan.y + plan.d, z0], P), { tone: "hi" });
    if (zl !== cache.zero[c]) { zero[c].innerHTML = zl; cache.zero[c] = zl; }
    const top = tk.floor + tk.H;
    const cx = plan.x + plan.w / 2, cy = plan.y + plan.d / 2;
    let f = "";
    if (k > 0 && t < REFILL && lch[c].pbr > 0) {
      f += '<g style="stroke-width:' + (0.4 + lch[c].pbr / 40).toFixed(2) + 'px">' + lineSvg(segment([cx, cy, top + 10], [cx, cy, z + 0.2], P), { tone: "hi", dashed: true, flow: true }) + '</g>';
      if (step.over[c] && t > REFILL * 0.35) {
        const sx = plan.x + plan.w + 6.5, sy = plan.y + plan.d / 2;
        f += lineSvg(segment([sx, sy, top - 3], [sx, sy, 3], P), { tone: "hi", dashed: true, flow: true });
      }
    }
    if (f !== cache.flow[c]) { flow[c].innerHTML = f; cache.flow[c] = f; }
  }
  const text = (k === 0 ? "start" : "grant " + k + " · " + step.grant + " B") + " · Bj " + [0, 1, 2].map((c) => lch[c].name + " " + Math.round(level[c])).join(" ");
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(k));
}

function rerun() {
  SIM = simulate(lch, GRANT_PROFILES[profile].sizes);
  k = 0; t = 0; cache.tray = ""; cache.head = "";
  drawStatic(); draw(); report();
}
function go(next) { k = (next + SIM.length) % SIM.length; t = 0; drawStatic(); }
function settleAt(next) { k = Math.max(0, Math.min(SIM.length - 1, next)); t = k === 0 ? 0 : lengthOf(SIM[k]) - CLEAR - 0.001; drawStatic(); }
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (playing) { t += dt; if (t >= (k === 0 ? 1.2 : lengthOf(SIM[k]))) go(k + 1); }
  draw();
  frame = visible && playing ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && playing) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => { playing = false; clearTimeout(idle); idle = setTimeout(() => { if (!still.matches) { playing = true; run(); } }, 12000); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") { pause(); settleAt(k + 1); }
  else if (event.key === "ArrowLeft") { pause(); settleAt(k - 1); }
  else if (event.key === " ") { if (playing) pause(); else { clearTimeout(idle); playing = true; run(); } }
  else if (event.key === "Home") { pause(); settleAt(0); }
  else if (event.key === "End") { pause(); settleAt(SIM.length - 1); }
  else return;
  event.preventDefault();
  draw();
});
stage.addEventListener("click", () => { if (playing) pause(); else { clearTimeout(idle); playing = true; run(); } });

// 参数面板与统计表
const form = document.querySelector(".lcp-controls");
const opt = (list, value, unit) => list.map((v) => '<option value="' + v + '"' + (v === value ? " selected" : "") + ">" + v + unit + "</option>").join("");
function buildForm() {
  form.innerHTML = '<label class="lcp-profile">grant sizes <select data-k="profile">' + Object.entries(GRANT_PROFILES).map(([key, p]) => '<option value="' + key + '"' + (key === profile ? " selected" : "") + ">" + p.label + "</option>").join("") + "</select></label>" +
    '<table><thead><tr><th>LCH</th><th>traffic</th><th>priority</th><th>PBR</th><th>BSD</th><th>bucket</th><th>rate</th><th>1st / 2nd round</th><th>waited with data</th></tr></thead><tbody>' +
    lch.map((c, i) => '<tr><th>' + c.name + '</th><td>' + (c.count > 50 ? "always has " + c.sdu + " B SDUs" : c.count + " × " + c.sdu + " B every " + c.every * 10 + " ms") + '</td><td><select data-i="' + i + '" data-k="priority">' + opt([1, 2, 3], c.priority, "") + '</select></td><td><select data-i="' + i + '" data-k="pbr">' + opt(PBR_OPTIONS, c.pbr, " B/ms") + '</select></td><td><select data-i="' + i + '" data-k="bsd">' + opt(BSD_OPTIONS, c.bsd, " ms") + '</select></td><td data-cap="' + i + '"></td><td data-rate="' + i + '"></td><td data-split="' + i + '"></td><td data-starve="' + i + '"></td></tr>').join("") +
    '</tbody></table><button type="button" data-k="reset">reset</button>';
}
function report() {
  const st = stats(SIM, 3);
  st.forEach((s, i) => {
    form.querySelector('[data-cap="' + i + '"]').textContent = lch[i].pbr * lch[i].bsd + " B";
    form.querySelector('[data-rate="' + i + '"]').textContent = s.rate.toFixed(1) + " B/ms";
    form.querySelector('[data-split="' + i + '"]').textContent = s.r1 + " / " + s.r2 + " B";
    form.querySelector('[data-starve="' + i + '"]').textContent = s.starve + " ms";
  });
}
form.addEventListener("change", (e) => {
  const el = e.target, key = el.dataset.k;
  if (key === "profile") profile = el.value;
  else lch[+el.dataset.i][key] = +el.value;
  rerun();
  playing = !still.matches; run();
});
form.addEventListener("click", (e) => { if (e.target.dataset.k === "reset") { lch = DEFAULT_LCH.map((c) => ({ ...c })); profile = "dip"; buildForm(); rerun(); } });
buildForm();
rerun();
if (still.matches) settleAt(20);
draw();
`;

const CSS = `<style>
[data-part^="water"]{--anatomy-lit-top:color-mix(in srgb,var(--anatomy-blue) 42%,var(--anatomy-card));--anatomy-lit-shade:color-mix(in srgb,var(--anatomy-blue) 30%,var(--anatomy-card));--anatomy-face:color-mix(in srgb,var(--anatomy-blue) 24%,var(--anatomy-card))}
.lcp-controls{margin-top:16px;font:12px/1.5 var(--anatomy-mono);color:var(--anatomy-text);overflow-x:auto}
.lcp-controls table{border-collapse:collapse;width:100%;margin:8px 0}
.lcp-controls th,.lcp-controls td{border-bottom:1px solid color-mix(in srgb,var(--anatomy-text) 18%,transparent);padding:4px 6px;text-align:left;white-space:nowrap}
.lcp-controls thead th{color:var(--anatomy-muted);font-weight:400}
.lcp-controls select,.lcp-controls button{font:inherit;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid color-mix(in srgb,var(--anatomy-text) 30%,transparent);border-radius:4px;padding:1px 4px}
</style>`;

const body = k.plateHtml({
  fig: "Fig 3",
  title: "LCP, three channels",
  hint: "Click to pause · ← → step",
  readout: "start",
  keys: [
    { mark: "lit", label: "Water = Bj; brim = PBR × BSD; bright line = Bj 0; pips = priority (3 pips highest)" },
    { mark: "raised", label: "Solid brick: first round, lowers its tank" },
    { mark: "dim", label: "Faded brick: second round, tank untouched" },
    { mark: "flat", label: "Front pillars: grant size per 10 ms; the lit one is now" },
  ],
  caption:
    "Change priority, PBR or BSD below and the 40 grants are recomputed at once. In the default cell-edge dip the grant shrinks to 300 B for grants 11–20: A and B use it all, C sends nothing, and its bucket fills. When grants return to 1500 B, B's bucket (64 × 50 = 3200 B) is full too and goes first, so C waits three more grants: 130 ms with data and nothing sent. Set B's BSD to 10 ms and C resumes at grant 21; set C's PBR to 0 and it waits 260 ms.",
  body: `${CSS}<div class="iso-stage" tabindex="0" role="slider" aria-label="LCP with three logical channels: arrow keys step one grant at a time" aria-valuemin="0" aria-valuemax="40" aria-valuenow="0">${svg}</div>`,
});

const name = theme === "light" ? "lcp-three-channels-light.html" : "lcp-three-channels.html";
writeFileSync(join(process.env.LCP_OUTPUT_DIR || HERE, name), k.pageHtml({ title: "LCP, three channels", theme, width: 760, body: body + `<form class="lcp-controls" onsubmit="return false"></form>`, script: kitScript() + live }));
console.log("wrote", name);
