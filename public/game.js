// ═══════════════════════════════════════════════════════════════
//  GeoBlast — Full Geometry Dash Replica
//  Game Engine + All Systems
// ═══════════════════════════════════════════════════════════════

// ─── RAILWAY CONFIG ───────────────────────────────────────────
// After deploying to Railway, paste your Railway URL below:
// e.g. "https://geoblast-production.up.railway.app"
const RAILWAY_URL = "YOUR_RAILWAY_URL_HERE";

// Auto-detect: localhost uses local server, GitHub Pages uses Railway
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : RAILWAY_URL.includes("YOUR_RAILWAY") ? null : RAILWAY_URL + '/api';

// If no backend configured, run in offline mode
const OFFLINE_MODE = !API;

// ─── STATE ────────────────────────────────────────────────────
let state = {
  user: null,
  isGuest: false,
  isOwner: false,
  coins: 0,
  stars: 0,
  completedLevels: [],
  cosmetics: {
    primaryColor: '#ff6b35',
    secondaryColor: '#ffd700',
    trail: 'classic',
    icon: 'cube'
  },
  settings: {
    sfx: true,
    particles: true,
    fps: false,
    flash: true
  },
  currentLevel: null,
  attempt: 0,
  bestPercent: {},
  totalDeaths: 0,
  practiceMode: false,
  practiceCheckpoints: [],
  token: null
};

// ─── LEVEL DEFINITIONS ────────────────────────────────────────
const LEVELS = [
  {
    id: 1, name: "Stereo Madness", difficulty: "auto",
    stars: 1, color: "#4a9eff", bgColor: "#001830", groundColor: "#003366",
    speed: 1.0, music: 130, song: "Stereo Madness",
    description: "The beginning of everything",
    segments: genLevel1()
  },
  {
    id: 2, name: "Back On Track", difficulty: "easy",
    stars: 2, color: "#39ff14", bgColor: "#001a00", groundColor: "#004400",
    speed: 1.0, music: 140, song: "Back On Track",
    description: "Getting warmed up",
    segments: genLevel2()
  },
  {
    id: 3, name: "Polargeist", difficulty: "normal",
    stars: 3, color: "#00d4ff", bgColor: "#000a1a", groundColor: "#002244",
    speed: 1.1, music: 148, song: "Polargeist",
    description: "Things get interesting",
    segments: genLevel3()
  },
  {
    id: 4, name: "Dry Out", difficulty: "normal",
    stars: 4, color: "#ff9933", bgColor: "#1a0d00", groundColor: "#3d1f00",
    speed: 1.1, music: 144, song: "Dry Out",
    description: "The desert awaits",
    segments: genLevel4()
  },
  {
    id: 5, name: "Base After Base", difficulty: "hard",
    stars: 5, color: "#ff3366", bgColor: "#1a0010", groundColor: "#4d0030",
    speed: 1.2, music: 168, song: "Base After Base",
    description: "Precision required",
    segments: genLevel5()
  },
  {
    id: 6, name: "Can't Let Go", difficulty: "hard",
    stars: 6, color: "#cc33ff", bgColor: "#0d0020", groundColor: "#300066",
    speed: 1.2, music: 172, song: "Can't Let Go",
    description: "Don't look back",
    segments: genLevel6()
  },
  {
    id: 7, name: "Jumper", difficulty: "harder",
    stars: 7, color: "#ff6600", bgColor: "#1a0800", groundColor: "#4d1a00",
    speed: 1.3, music: 160, song: "Jumper",
    description: "Jump. Jump. Jump again.",
    segments: genLevel7()
  },
  {
    id: 8, name: "Time Machine", difficulty: "harder",
    stars: 8, color: "#00ffcc", bgColor: "#001a14", groundColor: "#004433",
    speed: 1.3, music: 174, song: "Time Machine",
    description: "Tick tock...",
    segments: genLevel8()
  },
  {
    id: 9, name: "Cycles", difficulty: "insane",
    stars: 9, color: "#ff0066", bgColor: "#1a0010", groundColor: "#4d002e",
    speed: 1.4, music: 176, song: "Cycles",
    description: "The cycle continues",
    segments: genLevel9()
  },
  {
    id: 10, name: "xStep", difficulty: "insane",
    stars: 10, color: "#ffcc00", bgColor: "#1a1400", groundColor: "#4d3d00",
    speed: 1.4, music: 180, song: "xStep",
    description: "Every step matters",
    segments: genLevel10()
  },
  {
    id: 11, name: "Clutterfunk", difficulty: "insane",
    stars: 11, color: "#33ccff", bgColor: "#00141a", groundColor: "#003d4d",
    speed: 1.5, music: 184, song: "Clutterfunk",
    description: "Pure chaos",
    segments: genLevel11()
  },
  {
    id: 12, name: "Theory of Everything", difficulty: "insane",
    stars: 12, color: "#9933ff", bgColor: "#0a0020", groundColor: "#1a0066",
    speed: 1.5, music: 190, song: "Theory of Everything",
    description: "Everything falls apart",
    segments: genLevel12()
  },
  {
    id: 13, name: "Electroman Adventures", difficulty: "harder",
    stars: 8, color: "#00ffff", bgColor: "#001a1a", groundColor: "#004444",
    speed: 1.3, music: 166, song: "Electroman Adventures",
    description: "Electric dreams",
    segments: genLevel13()
  },
  {
    id: 14, name: "Clubstep", difficulty: "demon",
    stars: 14, color: "#ff3300", bgColor: "#1a0500", groundColor: "#4d0f00",
    speed: 1.6, music: 200, song: "Clubstep",
    description: "Enter the demon realm",
    segments: genLevel14()
  },
  {
    id: 15, name: "Electrodynamix", difficulty: "insane",
    stars: 12, color: "#ffff00", bgColor: "#1a1a00", groundColor: "#4d4d00",
    speed: 1.5, music: 192, song: "Electrodynamix",
    description: "Electric overdrive",
    segments: genLevel15()
  },
  {
    id: 16, name: "Hexagon Force", difficulty: "insane",
    stars: 12, color: "#ff66cc", bgColor: "#1a0014", groundColor: "#4d003d",
    speed: 1.5, music: 196, song: "Hexagon Force",
    description: "Six sides of pain",
    segments: genLevel16()
  },
  {
    id: 17, name: "Blast Processing", difficulty: "harder",
    stars: 10, color: "#66ff00", bgColor: "#0a1a00", groundColor: "#204d00",
    speed: 1.8, music: 202, song: "Blast Processing",
    description: "SPEED. PURE SPEED.",
    segments: genLevel17()
  },
  {
    id: 18, name: "Theory of Everything 2", difficulty: "demon",
    stars: 14, color: "#cc00ff", bgColor: "#0d0020", groundColor: "#26004d",
    speed: 1.6, music: 198, song: "Theory of Everything 2",
    description: "The sequel is worse",
    segments: genLevel18()
  },
  {
    id: 19, name: "Geometrical Dominator", difficulty: "harder",
    stars: 10, color: "#ff9900", bgColor: "#1a0d00", groundColor: "#4d2600",
    speed: 1.4, music: 188, song: "Geometrical Dominator",
    description: "Dominate or die",
    segments: genLevel19()
  },
  {
    id: 20, name: "Deadlocked", difficulty: "demon",
    stars: 14, color: "#ff0000", bgColor: "#1a0000", groundColor: "#4d0000",
    speed: 1.7, music: 210, song: "Deadlocked",
    description: "No escape. No mercy.",
    segments: genLevel20()
  },
  {
    id: 21, name: "Fingerdash", difficulty: "insane",
    stars: 12, color: "#ff6699", bgColor: "#1a0010", groundColor: "#4d0030",
    speed: 1.5, music: 194, song: "Fingerdash",
    description: "Fingers screaming",
    segments: genLevel21()
  },
  {
    id: 22, name: "Dash", difficulty: "insane",
    stars: 12, color: "#00ccff", bgColor: "#001a26", groundColor: "#004d66",
    speed: 1.6, music: 198, song: "Dash",
    description: "The dash never ends",
    segments: genLevel22()
  },
  {
    id: 23, name: "EXTREME VOID", difficulty: "extreme",
    stars: 20, color: "#ff0000", bgColor: "#050000", groundColor: "#200000",
    speed: 2.0, music: 240, song: "Death Note",
    description: "⚠ NOT FOR THE WEAK ⚠",
    segments: genLevelExtreme()
  }
];

// ─── LEVEL GENERATORS ─────────────────────────────────────────
// Generates obstacle arrays: each obj = {type, x, y, w, h, angle, color}
// Types: 'block','spike','platform','orb','pad','portal_gravity','portal_speed','saw'

