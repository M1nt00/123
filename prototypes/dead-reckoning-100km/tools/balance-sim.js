// PROTOTYPE - NOT FOR PRODUCTION
// Question: 덱을 다듬는 선택이 "어느 거리에서 싸울지"를 실제로 바꾸는가?
// Date: 2026-11-12
//
// 밸런스 시뮬레이션: 화면 없이 항해를 여러 판 돌려서 숫자가 어떤지 본다. 게임은 이 파일을 불러오지 않는다.
//   node tools/balance-sim.js [판 수=300] [읽기 수준=reader|coin|blind]
//
// 무엇을 하나: data/*.js 와 src/battle.js · src/ai.js (게임이 쓰는 규칙 그대로)를 불러와서,
//   적 AI와 같은 두뇌를 내 쪽에 앉히고 (aiPlan을 거울처럼 뒤집어 씀) 끝없는 항해를 흉내 낸다.
//   항로 · 보상은 src/voyage.js의 화면 흐름을 단순하게 옮긴 것: 전투 뒤 응급 수리, 카드 · 수리 · 개조 보상,
//   정비 지점, 정예, 구역마다 보스. 카드는 3장 중 무작위, 개조는 가진 덱에 맞는 것을 고른다.
// 읽기 수준 (내가 적의 이번 턴 이동을 얼마나 아나):
//   blind  = 전혀 모름 (늘 '적은 가만히 있다'고 봄)
//   coin   = 적 AI와 같음 (지난 턴 이동을 반쯤 믿음) — 기획/03의 '숙련 AI'
//   reader = 적 의도를 보는 사람: 방향은 늘 알고, 거리는 절반쯤 맞힘
// 이것이 말해 주지 않는 것: 사람이 느끼는 재미 · 공정함. 숫자는 '너무 쉽다 / 불가능하다'를 가르는 데만 쓴다.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = { Math, console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data/cards.js', 'data/rules.js', 'data/voyage.js', 'src/battle.js', 'src/ai.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const run = (code) => vm.runInContext(code, ctx);
const DATA = ctx.DATA;
const G = { newBattle: run('newBattle'), aiPlan: run('aiPlan'), resolveSteps: run('resolveSteps'), startTurn: run('startTurn'), planSummary: run('planSummary'), shuffle: run('shuffle') };

const runs = +process.argv[2] || 300, skill = process.argv[3] || 'reader';
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

// 내 쪽 계획: 적 AI의 두뇌를 거울처럼 뒤집어 씀
function myPlan(B, enemyMove) {
  const M = Object.create(B); M.enemy = B.player; M.player = B.enemy;
  let pred;
  if (skill === 'blind') pred = 0;
  else if (skill === 'reader') { const dir = Math.sign(enemyMove); pred = dir === 0 ? 0 : Math.random() < 0.5 ? enemyMove : dir * 2; }
  return G.aiPlan(M, pred);
}

// 전투 한 판. 돌려주는 값: { won, turns, hull }
function battle(enemyKey, ship, hullMult, extraCards) {
  const B = G.newBattle(enemyKey, { hull: ship.hull, maxHull: ship.maxHull, reactor: ship.reactor, cooling: ship.cooling, deck: ship.deck.slice(), mods: ship.mods.slice() });
  if (hullMult !== 1) B.enemy.hull = B.enemy.maxHull = Math.round(B.enemy.hull * hullMult);
  for (let k = 0; k < extraCards; k++) B.enemy.draw.push(rnd(DATA.endless.extraCards));
  G.shuffle(B.enemy.draw);
  for (let guard = 0; guard < 60 && B.phase !== 'over'; guard++) {
    B.enemy.plan = G.aiPlan(B);
    const E = B.enemy, ePlan = E.skip ? { items: [], cool: 0, engine: E.plan.engine || 0, od: false } : E.plan;
    B.player.plan = myPlan(B, G.planSummary(E, ePlan).move);
    for (const st of G.resolveSteps(B)) { if (B.phase === 'over') break; B.events = []; st.run(); }
    if (B.phase !== 'over') G.startTurn(B);
  }
  return { won: B.winner === 'player', turns: B.turn, hull: Math.max(0, B.player.hull) };
}

