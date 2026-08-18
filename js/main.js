/* חיבור הממשק למשחק: מסכים, הגדרות, חנות דמויות, אפקטים */

import {
  $, save, store, persist, resetSave, hasProfiles,
  setActiveProfile, addProfile, removeProfile,
  pendingDailyReward, claimDailyReward, STREAK_LADDER,
  COLORS, colorById, SPEEDS, QUALITY, clamp, pick, buzz,
} from './util.js';
import { unlockAudio, sfx, say, hushVoice } from './audio.js';
import { CHARACTERS, charById, paintPreview, ACCESSORIES, ACCESSORY_LABELS, DEFAULT_OUTFIT } from './characters.js';
import { Game } from './game.js';

/* ---------------- מסכים ---------------- */
const SCREENS = ['boot', 'onboard', 'home', 'pause', 'end', 'pick', 'who', 'daily', 'parent'];
function show(name){
  SCREENS.forEach(s => $('#scr-' + s)?.classList.toggle('show', s === name));
  const inGame = name === null;
  $('#hud').classList.toggle('show', inGame);
  $('#touchpad').classList.toggle('show', inGame);
}

/* ---------------- בוררים ---------------- */
function buildSwatches(host, current, onPick){
  host.innerHTML = '';
  COLORS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'sw';
    b.type = 'button';
    b.style.background = c.hex;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', c.he);
    b.setAttribute('aria-checked', String(c.id === current));
    b.onclick = () => {
      host.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-checked', 'false'));
      b.setAttribute('aria-checked', 'true');
      sfx.tap();
      onPick(c.id);
    };
    host.appendChild(b);
  });
}

function buildChips(host, options, current, onPick){
  host.innerHTML = '';
  options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = o.label;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(o.value === current));
    b.onclick = () => {
      host.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-checked', 'false'));
      b.setAttribute('aria-checked', 'true');
      sfx.tap();
      onPick(o.value);
    };
    host.appendChild(b);
  });
}

const TIME_OPTIONS = [
  { value: 5,   label: '5 דק׳'  },
  { value: 10,  label: '10 דק׳' },
  { value: 15,  label: '15 דק׳' },
  { value: 999, label: 'בלי הגבלה' },
];
const SPEED_OPTIONS = Object.keys(SPEEDS).map(k => ({ value: k, label: SPEEDS[k].label }));
const QUALITY_OPTIONS = Object.keys(QUALITY).map(k => ({ value: k, label: QUALITY[k].label }));

/* ---------------- אפקטים ---------------- */
const fx = $('#fx');
function confetti(n = 24){
  const colors = COLORS.map(c => c.hex);
  for (let i = 0; i < n; i++){
    const d = document.createElement('div');
    d.className = 'confetti';
    d.style.background = colors[i % colors.length];
    d.style.left = (Math.random() * 100) + 'vw';
    d.style.top = '-24px';
    fx.appendChild(d);
    const dur = 1400 + Math.random() * 1200;
    d.animate([
      { transform: `translate3d(0,0,0) rotate(0deg)`, opacity: 1 },
      { transform: `translate3d(${(Math.random() - .5) * 160}px, ${window.innerHeight + 60}px, 0) rotate(${Math.random() * 900 - 450}deg)`, opacity: .9 },
    ], { duration: dur, easing: 'cubic-bezier(.25,.6,.4,1)' }).onfinish = () => d.remove();
  }
}

let toastTimer = 0;
function toast(text){
  const el = $('#toast');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1200);
}

function prompt(colorHex, name){
  const el = $('#prompt');
  if (!colorHex){ el.classList.remove('show'); return; }
  el.innerHTML = `עברו בשער ה${name}<span class="dot" style="background:${colorHex}"></span>`;
  el.classList.add('show');
}

/* ---------------- מסך הבית ---------------- */
const heroCanvas = $('#heroCanvas');
let heroT = 0, heroRaf = 0;
function heroLoop(){
  heroRaf = requestAnimationFrame(heroLoop);
  heroT += 0.016;
  paintPreview(heroCanvas, save.character, colorById(save.color).hex, heroT, 'run', save.outfit || DEFAULT_OUTFIT);
}
function startHero(){ if (!heroRaf) heroLoop(); }
function stopHero(){ cancelAnimationFrame(heroRaf); heroRaf = 0; }