function genLevel1() {
  const seg = [];
  for (let x = 500; x < 6000; x += 200) {
    if (x % 400 === 0) seg.push({ type: 'block', x, y: 0, w: 60, h: 60 });
    if (x % 600 === 0) seg.push({ type: 'spike', x: x+60, y: 0 });
  }
  for (let x = 1000; x < 6000; x += 500) {
    seg.push({ type: 'block', x, y: 60, w: 60, h: 40 });
    seg.push({ type: 'spike', x: x+70, y: 0 });
    seg.push({ type: 'spike', x: x+90, y: 0 });
  }
  return seg;
}

function genLevel2() {
  const seg = [];
  for (let x = 400; x < 7000; x += 180) {
    const r = Math.random();
    if (r < 0.3) {
      seg.push({ type: 'block', x, y: 0, w: 60, h: 60 });
      if (Math.random() < 0.4) seg.push({ type: 'spike', x: x+65, y: 0 });
    } else if (r < 0.5) {
      seg.push({ type: 'spike', x, y: 0 });
      seg.push({ type: 'spike', x: x+30, y: 0 });
    } else if (r < 0.65) {
      seg.push({ type: 'platform', x, y: 120, w: 100, h: 20 });
      seg.push({ type: 'spike', x: x+50, y: 0 });
    }
  }
  return seg;
}

function genLevel3() {
  const seg = [];
  for (let x = 400; x < 8000; x += 160) {
    const r = Math.random();
    if (r < 0.25) {
      seg.push({ type: 'block', x, y: 0, w: 60, h: 60 });
      seg.push({ type: 'block', x, y: 60, w: 60, h: 60 });
    } else if (r < 0.45) {
      seg.push({ type: 'spike', x, y: 0 });
      seg.push({ type: 'spike', x: x+25, y: 0 });
      seg.push({ type: 'spike', x: x+50, y: 0 });
    } else if (r < 0.6) {
      seg.push({ type: 'orb', x: x+30, y: 100, color: '#ffff00' });
    } else if (r < 0.75) {
      seg.push({ type: 'platform', x, y: 140, w: 80, h: 20 });
      seg.push({ type: 'spike', x: x+30, y: 0 });
    }
  }
  // Add portal midway
  seg.push({ type: 'portal_gravity', x: 3000, y: 0, h: 200, color: '#00d4ff' });
  return seg;
}

function genLevelBase(difficulty, length = 9000) {
  const seg = [];
  const spawnRate = { auto:0.3, easy:0.35, normal:0.4, hard:0.5, harder:0.6, insane:0.7, demon:0.8, extreme:0.9 }[difficulty] || 0.5;
  for (let x = 400; x < length; x += 140) {
    if (Math.random() < spawnRate) {
      const r = Math.random();
      if (r < 0.2) {
        const h = Math.floor(Math.random()*3+1) * 60;
        seg.push({ type: 'block', x, y: 0, w: 60, h });
        if (difficulty !== 'auto' && Math.random() < 0.5)
          seg.push({ type: 'spike', x: x+65, y: 0 });
      } else if (r < 0.45) {
        const count = Math.floor(Math.random()*3)+1;
        for (let i=0;i<count;i++) seg.push({ type:'spike', x: x+i*25, y: 0 });
      } else if (r < 0.6) {
        seg.push({ type: 'platform', x, y: 80+Math.random()*80, w: 60+Math.random()*80, h: 20 });
        if (Math.random() < 0.4) seg.push({ type:'spike', x: x+20, y: 0 });
      } else if (r < 0.7) {
        seg.push({ type: 'orb', x: x+30, y: 80+Math.random()*100, color: Math.random()<0.5?'#ffff00':'#00aaff' });
      } else if (r < 0.8) {
        seg.push({ type: 'pad', x: x+20, y: 0, color: '#ff6600' });
      } else if (r < 0.88) {
        seg.push({ type: 'saw', x: x+20, y: 30+Math.random()*80, r: 25 });
      }
    }
  }
  if (difficulty === 'demon' || difficulty === 'extreme') {
    seg.push({ type: 'portal_gravity', x: Math.floor(length*0.3), y: 0, h: 200, color: '#00d4ff' });
    seg.push({ type: 'portal_gravity', x: Math.floor(length*0.6), y: 0, h: 200, color: '#ff6b35' });
  } else if (difficulty === 'insane' || difficulty === 'harder') {
    seg.push({ type: 'portal_gravity', x: Math.floor(length*0.45), y: 0, h: 200, color: '#00d4ff' });
  }
  return seg;
}

function genLevel4()  { return genLevelBase('normal', 8000); }
function genLevel5()  { return genLevelBase('hard', 9000); }
function genLevel6()  { return genLevelBase('hard', 9500); }
function genLevel7()  { return genLevelBase('harder', 10000); }
function genLevel8()  { return genLevelBase('harder', 10000); }
function genLevel9()  { return genLevelBase('insane', 11000); }
function genLevel10() { return genLevelBase('insane', 11000); }
function genLevel11() { return genLevelBase('insane', 11500); }
function genLevel12() { return genLevelBase('insane', 12000); }
function genLevel13() { return genLevelBase('harder', 10500); }
function genLevel14() { return genLevelBase('demon', 13000); }
function genLevel15() { return genLevelBase('insane', 12000); }
function genLevel16() { return genLevelBase('insane', 12500); }
function genLevel17() { return genLevelBase('harder', 11000); }
function genLevel18() { return genLevelBase('demon', 14000); }
function genLevel19() { return genLevelBase('harder', 11500); }
function genLevel20() { return genLevelBase('demon', 15000); }
function genLevel21() { return genLevelBase('insane', 12000); }
function genLevel22() { return genLevelBase('insane', 12500); }
function genLevelExtreme() { return genLevelBase('extreme', 18000); }

// ─── CANVAS + GAME ENGINE ─────────────────────────────────────
let canvas, ctx, animId;
let gameRunning = false;
let gameOver = false;
let levelComplete = false;
let paused = false;

// Player
let player = {
  x: 100, y: 0,
  vy: 0,
  size: 40,
  rotation: 0,
  rotSpeed: 0,
  onGround: false,
  gravityDir: 1,   // 1 = normal, -1 = flipped
  dead: false,
  trail: [],
  particles: []
};

// Camera
let camX = 0;
const GRAVITY = 1400;   // px/s²
const JUMP_VEL = -640;
const GROUND_Y = () => canvas.height - 100;
const CEIL_Y = 0;
let speedMult = 1.0;
let globalSpeed = 1.0;
let lastTime = 0;
let fps = 0, fpsCount = 0, fpsTimer = 0;

// Saw angles
let sawAngle = 0;

// ─── COSMETICS DATA ───────────────────────────────────────────
const COLORS = [
  '#ff6b35','#ffd700','#39ff14','#00d4ff','#bf5fff','#ff69b4',
  '#ff2222','#ffffff','#00ffff','#ff8800','#4444ff','#88ff00',
  '#ff0088','#00ff88','#8800ff','#ffaa00','#00aaff','#ff4400'
];

const TRAILS = [
  { id:'classic',  label:'Classic',  emoji:'💫', cost:0 },
  { id:'fire',     label:'Fire',     emoji:'🔥', cost:100 },
  { id:'ice',      label:'Ice',      emoji:'❄️', cost:100 },
  { id:'rainbow',  label:'Rainbow',  emoji:'🌈', cost:200 },
  { id:'electric', label:'Electric', emoji:'⚡', cost:200 },
  { id:'shadow',   label:'Shadow',   emoji:'🌑', cost:150 },
  { id:'star',     label:'Star',     emoji:'⭐', cost:250 },
  { id:'vortex',   label:'Vortex',   emoji:'🌀', cost:300 },
  { id:'heart',    label:'Heart',    emoji:'💜', cost:150 }
];

const ICONS = [
  { id:'cube',     label:'Cube',    emoji:'⬛', cost:0 },
  { id:'ship',     label:'Ship',    emoji:'🚀', cost:200 },
  { id:'ball',     label:'Ball',    emoji:'🔵', cost:150 },
  { id:'ufo',      label:'UFO',     emoji:'🛸', cost:250 },
  { id:'wave',     label:'Wave',    emoji:'〰️', cost:200 },
  { id:'robot',    label:'Robot',   emoji:'🤖', cost:300 },
  { id:'spider',   label:'Spider',  emoji:'🕷️', cost:350 },
  { id:'diamond',  label:'Diamond', emoji:'💎', cost:400 },
  { id:'skull',    label:'Skull',   emoji:'💀', cost:500 }
];

// ─── AUDIO (Web Audio API) ─────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx && AudioCtx) {
    audioCtx = new AudioCtx();
  }
}