function randCards(n) {
  const pool = DATA.voyage.cardPool, total = Object.values(pool).reduce((a, b) => a + b, 0), ids = [];
  for (let g = 0; ids.length < n && g < 100; g++) { let r = Math.random() * total, id = null; for (const [k, w] of Object.entries(pool)) { r -= w; if (r <= 0) { id = k; break; } } if (id && !ids.includes(id)) ids.push(id); }
  return ids;
}
// 개조 고르기: 3개 중에서. 덱에 그 거리에서 센 무기가 많은 개조를 먼저, 없으면 아무거나
function pickMod(ship, allowRare) {
  const all = Object.entries(DATA.voyage.mods).filter(([k, m]) => (allowRare || !m.rare) && !(m.perk && ship.mods.includes(k)));
  const opts = G.shuffle(all).slice(0, DATA.voyage.modChoices || 2);
  const score = ([k, m]) => {
    if (m.rare) return 5;
    if (m.perk && m.perk.band) { const mid = (m.perk.band[0] + m.perk.band[1]) / 2; return ship.deck.filter((id) => DATA.cards[id].type === 'weapon' && run('dmgAt')(DATA.cards[id], mid) >= 8).length; }
    return 1.5;
  };
  const [k, m] = opts.sort((a, b) => score(b) - score(a))[0];
  if (m.apply) m.apply(ship); if (m.perk) ship.mods.push(k);
}
const reward = (ship, kind, elite) => {
  if (kind === 'card') ship.deck.push(rnd(randCards(3)));
  else if (kind === 'repair') ship.hull = Math.min(ship.maxHull, ship.hull + DATA.voyage.repairAmount);
  else pickMod(ship, elite);
};

function voyage() {
  const P = DATA.ships.player, VD = DATA.voyage, E = DATA.endless;
  const ship = { hull: VD.playerHull, maxHull: VD.playerHull, reactor: P.reactor, cooling: P.cooling, deck: DATA.starterDeck.slice(), mods: [] };
  const per = E.jumpsPerSector + 1, out = { depth: 0, sectors: 0, turns: 0, battles: 0 };
  for (let d = 1; d <= 60; d++) {
    out.depth = d;
    const sec = Math.floor((d - 1) / per), jump = (d - 1) % per, boss = jump === E.jumpsPerSector;
    let enemy, kind = 'battle';
    if (boss) enemy = E.bosses[sec % E.bosses.length];
    else {
      const r = Math.random();
      if (jump >= 1 && r < 0.15) { kind = 'dock'; }
      else if (jump >= 1 && r < 0.3) { kind = 'elite'; enemy = rnd(E.elites); }
      else enemy = rnd(d <= E.tier1Until ? E.tier1 : d <= E.mixUntil ? E.tier1.concat(E.tier2) : E.tier2);
    }
    if (kind === 'dock') {                       // 정비: 선체가 반 아래면 수리, 아니면 개조
      if (ship.hull < ship.maxHull * 0.5) ship.hull = Math.min(ship.maxHull, ship.hull + VD.dockRepair); else pickMod(ship, false);
      continue;
    }
    const mult = boss ? E.bossBase + E.bossPerSector * sec : E.hullBase + E.hullPerDepth * (d - 1);
    const r = battle(enemy, ship, mult, Math.floor((d - 1) / E.extraCardEvery));
    out.turns += r.turns; out.battles++;
    ship.hull = r.hull;
    if (!r.won) { out.killer = enemy; return out; }
    ship.hull = Math.min(ship.maxHull, ship.hull + VD.autoRepair);
    if (boss) {
      out.sectors = sec + 1;
      if (E.winSector && out.sectors >= E.winSector) { out.won = true; out.ship = ship; return out; }
      ship.hull = Math.min(ship.maxHull, ship.hull + E.bossRepair); reward(ship, 'card'); pickMod(ship, true);
    } else if (kind === 'elite') { reward(ship, 'card'); reward(ship, 'mod', true); }
    else reward(ship, Math.random() < 0.6 ? 'card' : Math.random() < 0.5 ? 'repair' : 'mod');
  }
  return out;
}

const res = [];
for (let i = 0; i < runs; i++) res.push(voyage());
const pct = (f) => (100 * res.filter(f).length / res.length).toFixed(0) + '%';
const depths = res.map((r) => r.depth).sort((a, b) => a - b);
console.log(`runs ${runs} · skill ${skill}`);
console.log(`boss1 ${pct((r) => r.sectors >= 1)} · boss2 ${pct((r) => r.sectors >= 2)} · clear (boss${DATA.endless.winSector}) ${pct((r) => r.won)}`);
console.log(`median end depth ${depths[Math.floor(depths.length / 2)]} · turns per battle ${(res.reduce((a, r) => a + r.turns, 0) / res.reduce((a, r) => a + r.battles, 0)).toFixed(1)}`);
// 어디서 · 누구에게 끝났나 (자세히 보려면 넷째 인자에 detail)
if (process.argv[4] === 'detail') {
  const hist = {}, killers = {};
  for (const r of res) if (!r.won) { hist[r.depth] = (hist[r.depth] || 0) + 1; killers[r.killer] = (killers[r.killer] || 0) + 1; }
  console.log('ended at depth:', Object.entries(hist).map(([d, n]) => `${d}:${n}`).join(' '));
  console.log('sunk by:', Object.entries(killers).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' '));
}
const first = res.filter((r) => r.depth <= 3 && !r.won).length;
console.log(`died in the first three jumps ${(100 * first / res.length).toFixed(0)}%`);
