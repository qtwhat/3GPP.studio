// LCP 三逻辑信道模型（38.321 V19.3.0 §5.4.3.1），授权大小随时间变化。
// 讲解页 v2 在浏览器里用同一个 simulate() 重算；node model2.mjs 打印默认场景供核对。
// 规则：每次 LCP 前 Bj += PBR × T，截到 PBR × BSD；第一轮按优先级给 Bj > 0 的信道分配，
// 整个 SDU 装得下就整段发，装不下就分段填满，发到 Bj ≤ 0 或授权用完，扣 Bj；
// 第二轮按严格优先级填满剩余授权，不扣 Bj。忽略 MAC 与 RLC 头。

export const T = 10; // ms，授权间隔
export const STEPS = 40;
export const PBR_OPTIONS = [0, 8, 16, 32, 64, 128]; // 字节每毫秒（kBps）
export const BSD_OPTIONS = [10, 20, 50, 100, 150, 300]; // ms

export const DEFAULT_LCH = [
  { name: "A", priority: 1, pbr: 8, bsd: 20, sdu: 100, every: 2, count: 1 }, // 每 20 ms 一个 100 字节包，5 B/ms
  { name: "B", priority: 2, pbr: 64, bsd: 50, sdu: 500, every: 1, count: 2 }, // 每 10 ms 两个 500 字节包，100 B/ms
  { name: "C", priority: 3, pbr: 16, bsd: 100, sdu: 300, every: 1, count: 99 }, // 一直有数据
];

export const GRANT_PROFILES = {
  steady: { label: "steady 1500 B", sizes: Array(STEPS).fill(1500) },
  dip: { label: "cell-edge dip (300 B for 100 ms)", sizes: Array.from({ length: STEPS }, (_, i) => (i >= 10 && i < 20 ? 300 : 1500)) },
  rough: { label: "fluctuating 300–2000 B", sizes: [1500, 1800, 900, 600, 300, 400, 1200, 2000, 1700, 800, 300, 300, 500, 1100, 1600, 1900, 1400, 700, 400, 300, 600, 1000, 1500, 2000, 1800, 1200, 600, 300, 300, 800, 1400, 1700, 2000, 1600, 900, 500, 700, 1300, 1800, 1500] },
};

export function simulate(lchs, sizes) {
  const ch = lchs.map((c) => ({ ...c, cap: c.pbr * c.bsd, bj: c.pbr * c.bsd, q: [] }));
  const order = ch.map((_, i) => i).sort((a, b) => ch[a].priority - ch[b].priority || a - b);
  const out = [{ k: 0, grant: 0, bj: ch.map((c) => c.bj), pre: ch.map((c) => c.bj), over: ch.map(() => false), allocs: [], head: ch.map(() => 0), backlog: ch.map(() => 0) }];
  for (let k = 1; k <= sizes.length; k++) {
    const over = [], pre = [];
    for (const c of ch) {
      if ((k - 1) % c.every === 0) for (let i = 0; i < c.count; i++) c.q.push(c.sdu);
      c.q = c.q.slice(0, 40);
      over.push(c.cap > 0 && c.bj + c.pbr * T > c.cap);
      c.bj = Math.min(c.bj + c.pbr * T, c.cap);
      pre.push(c.bj);
    }
    const head = ch.map((c) => c.q[0] || 0);
    const allocs = [];
    let room = sizes[k - 1];
    const take = (i, round) => {
      const c = ch[i];
      const n = Math.min(c.q[0], room);
      c.q[0] -= n;
      if (c.q[0] === 0) c.q.shift();
      room -= n;
      if (round === 1) c.bj -= n;
      allocs.push({ ch: i, bytes: n, round, nextHead: c.q[0] || 0 });
    };
    for (const i of order) while (ch[i].bj > 0 && room > 0 && ch[i].q.length) take(i, 1);
    for (const i of order) while (room > 0 && ch[i].q.length) take(i, 2);
    out.push({ k, grant: sizes[k - 1], bj: ch.map((c) => c.bj), pre, over, allocs, head, backlog: ch.map((c) => c.q.reduce((s, b) => s + b, 0)) });
  }
  return out;
}

export function stats(sim, n) {
  return Array.from({ length: n }, (_, c) => {
    let r1 = 0, r2 = 0, run = 0, longest = 0;
    for (const s of sim.slice(1)) {
      const sent = s.allocs.filter((a) => a.ch === c).reduce((t, a) => t + a.bytes, 0);
      r1 += s.allocs.filter((a) => a.ch === c && a.round === 1).reduce((t, a) => t + a.bytes, 0);
      r2 += s.allocs.filter((a) => a.ch === c && a.round === 2).reduce((t, a) => t + a.bytes, 0);
      run = sent || !s.head[c] ? 0 : run + 1; // 只数「缓存里有数据却一个字节都没发」的授权
      longest = Math.max(longest, run);
    }
    return { r1, r2, rate: (r1 + r2) / ((sim.length - 1) * T), starve: longest * T };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [key, profile] of Object.entries(GRANT_PROFILES)) {
    const sim = simulate(DEFAULT_LCH, profile.sizes);
    console.log(`\n== ${profile.label} ==`);
    console.log("k  grant | " + DEFAULT_LCH.map((c) => `${c.name}: pre  r1  r2  Bj  backlog`).join(" | "));
    for (const s of sim.slice(1)) {
      const cols = DEFAULT_LCH.map((_, c) => {
        const r1 = s.allocs.filter((a) => a.ch === c && a.round === 1).reduce((t, a) => t + a.bytes, 0);
        const r2 = s.allocs.filter((a) => a.ch === c && a.round === 2).reduce((t, a) => t + a.bytes, 0);
        return `${String(s.pre[c]).padStart(5)} ${String(r1).padStart(4)} ${String(r2).padStart(4)} ${String(s.bj[c]).padStart(5)} ${String(s.backlog[c]).padStart(6)}`;
      });
      console.log(`${String(s.k).padStart(2)} ${String(s.grant).padStart(5)} | ${cols.join(" | ")}`);
    }
    stats(sim, 3).forEach((st, c) => console.log(`${DEFAULT_LCH[c].name}: 第一轮 ${st.r1}、第二轮 ${st.r2} 字节，平均 ${st.rate.toFixed(1)} B/ms，有数据却连续没发 ${st.starve} ms`));
  }
}
