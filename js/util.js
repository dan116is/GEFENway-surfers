/* עזרים כלליים, שמירת מצב והגדרות */

export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp  = (a, b, t) => a + (b - a) * t;
export const rand  = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
export const $     = sel => document.querySelector(sel);
export const $$    = sel => Array.from(document.querySelectorAll(sel));

/** פירוק צבע (#rgb, #rrggbb או rgb(...)) למערך [r,g,b] */
export function parseColor(c){
  if (Array.isArray(c)) return c;
  const s = String(c).trim();
  if (s[0] === '#'){
    const hex = s.length === 4
      ? s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
      : s.slice(1, 7);
    const v = parseInt(hex, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const m = s.match(/-?\d+(\.\d+)?/g);
  return m ? [+m[0] | 0, +m[1] | 0, +m[2] | 0] : [0, 0, 0];
}

const hex2 = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
export const toHex = ([r, g, b]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

/** שילוב שני צבעים לפי t — מקבל כל פורמט ומחזיר #rrggbb */
export function mixHex(a, b, t){
  const pa = parseColor(a), pb = parseColor(b);
  return toHex([lerp(pa[0], pb[0], t), lerp(pa[1], pb[1], t), lerp(pa[2], pb[2], t)]);
}

/** מבהיר (amt חיובי) או מכהה (amt שלילי) צבע */
export function shade(c, amt){
  const p = parseColor(c);
  return toHex(p.map(v => v + 255 * amt));
}

/* ---------- צבעים לבחירה ולשערי הצבעים ---------- */
export const COLORS = [
  { id:'red',    hex:'#ff4d4d', he:'אדום'  },
  { id:'orange', hex:'#ff9330', he:'כתום' },
  { id:'yellow', hex:'#ffc531', he:'צהוב'  },
  { id:'green',  hex:'#37d67a', he:'ירוק'  },
  { id:'blue',   hex:'#3aa0ff', he:'כחול'  },
  { id:'purple', hex:'#9b5cff', he:'סגול'  },
  { id:'pink',   hex:'#ff5d8f', he:'ורוד'  },
];
export const colorById = id => COLORS.find(c => c.id === id) || COLORS[4];

/* ---------- מצב שמור ---------- */
const KEY = 'gefenway.save.v1';

const DEFAULTS = {
  name: 'גפן',
  color: 'blue',
  character: 'fox',
  pickEachRun: true,        // בורר דמות לפני כל סיבוב — גפן בוחר בעצמו
  stars: 0,
  sessionMinutes: 10,
  speed: 'normal',          // calm | normal | fast
  sound: true,
  voice: true,
  gates: true,
  shake: true,
  onboarded: false,
  totals: { runs: 0, stars: 0, meters: 0, gates: 0, seconds: 0 },
  bestMeters: 0,
};

function deepMerge(base, over){
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k of Object.keys(over || {})){
    const v = over[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object' && base[k] !== null){
      out[k] = deepMerge(base[k], v);
    } else if (v !== undefined){
      out[k] = v;
    }
  }
  return out;
}

export const save = load();

function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return deepMerge(DEFAULTS, {});
    return deepMerge(DEFAULTS, JSON.parse(raw));
  } catch {
    return deepMerge(DEFAULTS, {});
  }
}

let flushTimer = 0;
export function persist(){
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* מצב פרטי — מתעלמים */ }
  }, 120);
}

export function resetSave(){
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/* ---------- פרופילי מהירות (עדינים — מותאם לגיל 4) ---------- */
export const SPEEDS = {
  calm:   { start: 5.5, max: 8.0,  ramp: 0.055, label: 'רגוע'  },
  normal: { start: 6.8, max: 10.5, ramp: 0.075, label: 'רגיל'  },
  fast:   { start: 8.0, max: 13.0, ramp: 0.10,  label: 'מהיר'  },
};

/* ---------- רטט עדין ---------- */
export function buzz(ms){
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch { /* ignore */ } }
}
