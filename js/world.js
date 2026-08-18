/* העולם: פרספקטיבה, שמיים משתנים לפי הזמן שנותר, כביש, נוף ואביזרים */

import { lerp, clamp, mixHex, shade } from './util.js';

export const DEPTH   = 9;      // עומק הפרספקטיבה
export const LANE_W  = 1.05;   // מרחק בין מסלולים ביחידות עולם
export const ROAD_HW = 1.78;   // חצי רוחב הכביש
export const Z_FAR   = 120;    // עד לאן מציירים
export const PLAYER_Z = 2.2;   // המרחק הקבוע של השחקן מהמצלמה

export function makeView(w, h){
  return {
    w, h,
    cx: w / 2,
    horizonY: h * 0.40,
    groundY:  h * 1.03,
    unit: Math.min(w * 0.36, h * 0.22),
  };
}

export const persp = z => DEPTH / (DEPTH + Math.max(z, -DEPTH * 0.9));

/** מיקום על המסך של נקודה בעולם */
export function project(view, z, wx = 0, wy = 0){
  const p = persp(z);
  return {
    x: view.cx + wx * view.unit * p,
    y: view.horizonY + (view.groundY - view.horizonY) * p - wy * view.unit * p,
    p,
    s: view.unit * p,
  };
}

export const laneX = lane => (lane - 1) * LANE_W;

/* ============================================================
   עולמות — המסלול עובר בין נופים שונים לאורך הריצה
   ============================================================ */
export const WORLD_LEN = 260;   // יחידות עולם לכל נוף
const BLEND = 46;               // אזור המעבר בין נוף לנוף

export const WORLDS = [
  { id:'park',   name:'פארק',  emoji:'🌳',
    gNear:'#e8f8ec', gFar:'#4fd07f', hill:'#79c98f',
    road:'#8d8ea8', dash:'rgba(255,255,255,.78)',
    kerbA:'rgba(255,255,255,.88)', kerbB:'rgba(232,90,110,.88)',
    props:['tree','flower','rock','shrub','lamp','flower','tree','shrub'] },

  { id:'city',   name:'עיר',   emoji:'🏙️',
    gNear:'#e3e6ef', gFar:'#9aa0b4', hill:'#8c96b2',
    road:'#5f6278', dash:'rgba(255,214,90,.9)',
    kerbA:'rgba(232,237,247,.92)', kerbB:'rgba(116,124,148,.92)',
    props:['building','building','lamp','bench','building','building','lamp','shrub'] },

  { id:'beach',  name:'חוף',   emoji:'🏖️',
    gNear:'#fff6de', gFar:'#f0d093', hill:'#74cfe6', sea:true,
    road:'#c9a06a', dash:'rgba(255,255,255,.85)',
    kerbA:'rgba(255,255,255,.92)', kerbB:'rgba(70,185,220,.9)',
    props:['palm','umbrella','rock','palm','umbrella','palm','shrub','rock'] },

  { id:'desert', name:'מדבר',  emoji:'🏜️',
    gNear:'#fff0cf', gFar:'#e0b273', hill:'#d5a065',
    road:'#a87950', dash:'rgba(255,255,255,.8)',
    kerbA:'rgba(255,245,225,.88)', kerbB:'rgba(186,116,66,.88)',
    props:['cactus','rock','cactus','rock','cactus','shrub','rock','cactus'] },

  { id:'snow',   name:'שלג',   emoji:'❄️',
    gNear:'#ffffff', gFar:'#d8e8f6', hill:'#cadff0', snow:true,
    road:'#a2b3c7', dash:'rgba(110,150,195,.85)',
    kerbA:'rgba(255,255,255,.95)', kerbB:'rgba(140,185,225,.92)',
    props:['pine','snowman','rock','pine','pine','shrub','pine','rock'] },
];

const smooth = t => t * t * (3 - 2 * t);

/** איזה עולם נמצא במרחק מוחלט זה, וכמה כבר התמזג עם הבא */
export function worldBlend(zAbs){
  const i = Math.floor(zAbs / WORLD_LEN);
  const into = zAbs - i * WORLD_LEN;
  const k = into > WORLD_LEN - BLEND ? smooth((into - (WORLD_LEN - BLEND)) / BLEND) : 0;
  return {
    index: i,
    a: WORLDS[((i % WORLDS.length) + WORLDS.length) % WORLDS.length],
    b: WORLDS[(((i + 1) % WORLDS.length) + WORLDS.length) % WORLDS.length],
    k,
  };
}

/** העולם ה"נוכחי" מבחינת השחקן — לצורך הכרזה ומזג אוויר */
export const worldAt = zAbs => worldBlend(zAbs + BLEND / 2).a;

/* ============================================================
   שמיים — שלוש תחנות זמן: יום → שקיעה → ערב
   ============================================================ */
const SKY_KEYS = [
  { t: 0.00, top:'#4fb8ff', mid:'#a8e4ff', low:'#e9f8ff', sun:'#fff6c9' },
  { t: 0.62, top:'#4a9fe8', mid:'#ffd39b', low:'#ffe9c4', sun:'#fff0b0' },
  { t: 0.86, top:'#37489a', mid:'#ff8f6b', low:'#ffcf8f', sun:'#ffb26b' },
  { t: 1.00, top:'#141d47', mid:'#3b3a75', low:'#7b5aa0', sun:'#ffd9a0' },
];

