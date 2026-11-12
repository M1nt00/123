# Brought in: dead-reckoning-100km

- From: `/home/user/m1nt00/deadreckoning` (folder), 2026-11-12
- Baseline: the tag `baseline/dead-reckoning-100km`, holding only the game's files as they came in
- The original was not changed. Its history, if it had one, stays with it.

| File | Bytes | SHA-256 |
|---|---|---|
| `.gitignore` | 9 | `442787ab3b4dcc0aeb55d4d866ec72bcc23b754efde3815e97f598ae79c42ba4` |
| `README.md` | 866 | `e455a215f5965c1bea5835beef5f618d5c4423266c01ef937f3c2aa05b910880` |
| `data/cards.js` | 10284 | `63d5525a2e0ea2483aed57d335816a6eda432bbf247a5cbdf2d69aef7385ab9d` |
| `data/rules.js` | 3327 | `eff5535c16b2b6a524bacb813f897cab14066f00c614d9ce4ac111d3c6ab40d1` |
| `data/voyage.js` | 14415 | `5b5277cc9f64396ec40959c51f8bfd2a3cada9dc943656a8d11ed38a4156550d` |
| `dr-cards.json` | 12995 | `1fb4633533be4924a35c9d6066067664399d089e6cff90eaa3549deb42672c95` |
| `index.html` | 3924 | `2d3a41068baa9325f639df96456c8138c45131db10d8602730898625dc7f5e6f` |
| `src/ai.js` | 6823 | `044a8776435b805f66005c9fa04827cf7cc29cc6acff333008b043561b6bb5a0` |
| `src/art.js` | 28178 | `236e2913ca31efab117bbfc82cfd67ca993cde778f91a80b04bd198d26a9d816` |
| `src/battle.js` | 25357 | `562850d768e8f1317a3d43e05bdd90b39853218e21c1c88042b9121775df3811` |
| `src/icons.js` | 4362 | `deac6243caba3523cba8363e2e214385491813f58295fc686c7054d2b36295ff` |
| `src/scene.js` | 75550 | `e6dad4508c9389d772bf3520c1565de04b1693f13436bdad6f5b3f1391b1e0ce` |
| `src/ui.js` | 69117 | `d5d0de23c0a1ceef57029e65eea9ffc6826638c8df040bfb237ba9a311d25af7` |
| `src/voyage.js` | 29094 | `c01414cd9ed4902b27093c010ee2648c30c770de61b9609ba471c12258bec6cc` |
| `style.css` | 57655 | `3c3dc752dc1383291d0a181d8c8ff844acb9500bf44e49a6913e069fd46c3d99` |
| `기획/01_기획서.md` | 32636 | `cbc1c47d6a50de355736d8a8e89ca7923828db12e78391ccfbf639ed2eb3b64b` |
| `기획/02_항해와_이야기.md` | 8024 | `f5c9ff5adc68a05067c173f5cf211400c8b977550667e4fdf94d1e68262af88f` |
| `기획/03_끝없는_항해.md` | 2623 | `cf2e4e2904aa2d74428863c19ce28f68bf963afadac58cdd9fab9b02b300c433` |
| `카드 목록.html` | 463134 | `7af83f65993662f6d4977472ee0ff4042e3f4c5ad8419f664ddf23f0dadc6971` |

Left out:
- `.git/`: its history stays in the original; the copy starts at the baseline tag

## Where it came from

- The path above is this session's read-only clone of `https://github.com/M1nt00/DeadReckoning`,
  at commit `5bb41fa8fa85fee055db66e32be6f3485ad0e3a8` (2026-10-01, "시험장: 표적 더미 적 · 비우기 버그 수정").

## Baseline screenshots

- `baseline/first.png`, `start.png`, `play-10s.png`, `play-30s.png`: taken in real time with
  Playwright (1280x720), inputs in `baseline/inputs.txt`, rows in `baseline/realtime.tsv`. 0 errors.
  They reached: the title menu, practice battle turn 1, the reveal phases of turn 1, turn 3
  (player hull 120 → 72 with no card played).
- NOT ASSESSED: `door-in.sh --shots`, the deterministic replay. Its first run played and hashed
  the screen (`baseline/first.tsv`: `screen 60 hookless 583b74b3 drawn`) but the browser gave no
  picture before the cap; a plain `page-shot.sh` of the page also gave none under the page time
  budget and one only in real time (`capped 40 20`). So `--shots --check` cannot compare a later
  change against this baseline here: the real-time pictures are looked at, not hashed.

## Read from the game

Read on 2026-11-12, from `prototypes/dead-reckoning-100km/` at `baseline/dead-reckoning-100km`.