function refreshHome(){
  $('#homeHello').textContent = save.name || 'גפן';
  $('#homeStars').textContent = save.stars;
  const next = save.stars === 0 ? 25 : (Math.floor(save.stars / 25) + 1) * 25;
  $('#homeFoot').textContent = `עוד ${next - save.stars} כוכבים עד החגיגה הבאה 🎉`;
}

function goHome(){
  stopWho();
  stopPick();
  refreshHome();
  if (showDailyIfDue()) return;   // הפרס נפתח פעם ביום, לפני מסך הבית
  show('home');
  startHero();
}

/* ---------------- מי משחק? (פרופילים) ---------------- */
const whoPreviews = [];
let whoRaf = 0, whoT = 0;

function whoLoop(){
  whoRaf = requestAnimationFrame(whoLoop);
  whoT += 0.016;
  whoPreviews.forEach((pv, i) => paintPreview(pv.cv, pv.char, pv.color, whoT + i * 0.4, 'run', pv.outfit));
}
function stopWho(){ cancelAnimationFrame(whoRaf); whoRaf = 0; }

function buildWho(){
  const grid = $('#whoGrid');
  grid.innerHTML = '';
  whoPreviews.length = 0;

  store.profiles.forEach(p => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'who-card';
    card.setAttribute('aria-current', String(p.id === store.activeId));
    card.setAttribute('aria-label', p.name);

    const cv = document.createElement('canvas');
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = p.name;
    const st = document.createElement('div');
    st.className = 'st';
    st.textContent = `${p.stars} ⭐`;
    card.append(cv, nm, st);

    card.onclick = () => {
      setActiveProfile(p.id);
      sfx.fanfare();
      stopWho();
      goHome();
      say(`שלום ${p.name}`, { force: true });
    };

    grid.appendChild(card);
    whoPreviews.push({ cv, char: p.character, color: colorById(p.color).hex, outfit: p.outfit || DEFAULT_OUTFIT });
  });
}

function openWho(){
  stopHero();
  buildWho();
  show('who');
  whoT = 0;
  if (!whoRaf) whoLoop();
}

/* ---------------- בורר הדמויות ---------------- */
const pickPreviews = [];
let pickRaf = 0, pickT = 0;

function pickLoop(){
  pickRaf = requestAnimationFrame(pickLoop);
  pickT += 0.016;
  const col = colorById(save.color).hex;
  const fit = save.outfit || DEFAULT_OUTFIT;
  paintPreview($('#pickHero'), save.character, col, pickT, 'run', fit);
  pickPreviews.forEach((pv, i) => {
    const running = pv.id === save.character;
    paintPreview(pv.cv, pv.id, col, running ? pickT : i * 0.31, running ? 'run' : 'idle', fit);
  });
}
function stopPick(){ cancelAnimationFrame(pickRaf); pickRaf = 0; }

function markPicked(){
  $('#pickGrid').querySelectorAll('.pick-card')
    .forEach(el => el.setAttribute('aria-checked', String(el.dataset.id === save.character)));
}

function buildPick(){
  const grid = $('#pickGrid');
  grid.innerHTML = '';
  pickPreviews.length = 0;

  CHARACTERS.forEach(c => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'pick-card';
    card.dataset.id = c.id;
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-label', c.name);
    card.setAttribute('aria-checked', String(save.character === c.id));

    const cv = document.createElement('canvas');
    card.appendChild(cv);
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = c.name;
    card.appendChild(nm);
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.textContent = '✓';
    card.appendChild(tick);

    card.onclick = () => {
      save.character = c.id;
      persist();
      sfx.tap();
      buzz(8);
      markPicked();
      say(c.name, { force: true });
    };

    grid.appendChild(card);
    pickPreviews.push({ cv, id: c.id });
  });

  buildSwatches($('#pickColor'), save.color, id => { save.color = id; persist(); });
  buildAccessoryRows();
}

