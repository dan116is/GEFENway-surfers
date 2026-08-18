/* ליבת המשחק — לולאה, שליטה, יצירת מסלול, התנגשויות.
   עיקרון מנחה: אין הפסד ואין "Game Over". פגיעה = מעידה קטנה וממשיכים. */

import { clamp, lerp, rand, randInt, pick, save, store, SPEEDS, QUALITY, buzz, COLORS, colorById } from './util.js';
import { sfx, say } from './audio.js';
import { drawCharacter } from './characters.js';
import {
  makeView, project, laneX, LANE_W, PLAYER_Z, Z_FAR,
  skyPalette, drawSky, drawGround, drawSideScenery,
  drawShadow, drawStarProp, drawGemProp, drawBush, drawCrate, drawBar,
  drawMagnet, drawShieldProp, drawGate, drawTreehouse,
  drawFog, drawVignette, drawSpeedLines,
} from './world.js';

const Z_SPAWN   = 78;    // מרחק היצירה
const SLOT_GAP  = 7.2;   // מרווח בין "משבצות" מסלול
const HIT_Z     = 0.75;  // חלון התנגשות
const JUMP_V    = 3.5;
const GRAVITY   = 9.5;
const SLIDE_T   = 0.62;
const STUMBLE_T = 1.15;