function playTone(freq, duration=0.1, type='square', vol=0.15) {
  if (!state.settings.sfx || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

function sfxJump()   { playTone(440, 0.1, 'square', 0.1); }
function sfxDie()    { playTone(80, 0.5, 'sawtooth', 0.2); playTone(60, 0.5, 'sine', 0.1); }
function sfxWin()    { [523,659,784,1047].forEach((f,i) => setTimeout(()=>playTone(f,0.3,'sine',0.15),i*150)); }
function sfxOrb()    { playTone(600, 0.08, 'sine', 0.1); }
function sfxClick()  { playTone(880, 0.05, 'sine', 0.08); }

// ─── SCREEN MANAGEMENT ────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  sfxClick();
}

function showLevelSelect() {
  showScreen('levelSelect');
  buildLevelGrid();
}

function showRegister() {
  toast('Coming soon! Play as guest for now.', 'info');
}

// ─── AUTHENTICATION ────────────────────────────────────────────
async function loginUser() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!username) { toast('Enter a username!', 'error'); return; }

  if (OFFLINE_MODE) {
    // No backend configured — use local storage login
    offlineLogin(username);
    toast('🌐 Playing offline — connect Railway for full features!', 'info');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    applySession(data);
    toast(`Welcome back, ${data.user.username}!`, 'success');
  } catch(e) {
    // Backend offline — fall back to local
    offlineLogin(username);
    toast('⚠️ Backend offline. Playing locally.', 'info');
  }
}

function offlineLogin(username) {
  state.user = { username, id: 'local_' + Date.now(), role: 'player' };
  state.isGuest = false;
  loadLocalData();
  afterLogin();
}

function guestLogin() {
  state.user = { username: 'Guest_' + Math.floor(Math.random()*9999), id: 'guest', role: 'guest' };
  state.isGuest = true;
  loadLocalData();
  afterLogin();
  toast('Playing as guest. Progress saves locally only.', 'info');
}

function applySession(data) {
  state.user = data.user;
  state.token = data.token;
  state.isOwner = data.user.role === 'owner';
  state.coins = data.user.coins || 0;
  state.stars = data.user.stars || 0;
  state.completedLevels = data.user.completedLevels || [];
  state.cosmetics = data.user.cosmetics || state.cosmetics;
  loadLocalData(); // merge local
  afterLogin();
}

function loadLocalData() {
  try {
    const saved = JSON.parse(localStorage.getItem('geoblast_save') || '{}');
    if (saved.coins) state.coins = Math.max(state.coins, saved.coins);
    if (saved.stars) state.stars = Math.max(state.stars, saved.stars);
    if (saved.completedLevels) {
      state.completedLevels = [...new Set([...state.completedLevels, ...(saved.completedLevels||[])])];
    }
    if (saved.cosmetics) state.cosmetics = { ...state.cosmetics, ...saved.cosmetics };
    if (saved.settings) state.settings = { ...state.settings, ...saved.settings };
    if (saved.bestPercent) state.bestPercent = saved.bestPercent;
    if (saved.attempt) state.attempt = saved.attempt;
    if (saved.totalDeaths) state.totalDeaths = saved.totalDeaths;
  } catch(e) {}
}

function saveLocalData() {
  try {
    localStorage.setItem('geoblast_save', JSON.stringify({
      coins: state.coins,
      stars: state.stars,
      completedLevels: state.completedLevels,
      cosmetics: state.cosmetics,
      settings: state.settings,
      bestPercent: state.bestPercent,
      attempt: state.attempt,
      totalDeaths: state.totalDeaths
    }));
  } catch(e) {}
}

function afterLogin() {
  document.getElementById('ownerAccessBtn').style.display =
    state.isOwner ? 'block' : 'none';
  document.getElementById('onlineBadge').style.display = 'flex';
  applySettings();
  showScreen('mainMenu');
  startMenuParticles();
}

document.getElementById('loginBtn').addEventListener('click', loginUser);

// ─── LEVEL GRID ────────────────────────────────────────────────
function buildLevelGrid() {
  const grid = document.getElementById('levelGrid');
  grid.innerHTML = '';
  LEVELS.forEach(level => {
    const unlocked = isLevelUnlocked(level.id);
    const completed = state.completedLevels.includes(level.id);
    const best = state.bestPercent[level.id] || 0;

    const card = document.createElement('div');
    card.className = `level-card ${!unlocked?'locked':''} ${completed?'completed':''}`;
    card.style.background = `linear-gradient(135deg, ${level.color}15, var(--gd-panel))`;

    if (!unlocked) {
      card.innerHTML = `
        <div class="level-num">LEVEL ${level.id}</div>
        <div class="level-name" style="color:${level.color}">${level.name}</div>
        <div class="level-lock-icon">🔒</div>
        <div style="font-size:0.7rem;color:rgba(255,255,255,0.3);margin-top:0.5rem">Complete level ${level.id-1}</div>
      `;
    } else {
      card.innerHTML = `
        <div class="level-num" style="color:${level.color}aa">LEVEL ${level.id}</div>
        <div class="level-name" style="color:${level.color}">${level.name}</div>
        <div class="level-difficulty diff-${level.difficulty}">${level.difficulty.toUpperCase()}</div>
        <div class="level-stars">${'★'.repeat(Math.min(level.stars,10))}</div>
        <div class="level-best">Best: ${best}% | ${level.song}</div>
      `;
      card.onclick = () => startLevel(level.id);
    }
    grid.appendChild(card);
  });
}

function isLevelUnlocked(id) {
  if (state.isOwner) return true;
  if (id === 1) return true;
  return state.completedLevels.includes(id - 1);
}

// ─── GAME INIT ─────────────────────────────────────────────────
function startLevel(levelId, practice = false) {
  const level = LEVELS.find(l => l.id === levelId);
  if (!level) return;

  state.currentLevel = level;
  state.practiceMode = practice;
  state.practiceCheckpoints = [];

  initAudio();

  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  resetPlayer();
  camX = 0;
  sawAngle = 0;
  speedMult = level.speed * globalSpeed;
  gameRunning = true;
  gameOver = false;
  levelComplete = false;
  paused = false;

  if (!practice) {
    state.attempt++;
    saveLocalData();
  }

  document.getElementById('hudLevelName').textContent = level.name;
  document.getElementById('hudAttempt').textContent = `Attempt #${state.attempt}`;
  document.getElementById('practiceBadge').style.display = practice ? 'block' : 'none';
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressPct').textContent = '0%';

  // Hide all overlays
  ['deathOverlay','winOverlay','pauseOverlay'].forEach(id =>
    document.getElementById(id).classList.remove('show')
  );

  showScreen('gameScreen');
  lastTime = performance.now();
  if (animId) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(gameLoop);
}

function resetPlayer() {
  player.x = 100;
  player.y = GROUND_Y() - player.size;
  player.vy = 0;
  player.rotation = 0;
  player.onGround = false;
  player.gravityDir = 1;
  player.dead = false;
  player.trail = [];
  player.particles = [];
}

function startPractice() {
  startLevel(state.currentLevel.id, true);
}

// ─── MAIN GAME LOOP ────────────────────────────────────────────
function gameLoop(timestamp) {
  if (!gameRunning) return;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  // FPS counter
  fpsCount++;
  fpsTimer += dt;
  if (fpsTimer >= 1) { fps = fpsCount; fpsCount = 0; fpsTimer = 0; }

  if (paused) {
    animId = requestAnimationFrame(gameLoop);
    return;
  }

  update(dt);
  render();

  animId = requestAnimationFrame(gameLoop);
}

