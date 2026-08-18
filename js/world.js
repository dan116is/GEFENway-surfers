/* העולם: פרספקטיבה, שמיים משתנים לפי הזמן שנותר, כביש, נוף ואביזרים */

import { lerp, clamp, mixHex } from './util.js';

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
   שמיים — שלוש תחנות: יום → שקיעה → ערב.
   dayT הולך מ-0 (תחילת הסשן) עד 1 (בית העץ).
   ============================================================ */
const SKY_KEYS = [
  { t: 0.00, top:'#4fb8ff', mid:'#a8e4ff', low:'#e9f8ff', ground:'#4fd07f', road:'#8d8ea8', sun:'#fff6c9' },
  { t: 0.62, top:'#4a9fe8', mid:'#ffd39b', low:'#ffe9c4', ground:'#43ad6d', road:'#7e7f9b', sun:'#fff0b0' },
  { t: 0.86, top:'#37489a', mid:'#ff8f6b', low:'#ffcf8f', ground:'#2b7d51', road:'#5f6182', sun:'#ffb26b' },
  { t: 1.00, top:'#141d47', mid:'#3b3a75', low:'#7b5aa0', ground:'#155238', road:'#3d3f5c', sun:'#ffd9a0' },
];

export function skyPalette(dayT){
  const t = clamp(dayT, 0, 1);
  let a = SKY_KEYS[0], b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let i = 0; i < SKY_KEYS.length - 1; i++){
    if (t >= SKY_KEYS[i].t && t <= SKY_KEYS[i + 1].t){ a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; }
  }
  const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  return {
    top: mixHex(a.top, b.top, k),
    mid: mixHex(a.mid, b.mid, k),
    low: mixHex(a.low, b.low, k),
    ground: mixHex(a.ground, b.ground, k),
    road: mixHex(a.road, b.road, k),
    sun: mixHex(a.sun, b.sun, k),
    night: clamp((t - 0.72) / 0.28, 0, 1),
    warm: clamp((t - 0.30) / 0.34, 0, 1) * (1 - clamp((t - 0.72) / 0.28, 0, 1)),
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

  // שמש/ירח — יורדת לאט לכיוון האופק
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

  // כוכבים בערב
  if (pal.night > 0.02){
    ctx.save();
    ctx.globalAlpha = pal.night * 0.9;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 46; i++){
      const sx = ((i * 97) % 1000) / 1000 * w;
      const sy = ((i * 61) % 700) / 700 * horizonY * 0.8;
      const r = (i % 3 === 0) ? 1.9 : 1.1;
      ctx.globalAlpha = pal.night * (0.35 + 0.55 * ((i * 37) % 10) / 10);
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // גבעות רחוקות (פרלקסה איטית)
  const off = (scrollZ * 6) % (w * 0.9);
  ctx.fillStyle = mixHex('#79c98f', '#20406b', clamp(dayT * 0.9, 0, 1));
  for (let i = -1; i < 4; i++){
    const hx = i * w * 0.9 - off;
    ctx.beginPath();
    ctx.moveTo(hx, horizonY + 2);
    ctx.quadraticCurveTo(hx + w * 0.22, horizonY - view.h * 0.13, hx + w * 0.46, horizonY + 2);
    ctx.quadraticCurveTo(hx + w * 0.66, horizonY - view.h * 0.08, hx + w * 0.9, horizonY + 2);
    ctx.closePath(); ctx.fill();
  }

  // עננים
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
  const { w, horizonY, groundY } = view;

  const gg = ctx.createLinearGradient(0, horizonY, 0, view.h);
  gg.addColorStop(0, mixHex('#ffffff', pal.ground, 0.55));
  gg.addColorStop(1, pal.ground);
  ctx.fillStyle = gg;
  ctx.fillRect(0, horizonY, w, view.h - horizonY);

  // פסי דשא נעים (תחושת מהירות עדינה) — נעצרים כשהם דקים מדי כדי שלא ייווצר כתם כהה
  ctx.save();
  ctx.fillStyle = '#0b3d24';
  const BAND = 4.5;
  for (let k = 0; k < 24; k++){
    if (k % 2) continue;
    const z0 = Math.max(k * BAND - (scrollZ % (BAND * 2)), 0);
    const z1 = z0 + BAND;
    const a = project(view, z0);
    const b = project(view, z1);
    const hgt = a.y - b.y;
    if (hgt < 2.5) break;
    ctx.globalAlpha = 0.10 * Math.min(1, hgt / 16);
    ctx.fillRect(0, b.y, w, hgt);
  }
  ctx.restore();

  // כביש — טרפז ישר בין z=0 ל-z=Z_FAR
  const near = project(view, 0);
  const far  = project(view, Z_FAR);
  const nearHW = ROAD_HW * near.s, farHW = ROAD_HW * far.s;

  ctx.fillStyle = pal.road;
  ctx.beginPath();
  ctx.moveTo(view.cx - nearHW, near.y);
  ctx.lineTo(view.cx + nearHW, near.y);
  ctx.lineTo(view.cx + farHW,  far.y);
  ctx.lineTo(view.cx - farHW,  far.y);
  ctx.closePath();
  ctx.fill();

  // הבהרה עדינה במרכז הכביש — עומק
  const roadLight = ctx.createLinearGradient(0, far.y, 0, near.y);
  roadLight.addColorStop(0, 'rgba(255,255,255,.16)');
  roadLight.addColorStop(1, 'rgba(0,0,0,.10)');
  ctx.fillStyle = roadLight;
  ctx.beginPath();
  ctx.moveTo(view.cx - nearHW, near.y);
  ctx.lineTo(view.cx + nearHW, near.y);
  ctx.lineTo(view.cx + farHW,  far.y);
  ctx.lineTo(view.cx - farHW,  far.y);
  ctx.closePath(); ctx.fill();

  // אבני שפה אדום־לבן
  const KERB = 2.6;
  for (const sd of [-1, 1]){
    for (let k = 0; k < 30; k++){
      let z0 = k * KERB - (scrollZ % (KERB * 2));
      const z1 = z0 + KERB;
      if (z1 <= 0.2) continue;
      z0 = Math.max(z0, 0.2);
      const a = project(view, z0, sd * ROAD_HW), b = project(view, z1, sd * ROAD_HW);
      if (a.y - b.y < 0.6) break;
      ctx.fillStyle = (k % 2) ? 'rgba(255,255,255,.85)' : 'rgba(232,90,110,.85)';
      const wa = Math.max(1, 0.075 * a.s), wb = Math.max(0.5, 0.075 * b.s);
      ctx.beginPath();
      ctx.moveTo(a.x - wa, a.y); ctx.lineTo(a.x + wa, a.y);
      ctx.lineTo(b.x + wb, b.y); ctx.lineTo(b.x - wb, b.y);
      ctx.closePath(); ctx.fill();
    }
  }

  // שוליים בהירים
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = Math.max(2, view.w * 0.006);
  ctx.beginPath();
  ctx.moveTo(view.cx - nearHW, near.y); ctx.lineTo(view.cx - farHW, far.y);
  ctx.moveTo(view.cx + nearHW, near.y); ctx.lineTo(view.cx + farHW, far.y);
  ctx.stroke();

  // קווי הפרדה מקווקווים בין המסלולים
  ctx.fillStyle = 'rgba(255,255,255,.75)';
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

/* עצים, פנסים, סלעים ופרחים לצדדים */
export function drawSideScenery(ctx, view, pal, scrollZ){
  const SP = 3.5;
  const items = [];
  for (let k = 0; k < 60; k++){
    const z = k * SP - (scrollZ % SP);
    if (z < 0.5 || z > Z_FAR * 0.8) continue;
    const seed = Math.abs(Math.floor((scrollZ / SP) + k));
    const hash = (seed * 2654435761) % 4096;              // מפזר בלי מחזוריות נראית לעין
    const side = (hash & 1) ? 1 : -1;
    const kind = ['tree', 'flower', 'rock', 'shrub', 'lamp', 'flower', 'tree', 'shrub'][(hash >> 4) % 8];
    items.push({ z, side, kind, seed: hash });
  }
  items.sort((a, b) => b.z - a.z);

  for (const it of items){
    const near = it.kind === 'flower' || it.kind === 'rock' || it.kind === 'shrub';
    const spread = near ? 0.30 + (it.seed % 5) * 0.55 : 0.75 + (it.seed % 3) * 0.45;
    const wx = it.side * (ROAD_HW + spread);
    const pr = project(view, it.z, wx);
    if (pr.s < 0.5) continue;
    switch (it.kind){
      case 'tree':   drawTree(ctx, pr.x, pr.y, pr.s, pal, it.seed); break;
      case 'lamp':   drawLamp(ctx, pr.x, pr.y, pr.s, pal); break;
      case 'rock':   drawRock(ctx, pr.x, pr.y, pr.s, pal, it.seed); break;
      case 'shrub':  drawShrub(ctx, pr.x, pr.y, pr.s, pal, it.seed); break;
      case 'flower': drawFlower(ctx, pr.x, pr.y, pr.s, pal, it.seed); break;
    }
  }
}

function drawRock(ctx, x, y, s, pal, seed){
  const r = s * (0.10 + (seed % 3) * 0.035);
  ctx.fillStyle = mixHex('#9aa3b8', '#2a2f4d', pal.night * 0.8);
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.4, r * 1.35, r, 0, Math.PI, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.62, r * 0.42, r * 0.24, -0.4, 0, Math.PI * 2);
  ctx.fill();
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
  ctx.fillStyle = mixHex('#8a5a34', '#2a2540', pal.night);
  ctx.fillRect(x - s * 0.05, y - h * 0.42, s * 0.10, h * 0.42);
  const crown = mixHex(seed % 2 ? '#35b866' : '#2f9f5b', '#10402c', pal.night * 0.85);
  ctx.fillStyle = crown;
  for (let i = 0; i < 3; i++){
    const r = s * (0.34 - i * 0.06);
    ctx.beginPath();
    ctx.arc(x, y - h * (0.40 + i * 0.20), r, 0, Math.PI * 2);
    ctx.fill();
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

/* ============================================================
   אביזרים
   ============================================================ */
export function drawShadow(ctx, x, y, s, alpha = 0.22){
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0d1b3e';
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.30, s * 0.085, 0, 0, Math.PI * 2); ctx.fill();
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
  ctx.fillStyle = '#2f9f5b';
  for (const [dx, dy, r] of [[-0.16, 0, .20], [0.16, 0, .20], [0, -0.10, .24]]){
    ctx.beginPath(); ctx.arc(x + dx * s, y - s * 0.16 + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#43c377';
  ctx.beginPath(); ctx.arc(x - s * 0.06, y - s * 0.30, s * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff5d8f';
  ctx.beginPath(); ctx.arc(x + s * 0.13, y - s * 0.26, s * 0.045, 0, Math.PI * 2); ctx.fill();
}

export function drawCrate(ctx, x, y, s){
  drawShadow(ctx, x, y, s);
  const w = s * 0.52, h = s * 0.72;
  ctx.fillStyle = '#d79a4f';
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = '#b57a34';
  ctx.fillRect(x - w / 2, y - h, w, h * 0.14);
  ctx.strokeStyle = '#8f5f26'; ctx.lineWidth = Math.max(1.5, s * 0.035);
  ctx.strokeRect(x - w / 2, y - h, w, h);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y);
  ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x - w / 2, y);
  ctx.stroke();
}

export function drawBar(ctx, x, y, s){
  const w = s * 0.66;
  const top = y - s * 1.30, bot = y - s * 0.62;
  ctx.fillStyle = '#ff5d8f';
  ctx.fillRect(x - w / 2, top, w, bot - top);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) ctx.fillRect(x - w / 2 + i * w / 3 + w * 0.07, top, w * 0.10, bot - top);
  ctx.fillStyle = '#c9376a';
  ctx.fillRect(x - w / 2, bot - s * 0.06, w, s * 0.06);
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