export function skyPalette(dayT, zAbs = 0){
  const t = clamp(dayT, 0, 1);
  let a = SKY_KEYS[0], b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++){
    if (t >= SKY_KEYS[i].t && t <= SKY_KEYS[i + 1].t){ a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; }
  }
  const j = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  const night = clamp((t - 0.72) / 0.28, 0, 1);

  const w = worldBlend(zAbs);
  const mixW = key => mixHex(w.a[key], w.b[key], w.k);
  const dim = c => mixHex(c, '#0f1730', night * 0.52);

  return {
    top: mixHex(a.top, b.top, j),
    mid: mixHex(a.mid, b.mid, j),
    low: mixHex(a.low, b.low, j),
    sun: mixHex(a.sun, b.sun, j),
    night,
    warm: clamp((t - 0.30) / 0.34, 0, 1) * (1 - night),
    groundNear: dim(mixW('gNear')),
    ground:     dim(mixW('gFar')),
    hill:       dim(mixW('hill')),
    road:       dim(mixW('road')),
    dash:       w.k < 0.5 ? w.a.dash : w.b.dash,
    kerbA:      w.k < 0.5 ? w.a.kerbA : w.b.kerbA,
    kerbB:      w.k < 0.5 ? w.a.kerbB : w.b.kerbB,
    sea:        (w.a.sea ? 1 - w.k : 0) + (w.b.sea ? w.k : 0),
    snow:       (w.a.snow ? 1 - w.k : 0) + (w.b.snow ? w.k : 0),
  };
}

