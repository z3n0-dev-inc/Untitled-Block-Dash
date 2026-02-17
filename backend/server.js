// ═══════════════════════════════════════════════════════════════
//  GeoBlast Backend — Node.js + Express + SQLite
//  Full API: Auth, Leaderboard, Owner Dashboard, Real-time
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ─── CONFIG ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'geoblast_super_secret_key_change_in_production_456';
const OWNER_KEY = process.env.OWNER_KEY || 'GEOBLAST_OWNER_2024';
const DB_PATH = process.env.DB_PATH || './geoblast.db';

// ─── DATABASE SETUP ────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT,
    email TEXT,
    role TEXT DEFAULT 'player',
    tag TEXT DEFAULT '',
    coins INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT,
    cosmetics TEXT DEFAULT '{}',
    completed_levels TEXT DEFAULT '[]',
    best_percent TEXT DEFAULT '{}',
    last_seen INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    score INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS level_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    level_id INTEGER NOT NULL,
    stars_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    completed_at INTEGER DEFAULT (strftime('%s','now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'announce',
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT NOT NULL,
    target_user TEXT,
    details TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    ip TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_score ON users(score DESC);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_completions_user ON level_completions(user_id);
`);

// Create default owner if none exists
const ownerExists = db.prepare("SELECT id FROM users WHERE role = 'owner' LIMIT 1").get();
if (!ownerExists) {
  const hash = bcrypt.hashSync('owner123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, role, tag, coins, stars, score)
    VALUES ('GeoOwner', ?, 'owner', 'owner', 99999, 9999, 9999999)
  `).run(hash);
  console.log('✅ Default owner created: GeoOwner / owner123');
}

// ─── MIDDLEWARE ────────────────────────────────────────────────
// Allow GitHub Pages, localhost, and any custom domain
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  // GitHub Pages URL — update YOURUSERNAME below after deploying
  /^https:\/\/[\w-]+\.github\.io$/,
  /^https:\/\/[\w-]+\.up\.railway\.app$/,
  // Add your custom domain here if you have one:
  // 'https://mygeoblast.com'
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    cb(allowed ? null : new Error('CORS blocked'), allowed);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting
const limiter = rateLimit({ windowMs: 15*60*1000, max: 300, message: { error: 'Too many requests' } });
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { error: 'Too many auth attempts' } });
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────
function authenticate(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_banned = 0').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found or banned' });
    req.user = user;
    // Update last seen
    db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), user.id);
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') return res.status(403).json({ error: 'Owner only!' });
  next();
}

function requireAdmin(req, res, next) {
  if (!['owner','admin'].includes(req.user?.role)) return res.status(403).json({ error: 'Admin+ only!' });
  next();
}

function requireMod(req, res, next) {
  if (!['owner','admin','mod'].includes(req.user?.role)) return res.status(403).json({ error: 'Mod+ only!' });
  next();
}

// ─── WEBSOCKET (Real-time) ─────────────────────────────────────
const connectedClients = new Map(); // userId → ws

wss.on('connection', (ws, req) => {
  let userId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'auth') {
        try {
          const decoded = jwt.verify(msg.token, JWT_SECRET);
          userId = decoded.id;
          connectedClients.set(userId, ws);
          const user = db.prepare('SELECT username, role FROM users WHERE id = ?').get(userId);
          ws.send(JSON.stringify({ type: 'auth_ok', username: user?.username }));
          console.log(`WS: ${user?.username} connected`);
        } catch(e) {
          ws.send(JSON.stringify({ type: 'auth_error' }));
        }
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
      }

    } catch(e) {}
  });

  ws.on('close', () => {
    if (userId) connectedClients.delete(userId);
  });
});

function broadcast(data, filterFn = null) {
  const msg = JSON.stringify(data);
  connectedClients.forEach((ws, uid) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (!filterFn || filterFn(uid)) ws.send(msg);
    }
  });
}