/** שורות אביזרים — הכל פתוח, בלי מחירים ובלי מנעולים */
function buildAccessoryRows(){
  const host = $('#accRows');
  host.innerHTML = '';
  if (!save.outfit) save.outfit = { ...DEFAULT_OUTFIT };

  for (const slot of Object.keys(ACCESSORIES)){
    const row = document.createElement('div');
    row.className = 'acc-row';
    const title = document.createElement('span');
    title.textContent = ACCESSORY_LABELS[slot];
    row.appendChild(title);

    const chips = document.createElement('div');
    chips.className = 'acc-chips';
    ACCESSORIES[slot].forEach(item => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'acc-chip';
      b.textContent = item.emoji;
      b.title = item.name;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', `${ACCESSORY_LABELS[slot]}: ${item.name}`);
      b.setAttribute('aria-checked', String(save.outfit[slot] === item.id));
      b.onclick = () => {
        save.outfit[slot] = item.id;
        persist();
        sfx.tap();
        buzz(6);
        chips.querySelectorAll('.acc-chip').forEach(x => x.setAttribute('aria-checked', 'false'));
        b.setAttribute('aria-checked', 'true');
      };
      chips.appendChild(b);
    });
    row.appendChild(chips);
    host.appendChild(row);
  }
}

function openPick(){
  stopHero();
  buildPick();
  show('pick');
  pickT = 0;
  if (!pickRaf) pickLoop();
}

/* ---------------- הגדרות הורים ---------------- */
function buildPlayerList(){
  const host = $('#playerList');
  host.innerHTML = '';
  store.profiles.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-row' + (p.id === store.activeId ? ' active' : '');
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = p.name;
    const st = document.createElement('div');
    st.className = 'st';
    st.textContent = `${p.stars} ⭐ · ${p.totals.runs} סבבים`;
    row.append(nm, st);
    if (store.profiles.length > 1){
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'מחק';
      del.onclick = () => {
        if (!confirm(`למחוק את ${p.name} ואת כל ההתקדמות שלו?`)) return;
        removeProfile(p.id);
        openParent();
        refreshHome();
      };
      row.appendChild(del);
    }
    host.appendChild(row);
  });
}

function openParent(){
  buildPlayerList();
  buildChips($('#setQuality'), QUALITY_OPTIONS, store.quality, v => {
    store.quality = v;
    persist();
    Game.resize();
  });
  $('#setName').value = save.name;
  buildSwatches($('#setColor'), save.color, id => { save.color = id; persist(); });
  buildChips($('#setTime'), TIME_OPTIONS, save.sessionMinutes, v => { save.sessionMinutes = v; persist(); });
  buildChips($('#setSpeed'), SPEED_OPTIONS, save.speed, v => { save.speed = v; persist(); });
  $('#setSound').checked = save.sound;
  $('#setVoice').checked = save.voice;
  $('#setGates').checked = save.gates;
  $('#setShake').checked = save.shake;
  $('#setPickEachRun').checked = save.pickEachRun;

  const t = save.totals;
  $('#parentStats').innerHTML = [
    `סבבים: ${t.runs}`,
    `כוכבים בסך הכל: ${t.stars}`,
    `זמן משחק: ${Math.round(t.seconds / 60)} דק׳`,
    `שערי צבע: ${t.gates}`,
    `שיא מרחק: ${save.bestMeters} מ׳`,
  ].map(s => `<span>${s}</span>`).join('');

  show('parent');
}

/* לחיצה ארוכה על גלגל השיניים — כדי שילד לא ייכנס בטעות */
function wireHoldToOpen(){
  const btn = $('#btnParent');
  const ring = btn.querySelector('.hold-ring circle');
  const LEN = 126, HOLD = 1400;
  let raf = 0, t0 = 0;

  const step = () => {
    const p = clamp((performance.now() - t0) / HOLD, 0, 1);
    ring.style.strokeDashoffset = String(LEN * (1 - p));
    if (p >= 1){ stop(); sfx.gem(); openParent(); return; }
    raf = requestAnimationFrame(step);
  };
  const start = e => { e.preventDefault(); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(step); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; ring.style.strokeDashoffset = String(LEN); };

  btn.addEventListener('touchstart', start, { passive: false });
  btn.addEventListener('mousedown', start);
  ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(ev => btn.addEventListener(ev, stop));
}

