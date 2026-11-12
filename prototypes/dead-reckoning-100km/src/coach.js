// PROTOTYPE - NOT FOR PRODUCTION
// Question: 덱을 다듬는 선택이 "어느 거리에서 싸울지"를 실제로 바꾸는가?
// Date: 2026-11-12
//
// 첫 판 안내: 연습 전투를 처음 고르면, 쉬운 적(data/rules.js의 coachEnemy)과 싸우는 동안
//   왼쪽 아래에 한 단계씩 할 일을 알려 준다. 글로 된 규칙을 읽지 않아도 한 판으로 배우게 하는 것이 목적.
//   - 게임 규칙은 건드리지 않는다. 화면 상태(B · resolving)를 지켜보다가 다음 단계로 넘어갈 뿐이다.
//   - 끝까지 보거나 [안내 끄기]를 누르면 localStorage 'dr-coach-done' = 1 → 다시 나오지 않는다.
//     규칙 화면(H) 맨 아래의 [안내 다시 보기]로 되살릴 수 있다.
//   - 문장은 아래 steps만 고치면 된다.
'use strict';

const Coach = {
  on: false, i: 0, el: null, turn0: 0, shown: -1,

  // until: 이 조건이 참이 되면 저절로 다음 단계 · next: 버튼으로 넘김 · when: 이 조건이 참일 때만 보여 줌
  steps: [
    { text: '<b>거리가 전부예요.</b> 카드마다 강한 거리가 달라요. 카드에 마우스를 올리면 거리별 피해가 보여요.', next: '다음' },
    { text: '위쪽의 <b>적 의도</b>를 보세요. 적이 다가오는지와 낼 카드 수를 알려 줘요. 얼마나 움직일지는 읽어야 해요.', next: '다음' },
    { text: '<b>기본 엔진 ◀ ▶</b> (← →)로 다가가 보세요. <b>이동이 공격보다 먼저</b>라서 "이동한 뒤의 거리"로 맞아요. 레이저는 500~900km.',
      until: () => B.player.plan.engine !== 0, wait: '엔진을 움직여 보세요' },
    { text: '<b>무기는 적 함선에, 방어는 내 함선에</b> 끌어다 놓으세요. 숫자키 1~5 뒤에 함선을 클릭해도 돼요.',
      until: () => B.player.plan.items.length > 0, wait: '카드를 한 장 올려 보세요' },
    { text: '준비됐으면 <b>결정 (Space)</b>. 양쪽 계획이 동시에 공개돼요. 남은 연료는 2까지 다음 턴으로 넘어가요.',
      until: () => resolving || B.turn > Coach.turn0, wait: '결정을 눌러 보세요' },
    { text: '<b>턴 결과</b>의 "예측 적중"은 내 무기가 제 거리에서 맞았다는 뜻이에요. 적의 최근 기동과 교리가 다음 수의 단서예요.',
      when: () => !resolving, next: '다음' },
    { text: '<b>열</b> 100은 멜트다운 (선체 피해 + 한 턴 쉼). 남는 연료로 냉각 +. 위급하면 <b>오버드라이브 (O)</b>: 연료 +3, 피해 +50%.', next: '다음' },
    { text: '이제 혼자 해 보세요. 이 적은 <b>가까이 붙으려</b> 해요. 붙기 전에 레이저 거리에서 깎아 두세요. 규칙은 <b>H</b>.', next: '안내 끝내기' },
  ],

  wanted() { try { return localStorage.getItem('dr-coach-done') !== '1'; } catch (e) { return true; } },
  done() { try { localStorage.setItem('dr-coach-done', '1'); } catch (e) {} this.stop(); },
  reset() { try { localStorage.removeItem('dr-coach-done'); } catch (e) {} },

  start() {
    this.on = true; this.i = 0; this.shown = -1; this.turn0 = B.turn;
    if (!this.el) {
      this.el = document.createElement('aside');
      this.el.id = 'coach';
      document.getElementById('field').appendChild(this.el);
      this.el.addEventListener('pointerdown', (e) => e.stopPropagation());   // 안내를 눌러도 '넘기기'가 되지 않게
      this.el.addEventListener('click', (e) => {
        if (e.target.closest('.cNext')) this.advance();
        if (e.target.closest('.cOff')) this.done();
      });
    }
    this.el.style.display = '';
    document.body.classList.add('coaching');
    this.tick();
  },
  stop() { this.on = false; document.body.classList.remove('coaching'); if (this.el) this.el.style.display = 'none'; },
  advance() {
    this.i++;
    if (this.i >= this.steps.length) return this.done();
    this.tick();
  },

  // 0.25초마다: 조건이 채워졌으면 다음 단계로, 바뀌었으면 다시 그림
  tick() {
    if (!this.on) return;
    if (typeof onTitle !== 'undefined' && onTitle) return this.stop();          // 메인 화면으로 나감
    if (!B || B.voyage || B.sandbox) return this.stop();
    if (B.phase === 'over') return this.done();                                  // 한 판이 끝남
    const s = this.steps[this.i];
    if (s.until && s.until()) return this.advance();
    const visible = !s.when || s.when();
    this.el.style.visibility = visible ? '' : 'hidden';
    if (this.shown === this.i) return;
    this.shown = this.i;
    this.el.innerHTML = `<div class="cHead"><span class="cStep">안내 ${this.i + 1} / ${this.steps.length}</span>
      ${s.wait ? `<span class="cWait">→ ${s.wait}</span>` : ''}
      <button class="cOff">안내 끄기</button>${s.next ? `<button class="cNext">${s.next} ▶</button>` : ''}</div>
      <div>${s.text}</div>`;
  },
};
setInterval(() => Coach.tick(), 250);

// 규칙 화면에 [안내 다시 보기] 버튼을 덧붙인다
(() => {
  const f = window.showHelp;
  if (typeof f !== 'function') return;
  window.showHelp = function (...a) {
    const r = f.apply(this, a);
    const box = document.querySelector('#overlay .box'), close = document.getElementById('closeHelp');
    if (box && close && !Coach.wanted()) {
      const b = document.createElement('button');
      b.className = 'ghostBtn'; b.textContent = '안내 다시 보기'; b.style.marginLeft = '8px';
      b.onclick = () => { Coach.reset(); b.textContent = '다음 연습 전투에서 안내가 나와요'; b.disabled = true; };
      close.after(b);
    }
    return r;
  };
})();
// 이 파일은 메인 화면이 그려진 뒤에 불러와지므로, 메인 화면의 '처음이라면' 표시를 한 번 더 맞춘다
if (typeof titleFirstTime === 'function' && typeof onTitle !== 'undefined' && onTitle) titleFirstTime();
// 위 막대의 [규칙] 버튼도 덧붙인 쪽을 부르게
(() => { const b = document.getElementById('helpBtn'); if (b) b.onclick = () => window.showHelp(); })();