// ─── UPDATE ────────────────────────────────────────────────────
function update(dt) {
  if (player.dead || levelComplete) return;

  const level = state.currentLevel;
  const PLAYER_SPEED = 380 * speedMult;
  const GND = GROUND_Y();

  // Move camera & player X
  camX += PLAYER_SPEED * dt;
  player.x = 100; // Player stays at fixed X on screen

  // Apply gravity
  player.vy += GRAVITY * player.gravityDir * dt;
  player.y += player.vy * dt;

  // Ground collision
  if (player.gravityDir === 1) {
    if (player.y + player.size >= GND) {
      player.y = GND - player.size;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // Ceiling
    if (player.y <= CEIL_Y + 20) {
      die();
      return;
    }
  } else {
    // Gravity flipped
    if (player.y <= CEIL_Y + 20) {
      player.y = CEIL_Y + 20;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    if (player.y + player.size >= GND) {
      die(); return;
    }
  }

  // Rotation
  if (!player.onGround) {
    player.rotation += 360 * dt * (player.gravityDir === 1 ? 1 : -1);
  } else {
    // Snap to nearest 90°
    player.rotation = Math.round(player.rotation / 90) * 90;
  }

  // Saw rotation
  sawAngle += 180 * dt;

  // Trail
  if (state.settings.particles) {
    player.trail.unshift({ x: player.x, y: player.y + player.size/2, age: 0 });
    if (player.trail.length > 20) player.trail.pop();
    player.trail.forEach(t => t.age += dt);
  }

  // Particles update
  player.particles = player.particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    return p.life > 0;
  });

  // Level obstacles collision
  const obstacles = level.segments;
  const GND_SCREEN = GND;
  const WORLD_X = camX; // world x at screen left edge

  for (const obs of obstacles) {
    const screenX = obs.x - WORLD_X + 0; // world → screen offset
    // Cull far away
    if (screenX > canvas.width + 100 || screenX < -200) continue;

    if (obs.type === 'block' || obs.type === 'platform') {
      const bx = screenX;
      const by = GND_SCREEN - obs.y - obs.h;
      const bw = obs.w;
      const bh = obs.h;
      if (rectOverlap(player.x+4, player.y+4, player.size-8, player.size-8,
                      bx, by, bw, bh)) {
        // Check if landing on top
        const prevBottom = player.y + player.size - player.vy * (1/60);
        if (prevBottom <= by + 5 && player.gravityDir === 1 && player.vy > 0) {
          player.y = by - player.size;
          player.vy = 0;
          player.onGround = true;
        } else if (prevBottom >= by + bh - 5 && player.gravityDir === -1 && player.vy < 0) {
          player.y = by + bh;
          player.vy = 0;
          player.onGround = true;
        } else {
          die(); return;
        }
      }
    }
    else if (obs.type === 'spike') {
      const sx = screenX, sy = GND_SCREEN - 40;
      const sw = 30, sh = 40;
      // Tighter spike hitbox
      if (rectOverlap(player.x+10, player.y+10, player.size-20, player.size-20,
                      sx+5, sy, sw-10, sh)) {
        die(); return;
      }
    }
    else if (obs.type === 'orb') {
      const ox = screenX + 20, oy = GND_SCREEN - obs.y - 20;
      const dist = Math.hypot((player.x+player.size/2)-ox, (player.y+player.size/2)-oy);
      if (dist < 35 && jumpHeld) {
        player.vy = JUMP_VEL * player.gravityDir;
        player.onGround = false;
        sfxOrb();
        spawnParticles(ox, oy, obs.color || '#ffff00', 8);
      }
    }
    else if (obs.type === 'pad') {
      const px2 = screenX, py2 = GND_SCREEN - 20;
      if (rectOverlap(player.x, player.y, player.size, player.size, px2, py2, 60, 20)) {
        player.vy = JUMP_VEL * 1.5 * player.gravityDir;
        player.onGround = false;
        sfxOrb();
      }
    }
    else if (obs.type === 'saw') {
      const sx = screenX + 20, sy = GND_SCREEN - obs.y - obs.r;
      const dist = Math.hypot((player.x+player.size/2)-sx, (player.y+player.size/2)-sy);
      if (dist < obs.r + player.size/2 - 10) {
        die(); return;
      }
    }
    else if (obs.type === 'portal_gravity') {
      const px2 = screenX, py2 = GND_SCREEN - obs.h;
      if (rectOverlap(player.x, player.y, player.size, player.size, px2, py2, 40, obs.h)) {
        player.gravityDir *= -1;
        spawnParticles(player.x+player.size/2, player.y+player.size/2, '#00d4ff', 12);
      }
    }
  }

  // Level completion check
  const levelLength = getLevelLength();
  const progress = Math.min(camX / levelLength, 1);
  const pct = Math.floor(progress * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressPct').textContent = pct + '%';

  // Update best percent
  const bestKey = state.currentLevel.id;
  if (pct > (state.bestPercent[bestKey] || 0)) {
    state.bestPercent[bestKey] = pct;
  }

  if (progress >= 1) {
    winLevel();
  }

  // Practice checkpoints
  if (state.practiceMode && player.onGround && Math.random() < 0.002) {
    state.practiceCheckpoints.push({ camX, playerY: player.y, gravityDir: player.gravityDir });
    toast('✓ Checkpoint!', 'success');
  }
}

function getLevelLength() {
  const segs = state.currentLevel.segments;
  if (!segs.length) return 6000;
  return Math.max(...segs.map(s => s.x)) + 2000;
}

function rectOverlap(ax,ay,aw,ah, bx,by,bw,bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

// ─── RENDER ────────────────────────────────────────────────────
function render() {
  const level = state.currentLevel;
  const W = canvas.width, H = canvas.height;
  const GND = GROUND_Y();

  // Clear
  ctx.clearRect(0, 0, W, H);

  // Sky background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, level.bgColor || '#001830');
  skyGrad.addColorStop(1, shadeColor(level.bgColor || '#001830', 30));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Background grid
  drawGrid();

  // Background decorations
  drawBackgroundDeco(level);

  // Ground
  drawGround(level, GND);

  // Level objects
  drawLevelObjects(level, GND);

  // Player trail
  drawTrail();

  // Player particles
  drawParticles();

  // Player
  if (!player.dead) {
    drawPlayer();
  }

  // HUD overlays
  if (state.settings.fps) {
    ctx.fillStyle = 'rgba(255,255,0,0.8)';
    ctx.font = '14px monospace';
    ctx.fillText('FPS: ' + fps, 10, H - 80);
  }
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const gridSize = 80;
  const offsetX = camX % gridSize;
  for (let x = -offsetX; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function drawBackgroundDeco(level) {
  // Parallax triangles
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = level.color || '#ffffff';
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 300 - camX * 0.3) % (canvas.width + 200)) - 100;
    const by = 50 + (i % 3) * 80;
    const size = 60 + (i%4)*30;
    ctx.beginPath();
    ctx.moveTo(bx, by + size);
    ctx.lineTo(bx + size, by + size);
    ctx.lineTo(bx + size/2, by);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGround(level, GND) {
  // Ground platform
  const groundGrad = ctx.createLinearGradient(0, GND, 0, canvas.height);
  groundGrad.addColorStop(0, level.groundColor || '#003366');
  groundGrad.addColorStop(1, '#000');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GND, canvas.width, canvas.height - GND);

  // Ground line glow
  ctx.shadowBlur = 10;
  ctx.shadowColor = level.color || '#00d4ff';
  ctx.fillStyle = level.color || '#00d4ff';
  ctx.fillRect(0, GND, canvas.width, 3);
  ctx.shadowBlur = 0;

  // Ground grid tiles
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  const tileW = 60;
  const offset = camX % tileW;
  for (let x = -offset; x < canvas.width; x += tileW) {
    ctx.beginPath();
    ctx.moveTo(x, GND);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}

function drawLevelObjects(level, GND) {
  const WORLD_X = camX;

  for (const obs of level.segments) {
    const screenX = obs.x - WORLD_X;
    if (screenX > canvas.width + 200 || screenX < -200) continue;

    ctx.save();

    if (obs.type === 'block') {
      const bx = screenX;
      const by = GND - obs.y - obs.h;
      // Block gradient
      const grad = ctx.createLinearGradient(bx, by, bx+obs.w, by+obs.h);
      grad.addColorStop(0, level.color + 'cc');
      grad.addColorStop(1, level.color + '44');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, obs.w, obs.h);
      // Block outline
      ctx.strokeStyle = level.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, obs.w, obs.h);
      // Inner pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx+4, by+4, obs.w-8, obs.h-8);
    }
    else if (obs.type === 'platform') {
      const px = screenX, py = GND - obs.y - obs.h;
      const pgrad = ctx.createLinearGradient(px, py, px, py+obs.h);
      pgrad.addColorStop(0, level.color + 'aa');
      pgrad.addColorStop(1, level.color + '22');
      ctx.fillStyle = pgrad;
      ctx.fillRect(px, py, obs.w, obs.h);
      ctx.strokeStyle = level.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, obs.w, obs.h);
    }
    else if (obs.type === 'spike') {
      const sx = screenX, sy = GND;
      ctx.fillStyle = level.color || '#ffffff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = level.color || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx+15, sy-40);
      ctx.lineTo(sx+30, sy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    else if (obs.type === 'orb') {
      const ox = screenX+20, oy = GND - obs.y - 20;
      ctx.shadowBlur = 15;
      ctx.shadowColor = obs.color || '#ffff00';
      // Outer glow ring
      ctx.strokeStyle = obs.color || '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ox, oy, 22, 0, Math.PI*2); ctx.stroke();
      // Inner circle
      const orbGrad = ctx.createRadialGradient(ox-5, oy-5, 2, ox, oy, 18);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.4, obs.color || '#ffff00');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.beginPath(); ctx.arc(ox, oy, 18, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    else if (obs.type === 'pad') {
      const px = screenX, py = GND - 20;
      ctx.fillStyle = obs.color || '#ff6600';
      ctx.shadowBlur = 10; ctx.shadowColor = obs.color || '#ff6600';
      ctx.beginPath();
      ctx.moveTo(px, py+20);
      ctx.lineTo(px+30, py+20);
      ctx.lineTo(px+15, py);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      // Arrow up
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('▲', px+10, py+15);
    }
    else if (obs.type === 'saw') {
      const sx = screenX+20, sy = GND - obs.y - obs.r;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((sawAngle * Math.PI) / 180);
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff2222';
      ctx.fillStyle = '#888';
      ctx.strokeStyle = '#ff2222';
      ctx.lineWidth = 2;
      // Draw saw blade
      const teeth = 8;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * obs.r, Math.sin(a) * obs.r);
        ctx.lineTo(Math.cos(a2) * (obs.r * 0.7), Math.sin(a2) * (obs.r * 0.7));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    else if (obs.type === 'portal_gravity') {
      const px = screenX, py = GND - obs.h;
      const t = Date.now() / 500;
      ctx.globalAlpha = 0.7 + Math.sin(t) * 0.2;
      ctx.strokeStyle = obs.color || '#00d4ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15; ctx.shadowColor = obs.color || '#00d4ff';
      ctx.strokeRect(px, py, 40, obs.h);
      // Arrows
      ctx.fillStyle = obs.color || '#00d4ff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('↕', px + 10, py + obs.h/2 + 7);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

function drawPlayer() {
  ctx.save();
  const px = player.x + player.size/2;
  const py = player.y + player.size/2;
  ctx.translate(px, py);
  ctx.rotate((player.rotation * Math.PI) / 180);

  const s = player.size;
  const col1 = state.cosmetics.primaryColor;
  const col2 = state.cosmetics.secondaryColor;
  const icon = state.cosmetics.icon;

  ctx.shadowBlur = 15;
  ctx.shadowColor = col1;

  if (icon === 'cube') {
    drawCubeShape(s, col1, col2);
  } else if (icon === 'ship') {
    drawShipShape(s, col1, col2);
  } else if (icon === 'ball') {
    drawBallShape(s, col1, col2);
  } else if (icon === 'diamond') {
    drawDiamondShape(s, col1, col2);
  } else if (icon === 'skull') {
    drawSkullShape(s, col1, col2);
  } else {
    drawCubeShape(s, col1, col2);
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawCubeShape(s, col1, col2) {
  const hs = s / 2;
  // Main body
  const grad = ctx.createLinearGradient(-hs, -hs, hs, hs);
  grad.addColorStop(0, col1);
  grad.addColorStop(1, col2);
  ctx.fillStyle = grad;
  roundRect(ctx, -hs, -hs, s, s, 4);
  ctx.fill();
  // Inner square
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, -hs+5, -hs+5, s-10, s-10, 2);
  ctx.stroke();
  // Star
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `${s*0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, 0);
}

function drawShipShape(s, col1, col2) {
  const grad = ctx.createLinearGradient(-s/2, 0, s/2, 0);
  grad.addColorStop(0, col2); grad.addColorStop(1, col1);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-s/2, s/4);
  ctx.lineTo(s/2, 0);
  ctx.lineTo(-s/2, -s/4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff88';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBallShape(s, col1, col2) {
  const grad = ctx.createRadialGradient(-s/6, -s/6, 2, 0, 0, s/2);
  grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, col1); grad.addColorStop(1, col2);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, 0, s/2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawDiamondShape(s, col1, col2) {
  const grad = ctx.createLinearGradient(0, -s/2, 0, s/2);
  grad.addColorStop(0, col1); grad.addColorStop(1, col2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -s/2);
  ctx.lineTo(s/2, 0);
  ctx.lineTo(0, s/2);
  ctx.lineTo(-s/2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff55';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSkullShape(s, col1, col2) {
  ctx.fillStyle = col1;
  ctx.beginPath(); ctx.arc(0, -s/8, s/2.2, 0, Math.PI*2); ctx.fill();
  ctx.fillRect(-s/4, 0, s/2, s/3);
  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-s/6, -s/8, s/10, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(s/6, -s/8, s/10, 0, Math.PI*2); ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawTrail() {
  if (!state.settings.particles) return;
  const trail = state.cosmetics.trail;
  const col = state.cosmetics.primaryColor;

  player.trail.forEach((t, i) => {
    const alpha = 1 - (t.age * 4);
    if (alpha <= 0) return;
    const size = player.size * 0.5 * (1 - t.age * 3);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (trail === 'classic') {
      ctx.fillStyle = col;
      ctx.fillRect(t.x, t.y - size/2, size, size);
    } else if (trail === 'fire') {
      const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size);
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.3, '#ff8800'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(t.x, t.y, size, 0, Math.PI*2); ctx.fill();
    } else if (trail === 'ice') {
      const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size);
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, '#00aaff'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(t.x, t.y, size, 0, Math.PI*2); ctx.fill();
    } else if (trail === 'rainbow') {
      const hue = (t.age * 720) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, 1)`;
      ctx.beginPath(); ctx.arc(t.x, t.y, size*0.8, 0, Math.PI*2); ctx.fill();
    } else if (trail === 'electric') {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8; ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + (Math.random()-0.5)*20, t.y + (Math.random()-0.5)*20);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (trail === 'star') {
      ctx.fillStyle = '#ffd700';
      ctx.font = `${size}px sans-serif`;
      ctx.fillText('★', t.x, t.y);
    } else if (trail === 'vortex') {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * (1 - t.age * 2));
      ctx.stroke();
    } else if (trail === 'shadow') {
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.arc(t.x, t.y, size, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = col;
      ctx.fillRect(t.x, t.y - size/2, size, size);
    }
    ctx.restore();
  });
}

function drawParticles() {
  player.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}

function spawnParticles(x, y, color, count = 10) {
  if (!state.settings.particles) return;
  for (let i = 0; i < count; i++) {
    player.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      color,
      size: 6 + Math.random() * 6,
      life: 1
    });
  }
}

// ─── INPUT ─────────────────────────────────────────────────────
let jumpHeld = false;

function handleJump() {
  if (!gameRunning || player.dead || levelComplete) return;
  if (paused) { resumeGame(); return; }
  if (player.onGround) {
    player.vy = JUMP_VEL * player.gravityDir;
    player.onGround = false;
    sfxJump();
    spawnParticles(player.x+player.size/2, player.y+player.size, state.cosmetics.primaryColor, 6);
  } else if (state.currentLevel.difficulty === 'auto') {
    // Auto level - just for show
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    jumpHeld = true;
    if (!gameRunning) return;
    handleJump();
  }
  if (e.code === 'Escape') {
    if (gameRunning && !gameOver && !levelComplete) {
      paused ? resumeGame() : pauseGame();
    }
  }
  if (e.code === 'KeyR' && gameRunning) restartLevel();
});

document.addEventListener('keyup', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') jumpHeld = false;
});

