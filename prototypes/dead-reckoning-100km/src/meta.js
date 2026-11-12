// PROTOTYPE - NOT FOR PRODUCTION
// Question: 덱을 다듬는 선택이 "어느 거리에서 싸울지"를 실제로 바꾸는가?
// Date: 2026-11-12
//
// 항해 기록 (메타 진행): 판이 끝나도 남는 것.
//   - 항해가 끝나면 (격침 · 항로 돌파) 기록 점수를 얻고, 합계가 쌓이면 함선 · 카드 · 출항 준비가 해금된다.
//   - 숫자와 해금 순서는 data/voyage.js의 DATA.meta. 여기는 저장 · 계산 · 화면 글만.
//   - 저장: localStorage 'dr-meta' = { xp: 기록 합계 }. 지우면 처음부터.
'use strict';

const Meta = {
  load() {
    try { return Object.assign({ xp: 0 }, JSON.parse(localStorage.getItem('dr-meta') || '{}')); } catch (e) { return { xp: 0 }; }
  },
  save(m) { try { localStorage.setItem('dr-meta', JSON.stringify(m)); } catch (e) { /* 저장이 막혀 있어도 게임은 계속 */ } },
  xp() { return +this.load().xp || 0; },

  // 해금 목록에 없는 것은 처음부터 열려 있다
  has(id) { const u = DATA.meta.unlocks.find((x) => x.id === id); return !u || this.xp() >= u.at; },
  locked(id) { return !this.has(id); },
  ships() { return Object.keys(DATA.meta.ships).filter((k) => this.has(k)); },
  next() { const xp = this.xp(); return DATA.meta.unlocks.find((u) => u.at > xp) || null; },

  // 해금 한 줄의 이름 · 설명
  label(u) {
    if (u.kind === 'card') return { what: '카드', name: DATA.cards[u.id].name, desc: DATA.cards[u.id].desc + ' — 이제 항해 보상에 나온다' };
    if (u.kind === 'ship') { const s = DATA.meta.ships[u.id]; return { what: '함선', name: s.name, desc: `${s.role} 덱 — ${s.desc}` }; }
    return { what: '항해', name: u.name, desc: u.desc };
  },

  // 항해가 끝났을 때 기록을 준다. 한 항해에서 두 번 불려도 (돌파 뒤 더 깊이 가서 격침) 늘어난 깊이만큼만 준다
  //   돌려주는 값: { gain, total, before, unlocked: [새로 해금된 것], next: 다음 해금 } · 테스트 판(V.test)은 null
  award(V, depth, cleared) {
    if (!V || V.test) return null;
    const M = DATA.meta, before = this.xp();
    const gain = Math.max(0, depth - (V.awardedDepth || 0)) * M.xpPerDepth + (cleared ? M.xpClear : 0);
    V.awardedDepth = Math.max(depth, V.awardedDepth || 0);
    const m = this.load();
    m.xp = before + gain;
    this.save(m);
    return { gain, total: m.xp, before, unlocked: M.unlocks.filter((u) => u.at > before && u.at <= m.xp), next: this.next() };
  },

  // 끝난 화면에 넣을 글: 얻은 기록 · 새 해금 · 다음 해금까지
  html(A) {
    if (!A) return '';
    const news = A.unlocked.map((u) => { const l = this.label(u); return `<div class="mNew">해금 — ${l.what} · ${l.name}</div><small>${l.desc}</small>`; }).join('');
    let bar = '<small>모든 해금을 마쳤다</small>';
    if (A.next) {
      const l = this.label(A.next), prev = DATA.meta.unlocks.filter((u) => u.at <= A.total).reduce((t, u) => Math.max(t, u.at), 0);
      const k = Math.max(0, Math.min(1, (A.total - prev) / (A.next.at - prev)));
      bar = `<div class="mBar"><i style="width:${Math.round(k * 100)}%"></i></div><small>다음 해금: ${l.what} · ${l.name} — 기록 ${A.next.at} (앞으로 ${A.next.at - A.total})</small>`;
    }
    return `<div class="vMeta"><div>항해 기록 <span class="mGain">+${A.gain}</span> <small>(합계 ${A.total})</small></div>${news}${bar}</div>`;
  },
  // 새 해금이 있으면 짧은 알림 (소리도 같이 난다)
  announce(A, voyage) {
    if (A && A.unlocked.length && voyage && voyage.toast) setTimeout(() => voyage.toast(`해금 — ${A.unlocked.map((u) => this.label(u).name).join(' · ')}`), 900);
  },
};
