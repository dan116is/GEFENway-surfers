/* ציור דמויות פרוצדורלי — בלי קבצי תמונה, חד בכל רזולוציה.
   יחידות: כפות רגליים ב-(0,0), ראש ב-y≈-1, רוחב ~0.62.

   דמות = נתונים. אוזניים, שיער, כתר, כנפיים, קרן, חצאית וכו' הם שדות
   שהמנוע מפרש, ולכן דמות חדשה היא בדרך כלל שורה אחת.
   בנוסף יש שכבת אביזרים (כובע/משקפיים/גב/גלגיליות) שאפשר להרכיב על כל דמות. */

const clampUnit = (v, a, b) => v < a ? a : v > b ? b : v;

export const CHARACTERS = [
  { id:'fox',      name:'שועלי',   emoji:'🦊', fur:'#ff8a3d', fur2:'#ffd9bd', accent:'#ffffff',
    ears:'point', tail:'bushy' },

  { id:'bunny',    name:'שפנפנה',  emoji:'🐰', fur:'#fff0f6', fur2:'#ffffff', accent:'#ff8fb8',
    ears:'long', bow:'#ff5d8f', tail:'puff', outline:'#e6c8d8' },

  { id:'cat',      name:'חתולי',   emoji:'🐱', fur:'#9aa4b8', fur2:'#e6ebf5', accent:'#ffffff',
    ears:'point', tail:'thin' },

  { id:'princess', name:'נסיכונת', emoji:'👑', fur:'#ffd9bd', fur2:'#fff0e4', accent:'#ffc531',
    ears:'none', hair:'#7a3f1d', hairStyle:'long', crown:true, skirt:'#ff5d8f', outline:'#e0ad8b' },

  { id:'penguin',  name:'פינגי',   emoji:'🐧', fur:'#2b3550', fur2:'#ffffff', accent:'#ffc531',
    ears:'none', belly:true, beak:true },

  { id:'fairy',    name:'פיונה',   emoji:'🧚', fur:'#ffe0cd', fur2:'#fff3ea', accent:'#9b5cff',
    ears:'none', hair:'#9b5cff', hairStyle:'tails', wings:'#bff0ff', antennae:true, skirt:'#a86bff',
    outline:'#e3b49b' },

  { id:'deer',     name:'עופרי',   emoji:'🦌', fur:'#d9a05b', fur2:'#ffeed6', accent:'#ff8fb8',
    ears:'leaf', antlers:true, flowers:true, tail:'puff' },

  { id:'dino',     name:'דינו',    emoji:'🦕', fur:'#3fc46b', fur2:'#d8ffe6', accent:'#ffd23f',
    ears:'none', spikes:true, tail:'thin' },

  { id:'unicorn',  name:'חדקורן',  emoji:'🦄', fur:'#f7e4ff', fur2:'#fffaff', accent:'#ff5d8f',
    ears:'point', horn:true, mane:'#ff8fd0', tail:'bushy', outline:'#d8bce4' },

  { id:'panda',    name:'פנדי',    emoji:'🐼', fur:'#f4f6fb', fur2:'#ffffff', accent:'#2b3550',
    ears:'round', roundEarColor:'#2b3550', eyePatch:true, outline:'#d3dae6' },

  { id:'tiger',    name:'טיגי',    emoji:'🐯', fur:'#ffa832', fur2:'#fff1d6', accent:'#2b3550',
    ears:'round', stripes:true, tail:'thin' },

  { id:'robot',    name:'רובי',    emoji:'🤖', fur:'#b9c3d6', fur2:'#eef3ff', accent:'#00e0ff',
    ears:'none', boxHead:true, antenna:true },
];

export const charById = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];

/* ---------- אביזרים: הכל פתוח תמיד, שום דבר לא נעול ---------- */
export const ACCESSORY_LABELS = { hat: 'כובע', face: 'פנים', back: 'גב', board: 'גלגיליות' };

