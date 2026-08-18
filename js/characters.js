/* ציור דמויות פרוצדורלי — בלי קבצי תמונה, נראה חד בכל רזולוציה.
   כל דמות מצוירת ביחידות: כפות רגליים ב-y=0, ראש ב-y=-1, רוחב ~0.62. */

export const CHARACTERS = [
  { id:'fox',     name:'שועלי',   cost:0,   emoji:'🦊', fur:'#ff8a3d', fur2:'#ffd9bd', accent:'#ffffff' },
  { id:'cat',     name:'חתולי',   cost:30,  emoji:'🐱', fur:'#9aa4b8', fur2:'#e6ebf5', accent:'#ffffff' },
  { id:'penguin', name:'פינגי',   cost:80,  emoji:'🐧', fur:'#2b3550', fur2:'#ffffff', accent:'#ffc531' },
  { id:'dino',    name:'דינו',    cost:150, emoji:'🦕', fur:'#3fc46b', fur2:'#d8ffe6', accent:'#ffd23f' },
  { id:'robot',   name:'רובי',    cost:260, emoji:'🤖', fur:'#b9c3d6', fur2:'#eef3ff', accent:'#00e0ff' },
  { id:'unicorn', name:'חדקורן',  cost:400, emoji:'🦄', fur:'#f0d9ff', fur2:'#fff7ff', accent:'#ff5d8f' },
];

export const charById = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];

/* ---------- פרימיטיבים ---------- */
function rr(ctx, x, y, w, h, r){
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x,     y + h, rad);
  ctx.arcTo(x,     y + h, x,     y,     rad);
  ctx.arcTo(x,     y,     x + w, y,     rad);
  ctx.closePath();
}
function circle(ctx, x, y, r){ ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
function tri(ctx, ax, ay, bx, by, cx, cy){
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
}

/* ---------- ראשים לפי מין החיה ---------- */
function drawHead(ctx, c, hx, hy, hr, look){
  ctx.save();
  ctx.translate(hx, hy);

  // אוזניים / קרן — מאחורי הראש
  ctx.fillStyle = c.fur;
  switch (c.id){
    case 'fox':
      tri(ctx, -hr * .95, -hr * .35, -hr * .30, -hr * 1.45, -hr * .12, -hr * .55); ctx.fill();
      tri(ctx,  hr * .95, -hr * .35,  hr * .30, -hr * 1.45,  hr * .12, -hr * .55); ctx.fill();
      break;
    case 'cat':
      tri(ctx, -hr * .88, -hr * .40, -hr * .48, -hr * 1.30, -hr * .10, -hr * .62); ctx.fill();
      tri(ctx,  hr * .88, -hr * .40,  hr * .48, -hr * 1.30,  hr * .10, -hr * .62); ctx.fill();
      break;
    case 'penguin':
      break;
    case 'dino':
      ctx.fillStyle = c.accent;
      for (let i = 0; i < 3; i++){
        const x = -hr * .55 + i * hr * .55;
        tri(ctx, x - hr * .16, -hr * .92, x, -hr * 1.34, x + hr * .16, -hr * .92); ctx.fill();
      }
      break;
    case 'robot': {
      ctx.strokeStyle = c.fur; ctx.lineWidth = hr * .12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -hr * .95); ctx.lineTo(0, -hr * 1.45); ctx.stroke();
      ctx.fillStyle = c.accent; circle(ctx, 0, -hr * 1.55, hr * .17); ctx.fill();
      break;
    }
    case 'unicorn': {
      ctx.fillStyle = '#ffc531';
      tri(ctx, -hr * .16, -hr * .95, 0, -hr * 1.62, hr * .16, -hr * .95); ctx.fill();
      ctx.fillStyle = c.accent;                     // רעמה
      rr(ctx, -hr * 1.02, -hr * .95, hr * .42, hr * 1.25, hr * .2); ctx.fill();
      break;
    }
  }

  // גולגולת
  ctx.fillStyle = c.fur;
  if (c.id === 'robot'){ rr(ctx, -hr, -hr, hr * 2, hr * 1.9, hr * .42); ctx.fill(); }
  else { circle(ctx, 0, 0, hr); ctx.fill(); }

  // פנים בהירות
  ctx.fillStyle = c.fur2;
  if (c.id === 'penguin'){ ctx.beginPath(); ctx.ellipse(0, hr * .12, hr * .72, hr * .72, 0, 0, Math.PI * 2); ctx.fill(); }
  else if (c.id === 'robot'){ rr(ctx, -hr * .78, -hr * .62, hr * 1.56, hr * 1.02, hr * .26); ctx.fill(); }
  else { ctx.beginPath(); ctx.ellipse(0, hr * .34, hr * .58, hr * .46, 0, 0, Math.PI * 2); ctx.fill(); }

  // אוזניים קדמיות ורודות
  if (c.id === 'fox' || c.id === 'cat'){
    ctx.fillStyle = '#ff9db8';
    const s = c.id === 'fox' ? .62 : .70;
    tri(ctx, -hr * s, -hr * .48, -hr * .40, -hr * 1.10, -hr * .22, -hr * .56); ctx.fill();
    tri(ctx,  hr * s, -hr * .48,  hr * .40, -hr * 1.10,  hr * .22, -hr * .56); ctx.fill();
  }

  // עיניים
  const eyeY = -hr * .08, eyeX = hr * .36;
  if (c.id === 'robot'){
    ctx.fillStyle = c.accent;
    rr(ctx, -eyeX - hr * .19, eyeY - hr * .16, hr * .38, hr * .32, hr * .12); ctx.fill();
    rr(ctx,  eyeX - hr * .19, eyeY - hr * .16, hr * .38, hr * .32, hr * .12); ctx.fill();
  } else {
    ctx.fillStyle = '#17203a';
    circle(ctx, -eyeX, eyeY, hr * .16); ctx.fill();
    circle(ctx,  eyeX, eyeY, hr * .16); ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, -eyeX + hr * .06 + look * hr * .03, eyeY - hr * .06, hr * .06); ctx.fill();
    circle(ctx,  eyeX + hr * .06 + look * hr * .03, eyeY - hr * .06, hr * .06); ctx.fill();
  }

  // אף / מקור / חיוך
  if (c.id === 'penguin'){
    ctx.fillStyle = c.accent;
    tri(ctx, -hr * .20, hr * .18, hr * .34, hr * .30, -hr * .20, hr * .42); ctx.fill();
  } else if (c.id !== 'robot'){
    ctx.fillStyle = '#17203a';
    circle(ctx, 0, hr * .26, hr * .11); ctx.fill();
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .07; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, hr * .26, hr * .26, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-hr * .22, hr * .5); ctx.lineTo(hr * .22, hr * .5); ctx.stroke();
  }

  ctx.restore();
}