/* ---------------- סוף סשן ---------------- */
function showEnd(res){
  coachTimers.forEach(clearTimeout);
  coachTimers = [];
  stopHero();
  $('#endStars').textContent = res.stars;
  $('#endDist').textContent = res.meters;
  $('#endGates').textContent = res.gates;
  $('#endTitle').textContent = `${save.name || 'גפן'} הגיע לבית העץ!`;

  $('#endUnlock').textContent = res.oops === 0
    ? 'סיבוב מושלם — בלי אף מעידה! 🌟'
    : `סך הכל אספת ${save.stars} כוכבים ⭐`;

  const board = $('#endBoard');
  if (store.profiles.length > 1){
    const ranked = store.profiles.slice().sort((a, b) => b.bestMeters - a.bestMeters);
    board.innerHTML = ranked.map((p, i) =>
      `<div class="board-row${p.id === store.activeId ? ' me' : ''}">` +
      `<span>${['🥇', '🥈', '🥉'][i] || '·'}</span>` +
      `<span class="nm">${p.name}</span>` +
      `<span>${p.bestMeters} מ׳</span></div>`).join('');
  } else {
    board.innerHTML = '';
  }

  persist();
  show('end');
  confetti(40);
  say(`${save.name || 'גפן'}, אספת ${res.stars} כוכבים. כל הכבוד!`, { force: true });
}

/* ---------------- פרס יומי (סולם רצף) ---------------- */
function showDailyIfDue(){
  const reward = pendingDailyReward();
  if (!reward) return false;

  claimDailyReward();
  $('#dailyTitle').textContent = reward.full
    ? 'שבוע שלם ברצף! 🏆'
    : `יום ${reward.day} ברצף!`;
  $('#dailyText').textContent = `קיבלת ${reward.stars} כוכבים`;

  const dots = $('#dailyDots');
  dots.innerHTML = '';
  STREAK_LADDER.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'daily-dot' + (i + 1 < reward.day ? ' done' : i + 1 === reward.day ? ' today' : '');
    d.textContent = String(i + 1);
    dots.appendChild(d);
  });

  show('daily');
  sfx.fanfare();
  confetti(reward.full ? 46 : 24);
  say(`${save.name}, קיבלת ${reward.stars} כוכבים על יום ${reward.day} ברצף`, { force: true });
  return true;
}

/* ---------------- מסך היכרות (שחקן ראשון או נוסף) ---------------- */
let onboardDraft = { name: 'גפן', color: 'blue' , sessionMinutes: 10 };

function openOnboard(mode){
  onboardDraft = mode === 'add'
    ? { name: '', color: pick(COLORS).id, sessionMinutes: 10 }
    : { name: 'גפן', color: 'blue', sessionMinutes: 10 };

  $('#onboardTitle').textContent = mode === 'add' ? 'שחקן חדש 👋' : 'שלום! 👋';
  $('#inpName').value = onboardDraft.name;
  buildSwatches($('#colorPick'), onboardDraft.color, id => { onboardDraft.color = id; });
  buildChips($('#timePick'), TIME_OPTIONS, onboardDraft.sessionMinutes, v => { onboardDraft.sessionMinutes = v; });
  show('onboard');
}

/* ---------------- התחלה ---------------- */
let coachTimers = [];
function coach(){
  coachTimers.forEach(clearTimeout);
  coachTimers = [];
  if (save.totals.runs > 1) return;          // רק בסבבים הראשונים
  const steps = [
    [1200, 'נגעו בצד כדי לזוז 👈👉'],
    [5200, 'נגעו באמצע כדי לקפוץ ⬆️'],
    [9200, 'אספו כוכבים ⭐'],
  ];
  steps.forEach(([ms, text]) => coachTimers.push(setTimeout(() => toast(text), ms)));
}