export const ACCESSORIES = {
  hat:   [
    { id:'none',   name:'בלי',          emoji:'🚫' },
    { id:'cap',    name:'כובע מצחייה', emoji:'🧢' },
    { id:'beanie', name:'כובע צמר',    emoji:'🧶' },
    { id:'party',  name:'כובע מסיבה', emoji:'🎉' },
    { id:'crown',  name:'כתר',          emoji:'👑' },
    { id:'bow',    name:'פפיון',       emoji:'🎀' },
  ],
  face:  [
    { id:'none',    name:'בלי',         emoji:'🚫' },
    { id:'glasses', name:'משקפיים',   emoji:'👓' },
    { id:'shades',  name:'משקפי שמש', emoji:'🕶️' },
    { id:'snorkel', name:'מסכת צלילה', emoji:'🤿' },
  ],
  back:  [
    { id:'none',     name:'בלי',       emoji:'🚫' },
    { id:'cape',     name:'גלימה',    emoji:'🦸' },
    { id:'backpack', name:'תיק',       emoji:'🎒' },
    { id:'wings',    name:'כנפיים',   emoji:'🪽' },
  ],
  board: [
    { id:'classic', name:'גלגיליות',  emoji:'🛹' },
    { id:'hover',   name:'הוברבורד',  emoji:'🛸' },
    { id:'rocket',  name:'רקטה',      emoji:'🚀' },
  ],
};

export const DEFAULT_OUTFIT = { hat:'none', face:'none', back:'none', board:'classic' };

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
function bowShape(ctx, x, y, r, color){
  ctx.fillStyle = color;
  ellipse(ctx, x - r, y, r * 0.95, r * 0.7, -0.35); ctx.fill();
  ellipse(ctx, x + r, y, r * 0.95, r * 0.7, 0.35); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  circle(ctx, x, y, r * 0.42); ctx.fill();
}
/** גפיים עם קצה מעוגל — יד/כף רגל, במקום קו חשוף */
function limb(ctx, x1, y1, x2, y2, w, color, capColor, capR){
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  if (capR){
    ctx.fillStyle = capColor;
    circle(ctx, x2, y2, capR); ctx.fill();
  }
}

/* ============================================================
   אביזרים
   ============================================================ */
function drawHat(ctx, id, hx, hy, hr, color){
  if (!id || id === 'none') return;
  ctx.save();
  ctx.translate(hx, hy);
  switch (id){
    case 'cap':
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -hr * .62, hr * .92, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ellipse(ctx, -hr * .74, -hr * .58, hr * .72, hr * .17); ctx.fill();
      ctx.fillStyle = color;
      ellipse(ctx, -hr * .74, -hr * .64, hr * .72, hr * .17); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.30)';
      circle(ctx, 0, -hr * 1.42, hr * .13); ctx.fill();
      break;
    case 'beanie':
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -hr * .58, hr * .95, Math.PI, 0); ctx.closePath(); ctx.fill();
      rr(ctx, -hr * .98, -hr * .70, hr * 1.96, hr * .28, hr * .13); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.32)';
      rr(ctx, -hr * .98, -hr * .70, hr * 1.96, hr * .28, hr * .13); ctx.fill();
      ctx.fillStyle = '#ffffff';
      circle(ctx, 0, -hr * 1.62, hr * .22); ctx.fill();
      break;
    case 'party':
      ctx.fillStyle = color;
      tri(ctx, -hr * .58, -hr * .68, 0, -hr * 1.86, hr * .58, -hr * .68); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.42)';
      for (let i = 0; i < 3; i++){
        const k = 0.28 + i * 0.24;
        tri(ctx, -hr * .58 * (1 - k), -hr * (.68 + 1.18 * k),
                  0,                  -hr * (.68 + 1.18 * (k + .10)),
                  hr * .58 * (1 - k), -hr * (.68 + 1.18 * k));
        ctx.fill();
      }
      ctx.fillStyle = '#ffc531';
      circle(ctx, 0, -hr * 1.92, hr * .18); ctx.fill();
      break;
    case 'crown':
      ctx.fillStyle = '#ffc531';
      ctx.beginPath();
      ctx.moveTo(-hr * .62, -hr * .78);
      ctx.lineTo(-hr * .44, -hr * 1.30);
      ctx.lineTo(-hr * .20, -hr * .96);
      ctx.lineTo(0,         -hr * 1.44);
      ctx.lineTo(hr * .20,  -hr * .96);
      ctx.lineTo(hr * .44,  -hr * 1.30);
      ctx.lineTo(hr * .62,  -hr * .78);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff5d8f';
      circle(ctx, 0, -hr * 1.00, hr * .09); ctx.fill();
      break;
    case 'bow':
      bowShape(ctx, 0, -hr * 1.00, hr * .34, color);
      break;
  }
  ctx.restore();
}