// ─── AUTH ROUTES ───────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { username, password, email, ownerKey } = req.body;
  if (!username || username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 chars' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password too short (min 6 chars)' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username: letters, numbers, underscore only' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username taken!' });

  const hash = bcrypt.hashSync(password, 10);
  const role = ownerKey === OWNER_KEY ? 'owner' : 'player';

  try {
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, email, role, coins, stars, score)
      VALUES (?, ?, ?, ?, 100, 0, 0)
    `).run(username, hash, email || null, role);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    logAdmin(null, 'register', username, `Role: ${role}`);
    res.json({ user: sanitizeUser(user), token });
  } catch(e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  if (user.is_banned) return res.status(403).json({ error: `Banned: ${user.ban_reason || 'Violation'}` });

  if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), user.id);
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  logAdmin(null, 'login', username, 'Login successful');
  res.json({ user: sanitizeUser(user), token });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

// ─── GAME ROUTES ───────────────────────────────────────────────
app.post('/api/game/complete', authenticate, (req, res) => {
  const { levelId, stars, coins } = req.body;
  if (!levelId) return res.status(400).json({ error: 'Missing levelId' });

  const user = req.user;

  // Add completion record
  const existing = db.prepare(
    'SELECT id FROM level_completions WHERE user_id = ? AND level_id = ?'
  ).get(user.id, levelId);

  if (!existing) {
    db.prepare(`
      INSERT INTO level_completions (user_id, level_id, stars_earned, coins_earned)
      VALUES (?, ?, ?, ?)
    `).run(user.id, levelId, stars || 0, coins || 0);
  }

  // Update user stats
  const completedLevels = JSON.parse(user.completed_levels || '[]');
  if (!completedLevels.includes(levelId)) completedLevels.push(levelId);

  const newCoins = user.coins + (coins || 0);
  const newStars = user.stars + (stars || 0);
  const newScore = newStars * 100 + newCoins;

  db.prepare(`
    UPDATE users SET
      coins = ?, stars = ?, score = ?,
      completed_levels = ?, last_seen = ?
    WHERE id = ?
  `).run(newCoins, newStars, newScore, JSON.stringify(completedLevels), Date.now(), user.id);

  // Broadcast achievement
  broadcast({
    type: 'player_complete',
    username: user.username,
    levelId,
    message: `${user.username} completed level ${levelId}!`
  });

  res.json({ success: true, newCoins, newStars });
});

app.post('/api/game/death', authenticate, (req, res) => {
  const user = req.user;
  db.prepare('UPDATE users SET total_deaths = total_deaths + 1, total_attempts = total_attempts + 1 WHERE id = ?').run(user.id);
  res.json({ success: true });
});

app.post('/api/game/best', authenticate, (req, res) => {
  const { levelId, percent } = req.body;
  const user = req.user;
  const best = JSON.parse(user.best_percent || '{}');
  if ((best[levelId] || 0) < percent) {
    best[levelId] = percent;
    db.prepare('UPDATE users SET best_percent = ? WHERE id = ?').run(JSON.stringify(best), user.id);
  }
  res.json({ success: true });
});

// ─── LEADERBOARD ──────────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const players = db.prepare(`
    SELECT username, role, tag, score, stars, coins,
           (SELECT COUNT(*) FROM level_completions lc WHERE lc.user_id = users.id) as levels
    FROM users
    WHERE is_banned = 0
    ORDER BY score DESC
    LIMIT ?
  `).all(limit);
  res.json({ players });
});

app.get('/api/leaderboard/level/:id', (req, res) => {
  const levelId = parseInt(req.params.id);
  const players = db.prepare(`
    SELECT u.username, u.role, u.tag, lc.stars_earned, lc.completed_at
    FROM level_completions lc
    JOIN users u ON u.id = lc.user_id
    WHERE lc.level_id = ? AND u.is_banned = 0
    ORDER BY lc.completed_at ASC
    LIMIT 50
  `).all(levelId);
  res.json({ players });
});

// ─── USER ROUTES ───────────────────────────────────────────────
app.get('/api/user/profile/:username', (req, res) => {
  const user = db.prepare(`
    SELECT username, role, tag, score, stars, coins, total_deaths,
           total_attempts, created_at, last_seen, completed_levels, best_percent
    FROM users WHERE username = ? COLLATE NOCASE AND is_banned = 0
  `).get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.post('/api/user/cosmetics', authenticate, (req, res) => {
  const { primaryColor, secondaryColor, trail, icon } = req.body;
  const cosmetics = { primaryColor, secondaryColor, trail, icon };
  db.prepare('UPDATE users SET cosmetics = ? WHERE id = ?').run(JSON.stringify(cosmetics), req.user.id);
  res.json({ success: true });
});

app.post('/api/user/settings', authenticate, (req, res) => {
  // Store user settings
  db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), req.user.id);
  res.json({ success: true });
});

// ─── OWNER ROUTES ─────────────────────────────────────────────
app.get('/api/owner/stats', authenticate, requireOwner, (req, res) => {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const online = db.prepare('SELECT COUNT(*) as c FROM users WHERE last_seen > ?').get(fiveMinAgo).c;
  const total = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const gamesToday = db.prepare('SELECT COUNT(*) as c FROM level_completions WHERE completed_at > ?').get(dayAgo / 1000).c;
  const totalStars = db.prepare('SELECT SUM(stars) as s FROM users').get().s || 0;
  const totalCoins = db.prepare('SELECT SUM(coins) as c FROM users').get().c || 0;
  const onlinePlayers = db.prepare(`
    SELECT username, role, tag, score FROM users
    WHERE last_seen > ? AND is_banned = 0
    ORDER BY last_seen DESC LIMIT 20
  `).all(fiveMinAgo);

  res.json({ online, totalPlayers: total, gamesToday, totalStars, totalCoins, onlinePlayers });
});

app.post('/api/owner/broadcast', authenticate, requireOwner, (req, res) => {
  const { message, type } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  db.prepare('INSERT INTO broadcasts (sender_id, message, type) VALUES (?, ?, ?)').run(req.user.id, message, type || 'announce');

  broadcast({ type: 'broadcast', message, msgType: type, sender: req.user.username });
  logAdmin(req.user.id, 'broadcast', null, message);

  res.json({ success: true, sent: connectedClients.size });
});

app.post('/api/owner/ban', authenticate, requireMod, (req, res) => {
  const { username, reason } = req.body;
  const target = db.prepare('SELECT id, role FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'owner') return res.status(403).json({ error: 'Cannot ban owner!' });

  db.prepare('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?').run(reason || 'Admin action', target.id);

  // Kick from WS
  const ws = connectedClients.get(target.id);
  if (ws) {
    ws.send(JSON.stringify({ type: 'banned', reason }));
    ws.close();
  }

  logAdmin(req.user.id, 'ban', username, reason);
  res.json({ success: true });
});

app.post('/api/owner/unban', authenticate, requireMod, (req, res) => {
  const { username } = req.body;
  const result = db.prepare('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE username = ? COLLATE NOCASE').run(username);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  logAdmin(req.user.id, 'unban', username);
  res.json({ success: true });
});

app.post('/api/owner/tag', authenticate, requireAdmin, (req, res) => {
  const { username, tag } = req.body;
  const validTags = ['owner', 'admin', 'mod', 'vip', 'legend', 'bot', ''];
  if (!validTags.includes(tag)) return res.status(400).json({ error: 'Invalid tag' });

  const target = db.prepare('SELECT id, role FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'owner' && req.user.role !== 'owner') return res.status(403).json({ error: 'Cannot modify owner' });

  db.prepare('UPDATE users SET tag = ? WHERE id = ?').run(tag, target.id);

  // Also update role if it's a role tag
  if (['admin','mod','vip'].includes(tag)) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(tag, target.id);
  }

  logAdmin(req.user.id, 'set_tag', username, `Tag: ${tag}`);

  // Notify user
  const ws = connectedClients.get(target.id);
  if (ws) ws.send(JSON.stringify({ type: 'tag_update', tag }));

  res.json({ success: true });
});

app.post('/api/owner/coins', authenticate, requireAdmin, (req, res) => {
  const { username, amount } = req.body;
  if (!amount || amount < 0) return res.status(400).json({ error: 'Invalid amount' });

  const target = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET coins = coins + ?, score = score + ? WHERE id = ?').run(amount, amount, target.id);
  logAdmin(req.user.id, 'give_coins', username, `+${amount} coins`);

  // Notify user
  const ws = connectedClients.get(target.id);
  if (ws) ws.send(JSON.stringify({ type: 'coins_received', amount, from: req.user.username }));

  res.json({ success: true });
});

app.post('/api/owner/stars', authenticate, requireAdmin, (req, res) => {
  const { username, amount } = req.body;
  if (!amount || amount < 0) return res.status(400).json({ error: 'Invalid amount' });

  const target = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET stars = stars + ?, score = score + ? WHERE id = ?').run(amount, amount * 100, target.id);
  logAdmin(req.user.id, 'give_stars', username, `+${amount} stars`);
  res.json({ success: true });
});

app.post('/api/owner/unlock', authenticate, requireAdmin, (req, res) => {
  const { username } = req.body;
  const target = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!target) return res.status(404).json({ error: 'User not found' });

  // Unlock all 23 levels
  const allLevels = JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]);
  db.prepare('UPDATE users SET completed_levels = ? WHERE id = ?').run(allLevels, target.id);
  logAdmin(req.user.id, 'unlock_all', username);
  res.json({ success: true });
});

app.post('/api/owner/speed', authenticate, requireOwner, (req, res) => {
  const { speed } = req.body;
  if (!speed || speed < 0.1 || speed > 5) return res.status(400).json({ error: 'Speed must be 0.1-5' });

  // Broadcast speed change
  broadcast({ type: 'speed_change', speed });
  logAdmin(req.user.id, 'set_speed', null, `${speed}x`);
  res.json({ success: true, speed });
});

app.post('/api/owner/reset-all', authenticate, requireOwner, (req, res) => {
  db.prepare(`UPDATE users SET
    coins = 0, stars = 0, score = 0,
    completed_levels = '[]', best_percent = '{}',
    total_deaths = 0, total_attempts = 0
    WHERE role != 'owner'
  `).run();
  db.prepare('DELETE FROM level_completions').run();

  broadcast({ type: 'reset', message: 'All progress has been reset by the owner.' });
  logAdmin(req.user.id, 'RESET_ALL', null, 'ALL PROGRESS WIPED');
  res.json({ success: true });
});

app.get('/api/owner/users', authenticate, requireAdmin, (req, res) => {
  const search = req.query.q || '';
  const users = db.prepare(`
    SELECT id, username, role, tag, score, stars, coins, is_banned, last_seen, created_at
    FROM users
    WHERE username LIKE ?
    ORDER BY created_at DESC LIMIT 100
  `).all(`%${search}%`);
  res.json({ users });
});

app.get('/api/owner/logs', authenticate, requireAdmin, (req, res) => {
  const logs = db.prepare(`
    SELECT al.*, u.username as admin_username
    FROM admin_logs al
    LEFT JOIN users u ON u.id = al.admin_id
    ORDER BY al.created_at DESC LIMIT 200
  `).all();
  res.json({ logs });
});

app.post('/api/owner/promote', authenticate, requireOwner, (req, res) => {
  const { username, role } = req.body;
  const validRoles = ['player', 'mod', 'admin'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const target = db.prepare('SELECT id, role FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'owner') return res.status(403).json({ error: 'Cannot modify owner' });

  db.prepare('UPDATE users SET role = ?, tag = ? WHERE id = ?').run(role, role, target.id);
  logAdmin(req.user.id, 'promote', username, `Role: ${role}`);
  res.json({ success: true });
});

app.delete('/api/owner/user/:username', authenticate, requireOwner, (req, res) => {
  const { username } = req.params;
  const target = db.prepare('SELECT id, role FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'owner') return res.status(403).json({ error: 'Cannot delete owner!' });

  db.prepare('DELETE FROM level_completions WHERE user_id = ?').run(target.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  logAdmin(req.user.id, 'DELETE_USER', username, 'Permanent deletion');
  res.json({ success: true });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────
app.get('/api/admin/broadcasts', authenticate, requireAdmin, (req, res) => {
  const broadcasts = db.prepare(`
    SELECT b.*, u.username FROM broadcasts b
    LEFT JOIN users u ON u.id = b.sender_id
    ORDER BY b.created_at DESC LIMIT 50
  `).all();
  res.json({ broadcasts });
});

// ─── PUBLIC STATS ─────────────────────────────────────────────
app.get('/api/stats/global', (req, res) => {
  const totalPlayers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalCompletions = db.prepare('SELECT COUNT(*) as c FROM level_completions').get().c;
  const totalStars = db.prepare('SELECT SUM(stars) as s FROM users WHERE is_banned = 0').get().s || 0;
  res.json({ totalPlayers, totalCompletions, totalStars });
});

// ─── UTIL FUNCTIONS ────────────────────────────────────────────
function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    tag: user.tag,
    coins: user.coins,
    stars: user.stars,
    score: user.score,
    cosmetics: safeJson(user.cosmetics, {}),
    completedLevels: safeJson(user.completed_levels, []),
    bestPercent: safeJson(user.best_percent, {}),
    totalDeaths: user.total_deaths,
    totalAttempts: user.total_attempts
  };
}

function safeJson(str, def) {
  try { return JSON.parse(str || 'null') || def; } catch(e) { return def; }
}

function logAdmin(adminId, action, targetUser, details = '') {
  try {
    db.prepare('INSERT INTO admin_logs (admin_id, action, target_user, details) VALUES (?, ?, ?, ?)').run(adminId, action, targetUser, details);
  } catch(e) {}
}

// ─── ERROR HANDLING ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── START SERVER ─────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║       🎮 GEOBLAST BACKEND            ║
  ║   Running at http://localhost:${PORT}   ║
  ╚══════════════════════════════════════╝
  
  Owner login: GeoOwner / owner123
  DB: ${DB_PATH}
  WS: Enabled
  `);
});

module.exports = { app, server, db };
