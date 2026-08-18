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

/* ---------- מצב שמור: מסמך אחד עם כמה פרופילים ---------- */
const KEY    = 'gefenway.save.v2';
const LEGACY = 'gefenway.save.v1';

const PROFILE_DEFAULTS = {
  id: '',
  name: 'גפן',
  color: 'blue',
  character: 'fox',
  pickEachRun: true,        // בורר דמות לפני כל סיבוב
  // כפול מ-DEFAULT_OUTFIT ב-characters.js בכוונה: util נטען לפניו בקובץ המאוחד
  outfit: { hat: 'none', face: 'none', back: 'none', board: 'classic' },
  streak: { days: 0, lastDay: 0 },
  stars: 0,
  sessionMinutes: 10,
  speed: 'normal',          // calm | normal | fast
  sound: true,
  voice: true,
  gates: true,
  shake: true,
  totals: { runs: 0, stars: 0, meters: 0, gates: 0, seconds: 0 },
  bestMeters: 0,
};

const ROOT_DEFAULTS = {
  version: 2,
  activeId: '',
  quality: 'ultra',         // normal | high | ultra
  profiles: [],
};

/** העתקה עמוקה — בלעדיה כמה פרופילים היו חולקים את אותו אובייקט streak/totals */
function clone(v){
  if (Array.isArray(v)) return v.map(clone);
  if (v && typeof v === 'object'){
    const o = {};
    for (const k of Object.keys(v)) o[k] = clone(v[k]);
    return o;
  }
  return v;
}

function deepMerge(base, over){
  const out = clone(base);
  for (const k of Object.keys(over || {})){
    const v = over[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object' && base[k] !== null){
      out[k] = deepMerge(base[k], v);
    } else if (v !== undefined){
      out[k] = clone(v);
    }
  }
  return out;
}

const newId = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

function readJSON(key){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function load(){
  const v2 = readJSON(KEY);
  if (v2 && Array.isArray(v2.profiles)){
    const root = deepMerge(ROOT_DEFAULTS, v2);
    root.profiles = v2.profiles.map(p => deepMerge(PROFILE_DEFAULTS, p));
    return root;
  }

  // הגירה מהגרסה עם שחקן יחיד
  const v1 = readJSON(LEGACY);
  const root = deepMerge(ROOT_DEFAULTS, {});
  if (v1){
    const p = deepMerge(PROFILE_DEFAULTS, v1);
    p.id = newId();
    root.profiles = [p];
    root.activeId = p.id;
  }
  return root;
}

export const store = load();

/** לפני שנוצר פרופיל ראשון עובדים על טיוטה מנותקת, כדי ש-save לעולם לא יהיה null */
const draftProfile = () => deepMerge(PROFILE_DEFAULTS, { id: '' });

/** הפרופיל הפעיל. binding חי — מתעדכן בכל המודולים כשמחליפים שחקן. */
export let save = store.profiles.find(p => p.id === store.activeId) || store.profiles[0] || draftProfile();

export const hasProfiles = () => store.profiles.length > 0;

let flushTimer = 0;
export function persist(){
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* מצב פרטי — מתעלמים */ }
  }, 120);
}

export function setActiveProfile(id){
  const p = store.profiles.find(x => x.id === id);
  if (!p) return false;
  store.activeId = id;
  save = p;
  persist();
  return true;
}

export function addProfile({ name, color, character, sessionMinutes, speed }){
  const p = deepMerge(PROFILE_DEFAULTS, {
    id: newId(),
    name: (name || 'שחקן').trim().slice(0, 12) || 'שחקן',
    color: color || 'blue',
    character: character || 'fox',
    sessionMinutes: sessionMinutes || PROFILE_DEFAULTS.sessionMinutes,
    speed: speed || PROFILE_DEFAULTS.speed,
  });
  store.profiles.push(p);
  store.activeId = p.id;
  save = p;
  persist();
  return p;
}

export function removeProfile(id){
  const i = store.profiles.findIndex(p => p.id === id);
  if (i < 0) return;
  store.profiles.splice(i, 1);
  if (store.activeId === id){
    const next = store.profiles[0] || null;
    store.activeId = next ? next.id : '';
    save = next || draftProfile();
  }
  persist();
}

export function resetSave(){
  try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY); } catch { /* ignore */ }
}

/* ---------- פרס יומי ---------- */
/** מספר היום המקומי — כך "יום חדש" הוא באמת בוקר חדש, לא 24 שעות מאז אתמול */
export function dayNumber(now = new Date()){
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

export const STREAK_LADDER = [10, 15, 20, 30, 40, 60, 100];

export function pendingDailyReward(profile = save){
  if (!profile) return null;
  const today = dayNumber();
  if (profile.streak.lastDay === today) return null;
  const broken = today - profile.streak.lastDay > 1;
  const day = broken ? 1 : Math.min(profile.streak.days + 1, STREAK_LADDER.length);
  return { day, stars: STREAK_LADDER[day - 1], full: day === STREAK_LADDER.length };
}

export function claimDailyReward(profile = save){
  const reward = pendingDailyReward(profile);
  if (!reward) return null;
  profile.streak.days = reward.day % STREAK_LADDER.length === 0 ? 0 : reward.day;
  profile.streak.lastDay = dayNumber();
  profile.stars += reward.stars;
  persist();
  return reward;
}

/* ---------- איכות תצוגה ---------- */
export const QUALITY = {
  // dprCap — עד כמה מותר להתקרב לרזולוציה הפיזית של המסך
  // ss     — דגימת־על: מציירים מעל הרזולוציה הפיזית ומקטינים, כדי לקבל קצוות חלקים
  normal: { dprCap: 2, ss: 1.0,  label: 'רגיל'    },
  high:   { dprCap: 3, ss: 1.0,  label: 'גבוה'    },
  ultra:  { dprCap: 3, ss: 1.5,  label: 'מקסימלי' },
};

/* ---------- פרופילי מהירות (עדינים — מותאם לגיל 4) ---------- */
export const SPEEDS = {
  calm:   { start: 6.4,  max: 9.4,  ramp: 0.070, label: 'רגוע' },
  normal: { start: 7.9,  max: 12.3, ramp: 0.090, label: 'רגיל' },
  fast:   { start: 9.4,  max: 15.2, ramp: 0.125, label: 'מהיר' },
};

/* ---------- רטט עדין ---------- */
export function buzz(ms){
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch { /* ignore */ } }
}
