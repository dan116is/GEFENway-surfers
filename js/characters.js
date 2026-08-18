/* ציור דמויות פרוצדורלי — בלי קבצי תמונה, נראה חד בכל רזולוציה.
   כל דמות מצוירת ביחידות: כפות רגליים ב-y=0, ראש ב-y≈-1, רוחב ~0.62.

   דמות = נתונים בלבד. כל אביזר (אוזניים, שיער, כתר, כנפיים, חצאית, פרפר)
   מצויר מהשדות שלמטה, ולכן הוספת דמות חדשה היא בדרך כלל שורה אחת. */

export const CHARACTERS = [
  { id:'fox',      name:'שועלי',   emoji:'🦊', fur:'#ff8a3d', fur2:'#ffd9bd', accent:'#ffffff',
    ears:'point', tail:'bushy' },

  { id:'bunny',    name:'שפנפנה',  emoji:'🐰', fur:'#fff0f6', fur2:'#ffffff', accent:'#ff8fb8',
    ears:'long', bow:'#ff5d8f', tail:'puff', outline:'#e9cfdd' },

  { id:'cat',      name:'חתולי',   emoji:'🐱', fur:'#9aa4b8', fur2:'#e6ebf5', accent:'#ffffff',
    ears:'point', tail:'thin' },

  { id:'princess', name:'נסיכונת', emoji:'👑', fur:'#ffd9bd', fur2:'#fff0e4', accent:'#ffc531',
    ears:'none', hair:'#7a3f1d', hairStyle:'long', crown:true, skirt:'#ff5d8f', outline:'#e7b795' },

  { id:'penguin',  name:'פינגי',   emoji:'🐧', fur:'#2b3550', fur2:'#ffffff', accent:'#ffc531',
    ears:'none', belly:true, beak:true },

  { id:'fairy',    name:'פיונה',   emoji:'🧚', fur:'#ffe0cd', fur2:'#fff3ea', accent:'#9b5cff',
    ears:'none', hair:'#9b5cff', hairStyle:'tails', wings:'#bff0ff', antennae:true, skirt:'#a86bff',
    outline:'#e8bda6' },

  { id:'deer',     name:'עופרי',   emoji:'🦌', fur:'#d9a05b', fur2:'#ffeed6', accent:'#ff8fb8',
    ears:'leaf', antlers:true, flowers:true, tail:'puff' },

  { id:'dino',     name:'דינו',    emoji:'🦕', fur:'#3fc46b', fur2:'#d8ffe6', accent:'#ffd23f',
    ears:'none', spikes:true, tail:'thin' },

  { id:'unicorn',  name:'חדקורן',  emoji:'🦄', fur:'#f7e4ff', fur2:'#fffaff', accent:'#ff5d8f',
    ears:'point', horn:true, mane:'#ff8fd0', tail:'bushy', outline:'#dcc3e6' },

  { id:'panda',    name:'פנדי',    emoji:'🐼', fur:'#f4f6fb', fur2:'#ffffff', accent:'#2b3550',
    ears:'round', roundEarColor:'#2b3550', eyePatch:true, outline:'#d9dfe9' },

  { id:'tiger',    name:'טיגי',    emoji:'🐯', fur:'#ffa832', fur2:'#fff1d6', accent:'#2b3550',
    ears:'round', stripes:true, tail:'thin' },

  { id:'robot',    name:'רובי',    emoji:'🤖', fur:'#b9c3d6', fur2:'#eef3ff', accent:'#00e0ff',
    ears:'none', boxHead:true, antenna:true },
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
function ellipse(ctx, x, y, rx, ry, rot = 0){ ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.closePath(); }
function tri(ctx, ax, ay, bx, by, cx, cy){
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
}
function bow(ctx, x, y, r, color){
  ctx.fillStyle = color;
  ellipse(ctx, x - r, y, r * 0.95, r * 0.7, -0.35); ctx.fill();
  ellipse(ctx, x + r, y, r * 0.95, r * 0.7, 0.35); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  circle(ctx, x, y, r * 0.42); ctx.fill();
}

/* ---------- ראש ---------- */
function drawHead(ctx, c, hx, hy, hr, look, outline){
  ctx.save();
  ctx.translate(hx, hy);

  // --- מאחורי הגולגולת ---
  if (c.hair && c.hairStyle === 'long'){
    ctx.fillStyle = c.hair;
    ellipse(ctx, 0, hr * 0.18, hr * 1.10, hr * 1.16); ctx.fill();
    // שתי מחלפות שמסגרות את הפנים בלי לכסות אותן
    [-1, 1].forEach(sd => {
      ctx.beginPath();
      ctx.moveTo(sd * hr * 0.86, -hr * 0.42);
      ctx.quadraticCurveTo(sd * hr * 1.16, hr * 0.62, sd * hr * 0.80, hr * 1.30);
      ctx.quadraticCurveTo(sd * hr * 0.52, hr * 0.70, sd * hr * 0.58, -hr * 0.30);
      ctx.closePath(); ctx.fill();
    });
  }

  ctx.fillStyle = c.fur;
  switch (c.ears){
    case 'point':
      tri(ctx, -hr * .95, -hr * .35, -hr * .34, -hr * 1.42, -hr * .12, -hr * .55); ctx.fill();
      tri(ctx,  hr * .95, -hr * .35,  hr * .34, -hr * 1.42,  hr * .12, -hr * .55); ctx.fill();
      break;
    case 'long':
      ellipse(ctx, -hr * .42, -hr * 1.30, hr * .26, hr * .72, -0.16); ctx.fill();
      ellipse(ctx,  hr * .42, -hr * 1.30, hr * .26, hr * .72,  0.16); ctx.fill();
      ctx.fillStyle = '#ff9db8';
      ellipse(ctx, -hr * .42, -hr * 1.28, hr * .13, hr * .50, -0.16); ctx.fill();
      ellipse(ctx,  hr * .42, -hr * 1.28, hr * .13, hr * .50,  0.16); ctx.fill();
      break;
    case 'round':
      ctx.fillStyle = c.roundEarColor || c.fur;
      circle(ctx, -hr * .82, -hr * .74, hr * .34); ctx.fill();
      circle(ctx,  hr * .82, -hr * .74, hr * .34); ctx.fill();
      break;
    case 'leaf':
      ellipse(ctx, -hr * .96, -hr * .58, hr * .34, hr * .19, -0.5); ctx.fill();
      ellipse(ctx,  hr * .96, -hr * .58, hr * .34, hr * .19,  0.5); ctx.fill();
      break;
  }

  if (c.antlers){
    ctx.strokeStyle = '#a9752f'; ctx.lineWidth = hr * .10; ctx.lineCap = 'round';
    [-1, 1].forEach(sd => {
      ctx.beginPath();
      ctx.moveTo(sd * hr * .40, -hr * .88);
      ctx.lineTo(sd * hr * .58, -hr * 1.42);
      ctx.moveTo(sd * hr * .50, -hr * 1.16);
      ctx.lineTo(sd * hr * .86, -hr * 1.28);
      ctx.stroke();
    });
  }

  if (c.spikes){
    ctx.fillStyle = c.accent;
    for (let i = 0; i < 3; i++){
      const x = -hr * .55 + i * hr * .55;
      tri(ctx, x - hr * .16, -hr * .92, x, -hr * 1.34, x + hr * .16, -hr * .92); ctx.fill();
    }
  }

  if (c.horn){
    ctx.fillStyle = '#ffc531';
    tri(ctx, -hr * .15, -hr * .95, 0, -hr * 1.62, hr * .15, -hr * .95); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    tri(ctx, -hr * .05, -hr * 1.05, 0, -hr * 1.55, hr * .05, -hr * 1.05); ctx.fill();
  }
  if (c.mane){
    ctx.fillStyle = c.mane;
    ctx.beginPath();
    ctx.moveTo(-hr * .10, -hr * 1.02);
    ctx.quadraticCurveTo(-hr * 1.16, -hr * .96, -hr * 1.02, -hr * .04);
    ctx.quadraticCurveTo(-hr * .96, hr * .72, -hr * .62, hr * 1.02);
    ctx.quadraticCurveTo(-hr * .96, hr * .18, -hr * .70, -hr * .40);
    ctx.quadraticCurveTo(-hr * .52, -hr * .86, -hr * .10, -hr * 1.02);
    ctx.closePath(); ctx.fill();
  }
  if (c.antenna){
    ctx.strokeStyle = c.fur; ctx.lineWidth = hr * .12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -hr * .95); ctx.lineTo(0, -hr * 1.45); ctx.stroke();
    ctx.fillStyle = c.accent; circle(ctx, 0, -hr * 1.55, hr * .17); ctx.fill();
  }

  // --- גולגולת ---
  const skull = ctx.createLinearGradient(0, -hr, 0, hr);
  skull.addColorStop(0, 'rgba(255,255,255,.34)');
  skull.addColorStop(0.45, 'rgba(255,255,255,0)');
  ctx.fillStyle = c.fur;
  if (c.boxHead) rr(ctx, -hr, -hr, hr * 2, hr * 1.9, hr * .42);
  else circle(ctx, 0, 0, hr);
  ctx.fill();
  if (outline){ ctx.strokeStyle = outline; ctx.lineWidth = hr * .055; ctx.stroke(); }
  ctx.fillStyle = skull; ctx.fill();

  if (c.stripes){
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(43,53,80,.85)';
    for (let i = 0; i < 3; i++){
      const y = -hr * .72 + i * hr * .30;
      rr(ctx, -hr * .95, y, hr * .34, hr * .11, hr * .05); ctx.fill();
      rr(ctx,  hr * .61, y, hr * .34, hr * .11, hr * .05); ctx.fill();
    }
    ctx.restore();
  }

  if (c.eyePatch){
    ctx.fillStyle = c.accent;
    ellipse(ctx, -hr * .40, -hr * .06, hr * .30, hr * .34, -0.28); ctx.fill();
    ellipse(ctx,  hr * .40, -hr * .06, hr * .30, hr * .34,  0.28); ctx.fill();
  }

  // --- פנים בהירות ---
  ctx.fillStyle = c.fur2;
  if (c.belly) ellipse(ctx, 0, hr * .12, hr * .72, hr * .72);
  else if (c.boxHead) rr(ctx, -hr * .78, -hr * .62, hr * 1.56, hr * 1.02, hr * .26);
  else ellipse(ctx, 0, hr * .34, hr * .58, hr * .46);
  ctx.fill();

  if (c.ears === 'point' && !c.horn){
    ctx.fillStyle = '#ff9db8';
    tri(ctx, -hr * .64, -hr * .48, -hr * .42, -hr * 1.06, -hr * .22, -hr * .56); ctx.fill();
    tri(ctx,  hr * .64, -hr * .48,  hr * .42, -hr * 1.06,  hr * .22, -hr * .56); ctx.fill();
  }

  // --- שיער קדמי ---
  if (c.hair){
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.moveTo(-hr * 1.00, -hr * .34);
    ctx.quadraticCurveTo(-hr * .92, -hr * 1.10, 0, -hr * 1.04);
    ctx.quadraticCurveTo(hr * .92, -hr * 1.10, hr * 1.00, -hr * .34);
    ctx.quadraticCurveTo(hr * .62, -hr * .70, hr * .14, -hr * .52);
    ctx.quadraticCurveTo(-hr * .42, -hr * .38, -hr * 1.00, -hr * .34);
    ctx.closePath(); ctx.fill();
    if (c.hairStyle === 'tails'){
      [-1, 1].forEach(sd => {
        circle(ctx, sd * hr * 1.00, hr * .10, hr * .30); ctx.fill();
        ellipse(ctx, sd * hr * 1.12, hr * .62, hr * .20, hr * .34, sd * 0.22); ctx.fill();
      });
    }
  }

  // --- עיניים ---
  const eyeY = -hr * .08, eyeX = hr * .36;
  if (c.boxHead){
    ctx.fillStyle = c.accent;
    rr(ctx, -eyeX - hr * .19, eyeY - hr * .16, hr * .38, hr * .32, hr * .12); ctx.fill();
    rr(ctx,  eyeX - hr * .19, eyeY - hr * .16, hr * .38, hr * .32, hr * .12); ctx.fill();
  } else {
    ctx.fillStyle = '#17203a';
    ellipse(ctx, -eyeX, eyeY, hr * .155, hr * .175); ctx.fill();
    ellipse(ctx,  eyeX, eyeY, hr * .155, hr * .175); ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, -eyeX + hr * .06 + look * hr * .03, eyeY - hr * .07, hr * .062); ctx.fill();
    circle(ctx,  eyeX + hr * .06 + look * hr * .03, eyeY - hr * .07, hr * .062); ctx.fill();
    ctx.globalAlpha = .55;
    circle(ctx, -eyeX - hr * .05, eyeY + hr * .06, hr * .030); ctx.fill();
    circle(ctx,  eyeX - hr * .05, eyeY + hr * .06, hr * .030); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // --- אף / מקור / חיוך ---
  if (c.beak){
    ctx.fillStyle = c.accent;
    tri(ctx, -hr * .20, hr * .18, hr * .34, hr * .30, -hr * .20, hr * .42); ctx.fill();
  } else if (c.boxHead){
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-hr * .22, hr * .5); ctx.lineTo(hr * .22, hr * .5); ctx.stroke();
  } else {
    ctx.fillStyle = '#17203a';
    ellipse(ctx, 0, hr * .25, hr * .105, hr * .085); ctx.fill();
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, hr * .26, hr * .26, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
  }

  // --- לחיים ורודות ---
  ctx.fillStyle = 'rgba(255,120,150,.30)';
  ellipse(ctx, -hr * .62, hr * .30, hr * .19, hr * .13); ctx.fill();
  ellipse(ctx,  hr * .62, hr * .30, hr * .19, hr * .13); ctx.fill();

  // --- אביזרים עליונים ---
  if (c.bow)      bow(ctx, hr * .62, -hr * .86, hr * .26, c.bow);
  if (c.antennae){
    ctx.strokeStyle = c.hair || '#9b5cff'; ctx.lineWidth = hr * .07; ctx.lineCap = 'round';
    [-1, 1].forEach(sd => {
      ctx.beginPath();
      ctx.moveTo(sd * hr * .30, -hr * .92);
      ctx.quadraticCurveTo(sd * hr * .62, -hr * 1.40, sd * hr * .44, -hr * 1.56);
      ctx.stroke();
      ctx.fillStyle = c.accent;
      circle(ctx, sd * hr * .44, -hr * 1.60, hr * .11); ctx.fill();
    });
  }
  if (c.flowers){
    [[-0.66, -0.80, '#ff5d8f'], [-0.20, -1.00, '#ffc531'], [0.30, -0.92, '#fff']].forEach(([fx, fy, col]) => {
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++){
        const a = i / 5 * Math.PI * 2;
        circle(ctx, hr * fx + Math.cos(a) * hr * .10, hr * fy + Math.sin(a) * hr * .10, hr * .075);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd23f';
      circle(ctx, hr * fx, hr * fy, hr * .06); ctx.fill();
    });
  }
  if (c.crown){
    ctx.fillStyle = '#ffc531';
    ctx.beginPath();
    ctx.moveTo(-hr * .58, -hr * .90);
    ctx.lineTo(-hr * .40, -hr * 1.34);
    ctx.lineTo(-hr * .18, -hr * 1.02);
    ctx.lineTo(0,          -hr * 1.44);
    ctx.lineTo(hr * .18,  -hr * 1.02);
    ctx.lineTo(hr * .40,  -hr * 1.34);
    ctx.lineTo(hr * .58,  -hr * .90);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5d8f';
    circle(ctx, 0, -hr * 1.06, hr * .085); ctx.fill();
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
  ctx.lineJoin = 'round';

  if (pose === 'slide'){
    ctx.translate(0, -0.16);
    ctx.rotate(-0.62);
    ctx.scale(1, 0.92);
  }

  const baseY  = -0.09 - bob;
  const legLen = 0.24;
  const bodyH  = 0.32;
  const bodyY  = baseY - legLen - bodyH + 0.02;

  // גלגיליות
  if (board && pose !== 'jump'){
    ctx.fillStyle = '#26304d';
    rr(ctx, -0.30, -0.055, 0.60, 0.055, 0.028); ctx.fill();
    ctx.fillStyle = color;
    rr(ctx, -0.26, -0.075, 0.52, 0.032, 0.016); ctx.fill();
    ctx.fillStyle = '#ffc531';
    circle(ctx, -0.19, -0.018, 0.030); ctx.fill();
    circle(ctx,  0.19, -0.018, 0.030); ctx.fill();
  }

  // כנפיים (מאחורי הכל)
  if (c.wings){
    const flap = 0.22 + Math.abs(Math.sin(cycle * 1.8)) * 0.20;
    ctx.save();
    ctx.globalAlpha = 0.82;
    [-1, 1].forEach(sd => {
      ctx.fillStyle = c.wings;
      ctx.save();
      ctx.translate(sd * 0.10, bodyY + 0.10);
      ctx.rotate(sd * flap);
      ellipse(ctx, sd * 0.20, -0.06, 0.20, 0.11, sd * -0.5); ctx.fill();
      ellipse(ctx, sd * 0.16,  0.08, 0.15, 0.09, sd * -0.3); ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // זנב
  if (c.tail === 'bushy' || c.tail === 'thin'){
    const wag = swing * 0.045;
    ctx.strokeStyle = c.fur;
    ctx.lineWidth = c.tail === 'bushy' ? 0.10 : 0.066;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0.11, bodyY + bodyH * 0.78);
    ctx.quadraticCurveTo(0.30, bodyY + bodyH * 0.86 + wag, 0.30, bodyY + bodyH * 1.42 + wag);
    ctx.stroke();
    if (c.tail === 'bushy'){
      ctx.fillStyle = c.fur2;
      circle(ctx, 0.30, bodyY + bodyH * 1.42 + wag, 0.045); ctx.fill();
    }
  } else if (c.tail === 'puff'){
    ctx.fillStyle = c.fur2;
    circle(ctx, 0.19, bodyY + bodyH * 1.00 + swing * 0.02, 0.058); ctx.fill();
  }

  // רגליים
  ctx.strokeStyle = c.fur;
  ctx.lineWidth = 0.095;
  ctx.lineCap = 'round';
  const legPhase = pose === 'jump' ? 0.55 : pose === 'slide' ? 0.9 : swing * 0.55;
  const legs = [[-1, legPhase], [1, -legPhase]];
  if (c.outline){
    ctx.save();
    ctx.strokeStyle = c.outline;
    ctx.lineWidth = 0.095 + 0.022;
    legs.forEach(([side, ph]) => {
      ctx.beginPath();
      ctx.moveTo(side * 0.085, baseY - legLen);
      ctx.lineTo(side * 0.085 + ph * 0.13, baseY - (pose === 'jump' ? 0.10 : 0.005));
      ctx.stroke();
    });
    ctx.restore();
  }
  legs.forEach(([side, ph]) => {
    ctx.beginPath();
    ctx.moveTo(side * 0.085, baseY - legLen);
    ctx.lineTo(side * 0.085 + ph * 0.13, baseY - (pose === 'jump' ? 0.10 : 0.005));
    ctx.stroke();
  });

  // גוף
  const bodyGrad = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
  bodyGrad.addColorStop(0, 'rgba(255,255,255,.30)');
  bodyGrad.addColorStop(0.55, 'rgba(255,255,255,0)');
  bodyGrad.addColorStop(1, 'rgba(0,0,0,.10)');
  ctx.fillStyle = color;
  rr(ctx, -0.145, bodyY, 0.29, bodyH, 0.11); ctx.fill();
  ctx.fillStyle = bodyGrad;
  rr(ctx, -0.145, bodyY, 0.29, bodyH, 0.11); ctx.fill();

  // חצאית / טוטו
  if (c.skirt){
    ctx.fillStyle = c.skirt;
    ctx.beginPath();
    ctx.moveTo(-0.145, bodyY + bodyH * 0.58);
    ctx.lineTo(0.145,  bodyY + bodyH * 0.58);
    ctx.quadraticCurveTo(0.255, bodyY + bodyH * 1.06, 0.205, bodyY + bodyH * 1.20);
    ctx.quadraticCurveTo(0, bodyY + bodyH * 1.34, -0.205, bodyY + bodyH * 1.20);
    ctx.quadraticCurveTo(-0.255, bodyY + bodyH * 1.06, -0.145, bodyY + bodyH * 0.58);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fill();
  }

  // ידיים
  ctx.strokeStyle = c.fur;
  ctx.lineWidth = 0.072;
  const armPhase = pose === 'jump' ? -1.0 : pose === 'slide' ? 0.6 : -swing * 0.6;
  const arms = [[-1, armPhase], [1, -armPhase]];
  const strokeArms = () => arms.forEach(([side, ph]) => {
    ctx.beginPath();
    ctx.moveTo(side * 0.125, bodyY + 0.075);
    ctx.lineTo(side * (0.175 + Math.abs(ph) * 0.02), bodyY + 0.075 + (pose === 'jump' ? -0.13 : 0.115) + ph * side * 0.045);
    ctx.stroke();
  });
  if (c.outline){
    ctx.save();
    ctx.strokeStyle = c.outline;
    ctx.lineWidth = 0.072 + 0.022;
    strokeArms();
    ctx.restore();
  }
  strokeArms();

  // ראש
  drawHead(ctx, c, 0, bodyY - 0.185 * 0.72, 0.185, pose === 'run' ? swing : 0, c.outline);

  ctx.restore();
}

/** תצוגה מקדימה בקנבס נפרד (מסך הבית / בורר הדמויות) */
export function paintPreview(canvas, id, color, t = 0, pose = 'run', dprCap = 3){
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  const w = canvas.clientWidth || 120, h = canvas.clientHeight || 120;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)){
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, w, h);

  const unit = h * 0.80;
  ctx.save();
  ctx.translate(w / 2, h * 0.94);

  ctx.fillStyle = 'rgba(13,27,62,.14)';
  ellipse(ctx, 0, 0, unit * 0.26, unit * 0.055); ctx.fill();

  ctx.scale(unit, unit);
  drawCharacter(ctx, id, { pose, t, color });
  ctx.restore();
}