**Read:** `index.html` (whole) · `README.md` (whole) · `data/rules.js` (whole) ·
`data/cards.js` 153-195 and every card id and type · `data/voyage.js` 7-15, 220-241 and its
top-level keys · `src/battle.js` 213-240 and its function list · `src/ai.js` 1-12 ·
`src/ui.js` 911-934 (keys) and its function list · `src/voyage.js` 527-531 (keys) and its
method list · `기획/01_기획서.md` 1-52, 159-218 and its headings · `기획/02_항해와_이야기.md`
headings · `기획/03_끝없는_항해.md` (whole).

**Where each built Feature lives:**

| Feature | Code | Screenshot |
|---|---|---|
| Simultaneous-reveal turn battle, 8 reveal steps | `src/battle.js:215` (`resolveSteps`), `:98` (`startTurn`) | start.png, play-10s.png |
| Distance-based weapon damage, base engine | `data/rules.js:7-21`, `src/battle.js:13` (`dmgAt`), `:195` (`weaponDmg`) | play-10s.png |
| Fuel, cooling, heat stages, meltdown, overdrive | `data/rules.js:14-29`, `src/battle.js:74` (`planSummary`), `:417-429` | play-30s.png |
| 25 cards (weapon 11, defense 6, move 3, system 3, field 1, support 1) | `data/cards.js:20-190`; starter deck `:192` | start.png |
| Enemy AI that picks in secret; doctrine shown | `src/ai.js:5` (`aiPlan`), `data/rules.js:52-57` | — |
| Endless voyage: routes, rewards, sector bosses, best depth saved | `src/voyage.js:28` (`startEndless`), `:165` (`routes`), `:292` (`rewards`), `:503` (`overEndless`), `data/voyage.js:220-241` | — (not reached by the shots) |
| Practice battle, rules, codex, log, sandbox | `src/ui.js:1066` (`titlePick`), `:852`, `:422`, `:835`, `:984` | first.png |

Win and lose: `src/battle.js:231-237` (hull 0 ends the battle in that step; both at 0 is a draw).
Save: `localStorage` key `dr-best-depth` (`src/voyage.js:506-508`, `src/ui.js:1085`).
Sound: none found (no audio code). Network: none (no request leaves `file:`).

**Not read:**

- `src/scene.js` 1-41, 68-1499 · `src/art.js` · `src/icons.js` · `style.css`: drawing and styling
- `src/ui.js` and `src/voyage.js` outside the ranges above: function and method names only
- `data/cards.js` 1-152 beyond ids and types (damage tables) · `data/voyage.js` 16-219 (pools, mods, chapters, events, enemy ships)
- `기획/01_기획서.md` 53-158, 219-480 · `기획/02_항해와_이야기.md` body: headings only. The v0.8 memo
  says "기획만, 아직 구현 안 함"; which of its items are built since was not checked one by one
- `카드 목록.html` (a bundled page, 463 KB) · `dr-cards.json`: the game does not load them
- Why anything is as it is, how it feels, whether it is fun: INTENT UNKNOWN

**Noticed, the game's own:** `README.md` describes v0.1 (11 cards, one enemy); the title screen
says v0.4 and `data/cards.js` has 25 cards. At 1280x720 the title's last two menu items overlap
the version line (first.png).

**Tuning values found** (already outside the code, in `data/`):

| Name | Value | Where |
|---|---|---|
| maxDistance / step / startDistance / shipLength | 2000 / 100 / 1200 / 100 | `data/rules.js:7-10` |
| handSize / carryMax / coolPerFuel | 5 / 2 / 15 | `data/rules.js:11-13` |
| overdriveFuel / Bonus / Heat / Cooldown | 3 / 0.5 / 30 / 4 | `data/rules.js:15-18` |
| engineMaxSteps / engineHeatPerStep | 20 / 5 | `data/rules.js:20-21` |
| warnHeat / warnShieldMult / dangerHeat / dangerFuel | 50 / 0.7 / 80 / 1 | `data/rules.js:23-26` |
| meltdownHeat / Damage / ResetHeat | 100 / 30 / 40 | `data/rules.js:27-29` |
| player hull / reactor / cooling | 120 / 5 / 10 | `data/rules.js:43` |
| vex hull / reactor / cooling / prefer | 110 / 5 / 10 / 800 | `data/rules.js:53` |
| voyage playerHull / autoRepair / repairAmount / dockRepair | 140 / 40 / 50 / 64 | `data/voyage.js:9-13` |
| endless jumpsPerSector / tier1Until / mixUntil | 4 / 3 / 8 | `data/voyage.js:221,228` |
| endless hullBase / hullPerDepth / bossBase / bossPerSector | 0.55 / 0.03 / 0.75 / 0.15 | `data/voyage.js:230,232` |
| endless extraCardEvery / bossRepair | 5 / 50 | `data/voyage.js:234,237` |
| each card's cost, heat and damage by distance | — | `data/cards.js:20-190` |

**Counts** (`game-read.sh`): `Math.random` 28 (ai 3, battle 3, scene 6, voyage 14) ·
`Date.now` 0 · `performance.now` 0 · `localStorage` 3 · scripts 10, 4,767 lines · states: title, cruise, battle.