document.getElementById('gameScreen').addEventListener('click', () => {
  handleJump();
  jumpHeld = true;
  setTimeout(() => jumpHeld = false, 100);
});

document.addEventListener('touchstart', e => {
  if (document.getElementById('gameScreen').classList.contains('active')) {
    e.preventDefault();
    jumpHeld = true;
    handleJump();
  }
});

document.addEventListener('touchend', () => { jumpHeld = false; });

window.addEventListener('resize', () => {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// ─── DEATH / WIN ───────────────────────────────────────────────
function die() {
  if (player.dead) return;
  player.dead = true;
  gameOver = true;
  state.totalDeaths++;
  sfxDie();

  // Screen flash
  if (state.settings.flash) {
    document.getElementById('gameScreen').style.background = '#ff000040';
    setTimeout(() => { document.getElementById('gameScreen').style.background = '#000'; }, 200);
  }

  // Death particles
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    player.particles.push({
      x: player.x + player.size/2,
      y: player.y + player.size/2,
      vx: Math.cos(angle) * (100 + Math.random()*200),
      vy: Math.sin(angle) * (100 + Math.random()*200),
      color: state.cosmetics.primaryColor,
      size: 8 + Math.random()*8,
      life: 1
    });
  }

  const best = state.bestPercent[state.currentLevel.id] || 0;
  document.getElementById('deathStats').textContent =
    `Best: ${best}% | Attempts: ${state.attempt} | Deaths: ${state.totalDeaths}`;

  setTimeout(() => {
    gameRunning = false;
    document.getElementById('deathOverlay').classList.add('show');
  }, 600);
}

async function winLevel() {
  if (levelComplete) return;
  levelComplete = true;
  sfxWin();

  const level = state.currentLevel;

  // Award rewards
  const coinsEarned = level.stars * 10 + 50;
  state.coins += coinsEarned;
  state.stars += level.stars;
  state.bestPercent[level.id] = 100;

  if (!state.completedLevels.includes(level.id)) {
    state.completedLevels.push(level.id);
    // Achievement check
    if (level.difficulty === 'demon') {
      showAchievement('💀 Demon Slayer', '💀');
    } else if (state.completedLevels.length === 1) {
      showAchievement('First Victory!', '🌟');
    } else if (state.completedLevels.length >= 5) {
      showAchievement('Level Master!', '🏆');
    }
  }

  saveLocalData();

  // Try sync to backend
  try {
    await apiPost('/game/complete', { levelId: level.id, stars: level.stars, coins: coinsEarned });
  } catch(e) {}

  const nextLev = LEVELS.find(l => l.id === level.id + 1);
  document.getElementById('nextLevelBtn').style.display = nextLev ? 'block' : 'none';

  document.getElementById('winStats').innerHTML =
    `<strong style="color:var(--gd-yellow)">+${coinsEarned} 🪙 COINS</strong><br>` +
    `<strong style="color:var(--gd-yellow)">+${level.stars} ⭐ STARS</strong><br>` +
    `Total Stars: ${state.stars} | Coins: ${state.coins}`;

  setTimeout(() => {
    gameRunning = false;
    document.getElementById('winOverlay').classList.add('show');
  }, 500);
}

function restartLevel() {
  if (!state.currentLevel) return;
  startLevel(state.currentLevel.id, state.practiceMode);
}

function nextLevel() {
  const nextId = state.currentLevel.id + 1;
  const next = LEVELS.find(l => l.id === nextId);
  if (next) startLevel(next.id);
  else showLevelSelect();
}

function pauseGame() {
  paused = true;
  document.getElementById('pauseOverlay').classList.add('show');
}

function resumeGame() {
  paused = false;
  document.getElementById('pauseOverlay').classList.remove('show');
  lastTime = performance.now();
}

// ─── COSMETICS ─────────────────────────────────────────────────
function initCosmetics() {
  // Primary Colors
  const prim = document.getElementById('primaryColors');
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (state.cosmetics.primaryColor === c ? ' selected' : '');
    sw.style.background = c;
    sw.title = c;
    sw.onclick = () => {
      document.querySelectorAll('#primaryColors .color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      state.cosmetics.primaryColor = c;
      updatePreview();
    };
    prim.appendChild(sw);
  });

  // Secondary Colors
  const sec = document.getElementById('secondaryColors');
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (state.cosmetics.secondaryColor === c ? ' selected' : '');
    sw.style.background = c;
    sw.onclick = () => {
      document.querySelectorAll('#secondaryColors .color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      state.cosmetics.secondaryColor = c;
      updatePreview();
    };
    sec.appendChild(sw);
  });

  // Trails
  const trailEl = document.getElementById('trailOptions');
  TRAILS.forEach(t => {
    const el = document.createElement('div');
    const owned = t.cost === 0 || state.coins >= t.cost || state.completedLevels.length * 10 > t.cost;
    el.className = 'trail-item' + (state.cosmetics.trail === t.id ? ' selected' : '') + (!owned ? ' locked-item' : '');
    el.innerHTML = `<span class="item-emoji">${t.emoji}</span>${t.label}<br><span style="color:var(--gd-yellow);font-size:0.6rem">${t.cost === 0 ? 'FREE' : `${t.cost}🪙`}</span>`;
    el.onclick = () => {
      if (!owned) { toast(`Need ${t.cost} coins!`, 'error'); return; }
      document.querySelectorAll('.trail-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      state.cosmetics.trail = t.id;
    };
    trailEl.appendChild(el);
  });

  // Icons
  const iconEl = document.getElementById('iconOptions');
  ICONS.forEach(ic => {
    const el = document.createElement('div');
    const owned = ic.cost === 0 || state.coins >= ic.cost;
    el.className = 'icon-item' + (state.cosmetics.icon === ic.id ? ' selected' : '') + (!owned ? ' locked-item' : '');
    el.innerHTML = `<span class="item-emoji">${ic.emoji}</span>${ic.label}<br><span style="color:var(--gd-yellow);font-size:0.6rem">${ic.cost === 0 ? 'FREE' : `${ic.cost}🪙`}</span>`;
    el.onclick = () => {
      if (!owned) { toast(`Need ${ic.cost} coins to unlock!`, 'error'); return; }
      document.querySelectorAll('.icon-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      state.cosmetics.icon = ic.id;
      updatePreview();
    };
    iconEl.appendChild(el);
  });

  document.getElementById('coinDisplay').textContent = state.coins;
  updatePreview();
}

function updatePreview() {
  const pc = document.getElementById('playerPreviewCanvas');
  const pctx = pc.getContext('2d');
  pctx.clearRect(0, 0, pc.width, pc.height);

  // Background
  pctx.fillStyle = '#111';
  pctx.fillRect(0, 0, pc.width, pc.height);

  // Draw preview player
  const px = pc.width/2, py = pc.height/2;
  const s = 50;
  pctx.save();
  pctx.translate(px, py);
  pctx.shadowBlur = 15;
  pctx.shadowColor = state.cosmetics.primaryColor;
  drawCubeShape.call({}, s, state.cosmetics.primaryColor, state.cosmetics.secondaryColor);
  pctx.restore();

  function drawCubeShape(s, c1, c2) {
    const hs = s/2;
    const grad = pctx.createLinearGradient(-hs,-hs,hs,hs);
    grad.addColorStop(0, c1); grad.addColorStop(1, c2);
    pctx.fillStyle = grad;
    pctx.fillRect(-hs,-hs,s,s);
    pctx.strokeStyle = '#ffffff44';
    pctx.lineWidth = 1.5;
    pctx.strokeRect(-hs+4,-hs+4,s-8,s-8);
    pctx.fillStyle = 'rgba(255,255,255,0.9)';
    pctx.font = `${s*0.4}px sans-serif`;
    pctx.textAlign = 'center'; pctx.textBaseline = 'middle';
    pctx.fillText('★', 0, 0);
  }

  // Trail preview
  const trailColors = {
    classic: state.cosmetics.primaryColor,
    fire: '#ff8800', ice: '#00aaff', rainbow: '#ff00ff',
    electric: '#00ffff', shadow: '#333333', star: '#ffd700',
    vortex: state.cosmetics.primaryColor, heart: '#ff69b4'
  };
  const tc = trailColors[state.cosmetics.trail] || '#ffffff';
  for (let i = 1; i <= 6; i++) {
    pctx.globalAlpha = 0.8 - i*0.1;
    pctx.fillStyle = tc;
    pctx.fillRect(px - i*20 - 5, py - 8, 16 - i, 16 - i);
  }
  pctx.globalAlpha = 1;
}

function saveCosmetics() {
  saveLocalData();
  document.getElementById('coinDisplay').textContent = state.coins;
  toast('✨ Cosmetics saved!', 'success');
  try { apiPost('/user/cosmetics', state.cosmetics); } catch(e) {}
}

// ─── PROFILE ───────────────────────────────────────────────────
function loadProfile() {
  const username = state.user?.username || 'GeoPlayer';
  document.getElementById('profileName').textContent = username;
  document.getElementById('profileJoin').textContent = 'Playing since today';

  // Tags
  const tags = document.getElementById('profileTags');
  tags.innerHTML = '';
  const userRole = state.user?.role || 'player';
  if (userRole !== 'player') {
    const tag = document.createElement('span');
    tag.className = `lb-tag tag-${userRole}`;
    tag.textContent = userRole.toUpperCase();
    tags.appendChild(tag);
  }

  // Avatar
  document.getElementById('profileAvatar').textContent =
    ICONS.find(i => i.id === state.cosmetics.icon)?.emoji || '⬛';

  // Stats
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-value" style="color:var(--gd-yellow)">${state.stars}</div><div class="stat-label">STARS</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--gd-yellow)">${state.coins}</div><div class="stat-label">COINS</div></div>
    <div class="stat-card"><div class="stat-value">${state.completedLevels.length}</div><div class="stat-label">LEVELS BEAT</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--gd-red)">${state.totalDeaths}</div><div class="stat-label">DEATHS</div></div>
    <div class="stat-card"><div class="stat-value">${state.attempt}</div><div class="stat-label">ATTEMPTS</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--gd-green)">${Math.max(...Object.values(state.bestPercent||{0:0})).toFixed(0)}%</div><div class="stat-label">BEST RUN</div></div>
  `;

  // Completed levels
  const list = document.getElementById('completedLevelsList');
  list.innerHTML = '';
  state.completedLevels.forEach(id => {
    const lev = LEVELS.find(l => l.id === id);
    if (!lev) return;
    const el = document.createElement('div');
    el.style.cssText = `display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.85rem;`;
    el.innerHTML = `<span style="color:${lev.color}">${lev.name}</span><span style="color:var(--gd-yellow)">+${lev.stars}⭐</span>`;
    list.appendChild(el);
  });
  if (!state.completedLevels.length) {
    list.innerHTML = '<div style="color:rgba(255,255,255,0.3);text-align:center;padding:1rem;">No levels completed yet. Start playing!</div>';
  }
}

// ─── LEADERBOARD ──────────────────────────────────────────────
async function loadLeaderboard() {
  const tbody = document.getElementById('lbBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:2rem">Loading...</td></tr>';

  try {
    const data = await apiFetch('/leaderboard');
    renderLeaderboard(data.players);
  } catch(e) {
    // Demo data
    renderLeaderboard(getDemoLeaderboard());
  }
}

function getDemoLeaderboard() {
  return [
    { username: 'GeoMaster_X', role: 'owner', score: 99999, stars: 350, levels: 23 },
    { username: 'ZeroGravity', role: 'admin', score: 85000, stars: 290, levels: 20 },
    { username: 'NightStar99', role: 'vip', score: 72000, stars: 250, levels: 18 },
    { username: 'CubeWarrior', role: 'player', score: 65000, stars: 220, levels: 16 },
    { username: 'DemonSlayer', role: 'mod', score: 58000, stars: 200, levels: 15 },
    { username: 'BlastMaster', role: 'player', score: 45000, stars: 170, levels: 12 },
    { username: 'GeoDash_Pro', role: 'player', score: 38000, stars: 140, levels: 10 },
    { username: 'JumpKing2000', role: 'player', score: 30000, stars: 110, levels: 8 },
    { username: state.user?.username || 'You', role: state.user?.role || 'player', score: state.stars * 100 + state.coins, stars: state.stars, levels: state.completedLevels.length },
  ].sort((a,b) => b.score - a.score);
}

function renderLeaderboard(players) {
  const tbody = document.getElementById('lbBody');
  tbody.innerHTML = '';
  players.slice(0, 20).forEach((p, i) => {
    const rank = i + 1;
    const rankClass = rank <= 3 ? `lb-rank-${rank}` : '';
    const tagHtml = p.role && p.role !== 'player'
      ? `<span class="lb-tag tag-${p.role}">${p.role.toUpperCase()}</span>` : '';
    const rankEmoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="lb-rank ${rankClass}">${rankEmoji}</td>
      <td class="lb-name">${p.username}${tagHtml}</td>
      <td class="lb-score">${p.score?.toLocaleString()}</td>
      <td class="lb-stars">${p.stars}⭐</td>
      <td>${p.levels}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── SETTINGS ─────────────────────────────────────────────────
function applySettings() {
  document.getElementById('playerNameInput').value = state.user?.username || '';
  ['sfx','particles','fps','flash'].forEach(key => {
    const el = document.getElementById('toggle' + key.charAt(0).toUpperCase() + key.slice(1));
    if (el) el.className = 'toggle' + (state.settings[key] ? ' on' : '');
  });
}

function toggleSetting(key, btn) {
  state.settings[key] = !state.settings[key];
  btn.className = 'toggle' + (state.settings[key] ? ' on' : '');
  sfxClick();
}

function saveSettings() {
  const name = document.getElementById('playerNameInput').value.trim();
  if (name && state.user) state.user.username = name;
  saveLocalData();
  toast('⚙ Settings saved!', 'success');
}

function resetProgress() {
  if (!confirm('Really reset ALL progress? This cannot be undone!')) return;
  localStorage.removeItem('geoblast_save');
  state.coins = 0; state.stars = 0;
  state.completedLevels = [];
  state.bestPercent = {};
  state.attempt = 0;
  state.totalDeaths = 0;
  toast('Progress reset.', 'info');
}

// ─── OWNER DASHBOARD ──────────────────────────────────────────
let ownerLogEntries = [];

function ownerLog(msg, type = '') {
  const log = document.getElementById('ownerLog');
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
  ownerLogEntries.push({ msg, type, time: Date.now() });
}

function clearOwnerLog() {
  document.getElementById('ownerLog').innerHTML = '';
}

async function loadOwnerDash() {
  ownerLog('Loading dashboard...', 'info');
  try {
    const data = await apiFetch('/owner/stats');
    document.getElementById('ownerOnline').textContent = data.online;
    document.getElementById('ownerTotal').textContent = data.totalPlayers;
    document.getElementById('ownerGames').textContent = data.gamesToday;
    document.getElementById('ownerStars').textContent = data.totalStars;
    document.getElementById('ownerCoins').textContent = data.totalCoins;
    renderOnlineUsers(data.onlinePlayers || []);
    ownerLog('Stats loaded successfully', 'info');
  } catch(e) {
    // Demo
    document.getElementById('ownerOnline').textContent = Math.floor(Math.random()*50)+5;
    document.getElementById('ownerTotal').textContent = Math.floor(Math.random()*1000)+200;
    document.getElementById('ownerGames').textContent = Math.floor(Math.random()*500)+50;
    document.getElementById('ownerStars').textContent = Math.floor(Math.random()*50000)+5000;
    document.getElementById('ownerCoins').textContent = Math.floor(Math.random()*200000)+20000;
    renderOnlineUsers(getDemoOnlineUsers());
    ownerLog('Using demo data (backend offline)', 'warn');
  }
}

function getDemoOnlineUsers() {
  return [
    { username: 'ZeroGravity', role: 'admin', score: 85000 },
    { username: 'NightStar99', role: 'vip', score: 72000 },
    { username: 'CubeWarrior', role: 'player', score: 65000 },
    { username: 'BlastMaster', role: 'player', score: 45000 },
  ];
}

function renderOnlineUsers(users) {
  const list = document.getElementById('onlineUsersList');
  list.innerHTML = '';
  users.forEach(u => {
    const row = document.createElement('div');
    row.className = 'user-row';
    const tagHtml = u.role && u.role !== 'player'
      ? `<span class="lb-tag tag-${u.role}" style="font-size:0.55rem">${u.role.toUpperCase()}</span>` : '';
    row.innerHTML = `
      <div class="user-row-name">${u.username}${tagHtml}</div>
      <div class="user-row-actions">
        <button class="mini-btn mini-btn-coins" onclick="ownerQuickCoins('${u.username}')">🪙</button>
        <button class="mini-btn mini-btn-promote" onclick="ownerQuickPromote('${u.username}')">↑</button>
        <button class="mini-btn mini-btn-ban" onclick="ownerQuickBan('${u.username}')">🚫</button>
      </div>
    `;
    list.appendChild(row);
  });
  if (!users.length) {
    list.innerHTML = '<div style="color:rgba(255,255,255,0.3);padding:1rem;text-align:center;">No players online</div>';
  }
}

async function ownerBroadcast() {
  const msg = document.getElementById('broadcastMsg').value.trim();
  if (!msg) { toast('Enter a message!', 'error'); return; }
  try {
    await apiPost('/owner/broadcast', { message: msg, type: 'announce' });
    ownerLog(`Broadcast sent: "${msg}"`, 'info');
    toast('📣 Broadcast sent!', 'success');
  } catch(e) {
    toast(`📣 [Demo] Broadcast: "${msg}"`, 'gold');
    ownerLog(`[Demo] Broadcast: "${msg}"`, 'info');
  }
}

async function ownerAlert() {
  const msg = document.getElementById('broadcastMsg').value.trim() || 'EMERGENCY ALERT FROM OWNER';
  try {
    await apiPost('/owner/broadcast', { message: msg, type: 'emergency' });
  } catch(e) {}
  toast(`🚨 EMERGENCY ALERT SENT`, 'error');
  ownerLog(`Emergency alert: "${msg}"`, 'err');
}

async function ownerGiveCoins() {
  const user = document.getElementById('targetUser').value.trim();
  if (!user) { toast('Enter a username!', 'error'); return; }
  try {
    await apiPost('/owner/coins', { username: user, amount: 1000 });
    ownerLog(`+1000 coins → ${user}`, 'info');
    toast(`🪙 +1000 coins given to ${user}!`, 'gold');
  } catch(e) {
    toast(`🪙 [Demo] +1000 coins → ${user}`, 'gold');
    ownerLog(`[Demo] Gave 1000 coins to ${user}`, 'info');
  }
}

async function ownerBan() {
  const user = document.getElementById('targetUser').value.trim();
  if (!user) { toast('Enter username!', 'error'); return; }
  if (!confirm(`Really ban ${user}?`)) return;
  try {
    await apiPost('/owner/ban', { username: user });
    ownerLog(`BANNED: ${user}`, 'err');
    toast(`🚫 ${user} has been banned!`, 'error');
  } catch(e) {
    toast(`🚫 [Demo] Banned: ${user}`, 'error');
    ownerLog(`[Demo] Banned ${user}`, 'err');
  }
}

async function ownerSetTag() {
  const user = document.getElementById('targetUser').value.trim();
  const tag = prompt('Tag (owner/admin/mod/vip/legend/bot or empty to remove):');
  if (!user) { toast('Enter username!', 'error'); return; }
  try {
    await apiPost('/owner/tag', { username: user, tag });
    ownerLog(`Tag "${tag}" set on ${user}`, 'info');
    toast(`🏷 Tag set on ${user}!`, 'success');
  } catch(e) {
    toast(`🏷 [Demo] Tag "${tag}" → ${user}`, 'info');
    ownerLog(`[Demo] Set tag "${tag}" on ${user}`, 'info');
  }
}

async function ownerApplyTag() {
  const user = document.getElementById('tagTargetUser').value.trim();
  const tag = document.getElementById('tagSelect').value;
  if (!user) { toast('Enter username!', 'error'); return; }
  try {
    await apiPost('/owner/tag', { username: user, tag });
    ownerLog(`Tag "${tag}" applied to ${user}`, 'info');
    toast(`🏷 Tag applied to ${user}!`, 'success');
  } catch(e) {
    toast(`🏷 [Demo] Applied "${tag}" to ${user}`, 'info');
    ownerLog(`[Demo] Applied tag "${tag}" to ${user}`, 'info');
  }
}

async function ownerUnlock() {
  const user = document.getElementById('targetUser').value.trim();
  if (!user) { toast('Enter username!', 'error'); return; }
  try {
    await apiPost('/owner/unlock', { username: user });
    ownerLog(`All levels unlocked for ${user}`, 'info');
    toast(`🔓 All levels unlocked for ${user}!`, 'success');
  } catch(e) {
    toast(`🔓 [Demo] Unlocked all for ${user}`, 'success');
    ownerLog(`[Demo] Unlocked levels for ${user}`, 'info');
  }
}

async function ownerSetSpeed() {
  const speed = parseFloat(document.getElementById('levelSpeedInput').value);
  if (isNaN(speed) || speed < 0.1 || speed > 5) { toast('Speed must be 0.1-5.0', 'error'); return; }
  globalSpeed = speed;
  try {
    await apiPost('/owner/speed', { speed });
    ownerLog(`Global speed set to ${speed}x`, 'info');
  } catch(e) {}
  toast(`⚡ Speed set to ${speed}x!`, 'gold');
  ownerLog(`Speed changed to ${speed}x`, 'info');
}

async function ownerAddStars() {
  if (!state.user) return;
  state.stars += 999;
  state.coins += 9999;
  saveLocalData();
  toast(`⭐ +999 Stars & +9999 Coins!`, 'gold');
  ownerLog('Owner gave self 999 stars', 'warn');
}

async function ownerResetAll() {
  if (!confirm('RESET ALL PLAYER PROGRESS? CANNOT BE UNDONE!')) return;
  try {
    await apiPost('/owner/reset-all', {});
    ownerLog('ALL PROGRESS RESET', 'err');
    toast('💀 All progress has been reset!', 'error');
  } catch(e) {
    ownerLog('[Demo] Reset all (demo only)', 'err');
    toast('💀 [Demo] Reset all!', 'error');
  }
}

function ownerQuickCoins(username) {
  ownerLog(`+500 coins → ${username}`, 'info');
  toast(`🪙 +500 coins → ${username}`, 'gold');
}
function ownerQuickPromote(username) {
  ownerLog(`Promoted ${username} to VIP`, 'info');
  toast(`⬆ Promoted ${username}!`, 'success');
}
function ownerQuickBan(username) {
  if (!confirm(`Ban ${username}?`)) return;
  ownerLog(`BANNED: ${username}`, 'err');
  toast(`🚫 Banned ${username}!`, 'error');
}

// ─── API HELPERS ───────────────────────────────────────────────
async function apiFetch(path) {
  if (OFFLINE_MODE || !API) throw new Error('Offline mode');
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const res = await fetch(API + path, { headers });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function apiPost(path, body) {
  if (OFFLINE_MODE || !API) throw new Error('Offline mode');
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const res = await fetch(API + path, {
    method: 'POST', headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

// ─── TOAST ─────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration + 300);
}

// ─── ACHIEVEMENT ───────────────────────────────────────────────
function showAchievement(name, icon = '🏆') {
  const popup = document.getElementById('achievementPopup');
  document.getElementById('achIcon').textContent = icon;
  document.getElementById('achName').textContent = name;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 4000);
}

// ─── MENU PARTICLES ────────────────────────────────────────────
function startMenuParticles() {
  const container = document.getElementById('menuParticles');
  container.innerHTML = '';
  const colors = [
    'var(--gd-orange)', 'var(--gd-yellow)', 'var(--gd-blue)',
    'var(--gd-green)', 'var(--gd-purple)', 'var(--gd-pink)'
  ];
  const shapes = ['■', '▲', '●', '★', '◆'];

  function spawnParticle() {
    const el = document.createElement('div');
    const size = 8 + Math.random() * 16;
    const x = Math.random() * 100;
    const dx = (Math.random() - 0.5) * 200;
    const dy = -(200 + Math.random() * 400);
    const duration = 3 + Math.random() * 4;
    const col = colors[Math.floor(Math.random() * colors.length)];
    el.style.cssText = `
      position:absolute; bottom:0; left:${x}%; color:${col};
      font-size:${size}px; pointer-events:none;
      --dx:${dx}px; --dy:${dy}px;
      animation: particleFloat ${duration}s linear forwards;
    `;
    el.textContent = shapes[Math.floor(Math.random()*shapes.length)];
    container.appendChild(el);
    setTimeout(() => el.remove(), duration * 1000);
  }

  const interval = setInterval(() => {
    if (!document.getElementById('mainMenu').classList.contains('active')) {
      clearInterval(interval);
      return;
    }
    spawnParticle();
  }, 400);
  for (let i = 0; i < 8; i++) setTimeout(spawnParticle, i * 200);
}

// ─── UTIL ──────────────────────────────────────────────────────
function shadeColor(color, amount) {
  // Simple color brightening
  return color;
}

// ─── LOADING SCREEN ────────────────────────────────────────────
const tips = [
  "Tip: Space or click to jump!",
  "Tip: Hit yellow orbs while jumping!",
  "Tip: Orange pads give a boost!",
  "Tip: Blue portals flip gravity!",
  "Tip: Practice mode lets you checkpoint!",
  "Tip: Earn coins to unlock cosmetics!",
  "Tip: Complete levels to unlock more!",
  "Tip: Saw blades are always spinning... avoid them!",
  "Tip: Some levels have portals that change your speed!"
];

function runLoading() {
  const bar = document.getElementById('loadingBar');
  const tip = document.getElementById('loadingTip');
  let pct = 0;
  tip.textContent = tips[Math.floor(Math.random() * tips.length)];

  const iv = setInterval(() => {
    pct += Math.random() * 15 + 5;
    if (pct >= 100) {
      pct = 100;
      bar.style.width = '100%';
      clearInterval(iv);
      setTimeout(() => {
        // Check if returning player
        loadLocalData();
        if (localStorage.getItem('geoblast_save')) {
          // Auto-restore guest session
          guestLogin();
        } else {
          showScreen('loginScreen');
        }
      }, 400);
    }
    bar.style.width = Math.min(pct, 100) + '%';
  }, 120);
}

// ─── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  runLoading();

  // Cosmetics panel
  document.getElementById('cosmeticsScreen').addEventListener('click', () => {
    // rebuild on first open
  });

  const cosmeticsScreen = document.getElementById('cosmeticsScreen');
  const origShow = cosmeticsScreen.style.display;
  new MutationObserver(() => {
    if (cosmeticsScreen.classList.contains('active')) {
      cosmeticsScreen.querySelector('#primaryColors') &&
      cosmeticsScreen.querySelector('#primaryColors').children.length === 0 &&
      initCosmetics();
    }
  }).observe(cosmeticsScreen, { attributes: true });

  // Actually init cosmetics when screen opens
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (document.getElementById('cosmeticsScreen').classList.contains('active')) {
        if (!document.getElementById('primaryColors').children.length) {
          initCosmetics();
        }
      }
    });
  });
});

// Ensure cosmetics init when navigating there
const origShowScreen = showScreen;
window.showScreen = function(id) {
  origShowScreen(id);
  if (id === 'cosmeticsScreen') {
    setTimeout(() => {
      if (!document.getElementById('primaryColors').children.length) {
        initCosmetics();
      }
      document.getElementById('coinDisplay').textContent = state.coins;
    }, 50);
  }
};

// Online count simulation
setInterval(() => {
  const el = document.getElementById('onlineCount');
  if (el) {
    const base = 5 + Math.floor(Math.random() * 30);
    el.textContent = base;
  }
}, 8000);