export const Game = {
  canvas: null, ctx: null, view: null, dpr: 1, autoScale: 1, fpsAcc: 0, fpsFrames: 0, fpsWarmup: 0,
  state: 'idle',            // idle | play | paused | ending | done
  hooks: {},

  /* --------- אתחול --------- */
  init(canvas, hooks){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.hooks = hooks || {};
    this.autoScale = 1;
    this.fpsAcc = 0;
    this.fpsFrames = 0;
    this.fpsWarmup = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'play') this.hooks.onAutoPause?.();
    });
    this.bindInput();
    this.resetRun();
    this.last = performance.now();
    requestAnimationFrame(this.frame.bind(this));
  },

  resize(){
    const w = window.innerWidth, h = window.innerHeight;
    const q = QUALITY[store.quality] || QUALITY.high;
    this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, q.dprCap) * q.ss * this.autoScale);
    this.canvas.width  = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.view = makeView(w, h);
    this.idleDirty = true;
  },

  /** אם המכשיר מתקשה, מורידים רזולוציה בשקט במקום לגמגם.
      מתעלמים מהשניות הראשונות — שם תמיד יש גמגום התחלתי. */
  watchFrameRate(dt){
    this.fpsWarmup += dt;
    if (this.fpsWarmup < 3) return;
    this.fpsAcc += dt; this.fpsFrames++;
    if (this.fpsAcc < 2.5) return;
    const fps = this.fpsFrames / this.fpsAcc;
    this.fpsAcc = 0; this.fpsFrames = 0;
    if (fps < 40 && this.autoScale > 0.6){
      this.autoScale = Math.max(0.6, this.autoScale - 0.15);
      this.resize();
    } else if (fps > 58 && this.autoScale < 1){
      this.autoScale = Math.min(1, this.autoScale + 0.1);
      this.resize();
    }
  },

  /* --------- קלט --------- */
  bindInput(){
    const pad = document.getElementById('touchpad');
    let sx = 0, sy = 0, st = 0, active = false;

    const down = e => {
      const p = e.touches ? e.touches[0] : e;
      sx = p.clientX; sy = p.clientY; st = performance.now(); active = true;
    };
    const up = e => {
      if (!active) return;
      active = false;
      const p = e.changedTouches ? e.changedTouches[0] : e;
      const dx = p.clientX - sx, dy = p.clientY - sy;
      const dt = performance.now() - st;
      const dist = Math.hypot(dx, dy);
      const TH = Math.min(46, window.innerWidth * 0.10);

      if (dist < TH || dt > 900){
        // הקשה — לפי אזור המסך (ילד בן 4 לא תמיד "מחליק" מדויק)
        const third = window.innerWidth / 3;
        if (p.clientX < third) this.move(-1);
        else if (p.clientX > third * 2) this.move(1);
        else this.jump();
      } else if (Math.abs(dx) > Math.abs(dy)){
        this.move(dx > 0 ? 1 : -1);
      } else if (dy < 0){
        this.jump();
      } else {
        this.slide();
      }
    };

    pad.addEventListener('touchstart', down, { passive: true });
    pad.addEventListener('touchend', up, { passive: true });
    pad.addEventListener('mousedown', down);
    pad.addEventListener('mouseup', up);

    window.addEventListener('keydown', e => {
      if (this.state !== 'play') return;
      if (e.key === 'ArrowLeft')  this.move(-1);
      if (e.key === 'ArrowRight') this.move(1);
      if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); this.jump(); }
      if (e.key === 'ArrowDown')  this.slide();
    });
  },

  /* --------- פעולות שחקן --------- */
  move(dir){
    if (this.state !== 'play') return;
    // בעברית המסך RTL, אבל התנועה במרחב היא ויזואלית: ימינה = ימינה על המסך
    const target = clamp(this.p.lane + dir, 0, 2);
    if (target === this.p.lane) return;
    this.p.lane = target;
    sfx.tap();
    buzz(8);
  },

  jump(){
    if (this.state !== 'play') return;
    if (this.p.y > 0.01 || this.p.slide > 0){
      this.p.jumpBuffer = 0.18;   // נזכור את הלחיצה לרגע — הרגשה סלחנית
      return;
    }
    this.liftOff();
  },

  liftOff(){
    this.p.jumpBuffer = 0;
    this.p.slide = 0;
    this.p.vy = JUMP_V;
    sfx.jump();
    buzz(12);
  },

  slide(){
    if (this.state !== 'play') return;
    if (this.p.y > 0.01) { this.p.vy = -JUMP_V * 0.8; return; }  // צלילה מהירה
    if (this.p.slide > 0) return;
    this.p.slide = SLIDE_T;
    sfx.slide();
  },

  /* --------- ניהול ריצה --------- */
  resetRun(){
    const prof = SPEEDS[save.speed] || SPEEDS.normal;
    this.p = { lane: 1, laneVis: 1, y: 0, vy: 0, slide: 0, stumble: 0, invuln: 0, shield: 0, magnet: 0, jumpBuffer: 0 };
    this.speed = prof.start;
    this.prof = prof;
    this.scrollZ = 0;
    this.meters = 0;
    this.stars = 0;
    this.gatesHit = 0;
    this.oops = 0;
    this.elapsed = 0;
    this.ents = [];
    this.parts = [];
    this.slotCountdown = 14;      // רגע נשימה בהתחלה
    this.slotIndex = 0;
    this.gateCountdown = 5;
    this.shake = 0;
    this.treehouseZ = null;
    this.nextMilestone = 25;
    this.runT = 0;
  },

  start(){
    this.resetRun();
    this.state = 'play';
    this.hooks.onStars?.(0);
    this.hooks.onProgress?.(0);
    const nm = save.name || 'גפן';
    setTimeout(() => say(`קדימה ${nm}!`, { force: true }), 250);
  },

  pause(){ if (this.state === 'play'){ this.state = 'paused'; } },
  resume(){ if (this.state === 'paused'){ this.state = 'play'; this.last = performance.now(); } },
  quit(){ this.state = 'idle'; this.idleDirty = true; },

  sessionSeconds(){
    const m = save.sessionMinutes;
    return m >= 900 ? Infinity : m * 60;
  },

  /* --------- יצירת מסלול --------- */
  spawnSlot(){
    const i = this.slotIndex++;

    // שער צבעים — רק אם מופעל, ולא בהתחלה
    if (save.gates && --this.gateCountdown <= 0 && this.state === 'play'){
      this.gateCountdown = randInt(7, 10);
      this.spawnGate();
      return;
    }

    const roll = Math.random();

    if (roll < 0.34){
      // שביל כוכבים במסלול אחד
      const lane = randInt(0, 2);
      const n = randInt(4, 7);
      const arc = Math.random() < 0.35;
      for (let k = 0; k < n; k++){
        this.ents.push({
          kind: 'star', lane, z: Z_SPAWN + k * 1.5,
          y: arc ? Math.sin(k / (n - 1) * Math.PI) * 0.85 : 0.35,
          spin: Math.random() * 6,
        });
      }
      if (arc){
        // מתחת לקשת הכוכבים תמיד יש שיח לקפוץ מעליו — הקשר ברור לילד
        this.ents.push({ kind: 'bush', lane, z: Z_SPAWN + (n - 1) / 2 * 1.5 });
      }
      return;
    }

    if (roll < 0.55){
      // מכשול בודד — תמיד נשארים שני מסלולים פנויים
      const lane = randInt(0, 2);
      this.ents.push({ kind: Math.random() < 0.5 ? 'bush' : 'crate', lane, z: Z_SPAWN });
      if (Math.random() < 0.6){
        const free = [0, 1, 2].filter(l => l !== lane);
        this.ents.push({ kind: 'star', lane: pick(free), z: Z_SPAWN, y: 0.35, spin: 0 });
      }
      return;
    }

    if (roll < 0.72 && i > 4){
      // שני מכשולים — מסלול אחד תמיד פתוח, והכוכב מסמן אותו
      const blocked = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, 2);
      const open = [0, 1, 2].find(l => !blocked.includes(l));
      blocked.forEach(l => this.ents.push({ kind: 'crate', lane: l, z: Z_SPAWN }));
      this.ents.push({ kind: 'star', lane: open, z: Z_SPAWN, y: 0.35, spin: 0 });
      this.ents.push({ kind: 'star', lane: open, z: Z_SPAWN + 1.6, y: 0.35, spin: 0 });
      return;
    }

    if (roll < 0.80 && i > 8){
      // מוט עילי — אפשר להתכופף או פשוט לעבור מסלול
      const lane = randInt(0, 2);
      this.ents.push({ kind: 'bar', lane, z: Z_SPAWN });
      return;
    }

    if (roll < 0.87){
      this.ents.push({ kind: 'gem', lane: randInt(0, 2), z: Z_SPAWN, y: 0.45, spin: 0 });
      return;
    }

    if (roll < 0.94){
      this.ents.push({ kind: Math.random() < 0.5 ? 'magnet' : 'shield', lane: randInt(0, 2), z: Z_SPAWN, y: 0.45, spin: 0 });
      return;
    }

    // משבצת ריקה — מנוחה לעיניים
  },

  spawnGate(){
    const shuffled = COLORS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const target = randInt(0, 2);
    this.ents.push({
      kind: 'gate', z: Z_SPAWN,
      colors: shuffled.map(c => c.hex),
      names: shuffled.map(c => c.he),
      target, resolved: false, announced: false,
    });
  },

  /* --------- חלקיקים --------- */
  burst(x, y, color, n = 10){
    for (let i = 0; i < n; i++){
      this.parts.push({
        x, y, vx: rand(-160, 160), vy: rand(-260, -60),
        life: rand(0.4, 0.8), t: 0, color, r: rand(2.5, 6),
      });
    }
  },

  /* --------- לולאה --------- */
  frame(ts){
    requestAnimationFrame(this.frame.bind(this));
    const dt = Math.min((ts - this.last) / 1000, 0.05);
    this.last = ts;
    if (this.state === 'idle'){
      if (this.idleDirty){ this.render(0, true); this.idleDirty = false; }
      return;
    }
    if (this.state === 'paused') { this.render(0); return; }
    this.update(dt);
    this.render(dt);
    this.watchFrameRate(dt);
  },

  update(dt){
    this.runT += dt;
    const sess = this.sessionSeconds();

    if (this.state === 'play'){
      this.elapsed += dt;
      this.speed = Math.min(this.prof.max, this.speed + this.prof.ramp * dt);
      if (this.elapsed >= sess && sess !== Infinity) this.beginEnding();
    }

    if (this.state === 'ending'){
      this.speed = Math.max(2.6, this.speed - dt * 2.2);
    }

    const stumbleFactor = this.p.stumble > 0 ? 0.45 : 1;
    const move = this.speed * stumbleFactor * dt;
    this.scrollZ += move;
    this.meters += move * 1.1;

    // טיימרים
    for (const k of ['slide', 'stumble', 'invuln', 'shield', 'magnet', 'jumpBuffer']){
      if (this.p[k] > 0) this.p[k] = Math.max(0, this.p[k] - dt);
    }
    this.shake = Math.max(0, this.shake - dt * 3.2);

    // קפיצה
    if (this.p.vy !== 0 || this.p.y > 0){
      this.p.vy -= GRAVITY * dt;
      this.p.y += this.p.vy * dt;
      if (this.p.y <= 0){
        this.p.y = 0;
        if (this.p.vy < -1) sfx.land();
        this.p.vy = 0;
        if (this.p.jumpBuffer > 0) this.liftOff();
      }
    }
    this.p.laneVis = lerp(this.p.laneVis, this.p.lane, Math.min(1, dt * 16));
    if (this.p.slide <= 0 && this.p.jumpBuffer > 0 && this.p.y <= 0) this.liftOff();

    // יצירת מסלול
    if (this.state === 'play'){
      this.slotCountdown -= move;
      if (this.slotCountdown <= 0){
        this.slotCountdown += SLOT_GAP;
        this.spawnSlot();
      }
    }

    // בית העץ
    if (this.treehouseZ !== null){
      this.treehouseZ -= move;
      if (this.treehouseZ <= PLAYER_Z + 0.5 && this.state === 'ending') this.finish();
    }

    // ישויות
    const px = laneX(this.p.laneVis);
    for (const e of this.ents){
      e.z -= move;
      if (e.spin !== undefined) e.spin += dt * 3.4;

      // מגנט מושך כוכבים
      if (this.p.magnet > 0 && (e.kind === 'star' || e.kind === 'gem' || e.kind === 'shield' || e.kind === 'magnet')
          && !e.taken && e.z > PLAYER_Z - 1 && e.z < PLAYER_Z + 16){
        e.pull = (e.pull ?? laneX(e.lane));
        e.pull = lerp(e.pull, px, Math.min(1, dt * 4));
        e.y = lerp(e.y ?? 0.35, this.p.y + 0.4, Math.min(1, dt * 3));
        if (Math.abs(e.pull - px) < 0.25 && e.z < PLAYER_Z + 2.2) this.collect(e);
      }

      if (e.taken || e.done) continue;

      if (e.kind === 'gate'){
        if (!e.announced && e.z < 46){
          e.announced = true;
          this.hooks.onPrompt?.(e.colors[e.target], e.names[e.target]);
          say(`עבור בשער ה${e.names[e.target]}`);
        }
        if (e.z <= PLAYER_Z && !e.resolved){
          e.resolved = true;
          this.hooks.onPrompt?.(null);
          if (this.p.lane === e.target){
            this.gatesHit++;
            this.addStars(3, true);
            sfx.gateGood();
            this.hooks.onToast?.(pick(['יפה! 🎉', 'בול! 🌈', 'כל הכבוד! ⭐']));
            this.hooks.onConfetti?.(14);
            say(pick(['יפה מאוד', 'מדהים', 'כל הכבוד']));
          } else {
            sfx.gateMiss();
            this.hooks.onToast?.('בפעם הבאה 🙂');
          }
        }
        continue;
      }

      const sameLane = e.lane === this.p.lane;
      const inWindow = Math.abs(e.z - PLAYER_Z) < HIT_Z;
      if (!inWindow) { if (e.z < PLAYER_Z - HIT_Z) e.done = true; continue; }

      if (e.kind === 'star' || e.kind === 'gem' || e.kind === 'magnet' || e.kind === 'shield'){
        const dx = Math.abs((e.pull ?? laneX(e.lane)) - px);
        const dy = Math.abs((e.y ?? 0.35) - (this.p.y + 0.4));
        if (dx < 0.68 && dy < 0.85) this.collect(e);
        continue;
      }

      if (!sameLane) continue;
      if (this.p.invuln > 0) continue;

      let hit = false;
      if (e.kind === 'bush')  hit = this.p.y < 0.30;
      if (e.kind === 'crate') hit = this.p.y < 0.95;
      if (e.kind === 'bar')   hit = this.p.slide <= 0;
      if (hit) this.hit(e);
    }

    this.ents = this.ents.filter(e => e.z > -6 && !e.taken);

    // חלקיקים
    for (const pt of this.parts){
      pt.t += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 620 * dt;
    }
    this.parts = this.parts.filter(pt => pt.t < pt.life);

    // התקדמות למסך
    if (sess !== Infinity) this.hooks.onProgress?.(clamp(this.elapsed / sess, 0, 1));
  },

  collect(e){
    e.taken = true;
    const pr = this.projPlayer();
    if (e.kind === 'star'){ this.addStars(1); sfx.star(); this.burst(pr.x, pr.y - pr.s * 0.6, '#ffc531', 8); }
    else if (e.kind === 'gem'){ this.addStars(5); sfx.gem(); this.burst(pr.x, pr.y - pr.s * 0.6, '#59d8ff', 16); this.hooks.onToast?.('+5 ⭐'); }
    else if (e.kind === 'magnet'){ this.p.magnet = 8; sfx.gem(); this.hooks.onToast?.('מגנט! 🧲'); say('מגנט'); }
    else if (e.kind === 'shield'){ this.p.shield = 12; sfx.shield(); this.hooks.onToast?.('בועה! 🫧'); say('בועת הגנה'); }
  },

  addStars(n, quiet = false){
    this.stars += n;
    this.hooks.onStars?.(this.stars);
    if (!quiet && this.stars >= this.nextMilestone){
      this.nextMilestone += 25;
      this.hooks.onMilestone?.(this.stars);
      sfx.fanfare();
      this.hooks.onConfetti?.(30);
      say(`${this.stars} כוכבים!`);
    }
  },

  hit(e){
    e.done = true;
    if (this.p.shield > 0){
      this.p.shield = 0;
      this.p.invuln = 1.0;
      sfx.shield();
      this.hooks.onToast?.('הבועה הצילה! 🫧');
      return;
    }
    this.oops++;
    this.p.stumble = STUMBLE_T;
    this.p.invuln = STUMBLE_T + 0.4;
    if (save.shake) this.shake = 1;
    sfx.bump();
    buzz([18, 40, 18]);
    this.hooks.onToast?.(pick(['אופס! 😅', 'לא נורא!', 'ממשיכים! 💪']));
    if (this.oops % 3 === 0) say(pick(['לא נורא, ממשיכים', 'אתה מסתדר מצוין']));
  },

  beginEnding(){
    if (this.state !== 'play') return;
    this.state = 'ending';
    this.hooks.onPrompt?.(null);
    this.hooks.onToast?.('בית העץ מתקרב! 🏡');
    // מנקים מכשולים שעוד לא הגיעו — הסיום תמיד נעים
    this.ents = this.ents.filter(e => !['crate', 'bar', 'bush'].includes(e.kind) || e.z < 20);
    this.treehouseZ = 70;
    say('הגיע הזמן לחזור לבית העץ');
  },

  finish(){
    this.state = 'done';
    sfx.fanfare();
    save.stars += this.stars;
    save.totals.runs += 1;
    save.totals.stars += this.stars;
    save.totals.meters += Math.round(this.meters);
    save.totals.gates += this.gatesHit;
    save.totals.seconds += Math.round(this.elapsed);
    save.bestMeters = Math.max(save.bestMeters, Math.round(this.meters));
    this.hooks.onEnd?.({
      stars: this.stars,
      meters: Math.round(this.meters),
      gates: this.gatesHit,
      oops: this.oops,
    });
  },

  /** סיום יזום מכפתור "חזרה הביתה" */
  endNow(){
    if (this.state === 'done' || this.state === 'idle') return;
    this.state = 'done';
    save.stars += this.stars;
    save.totals.runs += 1;
    save.totals.stars += this.stars;
    save.totals.meters += Math.round(this.meters);
    save.totals.gates += this.gatesHit;
    save.totals.seconds += Math.round(this.elapsed);
    save.bestMeters = Math.max(save.bestMeters, Math.round(this.meters));
  },

  projPlayer(){
    return project(this.view, PLAYER_Z, laneX(this.p.laneVis), this.p.y);
  },

  /* --------- ציור --------- */
  render(dt, attract = false){
    const ctx = this.ctx, view = this.view;
    const sess = this.sessionSeconds();
    const dayT = attract ? 0.12
      : (sess === Infinity ? clamp(this.elapsed / 900, 0, 0.75)
                           : clamp(this.elapsed / sess, 0, 1));
    const pal = skyPalette(dayT);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.shake > 0){
      const m = this.shake * 9;
      ctx.translate(rand(-m, m), rand(-m, m));
    }

    drawSky(ctx, view, pal, this.scrollZ, dayT);
    drawGround(ctx, view, pal, this.scrollZ);
    drawSideScenery(ctx, view, pal, this.scrollZ);

    if (this.treehouseZ !== null && this.treehouseZ < Z_FAR) drawTreehouse(ctx, view, this.treehouseZ);

    // ישויות מרחוק לקרוב
    const sorted = this.ents.slice().sort((a, b) => b.z - a.z);
    const playerDrawn = { done: false };

    for (const e of sorted){
      if (e.z > Z_FAR || e.z < -4) continue;

      if (!playerDrawn.done && e.z < PLAYER_Z){
        drawFog(ctx, view, pal);
        this.drawPlayer(ctx, pal);
        playerDrawn.done = true;
      }

      if (e.kind === 'gate'){
        drawGate(ctx, view, e.z, e.colors, e.resolved ? -1 : e.target, this.runT);
        continue;
      }

      const wx = e.pull ?? laneX(e.lane);
      const pr = project(view, e.z, wx, 0);
      if (pr.s < 0.4) continue;
      const py = project(view, e.z, wx, e.y ?? 0);

      switch (e.kind){
        case 'star':   drawShadow(ctx, pr.x, pr.y, pr.s, 0.07); drawStarProp(ctx, py.x, py.y, pr.s, e.spin); break;
        case 'gem':    drawShadow(ctx, pr.x, pr.y, pr.s, 0.07); drawGemProp(ctx, py.x, py.y, pr.s, e.spin); break;
        case 'magnet': drawShadow(ctx, pr.x, pr.y, pr.s, 0.07); drawMagnet(ctx, py.x, py.y, pr.s, e.spin); break;
        case 'shield': drawShadow(ctx, pr.x, pr.y, pr.s, 0.07); drawShieldProp(ctx, py.x, py.y, pr.s, e.spin); break;
        case 'bush':   drawBush(ctx, pr.x, pr.y, pr.s); break;
        case 'crate':  drawCrate(ctx, pr.x, pr.y, pr.s); break;
        case 'bar':    drawBar(ctx, pr.x, pr.y, pr.s); break;
      }
    }
    if (!playerDrawn.done){ drawFog(ctx, view, pal); this.drawPlayer(ctx, pal); }

    // חלקיקים
    for (const pt of this.parts){
      ctx.globalAlpha = clamp(1 - pt.t / pt.life, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // אור חמים של שקיעה
    if (pal.warm > 0.02){
      ctx.fillStyle = `rgba(255,148,72,${pal.warm * 0.18})`;
      ctx.fillRect(-20, -20, view.w + 40, view.h + 40);
    }

    // פסי מהירות
    const spd = (this.speed - this.prof.start) / Math.max(0.1, this.prof.max - this.prof.start);
    drawSpeedLines(ctx, view, clamp(spd - 0.25, 0, 1) * (this.state === 'play' ? 1 : 0), this.runT);

    // שכבת ערב עדינה
    if (pal.night > 0.03){
      ctx.fillStyle = `rgba(12,18,48,${pal.night * 0.28})`;
      ctx.fillRect(-20, -20, view.w + 40, view.h + 40);
    }

    drawVignette(ctx, view);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },

  drawPlayer(ctx, pal){
    const pr = this.projPlayer();
    const ground = project(this.view, PLAYER_Z, laneX(this.p.laneVis), 0);
    drawShadow(ctx, ground.x, ground.y, ground.s, 0.24 - this.p.y * 0.10);

    const pose = this.p.slide > 0 ? 'slide' : this.p.y > 0.05 ? 'jump' : 'run';
    const color = colorById(save.color).hex;

    ctx.save();
    ctx.translate(pr.x, pr.y);
    if (this.p.stumble > 0){
      ctx.rotate(Math.sin(this.p.stumble * 34) * 0.13);
    }
    if (this.p.invuln > 0 && this.p.stumble <= 0){
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(this.runT * 26);
    }
    ctx.scale(pr.s, pr.s);
    drawCharacter(ctx, save.character, { pose, t: this.runT, color });
    ctx.restore();

    // בועת הגנה
    if (this.p.shield > 0){
      ctx.save();
      ctx.globalAlpha = 0.30 + 0.14 * Math.sin(this.runT * 5) + (this.p.shield < 3 ? Math.sin(this.runT * 20) * 0.2 : 0);
      const g = ctx.createRadialGradient(pr.x, pr.y - pr.s * 0.5, pr.s * 0.1, pr.x, pr.y - pr.s * 0.5, pr.s * 0.72);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.7, 'rgba(140,225,255,.55)');
      g.addColorStop(1, 'rgba(90,200,255,.9)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(pr.x, pr.y - pr.s * 0.5, pr.s * 0.72, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // הילת מגנט
    if (this.p.magnet > 0){
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#ff7ba6';
      ctx.lineWidth = 3;
      for (let i = 0; i < 2; i++){
        const r = pr.s * (0.5 + 0.35 * ((this.runT * 1.4 + i * 0.5) % 1));
        ctx.globalAlpha = 0.4 * (1 - ((this.runT * 1.4 + i * 0.5) % 1));
        ctx.beginPath(); ctx.arc(pr.x, pr.y - pr.s * 0.5, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  },
};
