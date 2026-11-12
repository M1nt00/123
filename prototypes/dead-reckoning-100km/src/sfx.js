// PROTOTYPE - NOT FOR PRODUCTION
// Question: 덱을 다듬는 선택이 "어느 거리에서 싸울지"를 실제로 바꾸는가?
// Date: 2026-11-12
//
// 소리: 음원 파일 없이 Web Audio로 만드는 효과음.
//   - 이 파일은 맨 마지막에 불러와서, 다른 파일의 함수에 '소리 내기'만 덧붙인다 (게임 규칙은 건드리지 않음).
//     index.html에서 이 파일의 <script> 줄을 빼면 게임은 소리 없이 그대로 돌아간다.
//   - 음소거: 위 막대의 [소리] 버튼 · M 키 (localStorage 'dr-mute')
//   - 소리 크기 · 음색은 아래 Sfx.sounds의 숫자만 바꾸면 된다.
'use strict';

const Sfx = {
  ctx: null, master: null,
  muted: false,
  volume: 0.5,          // 전체 크기 (0~1)
  played: {},           // 소리마다 낸 횟수 (확인용)

  // 오디오 준비: 브라우저는 첫 클릭 · 키 입력 뒤에만 소리를 허락한다
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  },

  // 음 하나: freq → slideTo 로 미끄러지며 dur초
  tone(freq, dur, o = {}) {
    const c = this.ctx, t0 = c.currentTime + (o.delay || 0), vol = o.vol === undefined ? 0.1 : o.vol;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },

  // 잡음: 걸러 낸 흰 잡음 (폭발 · 분사 · 스침)
  noise(dur, o = {}) {
    const c = this.ctx, t0 = c.currentTime + (o.delay || 0), vol = o.vol === undefined ? 0.1 : o.vol;
    const n = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 1000, t0);
    if (o.slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  },

  // 효과음 목록 (k = 세기 0~1, 있는 것만)
  sounds: {
    ui: (s) => s.tone(660, 0.05, { type: 'triangle', vol: 0.1 }),
    pick: (s) => s.tone(520, 0.06, { type: 'triangle', vol: 0.12, slideTo: 720 }),
    place: (s) => { s.tone(440, 0.07, { type: 'square', vol: 0.06 }); s.tone(880, 0.1, { type: 'triangle', vol: 0.12, delay: 0.05 }); },
    remove: (s) => s.tone(520, 0.09, { type: 'triangle', vol: 0.1, slideTo: 300 }),
    decide: (s) => { s.tone(220, 0.2, { type: 'sawtooth', vol: 0.09, slideTo: 440 }); s.noise(0.22, { vol: 0.05, freq: 1800 }); },
    reveal: (s) => s.noise(0.09, { vol: 0.08, freq: 3200, type: 'bandpass' }),
    move: (s) => s.noise(0.7, { vol: 0.09, freq: 300, slideTo: 1400, type: 'bandpass' }),
    shield: (s) => s.tone(300, 0.35, { type: 'sine', vol: 0.11, slideTo: 620 }),
    shot: (s) => s.tone(1500, 0.16, { type: 'sawtooth', vol: 0.08, slideTo: 240 }),
    hit: (s, k) => { s.noise(0.22 + 0.2 * k, { vol: 0.14 + 0.14 * k, freq: 900, slideTo: 120 }); s.tone(110, 0.2 + 0.2 * k, { type: 'sine', vol: 0.18, slideTo: 45 }); },
    shieldHit: (s) => { s.tone(900, 0.12, { type: 'sine', vol: 0.09, slideTo: 500 }); s.noise(0.08, { vol: 0.05, freq: 4000, type: 'bandpass' }); },
    torpedo: (s) => s.noise(0.45, { vol: 0.08, freq: 500, slideTo: 1800, type: 'bandpass' }),
    overdrive: (s) => { s.tone(110, 0.5, { type: 'sawtooth', vol: 0.1, slideTo: 440 }); s.noise(0.5, { vol: 0.06, freq: 600, slideTo: 3000, type: 'bandpass' }); },
    meltdown: (s) => { for (let i = 0; i < 3; i++) s.tone(880, 0.12, { type: 'square', vol: 0.08, delay: i * 0.18 }); s.noise(0.8, { vol: 0.14, freq: 400, slideTo: 80, delay: 0.1 }); },
    explode: (s) => { s.noise(1.2, { vol: 0.28, freq: 700, slideTo: 60 }); s.tone(80, 0.9, { type: 'sine', vol: 0.22, slideTo: 30 }); },
    perk: (s) => { s.tone(784, 0.08, { type: 'triangle', vol: 0.1 }); s.tone(1175, 0.14, { type: 'triangle', vol: 0.1, delay: 0.07 }); },
    reward: (s) => [523, 659, 784].forEach((f, i) => s.tone(f, 0.12, { type: 'triangle', vol: 0.1, delay: i * 0.07 })),
    win: (s) => [392, 523, 659, 784, 1047].forEach((f, i) => s.tone(f, 0.24, { type: 'triangle', vol: 0.12, delay: i * 0.12 })),
    lose: (s) => [392, 330, 262, 196].forEach((f, i) => s.tone(f, 0.32, { type: 'sawtooth', vol: 0.07, delay: i * 0.2 })),
  },

  play(name, k = 0) {
    this.played[name] = (this.played[name] || 0) + 1;
    if (this.muted || !this.sounds[name]) return;
    try { if (this.ensure()) this.sounds[name](this, Math.max(0, Math.min(1, k))); } catch (e) { /* 소리가 안 나도 게임은 계속 */ }
  },

  setMuted(m) {
    this.muted = !!m;
    try { localStorage.setItem('dr-mute', this.muted ? '1' : '0'); } catch (e) {}
    const b = document.getElementById('muteBtn');
    if (b) { b.textContent = this.muted ? '소리 끔 (M)' : '소리 켬 (M)'; b.classList.toggle('on', !this.muted); }
  },
};