function startRun(){
  hushVoice();
  stopHero();
  stopPick();
  stopWho();
  show(null);
  $('#runStars').textContent = '0';
  $('#trackFill').style.width = '0%';
  Game.start();
  coach();
}

function wire(){
  /* מסך ההיכרות נבנה ב-openOnboard */
  $('#btnOnboardDone').onclick = () => {
    addProfile({
      name: $('#inpName').value,
      color: onboardDraft.color,
      character: pick(CHARACTERS).id,
      sessionMinutes: onboardDraft.sessionMinutes,
    });
    sfx.fanfare();
    confetti(24);
    goHome();
  };

  /* פרס יומי */
  $('#btnDailyOk').onclick = () => { goHome(); };

  /* בית */
  $('#btnPlay').onclick = () => { save.pickEachRun ? openPick() : startRun(); };
  $('#btnWho').onclick = () => openWho();
  $('#btnWhoAdd').onclick = () => { stopWho(); openOnboard('add'); };
  $('#btnAddPlayer').onclick = () => openOnboard('add');
  $('#btnPickGo').onclick = () => { stopPick(); startRun(); };
  $('#btnPickBack').onclick = () => { stopPick(); goHome(); };
  wireHoldToOpen();

  /* משחק */
  $('#btnPause').onclick = () => { Game.pause(); hushVoice(); show('pause'); };
  $('#btnResume').onclick = () => {
    show(null);
    let n = 3;
    toast(String(n));
    const tick = setInterval(() => {
      n--;
      if (n > 0){ toast(String(n)); sfx.tap(); return; }
      clearInterval(tick);
      toast('קדימה!');
      sfx.gem();
      Game.resume();
    }, 620);
  };
  $('#btnQuit').onclick = () => {
    coachTimers.forEach(clearTimeout); coachTimers = [];
    Game.endNow(); persist(); Game.quit(); goHome();
  };

  /* סוף */
  $('#btnEndHome').onclick = () => { Game.quit(); goHome(); };
  $('#btnEndAgain').onclick = () => { save.pickEachRun ? openPick() : startRun(); };

  /* הורים */
  $('#setName').oninput = e => { save.name = e.target.value.slice(0, 12); };
  ['sound', 'voice', 'gates', 'shake', 'pickEachRun'].forEach(k => {
    $('#set' + k[0].toUpperCase() + k.slice(1)).onchange = e => { save[k] = e.target.checked; persist(); };
  });
  $('#btnParentClose').onclick = () => {
    save.name = (save.name || 'גפן').trim() || 'גפן';
    persist();
    goHome();
  };
  $('#btnReset').onclick = () => {
    if (!confirm('לאפס את כל השחקנים, ההתקדמות והכוכבים?')) return;
    resetSave();
    location.reload();
  };

  /* פתיחת שמע במגע הראשון */
  const once = () => { unlockAudio(); window.removeEventListener('pointerdown', once); window.removeEventListener('touchstart', once); };
  window.addEventListener('pointerdown', once, { passive: true });
  window.addEventListener('touchstart', once, { passive: true });
}

/* ---------------- אתחול ---------------- */
function boot(){
  wire();

  Game.init($('#stage'), {
    onStars: n => {
      const el = $('#runStars');
      el.textContent = n;
      const pill = el.closest('.stars-pill');
      pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop');
    },
    onProgress: p => { $('#trackFill').style.width = (p * 100).toFixed(1) + '%'; },
    onToast: toast,
    onPrompt: prompt,
    onConfetti: confetti,
    onMilestone: n => toast(`${n} ⭐`),
    onEnd: showEnd,
    onAutoPause: () => { Game.pause(); hushVoice(); show('pause'); },
  });

  setTimeout(() => {
    if (!hasProfiles()) openOnboard('first');
    else if (store.profiles.length > 1) openWho();
    else goHome();
  }, 650);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* Service Worker — כדי שהמשחק יעבוד גם בלי אינטרנט */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')
    && document.querySelector('link[rel="manifest"]')){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