export function drawSky(ctx, view, pal, scrollZ, dayT){
  const { w, horizonY } = view;
  const g = ctx.createLinearGradient(0, 0, 0, horizonY + 2);
  g.addColorStop(0, pal.top);
  g.addColorStop(0.62, pal.mid);
  g.addColorStop(1, pal.low);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, horizonY + 2);

  const sunY = lerp(horizonY * 0.30, horizonY * 0.98, clamp(dayT, 0, 1));
  const sunR = view.w * 0.085;
  ctx.save();
  ctx.globalAlpha = 0.9;
  const halo = ctx.createRadialGradient(view.w * 0.74, sunY, sunR * 0.4, view.w * 0.74, sunY, sunR * 2.6);
  halo.addColorStop(0, pal.sun);
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(view.w * 0.74, sunY, sunR * 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pal.sun;
  ctx.beginPath(); ctx.arc(view.w * 0.74, sunY, sunR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (pal.night > 0.02){
    ctx.save();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 46; i++){
      const sx = ((i * 97) % 1000) / 1000 * w;
      const sy = ((i * 61) % 700) / 700 * horizonY * 0.8;
      ctx.globalAlpha = pal.night * (0.35 + 0.55 * ((i * 37) % 10) / 10);
      ctx.beginPath(); ctx.arc(sx, sy, (i % 3 === 0) ? 1.9 : 1.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // גבעות רחוקות
  const off = (scrollZ * 6) % (w * 0.9);
  ctx.fillStyle = pal.hill;
  for (let i = -1; i < 4; i++){
    const hx = i * w * 0.9 - off;
    ctx.beginPath();
    ctx.moveTo(hx, horizonY + 2);
    ctx.quadraticCurveTo(hx + w * 0.22, horizonY - view.h * 0.13, hx + w * 0.46, horizonY + 2);
    ctx.quadraticCurveTo(hx + w * 0.66, horizonY - view.h * 0.08, hx + w * 0.9, horizonY + 2);
    ctx.closePath(); ctx.fill();
  }

  ctx.save();
  ctx.globalAlpha = 0.75 * (1 - pal.night * 0.8);
  ctx.fillStyle = '#ffffff';
  const cloudOff = (scrollZ * 2.6) % (w * 1.4);
  for (let i = -1; i < 4; i++){
    const cxp = i * w * 0.7 - cloudOff * 0.5;
    const cyp = horizonY * (0.20 + 0.14 * ((i + 4) % 3));
    const cr = w * 0.05 * (1 + 0.25 * ((i + 5) % 3));
    ctx.beginPath();
    ctx.arc(cxp, cyp, cr, 0, Math.PI * 2);
    ctx.arc(cxp + cr * 0.9, cyp + cr * 0.15, cr * 0.78, 0, Math.PI * 2);
    ctx.arc(cxp - cr * 0.85, cyp + cr * 0.2, cr * 0.66, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ============================================================
   קרקע + כביש
   ============================================================ */
export function drawGround(ctx, view, pal, scrollZ){
  const { w, horizonY } = view;

  const gg = ctx.createLinearGradient(0, horizonY, 0, view.h);
  gg.addColorStop(0, pal.groundNear);
  gg.addColorStop(1, pal.ground);
  ctx.fillStyle = gg;
  ctx.fillRect(0, horizonY, w, view.h - horizonY);

  // ים לאורך האופק בעולם החוף
  if (pal.sea > 0.02){
    ctx.save();
    ctx.globalAlpha = pal.sea;
    const seaBottom = horizonY + (view.h - horizonY) * 0.13;
    const sg = ctx.createLinearGradient(0, horizonY, 0, seaBottom);
    sg.addColorStop(0, '#3fb6dd');
    sg.addColorStop(1, '#8fe0f0');
    ctx.fillStyle = sg;
    ctx.fillRect(0, horizonY, w, seaBottom - horizonY);
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++){
      const y = horizonY + (seaBottom - horizonY) * (0.35 + i * 0.22);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 22){
        const yy = y + Math.sin((x + scrollZ * 26 + i * 60) * 0.03) * 2.2;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = shade(pal.ground, -0.16);   // גוון הקרקע עצמה, לא ירוק קבוע
  const BAND = 4.5;
  for (let k = 0; k < 24; k++){
    if (k % 2) continue;
    const z0 = Math.max(k * BAND - (scrollZ % (BAND * 2)), 0);
    const a = project(view, z0);
    const b = project(view, z0 + BAND);
    const hgt = a.y - b.y;
    if (hgt < 2.5) break;
    ctx.globalAlpha = 0.16 * Math.min(1, hgt / 16);
    ctx.fillRect(0, b.y, w, hgt);
  }
  ctx.restore();

  const near = project(view, 0);
  const far  = project(view, Z_FAR);
  const nearHW = ROAD_HW * near.s, farHW = ROAD_HW * far.s;

  const roadPath = () => {
    ctx.beginPath();
    ctx.moveTo(view.cx - nearHW, near.y);
    ctx.lineTo(view.cx + nearHW, near.y);
    ctx.lineTo(view.cx + farHW,  far.y);
    ctx.lineTo(view.cx - farHW,  far.y);
    ctx.closePath();
  };

  ctx.fillStyle = pal.road;
  roadPath(); ctx.fill();

  const roadLight = ctx.createLinearGradient(0, far.y, 0, near.y);
  roadLight.addColorStop(0, 'rgba(255,255,255,.16)');
  roadLight.addColorStop(1, 'rgba(0,0,0,.10)');
  ctx.fillStyle = roadLight;
  roadPath(); ctx.fill();

  // אבני שפה
  const KERB = 2.6;
  for (const sd of [-1, 1]){
    for (let k = 0; k < 30; k++){
      let z0 = k * KERB - (scrollZ % (KERB * 2));
      const z1 = z0 + KERB;
      if (z1 <= 0.2) continue;
      z0 = Math.max(z0, 0.2);
      const a = project(view, z0, sd * ROAD_HW), b = project(view, z1, sd * ROAD_HW);
      if (a.y - b.y < 0.6) break;
      ctx.fillStyle = (k % 2) ? pal.kerbA : pal.kerbB;
      const wa = Math.max(1, 0.075 * a.s), wb = Math.max(0.5, 0.075 * b.s);
      ctx.beginPath();
      ctx.moveTo(a.x - wa, a.y); ctx.lineTo(a.x + wa, a.y);
      ctx.lineTo(b.x + wb, b.y); ctx.lineTo(b.x - wb, b.y);
      ctx.closePath(); ctx.fill();
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = Math.max(2, view.w * 0.006);
  ctx.beginPath();
  ctx.moveTo(view.cx - nearHW, near.y); ctx.lineTo(view.cx - farHW, far.y);
  ctx.moveTo(view.cx + nearHW, near.y); ctx.lineTo(view.cx + farHW, far.y);
  ctx.stroke();

  ctx.fillStyle = pal.dash;
  const DASH = 3.2, GAP = 3.2, PERIOD = DASH + GAP;
  for (const bx of [-LANE_W / 2, LANE_W / 2]){
    for (let k = 0; k < 34; k++){
      let z0 = k * PERIOD - (scrollZ % PERIOD);
      const z1 = z0 + DASH;
      if (z1 <= 0.2) continue;
      z0 = Math.max(z0, 0.2);
      const a = project(view, z0, bx), b = project(view, z1, bx);
      const wa = Math.max(1, 0.055 * a.s), wb = Math.max(0.5, 0.055 * b.s);
      ctx.beginPath();
      ctx.moveTo(a.x - wa, a.y); ctx.lineTo(a.x + wa, a.y);
      ctx.lineTo(b.x + wb, b.y); ctx.lineTo(b.x - wb, b.y);
      ctx.closePath(); ctx.fill();
    }
  }
}

/* ============================================================
   נוף הצדדים — כל פריט שייך לעולם שבמיקום המוחלט שלו,
   ולכן העולם הבא כבר נראה באופק לפני שמגיעים אליו
   ============================================================ */
export function drawSideScenery(ctx, view, pal, scrollZ){
  const SP = 3.5;
  const first = Math.floor(scrollZ / SP);
  const items = [];

  for (let k = 0; k < 62; k++){
    const idx = first + k;
    const zAbs = idx * SP;
    const z = zAbs - scrollZ;
    if (z < 0.5 || z > Z_FAR * 0.85) continue;
    const hash = Math.abs((idx * 2654435761) % 4096);
    const world = worldAt(zAbs);
    items.push({
      z, world, hash,
      side: (hash & 1) ? 1 : -1,
      kind: world.props[(hash >> 4) % world.props.length],
    });
  }
  items.sort((a, b) => b.z - a.z);

  for (const it of items){
    const big = it.kind === 'building' || it.kind === 'palm' || it.kind === 'pine' || it.kind === 'tree';
    const spread = big ? 0.95 + (it.hash % 3) * 0.55 : 0.30 + (it.hash % 5) * 0.55;
    const wx = it.side * (ROAD_HW + spread);
    const pr = project(view, it.z, wx);
    if (pr.s < 0.5) continue;
    switch (it.kind){
      case 'tree':     drawTree(ctx, pr.x, pr.y, pr.s, pal, it.hash); break;
      case 'lamp':     drawLamp(ctx, pr.x, pr.y, pr.s, pal); break;
      case 'rock':     drawRock(ctx, pr.x, pr.y, pr.s, pal, it.hash); break;
      case 'shrub':    drawShrub(ctx, pr.x, pr.y, pr.s, pal, it.hash); break;
      case 'flower':   drawFlower(ctx, pr.x, pr.y, pr.s, pal, it.hash); break;
      case 'building': drawBuilding(ctx, view, it.z, wx, it.hash, pal); break;
      case 'bench':    drawBench(ctx, pr.x, pr.y, pr.s, pal); break;
      case 'palm':     drawPalm(ctx, pr.x, pr.y, pr.s, pal, it.hash); break;
      case 'umbrella': drawUmbrella(ctx, pr.x, pr.y, pr.s, it.hash); break;
      case 'cactus':   drawCactus(ctx, pr.x, pr.y, pr.s, pal, it.hash); break;
      case 'pine':     drawPine(ctx, pr.x, pr.y, pr.s, pal, it.hash); break;
      case 'snowman':  drawSnowman(ctx, pr.x, pr.y, pr.s); break;
    }
  }
}

function drawRock(ctx, x, y, s, pal, seed){
  const r = s * (0.10 + (seed % 3) * 0.035);
  const base = mixHex('#9aa3b8', '#2a2f4d', pal.night * 0.8);
  drawShadow(ctx, x, y, s * 0.5, 0.14);
  const g = ctx.createLinearGradient(x + r * SUN_DIR, y - r * 1.2, x - r * SUN_DIR, y);
  g.addColorStop(0, shade(base, 0.16));
  g.addColorStop(1, shade(base, -0.14));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.4, r * 1.35, r, 0, Math.PI, 0);
  ctx.closePath(); ctx.fill();
}

function drawShrub(ctx, x, y, s, pal, seed){
  const r = s * (0.13 + (seed % 3) * 0.04);
  ctx.fillStyle = mixHex(seed % 2 ? '#3cba6d' : '#2f9f5b', '#0f3a28', pal.night * 0.85);
  for (const [dx, dy, k] of [[-0.9, 0, .8], [0.9, 0, .8], [0, -0.55, 1]]){
    ctx.beginPath(); ctx.arc(x + dx * r, y - r * 0.35 + dy * r, r * k, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFlower(ctx, x, y, s, pal, seed){
  const r = s * 0.055;
  if (r < 0.7) return;
  const cols = ['#ff5d8f', '#ffc531', '#ffffff', '#9b5cff'];
  const col = mixHex(cols[seed % cols.length], '#25406b', pal.night * 0.7);
  ctx.strokeStyle = mixHex('#2f9f5b', '#10402c', pal.night);
  ctx.lineWidth = Math.max(0.6, r * 0.35);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 2.2); ctx.stroke();
  ctx.fillStyle = col;
  for (let i = 0; i < 5; i++){
    const a = i / 5 * Math.PI * 2 + seed;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y - r * 2.2 + Math.sin(a) * r, r * 0.78, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = mixHex('#ffd23f', '#7a5a20', pal.night);
  ctx.beginPath(); ctx.arc(x, y - r * 2.2, r * 0.6, 0, Math.PI * 2); ctx.fill();
}

function drawTree(ctx, x, y, s, pal, seed){
  const h = (1.5 + (seed % 4) * 0.22) * s;
  drawShadow(ctx, x, y, s * 1.1, 0.16);
  const bark = mixHex('#8a5a34', '#2a2540', pal.night);
  ctx.fillStyle = bark;
  ctx.fillRect(x - s * 0.055, y - h * 0.42, s * 0.11, h * 0.42);
  ctx.fillStyle = shade(bark, 0.10);
  ctx.fillRect(x + SUN_DIR * s * 0.012, y - h * 0.42, s * 0.043, h * 0.42);

  const light = mixHex(seed % 2 ? '#5fd98d' : '#4cc97c', '#1a5a3c', pal.night * 0.85);
  const dark  = mixHex(seed % 2 ? '#238f52' : '#1d7d49', '#0d3526', pal.night * 0.85);
  for (let i = 0; i < 3; i++){
    const r = s * (0.36 - i * 0.062);
    const cy = y - h * (0.40 + i * 0.20);
    const g = ctx.createRadialGradient(x + r * 0.45 * SUN_DIR, cy - r * 0.45, r * 0.1, x, cy, r);
    g.addColorStop(0, light);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawLamp(ctx, x, y, s, pal){
  ctx.fillStyle = mixHex('#6b7390', '#2a2f4d', pal.night);
  ctx.fillRect(x - s * 0.035, y - s * 1.5, s * 0.07, s * 1.5);
  ctx.fillStyle = pal.night > 0.25 ? '#ffe6a3' : '#cfd6e6';
  ctx.beginPath(); ctx.arc(x, y - s * 1.55, s * 0.13, 0, Math.PI * 2); ctx.fill();
  if (pal.night > 0.25){
    ctx.save();
    ctx.globalAlpha = pal.night * 0.35;
    const gl = ctx.createRadialGradient(x, y - s * 1.5, 0, x, y - s * 1.5, s * 0.9);
    gl.addColorStop(0, '#ffdf9a'); gl.addColorStop(1, 'rgba(255,223,154,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(x, y - s * 1.5, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

/* ---------- עיר ---------- */
const BUILDING_COLORS = ['#c9d2e4', '#e0d6c8', '#b7c3d8', '#d8c9d2', '#c2cbbd'];

function drawBuilding(ctx, view, z, wx, seed, pal){
  const floors = 3 + (seed % 6);
  const h = 1.5 + floors * 0.55;
  const w = 1.5 + (seed % 3) * 0.45;
  const base = mixHex(BUILDING_COLORS[seed % BUILDING_COLORS.length], '#1a2340', pal.night * 0.62);
  const box = drawBox3D(ctx, view, z, wx, w, h, 1.5, base);

  // חלונות על הפאה הקדמית
  const { ftl, ftr, fbl } = box;
  const bw = ftr.x - ftl.x, bh = fbl.y - ftl.y;
  if (Math.abs(bw) < 6 || bh < 10) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ftl.x, ftl.y); ctx.lineTo(ftr.x, ftr.y);
  ctx.lineTo(box.fbr.x, box.fbr.y); ctx.lineTo(fbl.x, fbl.y);
  ctx.closePath(); ctx.clip();
  const cols = 3, rows = floors;
  for (let r = 0; r < rows; r++){
    for (let c = 0; c < cols; c++){
      const lit = ((seed + r * 7 + c * 13) % 5) < (pal.night > 0.3 ? 3 : 1);
      ctx.fillStyle = lit
        ? mixHex('#ffe9a8', '#ffd15c', pal.night)
        : `rgba(60,80,120,${0.35 + pal.night * 0.3})`;
      const x = ftl.x + bw * (0.14 + c * 0.26);
      const y = ftl.y + bh * (0.10 + r * (0.86 / rows));
      ctx.fillRect(x, y, bw * 0.16, bh * (0.55 / rows));
    }
  }
  ctx.restore();
}

function drawBench(ctx, x, y, s, pal){
  drawShadow(ctx, x, y, s * 0.7, 0.14);
  const wood = mixHex('#a9743d', '#2a2540', pal.night);
  ctx.fillStyle = wood;
  ctx.fillRect(x - s * 0.24, y - s * 0.26, s * 0.48, s * 0.07);
  ctx.fillRect(x - s * 0.24, y - s * 0.46, s * 0.48, s * 0.06);
  ctx.fillStyle = shade(wood, -0.16);
  ctx.fillRect(x - s * 0.21, y - s * 0.26, s * 0.05, s * 0.26);
  ctx.fillRect(x + s * 0.16, y - s * 0.26, s * 0.05, s * 0.26);
}

/* ---------- חוף ---------- */
function drawPalm(ctx, x, y, s, pal, seed){
  drawShadow(ctx, x, y, s * 1.0, 0.16);
  const h = (1.5 + (seed % 3) * 0.3) * s;
  const bend = ((seed % 5) - 2) * 0.05;
  ctx.strokeStyle = mixHex('#a9773f', '#2a2540', pal.night);
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + bend * h, y - h * 0.6, x + bend * h * 2, y - h);
  ctx.stroke();
  const tx = x + bend * h * 2, ty = y - h;
  const frond = mixHex('#37b866', '#12482f', pal.night * 0.85);
  ctx.fillStyle = frond;
  for (let i = 0; i < 6; i++){
    const a = Math.PI + i * (Math.PI / 5) + (seed % 3) * 0.12;
    ctx.beginPath();
    ctx.ellipse(tx + Math.cos(a) * s * 0.30, ty + Math.sin(a) * s * 0.20,
                s * 0.32, s * 0.10, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = mixHex('#8a5a34', '#241f38', pal.night);
  ctx.beginPath(); ctx.arc(tx, ty + s * 0.06, s * 0.06, 0, Math.PI * 2); ctx.fill();
}

function drawUmbrella(ctx, x, y, s, seed){
  drawShadow(ctx, x, y, s * 0.8, 0.16);
  const h = s * 0.95;
  ctx.strokeStyle = '#e8ecf6';
  ctx.lineWidth = s * 0.045;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
  const cols = [['#ff5d8f', '#ffffff'], ['#3aa0ff', '#ffe08a'], ['#37d67a', '#ffffff']][seed % 3];
  for (let i = 0; i < 6; i++){
    ctx.fillStyle = cols[i % 2];
    ctx.beginPath();
    ctx.moveTo(x, y - h - s * 0.10);
    ctx.arc(x, y - h - s * 0.10, s * 0.42, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6);
    ctx.closePath(); ctx.fill();
  }
}

/* ---------- מדבר ---------- */
function drawCactus(ctx, x, y, s, pal, seed){
  drawShadow(ctx, x, y, s * 0.7, 0.16);
  const h = (0.85 + (seed % 3) * 0.28) * s;
  const green = mixHex('#3faa63', '#123c2a', pal.night * 0.85);
  const rr2 = (px, py, pw, ph, r) => {
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + pw, py, px + pw, py + ph, r);
    ctx.arcTo(px + pw, py + ph, px, py + ph, r);
    ctx.arcTo(px, py + ph, px, py, r);
    ctx.arcTo(px, py, px + pw, py, r);
    ctx.closePath(); ctx.fill();
  };
  ctx.fillStyle = green;
  rr2(x - s * 0.09, y - h, s * 0.18, h, s * 0.09);
  if (seed % 2){
    rr2(x + s * 0.06, y - h * 0.72, s * 0.22, s * 0.14, s * 0.07);
    rr2(x + s * 0.20, y - h * 0.78, s * 0.14, h * 0.34, s * 0.07);
  } else {
    rr2(x - s * 0.28, y - h * 0.66, s * 0.22, s * 0.14, s * 0.07);
    rr2(x - s * 0.34, y - h * 0.72, s * 0.14, h * 0.30, s * 0.07);
  }
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  rr2(x - s * 0.06, y - h + s * 0.05, s * 0.05, h * 0.8, s * 0.03);
}

/* ---------- שלג ---------- */
function drawPine(ctx, x, y, s, pal, seed){
  drawShadow(ctx, x, y, s * 0.9, 0.14);
  const h = (1.5 + (seed % 3) * 0.3) * s;
  ctx.fillStyle = mixHex('#7a5636', '#231f36', pal.night);
  ctx.fillRect(x - s * 0.05, y - h * 0.22, s * 0.10, h * 0.22);
  for (let i = 0; i < 3; i++){
    const wdt = s * (0.42 - i * 0.10);
    const top = y - h * (0.34 + i * 0.24) - h * 0.30;
    const bot = y - h * (0.20 + i * 0.24);
    ctx.fillStyle = mixHex(i % 2 ? '#2f8f57' : '#27784a', '#0e3527', pal.night * 0.85);
    ctx.beginPath();
    ctx.moveTo(x, top); ctx.lineTo(x + wdt, bot); ctx.lineTo(x - wdt, bot);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + wdt * 0.55, bot - (bot - top) * 0.40);
    ctx.lineTo(x - wdt * 0.55, bot - (bot - top) * 0.40);
    ctx.closePath(); ctx.fill();
  }
}

function drawSnowman(ctx, x, y, s){
  drawShadow(ctx, x, y, s * 0.8, 0.14);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x, y - s * 0.22, s * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - s * 0.52, s * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - s * 0.76, s * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#17203a';
  ctx.beginPath(); ctx.arc(x - s * 0.045, y - s * 0.79, s * 0.017, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + s * 0.045, y - s * 0.79, s * 0.017, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff8a3d';
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.755); ctx.lineTo(x + s * 0.10, y - s * 0.74); ctx.lineTo(x, y - s * 0.725);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff5d8f';
  ctx.fillRect(x - s * 0.13, y - s * 0.90, s * 0.26, s * 0.06);
  ctx.fillRect(x - s * 0.09, y - s * 1.00, s * 0.18, s * 0.11);
}

/** פתיתי שלג — פונקציה של הזמן, בלי לנהל חלקיקים */
export function drawWeather(ctx, view, pal, t){
  if (pal.snow <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = pal.snow * 0.85;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++){
    const seed = (i * 9301 + 49297) % 233280 / 233280;
    const speed = 40 + seed * 90;
    const y = ((t * speed + seed * view.h * 3) % (view.h + 40)) - 20;
    const x = (seed * view.w + Math.sin(t * 0.8 + i) * 26 + view.w) % view.w;
    const r = 1.2 + seed * 2.6;
    ctx.globalAlpha = pal.snow * (0.35 + seed * 0.5);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ============================================================
   אביזרים
   ============================================================ */
/** השמש יושבת מימין־למעלה, ולכן כל התאורה והצללים בסצנה עקביים איתה */
export const SUN_DIR = 1;

/**
 * קופסה בפרספקטיבה אמיתית: שמונה פינות מוקרנות, שלוש פאות מוצללות.
 * z = מרכז הקופסה, wx = מיקום רוחבי, w/h/d = רוחב/גובה/עומק ביחידות עולם.
 */
export function drawBox3D(ctx, view, z, wx, w, h, d, base, opts = {}){
  const y0 = opts.y0 || 0;          // גובה הבסיס מעל הקרקע
  const y1 = y0 + h;
  const zF = Math.max(z - d / 2, 0.15);
  const zB = z + d / 2;
  const pt = (zz, x, y) => project(view, zz, x, y);

  const fbl = pt(zF, wx - w / 2, y0), fbr = pt(zF, wx + w / 2, y0);
  const ftl = pt(zF, wx - w / 2, y1), ftr = pt(zF, wx + w / 2, y1);
  const bbl = pt(zB, wx - w / 2, y0), bbr = pt(zB, wx + w / 2, y0);
  const btl = pt(zB, wx - w / 2, y1), btr = pt(zB, wx + w / 2, y1);

  const poly = pts => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    if (opts.edge){ ctx.strokeStyle = opts.edge; ctx.lineWidth = Math.max(1, fbl.s * 0.02); ctx.stroke(); }
  };

  // גג (או תחתית, אם הקופסה מרחפת מעל גובה העין)
  ctx.fillStyle = shade(base, 0.16);
  poly([btl, btr, ftr, ftl]);
  if (y0 > 0.05){
    ctx.fillStyle = shade(base, -0.22);
    poly([bbl, bbr, fbr, fbl]);
  }

  // רק אחת מפאות הצד נראית, לפי הצד שבו הקופסה נמצאת ביחס למצלמה
  const showsLeftFace = wx > 0;
  const sideLit = showsLeftFace ? SUN_DIR < 0 : SUN_DIR > 0;
  ctx.fillStyle = shade(base, sideLit ? 0.04 : -0.14);
  poly(showsLeftFace ? [ftl, btl, bbl, fbl] : [ftr, btr, bbr, fbr]);

  // פאה קדמית
  ctx.fillStyle = base;
  poly([ftl, ftr, fbr, fbl]);

  return { fbl, fbr, ftl, ftr, s: fbl.s };
}

export function drawShadow(ctx, x, y, s, alpha = 0.22){
  if (alpha <= 0.001) return;
  ctx.save();
  // הצל נופל הפוך לשמש, ומתרכך בשוליים
  const cx = x - SUN_DIR * s * 0.10;
  const g = ctx.createRadialGradient(cx, y, s * 0.03, cx, y, s * 0.34);
  g.addColorStop(0, `rgba(13,27,62,${alpha})`);
  g.addColorStop(1, 'rgba(13,27,62,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(cx, y, s * 0.34, s * 0.10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawStarProp(ctx, x, y, s, spin, glow = true){
  ctx.save();
  ctx.translate(x, y - s * 0.55);
  ctx.rotate(spin);
  if (glow && s > 14){ ctx.shadowColor = 'rgba(255,197,49,.9)'; ctx.shadowBlur = s * 0.30; }
  const R = s * 0.24, r = R * 0.47;
  ctx.beginPath();
  for (let i = 0; i < 10; i++){
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const rad = i % 2 ? r : R;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffc531'; ctx.fill();
  ctx.lineWidth = s * 0.035; ctx.strokeStyle = '#e09a10'; ctx.stroke();
  ctx.restore();
}

export function drawGemProp(ctx, x, y, s, spin, glow = true){
  ctx.save();
  ctx.translate(x, y - s * 0.6);
  if (glow && s > 14){ ctx.shadowColor = 'rgba(90,215,255,.95)'; ctx.shadowBlur = s * 0.34; }
  const sx = Math.cos(spin) * 0.55 + 0.45;
  ctx.scale(sx, 1);
  const R = s * 0.22;
  ctx.beginPath();
  ctx.moveTo(0, -R); ctx.lineTo(R * 0.85, -R * 0.2);
  ctx.lineTo(0, R); ctx.lineTo(-R * 0.85, -R * 0.2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -R, 0, R);
  g.addColorStop(0, '#8ef2ff'); g.addColorStop(1, '#2fa8ff');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.03; ctx.stroke();
  ctx.restore();
}

export function drawBush(ctx, x, y, s){
  drawShadow(ctx, x, y, s);
  for (const [dx, dy, r] of [[-0.17, 0, .21], [0.17, 0, .21], [0, -0.12, .26]]){
    const cx = x + dx * s, cy = y - s * 0.17 + dy * s, rad = r * s;
    const g = ctx.createRadialGradient(cx + rad * 0.42 * SUN_DIR, cy - rad * 0.42, rad * 0.12, cx, cy, rad);
    g.addColorStop(0, '#68d98f');
    g.addColorStop(0.6, '#35ab63');
    g.addColorStop(1, '#1f7a45');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ff5d8f';
  ctx.beginPath(); ctx.arc(x + s * 0.13, y - s * 0.30, s * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(x - s * 0.14, y - s * 0.22, s * 0.04, 0, Math.PI * 2); ctx.fill();
}

/** ארגז עץ — קובייה אמיתית עם גג, צד וקדמה מוצללים */
export function drawCrate(ctx, view, z, wx, tint = 0){
  const ground = project(view, z, wx);
  drawShadow(ctx, ground.x, ground.y, ground.s);
  const box = drawBox3D(ctx, view, z, wx, 0.64, 0.82, 0.64,
    shade('#d79a4f', tint), { edge: 'rgba(122,80,32,.55)' });

  // קרשים ואלכסונים על הפאה הקדמית
  const { ftl, ftr, fbl, fbr } = box;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ftl.x, ftl.y); ctx.lineTo(ftr.x, ftr.y);
  ctx.lineTo(fbr.x, fbr.y); ctx.lineTo(fbl.x, fbl.y);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(122,80,32,.5)';
  ctx.lineWidth = Math.max(1.2, box.s * 0.03);
  ctx.beginPath();
  ctx.moveTo(ftl.x, ftl.y); ctx.lineTo(fbr.x, fbr.y);
  ctx.moveTo(ftr.x, ftr.y); ctx.lineTo(fbl.x, fbl.y);
  ctx.stroke();
  ctx.fillStyle = 'rgba(181,122,52,.85)';
  ctx.fillRect(Math.min(ftl.x, fbl.x), ftl.y, Math.abs(ftr.x - ftl.x), (fbl.y - ftl.y) * 0.16);
  ctx.fillRect(Math.min(ftl.x, fbl.x), fbl.y - (fbl.y - ftl.y) * 0.16, Math.abs(fbr.x - fbl.x), (fbl.y - ftl.y) * 0.16);
  ctx.restore();
}

/** מוט עילי — קורה תלת־ממדית שתלויה מעל המסלול, על שני עמודים */
export function drawBar(ctx, view, z, wx){
  const ground = project(view, z, wx);
  drawShadow(ctx, ground.x, ground.y, ground.s, 0.16);
  // עמודים
  for (const sd of [-1, 1]){
    drawBox3D(ctx, view, z, wx + sd * 0.46, 0.11, 1.28, 0.11, '#c9376a');
  }
  // הקורה עצמה — מרחפת בגובה שצריך להתכופף מתחתיו
  const beam = drawBox3D(ctx, view, z, wx, 1.02, 0.40, 0.28, '#ff5d8f',
    { edge: 'rgba(160,40,80,.5)', y0: 0.72 });
  const { ftl, ftr, fbl } = beam;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ftl.x, ftl.y); ctx.lineTo(ftr.x, ftr.y);
  ctx.lineTo(beam.fbr.x, beam.fbr.y); ctx.lineTo(fbl.x, fbl.y);
  ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  const bw = ftr.x - ftl.x;
  for (let i = 0; i < 4; i++){
    ctx.save();
    ctx.translate(ftl.x + bw * (0.08 + i * 0.24), ftl.y);
    ctx.transform(1, 0, -0.45, 1, 0, 0);
    ctx.fillRect(0, 0, bw * 0.10, fbl.y - ftl.y);
    ctx.restore();
  }
  ctx.restore();
}

export function drawMagnet(ctx, x, y, s, spin){
  ctx.save();
  ctx.translate(x, y - s * 0.6);
  ctx.rotate(Math.sin(spin) * 0.25);
  const R = s * 0.22;
  ctx.lineWidth = R * 0.62; ctx.lineCap = 'butt';
  ctx.strokeStyle = '#ff4d4d';
  ctx.beginPath(); ctx.arc(0, 0, R, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#e8ecf6';
  ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(-R, R * 0.7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(R, R * 0.7); ctx.stroke();
  ctx.restore();
}

export function drawShieldProp(ctx, x, y, s, spin){
  ctx.save();
  ctx.translate(x, y - s * 0.6);
  ctx.globalAlpha = 0.85 + Math.sin(spin * 3) * 0.12;
  const R = s * 0.24;
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,255,.95)');
  g.addColorStop(1, 'rgba(120,220,255,.55)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5ecbff'; ctx.lineWidth = s * 0.04; ctx.stroke();
  ctx.restore();
}

/** שער צבעים — שלוש קשתות, אחת בכל מסלול */
export function drawGate(ctx, view, z, colors, targetIdx, pulse){
  for (let lane = 0; lane < 3; lane++){
    const pr = project(view, z, laneX(lane));
    if (pr.s < 0.5) continue;
    const s = pr.s;
    const halfW = s * 0.46, top = pr.y - s * 1.42;
    const col = colors[lane];
    const isTarget = lane === targetIdx;

    ctx.save();
    if (isTarget){
      ctx.shadowColor = col;
      ctx.shadowBlur = s * (0.28 + 0.18 * Math.sin(pulse * 6));
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(2, s * 0.13);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pr.x - halfW, pr.y);
    ctx.lineTo(pr.x - halfW, top + halfW * 0.6);
    ctx.quadraticCurveTo(pr.x - halfW, top, pr.x, top);
    ctx.quadraticCurveTo(pr.x + halfW, top, pr.x + halfW, top + halfW * 0.6);
    ctx.lineTo(pr.x + halfW, pr.y);
    ctx.stroke();
    ctx.restore();

    // וילון צבע שקוף
    ctx.save();
    ctx.globalAlpha = isTarget ? 0.30 + 0.10 * Math.sin(pulse * 6) : 0.14;
    ctx.fillStyle = col;
    ctx.fillRect(pr.x - halfW, top, halfW * 2, pr.y - top);
    ctx.restore();
  }
}

/** בית העץ — היעד בסוף הסשן */
export function drawTreehouse(ctx, view, z){
  const pr = project(view, z, 0);
  const s = pr.s;
  if (s < 0.4) return;
  const y = pr.y, x = pr.x;

  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(x - s * 0.16, y - s * 1.1, s * 0.32, s * 1.1);
  ctx.fillStyle = '#2f9f5b';
  for (const [dx, dy, r] of [[-0.62, -1.15, .48], [0.62, -1.15, .48], [0, -1.5, .60]]){
    ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#e8b06a';
  ctx.fillRect(x - s * 0.52, y - s * 1.98, s * 1.04, s * 0.62);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.62, y - s * 1.98);
  ctx.lineTo(x, y - s * 2.46);
  ctx.lineTo(x + s * 0.62, y - s * 1.98);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe08a';
  ctx.fillRect(x - s * 0.14, y - s * 1.80, s * 0.28, s * 0.28);
  ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.strokeRect(x - s * 0.14, y - s * 1.80, s * 0.28, s * 0.28);
}


/* ============================================================
   שכבות איכות: ערפל מרחק, ויניה וקווי מהירות
   ============================================================ */

/** אובך שמרכך את הרקע הרחוק — מוסיף עומק אמיתי לתמונה */
export function drawFog(ctx, view, pal){
  const top = view.horizonY - 2;
  const bottom = view.horizonY + (view.h - view.horizonY) * 0.26;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, pal.low);
  g.addColorStop(0.12, pal.low);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = 0.40;
  ctx.fillStyle = g;
  ctx.fillRect(0, top, view.w, bottom - top);
  ctx.restore();
}

let vignetteCache = null;
export function drawVignette(ctx, view){
  if (!vignetteCache || vignetteCache.w !== view.w || vignetteCache.h !== view.h){
    const g = ctx.createRadialGradient(
      view.w / 2, view.h * 0.52, Math.min(view.w, view.h) * 0.34,
      view.w / 2, view.h * 0.52, Math.max(view.w, view.h) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(8,14,34,0.34)');
    vignetteCache = { w: view.w, h: view.h, g };
  }
  ctx.fillStyle = vignetteCache.g;
  ctx.fillRect(0, 0, view.w, view.h);
}

/** פסי מהירות עדינים בשולי המסך כשרצים מהר */
export function drawSpeedLines(ctx, view, intensity, t){
  if (intensity <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = intensity * 0.28;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++){
    const seed = (i * 7919) % 1000 / 1000;
    const side = i % 2 ? 1 : -1;
    const prog = ((t * (1.1 + seed * 0.9) + seed) % 1);
    const x = view.cx + side * view.w * (0.30 + seed * 0.22 + prog * 0.28);
    const y = view.horizonY + (view.h - view.horizonY) * (0.15 + prog * 0.95);
    const len = view.h * 0.05 * (0.4 + prog);
    ctx.lineWidth = 1.5 + prog * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y - len);
    ctx.lineTo(x, y + len);
    ctx.stroke();
  }
  ctx.restore();
}