// ── 게임에 붙이기 ──────────────────────────────
(() => {
  try { Sfx.muted = localStorage.getItem('dr-mute') === '1'; } catch (e) {}
  Sfx.setMuted(Sfx.muted);

  // 함수 앞에 '소리 내기'를 끼워 넣는다. 원래 함수는 그대로 실행된다
  const before = (obj, name, fn) => {
    const f = obj && obj[name];
    if (typeof f !== 'function') return;
    obj[name] = function (...a) { try { fn.apply(this, a); } catch (e) { /* 소리 때문에 게임이 멈추면 안 됨 */ } return f.apply(this, a); };
  };

  // 전투 연출 (src/scene.js)
  if (typeof Scene !== 'undefined') {
    before(Scene, 'play', (events) => {
      if (events.some((e) => e.kind === 'overdrive')) Sfx.play('overdrive');
      if (events.some((e) => e.kind === 'perk' && e.who === 'player')) Sfx.play('perk');
    });
    before(Scene, 'animMove', (e) => { if (e.pm || e.em) Sfx.play('move'); });
    before(Scene, 'animShield', (e) => { if (e.amount || e.pd) Sfx.play('shield'); });
    before(Scene, 'animShot', () => Sfx.play('shot'));
    before(Scene, 'animTorpLaunch', () => Sfx.play('torpedo'));
    before(Scene, 'impact', (side, e) => { if (e.hull > 0) Sfx.play('hit', e.hull / 15); else if (e.shield > 0) Sfx.play('shieldHit'); });
    before(Scene, 'animMeltdown', () => Sfx.play('meltdown'));
    before(Scene, 'destroy', () => Sfx.play('explode'));
  }

  // 조작 (src/ui.js)
  before(window, 'pickUp', () => Sfx.play('pick'));
  before(window, 'togglePlan', (i) => Sfx.play(planHas(i) ? 'remove' : 'place'));
  before(window, 'decide', () => { if (B && B.phase === 'plan' && !resolving) Sfx.play('decide'); });
  before(window, 'revealPhase', () => Sfx.play('reveal'));
  before(window, 'showResult', () => Sfx.play(B && B.winner === 'player' ? 'win' : 'lose'));

  // 항해 (src/voyage.js)
  if (typeof Voyage !== 'undefined') {
    before(Voyage, 'toast', () => Sfx.play('reward'));
    before(Voyage, 'victory', () => Sfx.play('win'));
    before(Voyage, 'overEndless', () => Sfx.play('lose'));
    before(Voyage, 'over', function (win) { if (!(this.V && this.V.endless)) Sfx.play(win ? 'win' : 'lose'); });
  }

  // 버튼 · 메뉴 클릭
  document.addEventListener('click', (e) => { if (e.target.closest('button, .vRoute, .vcard')) Sfx.play('ui'); });

  // 음소거
  const mb = document.getElementById('muteBtn');
  if (mb) mb.onclick = () => Sfx.setMuted(!Sfx.muted);
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'm' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    Sfx.setMuted(!Sfx.muted);
  });
  // 첫 입력에서 오디오 켜기
  const wake = () => { if (!Sfx.muted) Sfx.ensure(); };
  document.addEventListener('pointerdown', wake, { once: true });
  document.addEventListener('keydown', wake, { once: true });
})();
