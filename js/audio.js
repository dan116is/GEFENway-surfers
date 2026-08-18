/* צלילים סינתטיים קטנים (בלי קבצים — עובד גם אופליין) + עידוד בקול */

import { save } from './util.js';

let ctx = null;
let master = null;
let noiseBuf = null;
let unlocked = false;

function ensure(){
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.32;
  master.connect(ctx.destination);
  return ctx;
}

/** iOS דורש מגע ראשון כדי לפתוח שמע */
export function unlockAudio(){
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  if (!unlocked){
    const s = c.createBufferSource();
    s.buffer = c.createBuffer(1, 1, 22050);
    s.connect(master);
    s.start(0);
    unlocked = true;
  }
}

function on(){ return save.sound && ensure(); }

function tone({ freq = 440, dur = 0.16, type = 'sine', gain = 0.5, slideTo = null, delay = 0 }){
  if (!on()) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.2, gain = 0.4, freq = 900, delay = 0 }){
  if (!on()) return;
  if (!noiseBuf){
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt); flt.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur);
}

/* מנגינת פנטטוניקה עולה — כל כוכב נשמע נעים ולא צורם */
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
let pentaIdx = 0;
let pentaAt = 0;

export const sfx = {
  star(){
    const now = performance.now();
    if (now - pentaAt > 900) pentaIdx = 0;
    pentaAt = now;
    tone({ freq: PENTA[pentaIdx % PENTA.length], dur: 0.14, type: 'triangle', gain: 0.35 });
    tone({ freq: PENTA[pentaIdx % PENTA.length] * 2, dur: 0.1, type: 'sine', gain: 0.14 });
    pentaIdx++;
  },
  gem(){
    [0, 0.07, 0.14].forEach((d, i) => tone({ freq: 660 * (1 + i * 0.26), dur: 0.2, type: 'triangle', gain: 0.32, delay: d }));
  },
  jump(){ tone({ freq: 330, slideTo: 720, dur: 0.16, type: 'sine', gain: 0.3 }); },
  land(){ noise({ dur: 0.1, gain: 0.18, freq: 500 }); },
  slide(){ noise({ dur: 0.3, gain: 0.2, freq: 1800 }); },
  bump(){
    noise({ dur: 0.22, gain: 0.42, freq: 320 });
    tone({ freq: 180, slideTo: 90, dur: 0.26, type: 'sawtooth', gain: 0.2 });
  },
  shield(){ tone({ freq: 300, slideTo: 900, dur: 0.35, type: 'sine', gain: 0.28 }); },
  gateGood(){
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.3, delay: i * 0.075 }));
  },
  gateMiss(){ tone({ freq: 300, slideTo: 210, dur: 0.28, type: 'sine', gain: 0.18 }); },
  fanfare(){
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      tone({ freq: f, dur: 0.42, type: 'triangle', gain: 0.34, delay: i * 0.11 }));
    [261, 392].forEach((f, i) => tone({ freq: f, dur: 0.7, type: 'sine', gain: 0.16, delay: i * 0.22 }));
  },
  unlock(){
    [392, 523, 659, 880].forEach((f, i) => tone({ freq: f, dur: 0.3, type: 'square', gain: 0.16, delay: i * 0.09 }));
  },
  tap(){ tone({ freq: 620, dur: 0.07, type: 'sine', gain: 0.22 }); },
};

/* ---------- קול (עידוד בעברית) ---------- */
let heVoice = null;
let voicesReady = false;

function loadVoices(){
  if (!('speechSynthesis' in window)) return;
  const list = speechSynthesis.getVoices();
  if (!list.length) return;
  heVoice = list.find(v => /^he/i.test(v.lang)) || null;
  voicesReady = true;
}
if ('speechSynthesis' in window){
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

let lastSpoke = 0;
export function say(text, { force = false } = {}){
  if (!save.voice || !('speechSynthesis' in window)) return;
  const now = performance.now();
  if (!force && now - lastSpoke < 2600) return;   // לא מקשקשים בלי סוף
  lastSpoke = now;
  if (!voicesReady) loadVoices();
  if (!heVoice) return;                            // אין קול עברי — שותקים במקום לדבר באנגלית
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = heVoice;
    u.lang = heVoice.lang;
    u.rate = 0.95;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export function hushVoice(){
  if ('speechSynthesis' in window){ try { speechSynthesis.cancel(); } catch { /* ignore */ } }
}