/**
 * מצייר דמות. הרגליים ב-(0,0), הגובה הכולל ≈ 1 יחידה.
 * opts: { pose:'run'|'jump'|'slide'|'idle', t, color, board }
 */
export function drawCharacter(ctx, id, opts = {}){
  const c = charById(id);
  const { pose = 'run', t = 0, color = '#3aa0ff', board = true } = opts;

  const cycle = t * 10;
  const swing = Math.sin(cycle);
  const bob   = pose === 'run' ? Math.abs(Math.sin(cycle)) * 0.035 : 0;

  ctx.save();

  if (pose === 'slide'){
    ctx.translate(0, -0.16);
    ctx.rotate(-0.62);
    ctx.scale(1, 0.92);
  }

  // גלגיליות / קרש
  if (board && pose !== 'jump'){
    ctx.fillStyle = '#26304d';
    rr(ctx, -0.30, -0.055, 0.60, 0.055, 0.028); ctx.fill();
    ctx.fillStyle = color;
    rr(ctx, -0.26, -0.075, 0.52, 0.032, 0.016); ctx.fill();
    ctx.fillStyle = '#ffc531';
    circle(ctx, -0.19, -0.018, 0.030); ctx.fill();
    circle(ctx,  0.19, -0.018, 0.030); ctx.fill();
  }

  const baseY = -0.09 - bob;
  const legLen = 0.24;
  const bodyH  = 0.32;
  const bodyY  = baseY - legLen - bodyH + 0.02;

  // זנב — מאחורי הגוף כדי שלא יסתיר את היד
  if (c.id === 'fox' || c.id === 'cat' || c.id === 'dino'){
    const wag = swing * 0.045;
    ctx.strokeStyle = c.fur;
    ctx.lineWidth = c.id === 'fox' ? 0.10 : 0.066;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0.11, bodyY + bodyH * 0.78);
    ctx.quadraticCurveTo(0.30, bodyY + bodyH * 0.86 + wag, 0.30, bodyY + bodyH * 1.42 + wag);
    ctx.stroke();
    if (c.id === 'fox'){
      ctx.fillStyle = c.fur2;
      circle(ctx, 0.30, bodyY + bodyH * 1.42 + wag, 0.045); ctx.fill();
    }
  }

  // רגליים
  ctx.strokeStyle = c.fur;
  ctx.lineWidth = 0.095;
  ctx.lineCap = 'round';
  const legPhase = pose === 'jump' ? 0.55 : pose === 'slide' ? 0.9 : swing * 0.55;
  [[-1, legPhase], [1, -legPhase]].forEach(([side, ph]) => {
    ctx.beginPath();
    ctx.moveTo(side * 0.085, baseY - legLen);
    ctx.lineTo(side * 0.085 + ph * 0.13, baseY - (pose === 'jump' ? 0.10 : 0.005));
    ctx.stroke();
  });

  // גוף (חולצה בצבע האהוב)
  ctx.fillStyle = color;
  rr(ctx, -0.145, bodyY, 0.29, bodyH, 0.11); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  rr(ctx, -0.145, bodyY, 0.29, bodyH * 0.34, 0.11); ctx.fill();

  // ידיים
  ctx.strokeStyle = c.fur;
  ctx.lineWidth = 0.072;
  const armPhase = pose === 'jump' ? -1.0 : pose === 'slide' ? 0.6 : -swing * 0.6;
  [[-1, armPhase], [1, -armPhase]].forEach(([side, ph]) => {
    ctx.beginPath();
    ctx.moveTo(side * 0.125, bodyY + 0.075);
    ctx.lineTo(side * (0.175 + Math.abs(ph) * 0.02), bodyY + 0.075 + (pose === 'jump' ? -0.13 : 0.115) + ph * side * 0.045);
    ctx.stroke();
  });

  // ראש
  const hr = 0.185;
  drawHead(ctx, c, 0, bodyY - hr * 0.72, hr, pose === 'run' ? swing : 0);

  ctx.restore();
}

/** תצוגה מקדימה בקנבס נפרד (מסך הבית / מסך החברים) */
export function paintPreview(canvas, id, color, t = 0, pose = 'run'){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 120, h = canvas.clientHeight || 120;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)){
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const unit = h * 0.82;
  ctx.save();
  ctx.translate(w / 2, h * 0.94);

  // צל
  ctx.fillStyle = 'rgba(13,27,62,.14)';
  ctx.beginPath(); ctx.ellipse(0, 0, unit * 0.26, unit * 0.055, 0, 0, Math.PI * 2); ctx.fill();

  ctx.scale(unit, unit);
  drawCharacter(ctx, id, { pose, t, color });
  ctx.restore();
}