function drawFaceGear(ctx, id, hx, hy, hr, color){
  if (!id || id === 'none') return;
  ctx.save();
  ctx.translate(hx, hy);
  const eyeX = hr * .36, eyeY = -hr * .08;
  switch (id){
    case 'glasses':
      ctx.strokeStyle = '#3b4a72';
      ctx.lineWidth = hr * .075;
      circle(ctx, -eyeX, eyeY, hr * .30); ctx.stroke();
      circle(ctx,  eyeX, eyeY, hr * .30); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-eyeX + hr * .30, eyeY); ctx.lineTo(eyeX - hr * .30, eyeY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(190,235,255,.42)';
      circle(ctx, -eyeX, eyeY, hr * .28); ctx.fill();
      circle(ctx,  eyeX, eyeY, hr * .28); ctx.fill();
      break;
    case 'shades':
      ctx.fillStyle = '#22283f';
      rr(ctx, -eyeX - hr * .34, eyeY - hr * .26, hr * .66, hr * .48, hr * .16); ctx.fill();
      rr(ctx,  eyeX - hr * .32, eyeY - hr * .26, hr * .66, hr * .48, hr * .16); ctx.fill();
      ctx.fillStyle = '#22283f';
      rr(ctx, -hr * .10, eyeY - hr * .10, hr * .20, hr * .10, hr * .04); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.30)';
      rr(ctx, -eyeX - hr * .26, eyeY - hr * .18, hr * .22, hr * .12, hr * .05); ctx.fill();
      break;
    case 'snorkel':
      ctx.strokeStyle = color;
      ctx.lineWidth = hr * .10;
      rr(ctx, -hr * .74, eyeY - hr * .32, hr * 1.48, hr * .60, hr * .18); ctx.stroke();
      ctx.fillStyle = 'rgba(160,225,255,.45)';
      rr(ctx, -hr * .74, eyeY - hr * .32, hr * 1.48, hr * .60, hr * .18); ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = hr * .11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hr * .74, eyeY - hr * .10);
      ctx.quadraticCurveTo(hr * 1.05, eyeY - hr * .30, hr * 1.02, -hr * 1.05);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function drawBackGear(ctx, id, bodyY, bodyH, cycle, color, lean){
  if (!id || id === 'none') return;
  const wave = Math.sin(cycle * 0.9);
  ctx.save();
  switch (id){
    case 'cape':
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-0.15, bodyY + 0.03);
      ctx.quadraticCurveTo(-0.34 + wave * 0.04 - lean * 0.10, bodyY + bodyH * 0.9,
                           -0.24 + wave * 0.07 - lean * 0.14, bodyY + bodyH * 1.65);
      ctx.quadraticCurveTo(0, bodyY + bodyH * 1.42 + wave * 0.02,
                           0.24 + wave * 0.07 - lean * 0.14, bodyY + bodyH * 1.65);
      ctx.quadraticCurveTo(0.34 + wave * 0.04 - lean * 0.10, bodyY + bodyH * 0.9,
                           0.15, bodyY + 0.03);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      ctx.fill();
      break;
    case 'backpack':
      ctx.fillStyle = color;
      rr(ctx, -0.17, bodyY + 0.05, 0.34, bodyH * 0.86, 0.09); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      rr(ctx, -0.11, bodyY + bodyH * 0.55, 0.22, bodyH * 0.30, 0.05); ctx.fill();
      break;
    case 'wings': {
      const flap = 0.20 + Math.abs(Math.sin(cycle * 1.8)) * 0.22;
      [-1, 1].forEach(sd => {
        ctx.save();
        ctx.translate(sd * 0.09, bodyY + 0.10);
        ctx.rotate(sd * flap);
        // כנפיים שקופות עם קו מתאר, כדי שייראו גם על רקע בהיר
        ctx.fillStyle = 'rgba(214,240,255,.92)';
        ctx.strokeStyle = 'rgba(120,190,235,.95)';
        ctx.lineWidth = 0.014;
        ellipse(ctx, sd * 0.22, -0.07, 0.22, 0.12, sd * -0.5); ctx.fill(); ctx.stroke();
        ellipse(ctx, sd * 0.17,  0.08, 0.16, 0.10, sd * -0.3); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      break;
    }
  }
  ctx.restore();
}

function drawBoard(ctx, id, t, lean, color){
  ctx.save();
  ctx.rotate(lean * 0.22);
  const spin = t * 14;
  switch (id){
    case 'hover':
      ctx.fillStyle = '#2b3550';
      rr(ctx, -0.30, -0.075, 0.60, 0.055, 0.028); ctx.fill();
      ctx.fillStyle = color;
      rr(ctx, -0.27, -0.088, 0.54, 0.030, 0.015); ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(t * 9) * 0.16;
      const gl = ctx.createLinearGradient(0, -0.02, 0, 0.07);
      gl.addColorStop(0, 'rgba(120,235,255,.95)');
      gl.addColorStop(1, 'rgba(120,235,255,0)');
      ctx.fillStyle = gl;
      rr(ctx, -0.26, -0.020, 0.52, 0.085, 0.03); ctx.fill();
      ctx.restore();
      break;
    case 'rocket':
      ctx.fillStyle = '#3b4a72';
      rr(ctx, -0.30, -0.060, 0.60, 0.055, 0.028); ctx.fill();
      ctx.fillStyle = color;
      rr(ctx, -0.26, -0.080, 0.52, 0.032, 0.016); ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.85;
      const f = 0.9 + Math.sin(t * 22) * 0.22;
      ctx.fillStyle = '#ffc531';
      tri(ctx, 0.28, -0.055, 0.28 + 0.16 * f, -0.030, 0.28, -0.005); ctx.fill();
      ctx.fillStyle = '#ff6a3d';
      tri(ctx, 0.29, -0.048, 0.29 + 0.10 * f, -0.030, 0.29, -0.012); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffc531';
      circle(ctx, -0.19, -0.018, 0.030); ctx.fill();
      circle(ctx,  0.19, -0.018, 0.030); ctx.fill();
      break;
    default:
      ctx.fillStyle = '#26304d';
      rr(ctx, -0.30, -0.055, 0.60, 0.055, 0.028); ctx.fill();
      ctx.fillStyle = color;
      rr(ctx, -0.26, -0.075, 0.52, 0.032, 0.016); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      rr(ctx, -0.26, -0.075, 0.52, 0.014, 0.007); ctx.fill();
      for (const wx of [-0.19, 0.19]){
        ctx.fillStyle = '#ffc531';
        circle(ctx, wx, -0.018, 0.032); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.lineWidth = 0.008;
        ctx.beginPath();
        ctx.moveTo(wx + Math.cos(spin) * 0.020, -0.018 + Math.sin(spin) * 0.020);
        ctx.lineTo(wx - Math.cos(spin) * 0.020, -0.018 - Math.sin(spin) * 0.020);
        ctx.stroke();
      }
  }
  ctx.restore();
}

/* ============================================================
   ראש
   ============================================================ */
function drawHead(ctx, c, hx, hy, hr, look, outline, face){
  const { expr = 'smile', blink = false } = face || {};
  ctx.save();
  ctx.translate(hx, hy);

  /* --- מאחורי הגולגולת --- */
  if (c.hair && c.hairStyle === 'long'){
    ctx.fillStyle = c.hair;
    ellipse(ctx, 0, hr * 0.18, hr * 1.10, hr * 1.16); ctx.fill();
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
      ctx.moveTo(sd * hr * .40, -hr * .88); ctx.lineTo(sd * hr * .58, -hr * 1.42);
      ctx.moveTo(sd * hr * .50, -hr * 1.16); ctx.lineTo(sd * hr * .86, -hr * 1.28);
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

  /* --- גולגולת עם נפח --- */
  ctx.fillStyle = c.fur;
  if (c.boxHead) rr(ctx, -hr, -hr, hr * 2, hr * 1.9, hr * .42);
  else circle(ctx, 0, 0, hr);
  ctx.fill();
  if (outline){ ctx.strokeStyle = outline; ctx.lineWidth = hr * .055; ctx.stroke(); }

  const vol = ctx.createRadialGradient(-hr * .34, -hr * .40, hr * .10, 0, 0, hr * 1.15);
  vol.addColorStop(0, 'rgba(255,255,255,.40)');
  vol.addColorStop(0.55, 'rgba(255,255,255,0)');
  vol.addColorStop(1, 'rgba(20,30,60,.16)');
  ctx.fillStyle = vol;
  ctx.fill();

  if (c.stripes){
    ctx.save(); ctx.clip();
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

  /* --- פנים בהירות --- */
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

  /* --- עיניים והבעה --- */
  const eyeY = -hr * .08, eyeX = hr * .36;
  if (c.boxHead){
    ctx.fillStyle = c.accent;
    const eh = blink ? hr * .08 : hr * .32;
    rr(ctx, -eyeX - hr * .19, eyeY - eh / 2, hr * .38, eh, hr * .09); ctx.fill();
    rr(ctx,  eyeX - hr * .19, eyeY - eh / 2, hr * .38, eh, hr * .09); ctx.fill();
  } else if (blink){
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .075; ctx.lineCap = 'round';
    [-1, 1].forEach(sd => {
      ctx.beginPath();
      ctx.arc(sd * eyeX, eyeY - hr * .04, hr * .17, Math.PI * 0.18, Math.PI * 0.82);
      ctx.stroke();
    });
  } else if (expr === 'oops'){
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .075; ctx.lineCap = 'round';
    [-1, 1].forEach(sd => {
      ctx.beginPath();
      ctx.arc(sd * eyeX, eyeY + hr * .16, hr * .18, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
    });
  } else {
    const grow = expr === 'open' ? 1.22 : expr === 'determined' ? 0.86 : 1;
    ctx.fillStyle = '#17203a';
    ellipse(ctx, -eyeX, eyeY, hr * .155 * grow, hr * .175 * grow); ctx.fill();
    ellipse(ctx,  eyeX, eyeY, hr * .155 * grow, hr * .175 * grow); ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, -eyeX + hr * .06 + look * hr * .035, eyeY - hr * .07, hr * .062 * grow); ctx.fill();
    circle(ctx,  eyeX + hr * .06 + look * hr * .035, eyeY - hr * .07, hr * .062 * grow); ctx.fill();
    ctx.globalAlpha = .55;
    circle(ctx, -eyeX - hr * .05, eyeY + hr * .06, hr * .030); ctx.fill();
    circle(ctx,  eyeX - hr * .05, eyeY + hr * .06, hr * .030); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* --- אף / מקור / פה --- */
  if (c.beak){
    ctx.fillStyle = c.accent;
    tri(ctx, -hr * .20, hr * .18, hr * .34, hr * .30, -hr * .20, hr * .42); ctx.fill();
  } else if (c.boxHead){
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .08; ctx.lineCap = 'round';
    ctx.beginPath();
    if (expr === 'open'){ ctx.arc(0, hr * .42, hr * .18, 0, Math.PI); }
    else { ctx.moveTo(-hr * .22, hr * .5); ctx.lineTo(hr * .22, hr * .5); }
    ctx.stroke();
  } else {
    ctx.fillStyle = '#17203a';
    ellipse(ctx, 0, hr * .25, hr * .105, hr * .085); ctx.fill();
    ctx.strokeStyle = '#17203a'; ctx.lineWidth = hr * .07; ctx.lineCap = 'round';
    if (expr === 'open'){
      ctx.fillStyle = '#17203a';
      ellipse(ctx, 0, hr * .48, hr * .16, hr * .19); ctx.fill();
      ctx.fillStyle = '#ff7d9c';
      ellipse(ctx, 0, hr * .54, hr * .10, hr * .10); ctx.fill();
    } else if (expr === 'determined'){
      ctx.beginPath(); ctx.moveTo(-hr * .16, hr * .46); ctx.lineTo(hr * .16, hr * .46); ctx.stroke();
    } else if (expr === 'oops'){
      ctx.beginPath();
      ctx.moveTo(-hr * .18, hr * .50);
      ctx.quadraticCurveTo(-hr * .06, hr * .40, 0, hr * .50);
      ctx.quadraticCurveTo(hr * .06, hr * .60, hr * .18, hr * .50);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, hr * .26, hr * .26, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(255,120,150,.32)';
  ellipse(ctx, -hr * .62, hr * .30, hr * .19, hr * .13); ctx.fill();
  ellipse(ctx,  hr * .62, hr * .30, hr * .19, hr * .13); ctx.fill();

  /* --- אביזרים מובנים בדמות --- */
  if (c.bow) bowShape(ctx, hr * .62, -hr * .86, hr * .26, c.bow);
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
 * opts: { pose, t, color, board, outfit, lean, vy, squash, expr }
 */
export function drawCharacter(ctx, id, opts = {}){
  const c = charById(id);
  const {
    pose = 'run', t = 0, color = '#3aa0ff', board = true,
    outfit = DEFAULT_OUTFIT, lean = 0, vy = 0, squash = 0,
  } = opts;

  const cycle = t * 10;
  const swing = Math.sin(cycle);
  const bob   = pose === 'run' ? Math.abs(Math.sin(cycle)) * 0.035 : 0;

  // מתיחה בעלייה, כיווץ בנחיתה — נותן לקפיצה משקל
  const stretch = clampUnit(vy * 0.042, -0.10, 0.15) - squash * 0.20;
  const sy = 1 + stretch;
  const sx = 1 - stretch * 0.55;

  const expr = opts.expr || (pose === 'jump' ? 'open' : pose === 'slide' ? 'determined' : 'smile');
  // מצמוץ פעם ב־3.4 שניות
  const blink = ((t * 1000) % 3400) < 120;

  ctx.save();
  ctx.lineJoin = 'round';

  // גלגיליות — נשארות על הקרקע, רק מתנדנדות
  if (board) drawBoard(ctx, outfit.board, t, lean, color);

  if (pose === 'slide'){
    ctx.translate(0, -0.16);
    ctx.rotate(-0.62);
    ctx.scale(1, 0.92);
  }

  ctx.rotate(lean * 0.20);
  ctx.scale(sx, sy);

  const baseY  = -0.09 - bob;
  const legLen = 0.24;
  const bodyH  = 0.32;
  const bodyY  = baseY - legLen - bodyH + 0.02;
  const hr     = 0.185;
  const headY  = bodyY - hr * 0.72;

  // אביזר גב (מאחורי הכל)
  drawBackGear(ctx, outfit.back, bodyY, bodyH, cycle, color, lean);

  // כנפיים מובנות (פיונה)
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

  // זנב — נגרר אחרי הפנייה
  const wag = swing * 0.045 - lean * 0.05;
  if (c.tail === 'bushy' || c.tail === 'thin'){
    ctx.strokeStyle = c.fur;
    ctx.lineWidth = c.tail === 'bushy' ? 0.10 : 0.066;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0.11, bodyY + bodyH * 0.78);
    ctx.quadraticCurveTo(0.30 - lean * 0.06, bodyY + bodyH * 0.86 + wag, 0.30 - lean * 0.10, bodyY + bodyH * 1.42 + wag);
    ctx.stroke();
    if (c.tail === 'bushy'){
      ctx.fillStyle = c.fur2;
      circle(ctx, 0.30 - lean * 0.10, bodyY + bodyH * 1.42 + wag, 0.045); ctx.fill();
    }
  } else if (c.tail === 'puff'){
    ctx.fillStyle = c.fur2;
    circle(ctx, 0.19 - lean * 0.05, bodyY + bodyH * 1.00 + swing * 0.02, 0.058); ctx.fill();
  }

  // רגליים + נעליים
  const legPhase = pose === 'jump' ? 0.55 : pose === 'slide' ? 0.9 : swing * 0.55;
  const shoe = '#2b3550';
  const legs = [[-1, legPhase], [1, -legPhase]];
  for (const [side, ph] of legs){
    const x1 = side * 0.085, y1 = baseY - legLen;
    const x2 = side * 0.085 + ph * 0.13, y2 = baseY - (pose === 'jump' ? 0.10 : 0.005);
    if (c.outline) limb(ctx, x1, y1, x2, y2, 0.117, c.outline, null, 0);
    limb(ctx, x1, y1, x2, y2, 0.095, c.fur, shoe, 0.050);
  }

  // גוף
  const bodyGrad = ctx.createLinearGradient(-0.145, bodyY, 0.145, bodyY + bodyH);
  bodyGrad.addColorStop(0, 'rgba(255,255,255,.34)');
  bodyGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
  bodyGrad.addColorStop(1, 'rgba(0,0,0,.14)');
  ctx.fillStyle = color;
  rr(ctx, -0.145, bodyY, 0.29, bodyH, 0.11); ctx.fill();
  ctx.fillStyle = bodyGrad;
  rr(ctx, -0.145, bodyY, 0.29, bodyH, 0.11); ctx.fill();
  // אור שוליים
  ctx.strokeStyle = 'rgba(255,255,255,.42)';
  ctx.lineWidth = 0.016;
  ctx.beginPath();
  ctx.moveTo(-0.128, bodyY + bodyH - 0.06);
  ctx.quadraticCurveTo(-0.145, bodyY + 0.05, -0.075, bodyY + 0.012);
  ctx.stroke();

  if (c.skirt){
    ctx.fillStyle = c.skirt;
    ctx.beginPath();
    ctx.moveTo(-0.145, bodyY + bodyH * 0.58);
    ctx.lineTo(0.145,  bodyY + bodyH * 0.58);
    ctx.quadraticCurveTo(0.255 - lean * 0.04, bodyY + bodyH * 1.06, 0.205 - lean * 0.06, bodyY + bodyH * 1.20);
    ctx.quadraticCurveTo(0, bodyY + bodyH * 1.34, -0.205 - lean * 0.06, bodyY + bodyH * 1.20);
    ctx.quadraticCurveTo(-0.255 - lean * 0.04, bodyY + bodyH * 1.06, -0.145, bodyY + bodyH * 0.58);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fill();
  }

  // ידיים + כפות
  const armPhase = pose === 'jump' ? -1.0 : pose === 'slide' ? 0.6 : -swing * 0.6;
  const arms = [[-1, armPhase], [1, -armPhase]];
  for (const [side, ph] of arms){
    const x1 = side * 0.125, y1 = bodyY + 0.075;
    const x2 = side * (0.175 + Math.abs(ph) * 0.02);
    const y2 = bodyY + 0.075 + (pose === 'jump' ? -0.13 : 0.115) + ph * side * 0.045;
    if (c.outline) limb(ctx, x1, y1, x2, y2, 0.094, c.outline, null, 0);
    limb(ctx, x1, y1, x2, y2, 0.072, c.fur, c.fur2, 0.042);
  }

  // ראש — נגרר קלות אחרי הפנייה
  ctx.save();
  ctx.translate(-lean * 0.018, 0);
  ctx.rotate(-lean * 0.10);
  drawHead(ctx, c, 0, headY, hr, pose === 'run' ? swing : lean * 2, c.outline, { expr, blink });
  drawFaceGear(ctx, outfit.face, 0, headY, hr, color);
  drawHat(ctx, outfit.hat, 0, headY, hr, color);
  ctx.restore();

  ctx.restore();
}

/** תצוגה מקדימה בקנבס נפרד */
export function paintPreview(canvas, id, color, t = 0, pose = 'run', outfit = DEFAULT_OUTFIT, dprCap = 3){
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

  const unit = h * 0.78;
  ctx.save();
  ctx.translate(w / 2, h * 0.94);
  ctx.fillStyle = 'rgba(13,27,62,.14)';
  ellipse(ctx, 0, 0, unit * 0.26, unit * 0.055); ctx.fill();
  ctx.scale(unit, unit);
  drawCharacter(ctx, id, { pose, t, color, outfit, lean: Math.sin(t * 1.6) * 0.12 });
  ctx.restore();
}
