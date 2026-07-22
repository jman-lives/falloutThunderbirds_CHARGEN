/**
 * GM Screen — Fallout: Thunderbirds
 * All data persisted to localStorage. No backend required.
 *
 * localStorage keys:
 *   gm_characters   — array of character JSON objects
 *   gm_conditions   — object keyed by charId, array of condition strings
 *   gm_npcs         — array of NPC row objects
 *   gm_follower_pool — array of saved follower NPC templates
 *   gm_npc_reference — string (reference point label)
 *   gm_seq_extras   — array of manually-added sidebar-only sequence entries
 *   gm_player_timers — object keyed by charId, timer state
 *   gm_notes        — string (session notes)
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTIONS = [
  'NCR', 'Brotherhood of Steel', 'Raiders', 'Vault Dwellers', 'Super Mutants',
  'Enclave', 'Followers of the Apocalypse', 'Talon Company', 'Gunners',
  'Institute', 'Minutemen', "Caesar's Legion", 'Custom…'
];

const STATUSES = ['hostile', 'neutral', 'friendly'];

const PRESET_CONDITIONS = [
  { id: 'poisoned',        label: 'Poisoned' },
  { id: 'irradiated',      label: 'Irradiated' },
  { id: 'bleeding',        label: 'Bleeding' },
  { id: 'unconscious',     label: 'Unconscious' },
  { id: 'stunned',         label: 'Stunned' },
  { id: 'crippled-arm-l',  label: 'Crippled Arm L' },
  { id: 'crippled-arm-r',  label: 'Crippled Arm R' },
  { id: 'crippled-leg-l',  label: 'Crippled Leg L' },
  { id: 'crippled-leg-r',  label: 'Crippled Leg R' },
  { id: 'dead',            label: 'Dead' },
];

const SKILL_CATEGORIES = {
  Combat:    ['guns', 'energy_weapons', 'unarmed', 'melee_weapons', 'throwing'],
  Medical:   ['first_aid', 'doctor'],
  Stealth:   ['sneak', 'lockpick', 'steal', 'traps'],
  Technical: ['science', 'repair', 'pilot'],
  Social:    ['speech', 'barter', 'gambling', 'outdoorsman'],
};

const SKILL_LABELS = {
  guns: 'Guns', energy_weapons: 'Energy Weapons', unarmed: 'Unarmed',
  melee_weapons: 'Melee Weapons', throwing: 'Throwing',
  first_aid: 'First Aid', doctor: 'Doctor',
  sneak: 'Sneak', lockpick: 'Lockpick', steal: 'Steal', traps: 'Traps',
  science: 'Science', repair: 'Repair', pilot: 'Pilot',
  speech: 'Speech', barter: 'Barter', gambling: 'Gambling', outdoorsman: 'Outdoorsman',
};

const SPECIAL_KEYS = [
  { key: 'strength',    abbr: 'STR' },
  { key: 'perception',  abbr: 'PE'  },
  { key: 'endurance',   abbr: 'END' },
  { key: 'charisma',    abbr: 'CH'  },
  { key: 'intelligence',abbr: 'IN'  },
  { key: 'agility',     abbr: 'AG'  },
  { key: 'luck',        abbr: 'LK'  },
];

const BASE_PLAYER_TIMER_SECONDS = 5 * 60;

const DEFAULT_CRITTER_TEMPLATES = [
  {
    id: 'mantis',
    name: 'Mantis',
    baseStats: { hp: 10, sq: 7, ap: 7, xp: 50, cc: 2, ac: 5 },
    attacks: [
      { name: 'Mandible', chance: 70, ap: 3, damage: '1d6', effect: 'Poison Type B' },
      { name: 'Claw', chance: 75, ap: 4, damage: '1d8', effect: 'None' },
    ],
  },
  {
    id: 'radscorpion',
    name: 'Radscorpion',
    baseStats: { hp: 16, sq: 8, ap: 8, xp: 80, cc: 3, ac: 7 },
    attacks: [
      { name: 'Sting', chance: 70, ap: 4, damage: '1d10', effect: 'Poison Type C' },
      { name: 'Pincer', chance: 65, ap: 4, damage: '1d8', effect: 'Knockdown on crit' },
    ],
  },
  {
    id: 'gecko',
    name: 'Gecko',
    baseStats: { hp: 8, sq: 7, ap: 7, xp: 40, cc: 2, ac: 4 },
    attacks: [
      { name: 'Bite', chance: 68, ap: 3, damage: '1d6', effect: 'None' },
      { name: 'Tail Swipe', chance: 60, ap: 4, damage: '1d8', effect: 'Stagger on crit' },
    ],
  },
  {
    id: 'wild_dog',
    name: 'Wild Dog',
    baseStats: { hp: 9, sq: 9, ap: 7, xp: 45, cc: 3, ac: 6 },
    attacks: [
      { name: 'Bite', chance: 72, ap: 3, damage: '1d6', effect: 'Bleed on crit' },
      { name: 'Lunge', chance: 66, ap: 4, damage: '1d8', effect: 'Push target 1 hex' },
    ],
  },
];

const DEFAULT_ROBOT_TEMPLATES = [
  {
    id: 'robot_protectron',
    name: 'Protectron',
    baseStats: { hp: 50, sq: 8, ap: 8, xp: 120, cc: 4, ac: 5 },
    attacks: [
      { name: 'Thorn', chance: 75, ap: 4, damage: '1d6', effect: 'None' },
      { name: 'Punch', chance: 75, ap: 4, damage: '1d3', effect: 'None' },
    ],
  },
  {
    id: 'robot_mr_handy',
    name: 'Mr. Handy',
    baseStats: { hp: 40, sq: 10, ap: 9, xp: 140, cc: 5, ac: 6 },
    attacks: [
      { name: 'Buzzsaw', chance: 75, ap: 4, damage: '1d6', effect: 'Bleed on crit' },
      { name: 'Flamer', chance: 70, ap: 5, damage: '1d8', effect: 'Burn on crit' },
    ],
  },
  {
    id: 'robot_eyebot',
    name: 'Eyebot',
    baseStats: { hp: 30, sq: 12, ap: 8, xp: 100, cc: 3, ac: 4 },
    attacks: [
      { name: 'Laser Ping', chance: 75, ap: 3, damage: '1d4', effect: 'None' },
      { name: 'Shock Pulse', chance: 70, ap: 4, damage: '1d6', effect: 'Stagger on crit' },
    ],
  },
  {
    id: 'robot_securitron',
    name: 'Securitron',
    baseStats: { hp: 70, sq: 9, ap: 9, xp: 220, cc: 6, ac: 8 },
    attacks: [
      { name: '9mm Burst', chance: 75, ap: 4, damage: '2d6', effect: 'None' },
      { name: 'Micro-Missile', chance: 70, ap: 6, damage: '2d8', effect: 'Small blast' },
    ],
  },
  {
    id: 'robot_turret_sentry',
    name: 'Sentry Turret',
    baseStats: { hp: 60, sq: 0, ap: 8, xp: 180, cc: 4, ac: 8 },
    attacks: [
      { name: '5mm Burst', chance: 75, ap: 4, damage: '2d6', effect: 'None' },
      { name: 'Suppressive Fire', chance: 70, ap: 5, damage: '2d4', effect: '-10% to hit for 1 round' },
    ],
  },
  {
    id: 'robot_turret_laser',
    name: 'Laser Turret',
    baseStats: { hp: 55, sq: 0, ap: 8, xp: 190, cc: 5, ac: 7 },
    attacks: [
      { name: 'Laser Bolt', chance: 75, ap: 4, damage: '2d6', effect: 'None' },
      { name: 'Overcharge Beam', chance: 68, ap: 6, damage: '2d8', effect: 'Armor -1 for 1 round' },
    ],
  },
  {
    id: 'robot_turret_missile',
    name: 'Missile Turret',
    baseStats: { hp: 80, sq: 0, ap: 7, xp: 260, cc: 6, ac: 9 },
    attacks: [
      { name: 'Missile Rack', chance: 70, ap: 6, damage: '3d8', effect: 'Small blast' },
      { name: 'High-Explosive Volley', chance: 65, ap: 7, damage: '3d10', effect: 'Large blast' },
    ],
  },
];

let critterTemplates = [...DEFAULT_CRITTER_TEMPLATES];
let robotTemplates = [...DEFAULT_ROBOT_TEMPLATES];

// Stat display order and labels (exact Fallout: Thunderbirds names)
const STAT_DISPLAY = [
  { key: 'Sequence',         label: 'Sequence',           seq: true  },
  { key: 'Hit_Points',       label: 'Hit Points'                      },
  { key: 'Armor_Class',      label: 'Armor Class'                     },
  { key: 'Action_Points',    label: 'Action Points'                   },
  { key: 'Carry_Weight',     label: 'Carry Weight',       unit: 'lbs' },
  { key: 'Melee_Damage',     label: 'Melee Damage'                    },
  { key: 'Critical_Chance',  label: 'Critical Chance',    unit: '%'   },
  { key: 'Healing_Rate',     label: 'Healing Rate'                    },
  { key: 'Poison_Resist',    label: 'Poison Resist',      unit: '%'   },
  { key: 'Radiation_Resist', label: 'Radiation Resist',   unit: '%'   },
  { key: 'Electricity_Resist',label:'Electricity Resist', unit: '%'   },
  { key: 'Gas_Resist',       label: 'Gas Resist',         unit: '%'   },
];

// ─── State ────────────────────────────────────────────────────────────────────

let characters   = [];   // loaded character sheets
let conditions   = {};   // { charId: [conditionId, ...] }
let npcs         = [];   // NPC table rows
let followerPool = [];   // saved follower templates
let npcReference = 'Party';
let seqExtras    = [];   // manual sidebar-only sequence entries  { id, name, seq }
let seqActiveIdx = -1;   // index in sorted sequence list
let diceHistory  = [];
let playerTimers = {};   // { [charId]: { remainingSeconds, isRunning } }
let playerTimerInterval = null;

let npcRefLabel  = '';   // current reference text (rendered in distance header)

// ─── Persistence Helpers ──────────────────────────────────────────────────────

function save() {
  localStorage.setItem('gm_characters',    JSON.stringify(characters));
  localStorage.setItem('gm_conditions',    JSON.stringify(conditions));
  localStorage.setItem('gm_npcs',          JSON.stringify(npcs));
  localStorage.setItem('gm_follower_pool', JSON.stringify(followerPool));
  localStorage.setItem('gm_npc_reference', npcReference);
  localStorage.setItem('gm_seq_extras',    JSON.stringify(seqExtras));
  localStorage.setItem('gm_player_timers', JSON.stringify(playerTimers));
}

function load() {
  try { characters   = JSON.parse(localStorage.getItem('gm_characters'))    || []; } catch { characters   = []; }
  try { conditions   = JSON.parse(localStorage.getItem('gm_conditions'))    || {}; } catch { conditions   = {}; }
  try { npcs         = JSON.parse(localStorage.getItem('gm_npcs'))          || []; } catch { npcs         = []; }
  try { followerPool = JSON.parse(localStorage.getItem('gm_follower_pool')) || []; } catch { followerPool = []; }
  npcReference = localStorage.getItem('gm_npc_reference') || 'Party';
  try { seqExtras    = JSON.parse(localStorage.getItem('gm_seq_extras'))    || []; } catch { seqExtras    = []; }
  try { playerTimers = JSON.parse(localStorage.getItem('gm_player_timers')) || {}; } catch { playerTimers = {}; }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function charId(char) {
  return (char.name || 'unknown') + '|' + (char.createdAt || '');
}

function perkLabel(perk) {
  // Convert snake_case id to Title Case
  const name = perk.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return perk.rank > 1 ? `${name} (×${perk.rank})` : name;
}

function traitLabel(id) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function condClass(id) {
  if (id.startsWith('crippled')) return 'cond-crippled';
  return 'cond-' + id;
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function enforceReadableSelects(scope = document) {
  const root = scope && typeof scope.querySelectorAll === 'function' ? scope : document;
  const selects = root.querySelectorAll('select');
  selects.forEach(select => {
    select.style.colorScheme = 'light';
    select.style.color = '#111827';
    select.style.webkitTextFillColor = '#111827';
    select.style.backgroundColor = '#ffffff';
    select.style.borderColor = 'rgba(15,23,32,0.45)';

    Array.from(select.options || []).forEach(option => {
      option.style.color = '#111827';
      option.style.webkitTextFillColor = '#111827';
      option.style.backgroundColor = '#ffffff';
    });
  });
}

function trunc(str, n = 10) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function timerKeyFromCharId(id) {
  return encodeURIComponent(id);
}

function getCharacterSequence(char) {
  const seq = Number(
    char?.stats?.Sequence
    ?? char?.stats?.sequence
    ?? char?.Sequence
    ?? char?.sequence
  );
  return Number.isFinite(seq) ? seq : null;
}

function ensurePlayerTimer(id) {
  if (!playerTimers[id]) {
    playerTimers[id] = {
      remainingSeconds: BASE_PLAYER_TIMER_SECONDS,
      isRunning: false,
    };
  }

  const timer = playerTimers[id];
  if (!Number.isFinite(timer.remainingSeconds)) timer.remainingSeconds = BASE_PLAYER_TIMER_SECONDS;
  timer.remainingSeconds = Math.max(0, Math.floor(timer.remainingSeconds));
  timer.isRunning = Boolean(timer.isRunning);
  return timer;
}

function syncPlayerTimersWithCharacters() {
  const ids = new Set(characters.map(charId));
  let changed = false;

  ids.forEach(id => {
    if (!playerTimers[id]) changed = true;
    ensurePlayerTimer(id);
  });

  Object.keys(playerTimers).forEach(id => {
    if (!ids.has(id)) {
      delete playerTimers[id];
      changed = true;
    }
  });

  if (changed) save();
}

function formatTimer(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updatePlayerTimerDom(id) {
  const timer = ensurePlayerTimer(id);
  const key = timerKeyFromCharId(id);
  const root = document.querySelector(`.player-timer[data-char-key="${key}"]`);
  const display = document.querySelector(`.player-timer-display[data-char-key="${key}"]`);

  if (display) display.textContent = formatTimer(timer.remainingSeconds);
  if (root) {
    root.classList.toggle('running', timer.isRunning);
    root.classList.toggle('paused', !timer.isRunning && timer.remainingSeconds < BASE_PLAYER_TIMER_SECONDS);
  }
}

function initPlayerTimerTicker() {
  if (playerTimerInterval) return;

  playerTimerInterval = setInterval(() => {
    let changed = false;

    Object.entries(playerTimers).forEach(([id, timer]) => {
      if (!timer || !timer.isRunning) return;

      timer.remainingSeconds -= 1;
      changed = true;

      if (timer.remainingSeconds <= 0) {
        // On timeout, reset back to 5:00 and pause.
        timer.remainingSeconds = BASE_PLAYER_TIMER_SECONDS;
        timer.isRunning = false;
      }

      updatePlayerTimerDom(id);
    });

    if (changed) save();
  }, 1000);
}

// ─── Condition Helpers ────────────────────────────────────────────────────────

function getConditions(id) {
  return conditions[id] || [];
}

function toggleCondition(id, condId) {
  if (!conditions[id]) conditions[id] = [];
  const idx = conditions[id].indexOf(condId);
  if (idx === -1) conditions[id].push(condId);
  else            conditions[id].splice(idx, 1);
  save();
}

function addCustomCondition(id, text) {
  if (!text.trim()) return;
  if (!conditions[id]) conditions[id] = [];
  const condId = 'custom:' + text.trim();
  if (!conditions[id].includes(condId)) {
    conditions[id].push(condId);
    save();
  }
}

function removeCondition(id, condId) {
  if (!conditions[id]) return;
  conditions[id] = conditions[id].filter(c => c !== condId);
  save();
}

// ─── Condition Badge Rendering ────────────────────────────────────────────────

function renderConditionBadges(id) {
  const conds = getConditions(id);
  if (!conds.length) return '';
  return conds.map(c => {
    if (c.startsWith('custom:')) {
      const label = c.slice(7);
      return `<span class="cond-badge cond-custom" data-cid="${sanitize(id)}" data-cond="${sanitize(c)}"
        title="Click to remove"
        onclick="removeConditionAndRefresh(${JSON.stringify(id)},${JSON.stringify(c)})"
        style="cursor:pointer">${sanitize(label)}</span>`;
    }
    const preset = PRESET_CONDITIONS.find(p => p.id === c);
    const label = preset ? preset.label : c;
    const cls = condClass(c);
    return `<span class="cond-badge ${cls}" data-cid="${sanitize(id)}" data-cond="${sanitize(c)}"
      title="Click to remove"
      onclick="removeConditionAndRefresh(${JSON.stringify(id)},${JSON.stringify(c)})"
      style="cursor:pointer">${sanitize(label)}</span>`;
  }).join('');
}

window.removeConditionAndRefresh = function(id, condId) {
  removeCondition(id, condId);
  renderCharacters();
};

// ─── Character Rendering ──────────────────────────────────────────────────────

function renderCharacters() {
  const list = document.getElementById('char-list');
  const dropZone = document.getElementById('drop-zone');

  syncPlayerTimersWithCharacters();

  if (!characters.length) {
    dropZone.style.display = '';
    list.innerHTML = '';
    updateTabCounts();
    return;
  }

  dropZone.style.display = 'none';
  updateTabCounts();

  const sortedCharacters = [...characters].sort((a, b) => {
    const seqA = getCharacterSequence(a);
    const seqB = getCharacterSequence(b);
    const hasSeqA = seqA !== null;
    const hasSeqB = seqB !== null;

    if (hasSeqA && hasSeqB) return seqB - seqA;
    if (hasSeqA) return -1;
    if (hasSeqB) return 1;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });

  list.innerHTML = sortedCharacters.map((char, idx) => {
    const id   = charId(char);
    const timer = ensurePlayerTimer(id);
    const timerKey = timerKeyFromCharId(id);
    const attr = char.attributes || {};
    const stats = char.stats || {};
    const conds = getConditions(id);
    const perks = char.selectedPerks || [];
    const traits = char.selectedTraits || [];

    // SPECIAL pills
    const specialHtml = SPECIAL_KEYS.map(s =>
      `<span class="sp-pill"><span style="font-size:0.6rem;color:var(--muted)">${s.abbr}</span> <b>${attr[s.key] ?? '—'}</b></span>`
    ).join('');

    const badgesHtml = renderConditionBadges(id);
    const perkSummaryHtml = perks.length
      ? `${perks.slice(0, 3).map(p => `<span class="perk-tag" title="Rank ${p.rank} — level ${p.modifiedAtLevel}">${perkLabel(p)}</span>`).join('')}${perks.length > 3 ? `<span class="perk-tag">+${perks.length - 3}</span>` : ''}`
      : '<span class="perk-tag" style="opacity:0.65">No Perks</span>';
    const traitSummaryHtml = traits.length
      ? `${traits.slice(0, 3).map(t => `<span class="trait-tag">${traitLabel(t)}</span>`).join('')}${traits.length > 3 ? `<span class="trait-tag">+${traits.length - 3}</span>` : ''}`
      : '<span class="trait-tag" style="opacity:0.65">No Traits</span>';

    // Badge for generated NPCs
    const npcBadge = char._isGeneratedNpc
      ? `<span style="font-size:0.62rem;font-weight:700;padding:1px 6px;border-radius:999px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#ef4444;text-transform:uppercase;letter-spacing:0.05em;margin-right:2px;">NPC</span>`
      : '';

    return `
<div class="char-row" id="char-row-${idx}">
  <div class="char-summary" onclick="toggleCharRow(${idx})">
    <span class="char-chevron">▶</span>    ${npcBadge}    <span class="char-name">${sanitize(char.name || 'Unknown')}</span>
    <span class="char-meta" title="${sanitize(char.player || '')}">${sanitize(trunc(char.player || '', 10))} · ${sanitize(char.race || '')} · Lvl ${char.level || 1}${char.age > 0 && char.age < 18 ? ' · <span style="color:#ef4444;font-weight:700">⚠ Child</span>' : char.age > 0 && char.age <= 19 ? ' · <span style="color:#ef4444;font-weight:700">⚠ Teenager</span>' : char.age > 0 && char.age < 25 ? ' · <span style="color:#fbbf24;font-weight:700">⚠ Young</span>' : ''}</span>
    <div class="char-stats-pill">
      <span class="stat-pill hp">HP ${stats.Hit_Points ?? '—'}</span>
      <span class="stat-pill ac">AC ${stats.Armor_Class ?? '—'}</span>
      <span class="stat-pill ap">AP ${stats.Action_Points ?? '—'}</span>
      <span class="stat-pill seq">SEQ ${stats.Sequence ?? '—'}</span>
    </div>
    <div class="special-pills">${specialHtml}</div>
    <div class="condition-badges">${badgesHtml}</div>
    <div class="player-timer" data-char-key="${timerKey}" onclick="event.stopPropagation()">
      <span class="player-timer-label">Turn Timer</span>
      <span class="player-timer-display" data-char-key="${timerKey}">${formatTimer(timer.remainingSeconds)}</span>
      <div class="player-timer-controls">
        <button class="player-timer-btn" data-char-key="${timerKey}" onclick="playPlayerTimerFromBtn(this);event.stopPropagation()" title="Play">▶</button>
        <button class="player-timer-btn" data-char-key="${timerKey}" onclick="pausePlayerTimerFromBtn(this);event.stopPropagation()" title="Pause">⏸</button>
        <button class="player-timer-btn" data-char-key="${timerKey}" onclick="stopPlayerTimerFromBtn(this);event.stopPropagation()" title="Stop">■</button>
        <button class="player-timer-btn" data-char-key="${timerKey}" onclick="resetPlayerTimerFromBtn(this);event.stopPropagation()" title="Reset to 5:00">↺</button>
      </div>
    </div>
    <div class="trait-list" style="width:100%"><span style="font-size:0.65rem;color:var(--muted);margin-right:6px;align-self:center">Traits:</span>${traitSummaryHtml}</div>
    <div class="perk-list" style="width:100%"><span style="font-size:0.65rem;color:var(--muted);margin-right:6px;align-self:center">Perks:</span>${perkSummaryHtml}</div>
    <div class="char-actions">
      <button class="btn-remove" onclick='removeCharacter(event, ${JSON.stringify(id)})' title="Remove character">✕</button>
    </div>
  </div>

  <div class="char-detail">
    ${renderCharDetail(char, id)}
  </div>
</div>`;
  }).join('');

  characters.forEach(char => updatePlayerTimerDom(charId(char)));
}

window.toggleCharRow = function(idx) {
  const row = document.getElementById('char-row-' + idx);
  if (row) row.classList.toggle('open');
};

window.removeCharacter = function(event, id) {
  event.stopPropagation();
  const idx = characters.findIndex(char => charId(char) === id);
  if (idx === -1) return;
  characters.splice(idx, 1);
  syncPlayerTimersWithCharacters();
  save();
  renderCharacters();
  renderSequenceTracker();
};

window.playPlayerTimer = function(id) {
  initPlayerTimerTicker();
  const timer = ensurePlayerTimer(id);
  timer.isRunning = true;
  save();
  updatePlayerTimerDom(id);
};

window.playPlayerTimerFromBtn = function(btn) {
  const key = btn?.dataset?.charKey;
  if (!key) return;
  window.playPlayerTimer(decodeURIComponent(key));
};

window.pausePlayerTimer = function(id) {
  const timer = ensurePlayerTimer(id);
  timer.isRunning = false;
  save();
  updatePlayerTimerDom(id);
};

window.pausePlayerTimerFromBtn = function(btn) {
  const key = btn?.dataset?.charKey;
  if (!key) return;
  window.pausePlayerTimer(decodeURIComponent(key));
};

window.stopPlayerTimer = function(id) {
  const timer = ensurePlayerTimer(id);

  if (timer.remainingSeconds > 0) {
    timer.remainingSeconds = BASE_PLAYER_TIMER_SECONDS + timer.remainingSeconds;
  } else {
    timer.remainingSeconds = BASE_PLAYER_TIMER_SECONDS;
  }

  timer.isRunning = false;
  save();
  updatePlayerTimerDom(id);
};

window.stopPlayerTimerFromBtn = function(btn) {
  const key = btn?.dataset?.charKey;
  if (!key) return;
  window.stopPlayerTimer(decodeURIComponent(key));
};

window.resetPlayerTimer = function(id) {
  const timer = ensurePlayerTimer(id);
  timer.remainingSeconds = BASE_PLAYER_TIMER_SECONDS;
  timer.isRunning = false;
  save();
  updatePlayerTimerDom(id);
};

window.resetPlayerTimerFromBtn = function(btn) {
  const key = btn?.dataset?.charKey;
  if (!key) return;
  window.resetPlayerTimer(decodeURIComponent(key));
};

function renderCharDetail(char, id) {
  const attr  = char.attributes || {};
  const stats = char.stats      || {};
  const skills = char.skills    || {};
  const tagSkills = char.tagSkills || {};

  // ── SPECIAL ──
  const specialCells = SPECIAL_KEYS.map(s => `
    <div class="special-cell">
      <div class="label">${s.abbr}</div>
      <div class="value">${attr[s.key] ?? '—'}</div>
    </div>`).join('');

  // ── Secondary Stats ──
  const statsHtml = STAT_DISPLAY.map(s => {
    const val = stats[s.key];
    if (val === undefined || val === null) return '';
    const display = s.unit ? `${val}${s.unit}` : val;
    return `<div class="stat-row${s.seq ? ' seq' : ''}">
      <span class="lbl">${s.label}</span>
      <span class="val">${display}</span>
    </div>`;
  }).join('');

  // ── Skills ──
  const skillsHtml = Object.entries(SKILL_CATEGORIES).map(([cat, keys]) => {
    const rows = keys.map(k => {
      const val = skills[k];
      if (val === undefined) return '';
      const isTagged = tagSkills[k];
      const tagHtml = isTagged ? '<span class="tag-badge">T</span>' : '';
      return `<div class="skill-line">
        <span class="sname">${tagHtml}${SKILL_LABELS[k]}</span>
        <span class="sval">${val}%</span>
      </div>`;
    }).join('');
    return `<div class="skills-section">
      <div class="skills-cat-label">${cat}</div>
      ${rows}
    </div>`;
  }).join('');

  // ── Perks ──
  const perks = char.selectedPerks || [];
  const perksHtml = perks.length
    ? `<div class="perk-list">${perks.map(p =>
        `<span class="perk-tag" title="Rank ${p.rank} — acquired at level ${p.modifiedAtLevel}">${perkLabel(p)}</span>`
      ).join('')}</div>`
    : '<span style="font-size:0.78rem;color:var(--muted)">None</span>';

  // ── Traits ──
  const traits = char.selectedTraits || [];
  const traitsHtml = traits.length
    ? `<div class="trait-list">${traits.map(t =>
        `<span class="trait-tag">${traitLabel(t)}</span>`
      ).join('')}</div>`
    : '<span style="font-size:0.78rem;color:var(--muted)">None</span>';

  // ── Equipment ──
  let equipHtml = '<span style="font-size:0.78rem;color:var(--muted)">None</span>';
  const equip = char.equipment;
  if (equip && equip.items && Object.keys(equip.items).length) {
    const rows = Object.entries(equip.items).map(([name, qty]) =>
      `<tr><td>${sanitize(name)}</td><td>×${qty}</td></tr>`
    ).join('');
    equipHtml = `
      <table class="equip-table"><tbody>${rows}</tbody></table>
      <div class="equip-footer">
        <span><b>${equip.totalWeight ?? '?'}</b> lbs</span>
        <span>Value: <b>${equip.totalCost ?? '?'}</b> caps</span>
      </div>`;
  }

  // ── Conditions Panel ──
  const conds = getConditions(id);
  const presetToggles = PRESET_CONDITIONS.map(p => {
    const active = conds.includes(p.id) ? 'active' : '';
    return `<button class="cond-toggle-btn ct-${p.id} ${active}"
      onclick="toggleCondAndRefresh(${JSON.stringify(id)}, ${JSON.stringify(p.id)})"
      >${p.label}</button>`;
  }).join('');

  return `
    <div class="detail-grid">

      <div class="detail-card" style="grid-column:1/-1">
        <div class="detail-card-title">S.P.E.C.I.A.L.</div>
        <div class="special-grid">${specialCells}</div>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">Secondary Stats</div>
        ${statsHtml}
      </div>

      <div class="detail-card">
        <div class="detail-card-title">Skills</div>
        ${skillsHtml}
      </div>

      <div class="detail-card">
        <div class="detail-card-title">Traits</div>
        ${traitsHtml}
      </div>

      <div class="detail-card">
        <div class="detail-card-title">Perks</div>
        ${perksHtml}
      </div>

      <div class="detail-card" style="grid-column:1/-1">
        <div class="detail-card-title">Equipment</div>
        ${equipHtml}
      </div>

      <div class="detail-card" style="grid-column:1/-1">
        <div class="cond-panel">
          <div class="cond-panel-title">Conditions</div>
          <div class="cond-toggles">${presetToggles}</div>
          <div class="cond-custom-wrap">
            <input type="text" class="npc-input" placeholder="Custom condition…" id="cond-custom-${sanitize(id)}" maxlength="40" />
            <button onclick="addCustomCond(${JSON.stringify(id)})">Add</button>
          </div>
        </div>
      </div>

    </div>`;
}

window.toggleCondAndRefresh = function(id, condId) {
  toggleCondition(id, condId);
  renderCharacters();
};

window.addCustomCond = function(id) {
  const el = document.getElementById('cond-custom-' + id);
  if (!el) return;
  addCustomCondition(id, el.value);
  el.value = '';
  renderCharacters();
};

// ─── File Upload ──────────────────────────────────────────────────────────────

function processFiles(files) {
  const promises = Array.from(files).map(file => {
    if (!file.name.endsWith('.json')) return Promise.resolve(null);
    return file.text().then(text => {
      try {
        const data = JSON.parse(text);
        // Basic validation — must have name and attributes
        if (!data.name || !data.attributes) return null;
        return data;
      } catch {
        return null;
      }
    });
  });

  Promise.all(promises).then(results => {
    const valid = results.filter(Boolean);
    if (!valid.length) return;

    // Avoid duplicates by charId
    const existing = new Set(characters.map(charId));
    const added = valid.filter(c => !existing.has(charId(c)));
    characters.push(...added);
    save();
    renderCharacters();
    renderSequenceTracker();
  });
}

// ─── NPC Table ────────────────────────────────────────────────────────────────

const FACTION_BADGE_CLASS = {
  'NCR':                         'nft-ncr',
  'Brotherhood of Steel':        'nft-bos',
  'Raiders':                     'nft-raiders',
  'Vault Dwellers':              'nft-vault',
  'Super Mutants':               'nft-mutants',
  'Enclave':                     'nft-enclave',
  'Followers of the Apocalypse': 'nft-followers',
  'Talon Company':               'nft-talon',
  'Gunners':                     'nft-gunners',
  'Institute':                   'nft-institute',
  'Minutemen':                   'nft-minutemen',
  "Caesar's Legion":             'nft-legion',
};

const NPC_ARMOR_AC_BONUS = {
  'Leather Jacket': 2,
  'Road Leathers': 2,
  'Vault Suit': 2,
  'Leather Armor': 2,
  'Leather Armor Mk II': 4,
  'Raider Armor': 4,
  'Metal Armor': 4,
  'Combat Armor': 4,
  'Metal Armor Mk II': 6,
  'Combat Armor Mk II': 6,
  'Tesla Armor': 6,
  'Power Armor': 6,
};

function getNpcArmorBonus(armorName) {
  return NPC_ARMOR_AC_BONUS[armorName] || 0;
}

function getNpcEffectiveAc(npc) {
  const base = parseInt(npc.acBase, 10);
  const armorBonus = getNpcArmorBonus(npc.armor);
  return (isNaN(base) ? 0 : base) + armorBonus;
}

function _hpColor(ratio) {
  if (ratio === null) return '#60a5fa';
  if (ratio > 0.6)   return '#34d399';
  if (ratio > 0.3)   return '#fbbf24';
  return '#ef4444';
}

function newNpc() {
  return {
    _id: uid(),
    _isCritter: false,
    _critterTemplateId: '',
    name: '',
    level: '1',
    faction: '',
    customFaction: '',
    status: 'neutral',
    distance: '',
    hpCurrent: '',
    hpMax: '',
    acBase: '',
    armor: '',
    sequence: '',
    attacks: '',
    xp: '',
    notes: '',
    age: '',
  };
}

function formatCritterAttack(attack, level) {
  const chanceBonus = Math.floor((level - 1) * 2);
  const damageBonus = Math.floor((level - 1) / 2);
  const chance = Math.min(95, attack.chance + chanceBonus);
  const damage = damageBonus > 0 ? `${attack.damage} + ${damageBonus}` : attack.damage;
  return `${attack.name} (${chance}%, ${attack.ap} AP, D: ${damage}, ${attack.effect || 'None'})`;
}

function computeScaledCritter(template, level) {
  const safeLevel = Math.max(1, Math.min(30, parseInt(level, 10) || 1));
  const scale = safeLevel - 1;
  const hp = Math.max(1, Math.round(template.baseStats.hp * (1 + scale * 0.22)));
  const sq = template.baseStats.sq + Math.floor(scale / 2);
  const ap = Math.min(15, template.baseStats.ap + Math.floor(scale / 3));
  const xp = Math.max(1, Math.round(template.baseStats.xp * (1 + scale * 0.35)));
  const cc = Math.min(50, template.baseStats.cc + Math.floor(scale / 2));
  const ac = template.baseStats.ac + Math.floor(scale / 3);
  const attacks = template.attacks.map(a => formatCritterAttack(a, safeLevel));

  return { level: safeLevel, hp, sq, ap, xp, cc, ac, attacks };
}

function findCritterTemplate(templateId) {
  return critterTemplates.find(t => t.id === templateId) || null;
}

function findRobotTemplate(templateId) {
  return robotTemplates.find(t => t.id === templateId) || null;
}

function findAnyCreatureTemplate(templateId) {
  return findCritterTemplate(templateId) || findRobotTemplate(templateId) || null;
}

function normalizeCritterTemplate(entry) {
  if (!entry || !entry.id || !entry.name || !entry.baseStats) return null;

  const attacks = Array.isArray(entry.attacks)
    ? entry.attacks.map(a => ({
        name: a.name || 'Attack',
        chance: Number(a.chance) || 50,
        ap: Number(a.ap ?? a.apCost) || 3,
        damage: a.damage || '1d6',
        effect: a.effect || 'None',
      }))
    : [];

  if (!attacks.length) return null;

  return {
    id: String(entry.id),
    name: String(entry.name),
    baseStats: {
      hp: Number(entry.baseStats.hp) || 8,
      sq: Number(entry.baseStats.sq) || 6,
      ap: Number(entry.baseStats.ap) || 6,
      xp: Number(entry.baseStats.xp) || 30,
      cc: Number(entry.baseStats.cc) || 1,
      ac: Number(entry.baseStats.ac) || 0,
    },
    attacks,
  };
}

function isRobotTemplate(entry) {
  if (!entry) return false;
  const haystack = `${entry.id || ''} ${entry.name || ''}`.toLowerCase();
  return [
    'robot',
    'bot',
    'protectron',
    'securitron',
    'eyebot',
    'assaultron',
    'sentry',
    'mr handy',
    'robobrain',
    'turret',
  ].some(token => haystack.includes(token));
}

async function loadCritterTemplatesFromDatabase() {
  try {
    const res = await fetch('database.json', { cache: 'no-store' });
    if (!res.ok) return;
    const db = await res.json();
    if (!Array.isArray(db.critters)) return;

    const mapped = db.critters
      .map(normalizeCritterTemplate)
      .filter(Boolean);

    if (mapped.length) {
      critterTemplates = mapped;
      const robotsFromDb = mapped.filter(isRobotTemplate);
      if (robotsFromDb.length) {
        const byId = new Map();
        DEFAULT_ROBOT_TEMPLATES.forEach(t => byId.set(t.id, t));
        robotsFromDb.forEach(t => byId.set(t.id, t));
        robotTemplates = Array.from(byId.values());
      }
    }
  } catch {
    // Keep defaults if file isn't available.
  }
}

function makeCritterName(baseName = 'Critter') {
  const used = new Set(
    npcs
      .map(npc => (npc.name || '').trim())
      .filter(name => {
        const safeBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`^${safeBase}\\s+\\d+$`, 'i').test(name);
      })
      .map(name => parseInt(name.split(/\s+/).pop(), 10))
      .filter(num => Number.isFinite(num) && num > 0)
  );

  let next = 1;
  while (used.has(next)) next += 1;
  return `${baseName} ${next}`;
}

function buildCritterRowFromTemplate(template, customName, level, typeLabel = 'Critter') {
  if (!template) return null;
  const scaled = computeScaledCritter(template, level);

  return {
    ...newNpc(),
    _isCritter: true,
    _critterTemplateId: template.id,
    name: (customName || '').trim() || makeCritterName(template.name),
    level: String(scaled.level),
    status: 'hostile',
    hpCurrent: String(scaled.hp),
    hpMax: String(scaled.hp),
    acBase: String(scaled.ac),
    sequence: String(scaled.sq),
    attacks: scaled.attacks.join('; '),
    xp: String(scaled.xp),
    notes: `${typeLabel} · Lvl ${scaled.level} · AP ${scaled.ap} · CC ${scaled.cc}%`,
  };
}

function buildCritterRow(templateId, customName, level) {
  const template = findCritterTemplate(templateId);
  return buildCritterRowFromTemplate(template, customName, level, 'Critter');
}

function getRecommendedEncounterLevel() {
  const levels = characters
    .map(char => parseInt(char.level, 10))
    .filter(level => Number.isFinite(level) && level > 0);
  if (!levels.length) return 3;

  const avg = levels.reduce((sum, level) => sum + level, 0) / levels.length;
  return Math.max(1, Math.min(30, Math.round(avg)));
}

function addGeneratedRobot() {
  const pool = robotTemplates.length ? robotTemplates : DEFAULT_ROBOT_TEMPLATES;
  if (!pool.length) return;

  const template = pool[Math.floor(Math.random() * pool.length)];
  const level = getRecommendedEncounterLevel();
  const row = buildCritterRowFromTemplate(template, '', level, 'Robot');
  if (!row) return;

  row._isRobot = true;
  row.status = 'hostile';
  npcs.push(row);
  save();
  renderNpcTable();
  renderSequenceTracker();
  updateTabCounts();
  switchTab('encounter');
}

function applyCritterLevelToNpc(npc, newLevel) {
  const template = findAnyCreatureTemplate(npc._critterTemplateId);
  if (!template) return;

  const oldMax = parseInt(npc.hpMax, 10);
  const oldCur = parseInt(npc.hpCurrent, 10);
  const hpRatio = oldMax > 0 && Number.isFinite(oldCur) ? Math.max(0, oldCur / oldMax) : 1;
  const scaled = computeScaledCritter(template, newLevel);

  npc.level = String(scaled.level);
  npc.sequence = String(scaled.sq);
  npc.acBase = String(scaled.ac);
  npc.hpMax = String(scaled.hp);
  npc.hpCurrent = String(Math.max(0, Math.min(scaled.hp, Math.round(scaled.hp * hpRatio))));
  npc.attacks = scaled.attacks.join('; ');
  npc.xp = String(scaled.xp);
  const typeLabel = npc._isRobot ? 'Robot' : 'Critter';
  npc.notes = `${typeLabel} · Lvl ${scaled.level} · AP ${scaled.ap} · CC ${scaled.cc}%`;
}

window.adjustCritterLevel = function(idx, delta) {
  const npc = npcs[idx];
  if (!npc || !npc._isCritter) return;

  const level = parseInt(npc.level, 10) || 1;
  const nextLevel = Math.max(1, Math.min(30, level + delta));
  if (nextLevel === level) return;

  applyCritterLevelToNpc(npc, nextLevel);
  save();
  renderNpcTable();
  renderSequenceTracker();
};

function addCritter(templateId, customName, level) {
  const row = buildCritterRow(templateId, customName, level);
  if (!row) return;

  npcs.push(row);
  save();
  renderNpcTable();
  renderSequenceTracker();
  updateTabCounts();
}

function renderFollowerPool() {
  const listEl = document.getElementById('follower-pool-list');
  if (!listEl) return;

  if (!followerPool.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:12px;font-size:0.8rem">No saved followers yet.</div>`;
    return;
  }

  listEl.innerHTML = followerPool.map(f => {
    const faction = f.faction === 'Custom…' ? (f.customFaction || 'Custom') : (f.faction || 'No faction');
    return `<div class="follower-row">
      <span class="follower-name" title="${sanitize(f.name || 'Follower')}">${sanitize(f.name || 'Follower')}</span>
      <span class="follower-meta">${sanitize(faction)} · HP ${sanitize(String(f.hpMax || '—'))}</span>
      <button class="follower-add-btn" onclick="addFollowerToEncounter('${sanitize(f._id)}')">+ Add</button>
      <button class="follower-remove-btn" onclick="removeFollower('${sanitize(f._id)}')">✕</button>
    </div>`;
  }).join('');
}

function renderNpcTable() {
  const listEl   = document.getElementById('npc-list');
  const refInput = document.getElementById('npc-ref-input');
  if (refInput && refInput.value !== npcReference) refInput.value = npcReference;

  if (!npcs.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:20px;font-size:0.85rem">No NPCs yet — click <b>☠ Generate &amp; Add NPC</b> below.</div>`;
    updateTabCounts();
    return;
  }
  updateTabCounts();

  listEl.innerHTML = npcs.map((npc, idx) => {
    const statusCycle = STATUSES[(STATUSES.indexOf(npc.status) + 1) % STATUSES.length];
    const statusLabel = (npc.status || 'neutral')[0].toUpperCase() + (npc.status || 'neutral').slice(1);
    const statusClass = `status-${npc.status || 'neutral'}`;

    // Faction badge
    const displayFaction = npc.faction === 'Custom…'
      ? (npc.customFaction || 'Custom')
      : (npc.faction || '');
    const fBadgeClass = FACTION_BADGE_CLASS[npc.faction] || '';
    const factionBadge = displayFaction
      ? `<span class="npc-faction-tag ${fBadgeClass}">${sanitize(displayFaction)}</span>`
      : '';

    // Faction select
    const factionOptions = FACTIONS.map(f =>
      `<option value="${sanitize(f)}" ${(npc.faction || '') === f ? 'selected' : ''}>${sanitize(f)}</option>`
    ).join('');
    const customInput = npc.faction === 'Custom…'
      ? `<input class="npc-stat-input npc-stat-input-md" value="${sanitize(npc.customFaction || '')}"
           oninput="updateNpc(${idx},'customFaction',this.value)" placeholder="Faction name"
           style="margin-top:3px" />`
      : '';

    // HP bar
    const cur = parseFloat(npc.hpCurrent);
    const max = parseFloat(npc.hpMax);
    const hpRatio   = (!isNaN(cur) && !isNaN(max) && max > 0) ? Math.max(0, Math.min(1, cur / max)) : null;
    const hpColor   = _hpColor(hpRatio);
    const hpBarHtml = max > 0
      ? `<div class="npc-hp-bar-wrap" id="hpbar-${idx}">
           <div class="npc-hp-bar-fill" style="width:${hpRatio !== null ? Math.round(hpRatio * 100) : 0}%;background:${hpColor}"></div>
         </div>`
      : '';

    const age = parseInt(npc.age, 10);
    const isChild = age > 0 && age < 18;
    const armorBonus = getNpcArmorBonus(npc.armor);
    const effectiveAc = getNpcEffectiveAc(npc);
    const childBadge = isChild
      ? `<span style="font-size:0.6rem;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5);color:#ef4444;text-transform:uppercase;letter-spacing:0.05em;flex-shrink:0">CHILD</span>`
      : '';
    const critterBadge = npc._isCritter
      ? (npc._isRobot
          ? `<span style="font-size:0.6rem;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(96,165,250,0.18);border:1px solid rgba(96,165,250,0.55);color:#60a5fa;text-transform:uppercase;letter-spacing:0.05em;flex-shrink:0">ROBOT</span>`
          : `<span style="font-size:0.6rem;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(74,222,128,0.18);border:1px solid rgba(74,222,128,0.55);color:#4ade80;text-transform:uppercase;letter-spacing:0.05em;flex-shrink:0">CRITTER</span>`)
      : '';
    const critterLevelControls = npc._isCritter
      ? `<div class="npc-stat-blk">
          <div class="npc-stat-label">LEVEL</div>
          <div style="display:flex;align-items:center;gap:4px;">
            <button class="player-timer-btn" onclick="adjustCritterLevel(${idx},-1)" title="Lower level">−</button>
            <span class="npc-stat-input npc-stat-input-sm" style="display:inline-flex;align-items:center;justify-content:center">${sanitize(String(npc.level || '1'))}</span>
            <button class="player-timer-btn" onclick="adjustCritterLevel(${idx},1)" title="Raise level">+</button>
          </div>
        </div>`
      : '';

    // Status button — children require GM confirmation
    const statusOnClick = isChild
      ? `confirmChildStatus(${idx},'${statusCycle}')`
      : `updateNpcStatus(${idx},'${statusCycle}')`;

    // Distance label
    const refLabel = npcReference ? `hex from ${npcReference}` : 'hexes';

    return `
<div class="npc-card" data-status="${sanitize(npc.status || 'neutral')}" data-idx="${idx}">
  <div class="npc-card-header">
    <button class="status-btn ${statusClass}"
      onclick="${statusOnClick}">${statusLabel}</button>
    <input class="npc-card-name" value="${sanitize(npc.name || '')}"
      oninput="updateNpc(${idx},'name',this.value)" placeholder="Name…" />
    ${critterBadge}
    ${childBadge}
    <div class="npc-faction-wrap">
      ${factionBadge}
      <select class="npc-faction-select" onchange="updateNpcFaction(${idx},this.value)">
        <option value="">— Faction —</option>
        ${factionOptions}
      </select>
      ${customInput}
    </div>
    <button class="btn-follower" onclick="saveNpcToFollowers(${idx});event.stopPropagation()" title="Save to follower pool">★</button>
    <button class="btn-remove" onclick="removeNpc(${idx})" title="Remove">✕</button>
  </div>

  <div class="npc-card-stats">
    <div class="npc-stat-blk">
      <div class="npc-stat-label">SEQ</div>
      <input class="npc-stat-input npc-seq-input" type="number" min="0"
        value="${sanitize(String(npc.sequence ?? ''))}"
        oninput="updateNpc(${idx},'sequence',this.value);renderSequenceTracker()"
        placeholder="—" />
    </div>

      ${critterLevelControls}

    <div class="npc-stat-blk">
      <div class="npc-stat-label">HP</div>
      <div class="npc-hp-inputs">
        <input class="npc-stat-input npc-stat-input-sm npc-hp-current" type="number" min="0"
          value="${sanitize(String(npc.hpCurrent ?? ''))}"
          oninput="updateNpc(${idx},'hpCurrent',this.value);refreshHpBar(${idx})"
          placeholder="cur" style="color:${hpColor}" />
        <span class="hp-sep">/</span>
        <span class="npc-stat-input npc-stat-input-sm"
          style="display:inline-flex;align-items:center;justify-content:center;opacity:0.8;cursor:not-allowed"
          title="Total HP is fixed">
          ${sanitize(String(npc.hpMax ?? '—'))}
        </span>
      </div>
      ${hpBarHtml}
    </div>

    <div class="npc-stat-blk">
      <div class="npc-stat-label">DIST</div>
      <div class="npc-dist-wrap">
        <input class="npc-stat-input npc-stat-input-sm" type="number" min="0"
          value="${sanitize(String(npc.distance ?? ''))}"
          oninput="updateNpc(${idx},'distance',this.value)"
          placeholder="0" />
        <span class="npc-dist-ref">${sanitize(refLabel)}</span>
      </div>
    </div>

    <div class="npc-stat-blk">
      <div class="npc-stat-label">ARMOR</div>
      <select class="npc-stat-input npc-stat-input-md" onchange="updateNpcArmor(${idx},this.value)">
        <option value="" ${!npc.armor ? 'selected' : ''}>— None —</option>
        <optgroup label="Low">
          <option value="Leather Jacket"      ${npc.armor==='Leather Jacket'      ?'selected':''}>Leather Jacket</option>
          <option value="Road Leathers"        ${npc.armor==='Road Leathers'        ?'selected':''}>Road Leathers</option>
          <option value="Vault Suit"           ${npc.armor==='Vault Suit'           ?'selected':''}>Vault Suit</option>
          <option value="Leather Armor"        ${npc.armor==='Leather Armor'        ?'selected':''}>Leather Armor</option>
        </optgroup>
        <optgroup label="Medium">
          <option value="Leather Armor Mk II"  ${npc.armor==='Leather Armor Mk II'  ?'selected':''}>Leather Armor Mk II</option>
          <option value="Raider Armor"         ${npc.armor==='Raider Armor'         ?'selected':''}>Raider Armor</option>
          <option value="Metal Armor"          ${npc.armor==='Metal Armor'          ?'selected':''}>Metal Armor</option>
          <option value="Combat Armor"         ${npc.armor==='Combat Armor'         ?'selected':''}>Combat Armor</option>
        </optgroup>
        <optgroup label="High">
          <option value="Metal Armor Mk II"    ${npc.armor==='Metal Armor Mk II'    ?'selected':''}>Metal Armor Mk II</option>
          <option value="Combat Armor Mk II"   ${npc.armor==='Combat Armor Mk II'   ?'selected':''}>Combat Armor Mk II</option>
          <option value="Tesla Armor"          ${npc.armor==='Tesla Armor'          ?'selected':''}>Tesla Armor</option>
          <option value="Power Armor"          ${npc.armor==='Power Armor'          ?'selected':''}>Power Armor</option>
        </optgroup>
      </select>
      <div style="font-size:0.68rem;color:var(--muted);margin-top:3px">AC +${armorBonus}</div>
    </div>

    <div class="npc-stat-blk">
      <div class="npc-stat-label">AC</div>
      <span class="npc-stat-input npc-stat-input-sm"
        style="display:inline-flex;align-items:center;justify-content:center;opacity:0.9"
        title="Base AC + Armor Bonus">
        ${sanitize(String(effectiveAc))}
      </span>
    </div>

    <div class="npc-stat-blk npc-notes-blk">
      <div class="npc-stat-label">ATTACKS</div>
      <input class="npc-stat-input npc-stat-input-lg" value="${sanitize(npc.attacks || '')}"
        oninput="updateNpc(${idx},'attacks',this.value)" placeholder="—" />
    </div>

    <div class="npc-stat-blk">
      <div class="npc-stat-label">XP</div>
      <input class="npc-stat-input npc-stat-input-sm" type="number" min="0"
        value="${sanitize(String(npc.xp ?? ''))}"
        oninput="updateNpc(${idx},'xp',this.value)"
        placeholder="0" />
    </div>

    <div class="npc-stat-blk npc-notes-blk">
      <div class="npc-stat-label">NOTES</div>
      <input class="npc-stat-input npc-stat-input-lg" value="${sanitize(npc.notes || '')}"
        oninput="updateNpc(${idx},'notes',this.value)" placeholder="—" />
    </div>
  </div>
</div>`;
  }).join('');

  enforceReadableSelects(listEl);
}

// Live HP bar refresh without full re-render
window.refreshHpBar = function(idx) {
  const npc  = npcs[idx];
  if (!npc) return;
  const cur  = parseFloat(npc.hpCurrent);
  const max  = parseFloat(npc.hpMax);
  const ratio = (!isNaN(cur) && !isNaN(max) && max > 0) ? Math.max(0, Math.min(1, cur / max)) : null;
  const color = _hpColor(ratio);
  const card  = document.querySelector(`[data-idx="${idx}"]`);
  if (!card) return;
  const fill  = card.querySelector('.npc-hp-bar-fill');
  if (fill) { fill.style.width = ratio !== null ? `${Math.round(ratio * 100)}%` : '0%'; fill.style.backgroundColor = color; }
  const curInput = card.querySelector('.npc-hp-current');
  if (curInput) curInput.style.color = color;
};

// Status cycle without full re-render
window.updateNpcStatus = function(idx, newStatus) {
  if (!npcs[idx]) return;
  npcs[idx].status = newStatus;
  save();
  renderNpcTable();
  renderSequenceTracker();
};

// Child status change — requires GM confirmation via modal
let _pendingChildStatus = null;
window.confirmChildStatus = function(idx, newStatus) {
  _pendingChildStatus = { idx, newStatus };
  const modal = document.getElementById('child-confirm-modal');
  modal.style.display = 'flex';
};
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('child-confirm-ok').addEventListener('click', () => {
    if (_pendingChildStatus) {
      updateNpcStatus(_pendingChildStatus.idx, _pendingChildStatus.newStatus);
      _pendingChildStatus = null;
    }
    document.getElementById('child-confirm-modal').style.display = 'none';
  });
  document.getElementById('child-confirm-cancel').addEventListener('click', () => {
    _pendingChildStatus = null;
    document.getElementById('child-confirm-modal').style.display = 'none';
  });
});

window.updateNpc = function(idx, field, value) {
  if (!npcs[idx]) return;
  npcs[idx][field] = value;
  save();
};

window.updateNpcFaction = function(idx, value) {
  if (!npcs[idx]) return;
  npcs[idx].faction = value;
  save();
  renderNpcTable();
};

window.updateNpcArmor = function(idx, value) {
  if (!npcs[idx]) return;
  npcs[idx].armor = value;
  save();
  renderNpcTable();
  renderSequenceTracker();
};

window.removeNpc = function(idx) {
  npcs.splice(idx, 1);
  save();
  renderNpcTable();
  renderFollowerPool();
  renderSequenceTracker();
};

window.saveNpcToFollowers = function(idx) {
  const npc = npcs[idx];
  if (!npc) return;

  const parsedSeq = parseInt(npc.sequence, 10);
  const baseSeq = npc._isFollower
    ? (parseInt(npc._followerBaseSequence, 10) || 0)
    : (isNaN(parsedSeq) ? 0 : parsedSeq);

  const template = {
    ...npc,
    _id: uid(),
    _isFollower: true,
    _followerBaseSequence: baseSeq,
  };

  followerPool.push(template);
  save();
  renderFollowerPool();
};

window.addFollowerToEncounter = function(followerId) {
  const follower = followerPool.find(f => f._id === followerId);
  if (!follower) return;

  const parsedSeq = parseInt(follower.sequence, 10);
  const baseSeq = parseInt(follower._followerBaseSequence, 10) || (isNaN(parsedSeq) ? 0 : parsedSeq);

  const row = {
    ...newNpc(),
    ...follower,
    _id: uid(),
    _isFollower: true,
    _followerBaseSequence: baseSeq,
    sequence: String(baseSeq),
  };

  npcs.push(row);
  save();
  renderNpcTable();
  renderSequenceTracker();
  updateTabCounts();
};

window.removeFollower = function(followerId) {
  followerPool = followerPool.filter(f => f._id !== followerId);
  save();
  renderFollowerPool();
};

// ─── Sequence Tracker ─────────────────────────────────────────────────────────

/**
 * Build the combined sequence list from:
 *  1. Loaded player characters (stats.Sequence, already accounts for traits/perks)
 *  2. NPC table rows with a sequence value
 *  3. Manual sidebar-only extras (seqExtras)
 */
function buildSeqEntries() {
  const entries = [];

  // Player characters
  characters.forEach(char => {
    const seq = getCharacterSequence(char);
    if (seq === null) return;
    const id    = charId(char);
    const conds = getConditions(id);
    const hp    = char.stats?.Hit_Points ?? null;
    entries.push({
      id:      'pc:' + id,
      name:    char.name || 'Unknown',
      seq,
      type:    'PC',
      hp,
      hpMax:   hp,
      conds,
      status:  null,
      faction: null,
      race:    char.race || '',
      level:   char.level || 1,
    });
  });

  // NPCs from encounter table
  npcs.forEach(npc => {
    let seq = npc.sequence !== '' ? Number(npc.sequence) : null;
    if (seq === null || isNaN(seq)) return;

    // Followers always receive a natural +2 sequence bonus for turn order.
    // Prefer persisted base sequence when available to avoid double-stacking.
    if (npc._isFollower) {
      const base = parseInt(npc._followerBaseSequence, 10);
      seq = !isNaN(base) ? (base + 2) : (seq + 2);
    }

    const cur = parseFloat(npc.hpCurrent);
    const max = parseFloat(npc.hpMax);
    entries.push({
      id:      'npc:' + npc._id,
      name:    npc.name || 'NPC',
      seq,
      type:    'NPC',
      hp:      isNaN(cur) ? null : cur,
      hpMax:   isNaN(max) ? null : max,
      conds:   [],
      status:  npc.status || 'neutral',
      faction: npc.faction === 'Custom…' ? (npc.customFaction || 'Custom') : (npc.faction || ''),
      race:    '',
      level:   null,
      ac:      getNpcEffectiveAc(npc),
    });
  });

  // Sidebar-only manual extras
  seqExtras.forEach(e => {
    entries.push({
      id:      'extra:' + e.id,
      name:    e.name,
      seq:     e.seq,
      type:    'NPC',
      hp:      null,
      hpMax:   null,
      conds:   [],
      status:  'neutral',
      faction: '',
      race:    '',
      level:   null,
      ac:      null,
    });
  });

  return entries;
}

let seqEntries = [];  // sorted list, rebuilt on each render

function renderNowActingCard(entry) {
  const card = document.getElementById('now-acting-card');
  if (!card) return;

  if (!seqEntries.length) {
    card.innerHTML = `<div class="now-acting-empty">Load characters or add NPCs to begin.</div>`;
    return;
  }

  if (!entry) {
    card.innerHTML = `<div class="now-acting-empty">Press Next Turn to begin.</div>`;
    return;
  }

  const hpHtml = entry.hp !== null
    ? `<span class="seq-hp${entry.hpMax && entry.hpMax > 0 ? (entry.hp / entry.hpMax > 0.6 ? '' : entry.hp / entry.hpMax > 0.3 ? ' low' : ' crit') : ''}">${entry.hpMax ? `HP ${entry.hp} / ${entry.hpMax}` : `HP ${entry.hp}`}</span>`
    : '';
  const statusHtml = entry.status
    ? `<span class="seq-status seq-status-${entry.status}">${sanitize(entry.status)}</span>`
    : '';
  const acHtml = entry.ac !== null && entry.ac !== undefined
    ? `<span class="seq-faction">AC ${sanitize(String(entry.ac))}</span>`
    : '';

  let contextHtml = '';
  if (entry.faction) {
    contextHtml = `<span class="seq-faction">${sanitize(entry.faction)}</span>`;
  } else {
    const parts = [];
    if (entry.race) parts.push(entry.race);
    if (entry.level) parts.push(`Lvl ${entry.level}`);
    if (parts.length) contextHtml = `<span class="seq-faction">${sanitize(parts.join(' · '))}</span>`;
  }

  card.innerHTML = `
    <div class="now-acting-head">
      <span class="now-acting-title">Now Acting</span>
      <span class="now-acting-seq">SEQ ${sanitize(String(entry.seq))}</span>
    </div>
    <div class="now-acting-name">${sanitize(entry.name)}</div>
    <div class="now-acting-meta">
      <span class="seq-type">${sanitize(entry.type)}</span>
      ${statusHtml}
      ${hpHtml}
      ${acHtml}
      ${contextHtml}
    </div>
  `;
}

function renderSequenceTracker() {
  seqEntries = buildSeqEntries();
  seqEntries.sort((a, b) => b.seq - a.seq);
  renderCombatTargetOptions();
  syncDefenseAcFromSelectedTarget();

  if (seqEntries.length === 0) seqActiveIdx = -1;
  else if (seqActiveIdx >= seqEntries.length) seqActiveIdx = 0;

  const list = document.getElementById('seq-list');
  if (!seqEntries.length) {
    renderNowActingCard(null);
    list.innerHTML = `<div class="empty-state" style="padding:12px;font-size:0.8rem">Load characters or add NPCs to begin.</div>`;
    return;
  }

  const displayEntries = seqActiveIdx >= 0
    ? seqEntries.slice(seqActiveIdx).concat(seqEntries.slice(0, seqActiveIdx))
    : seqEntries;

  const activeEntry = seqActiveIdx >= 0 ? displayEntries[0] : null;
  renderNowActingCard(activeEntry);

  list.innerHTML = displayEntries.map((e, i) => {
    const isActive = seqActiveIdx >= 0 ? i === 0 : false;

    // HP pill
    let hpHtml = '';
    if (e.hp !== null) {
      const ratio  = (e.hpMax && e.hpMax > 0) ? e.hp / e.hpMax : null;
      const hpCls  = ratio === null ? '' : ratio > 0.6 ? '' : ratio > 0.3 ? ' low' : ' crit';
      const hpLbl  = e.hpMax ? `HP ${e.hp} / ${e.hpMax}` : `HP ${e.hp}`;
      hpHtml = `<span class="seq-hp${hpCls}">${hpLbl}</span>`;
    }

    // Status badge (NPCs only)
    const statusHtml = e.status
      ? `<span class="seq-status seq-status-${e.status}">${e.status}</span>` : '';

    // Faction or Race/Level
    let metaHtml = '';
    if (e.faction) {
      metaHtml = `<span class="seq-faction">${sanitize(e.faction)}</span>`;
    } else if (e.race || e.level) {
      const parts = [];
      if (e.race)  parts.push(e.race);
      if (e.level) parts.push(`Lvl ${e.level}`);
      metaHtml = `<span class="seq-faction">${parts.join(' · ')}</span>`;
    }

    if (e.ac !== null && e.ac !== undefined) {
      metaHtml += `<span class="seq-faction">AC ${sanitize(String(e.ac))}</span>`;
    }

    // Condition badges (mini)
    let condsHtml = '';
    if (e.conds && e.conds.length) {
      const badges = e.conds.map(c => {
        const label = c.startsWith('custom:') ? c.slice(7)
          : (PRESET_CONDITIONS.find(p => p.id === c)?.label || c);
        const cls = condClass(c);
        return `<span class="cond-badge ${cls}" style="font-size:0.58rem;padding:0px 4px">${sanitize(label)}</span>`;
      }).join('');
      condsHtml = `<div class="seq-conds">${badges}</div>`;
    }

    // Remove button (manual extras only)
    const removeBtn = e.id.startsWith('extra:')
      ? `<button class="seq-remove" onclick="removeSeqExtra('${sanitize(e.id.slice(6))}')" title="Remove">✕</button>` : '';

    const metaRow = (hpHtml || statusHtml || metaHtml)
      ? `<div class="seq-meta-row">${hpHtml}${statusHtml}${metaHtml}</div>` : '';

    return `<div class="seq-entry${isActive ? ' active-turn' : ''}" id="seq-entry-${i}">
      <span class="seq-num">${e.seq}</span>
      <div class="seq-body">
        <div class="seq-name-row">
          <span class="seq-label">${sanitize(e.name)}</span>
          <span class="seq-type">${e.type}</span>
        </div>
        ${metaRow}
        ${condsHtml}
      </div>
      ${removeBtn}
    </div>`;
  }).join('');
}

window.removeSeqExtra = function(id) {
  seqExtras = seqExtras.filter(e => e.id !== id);
  save();
  renderSequenceTracker();
};

// ─── Dice Roller ──────────────────────────────────────────────────────────────

function rollDice(sides) {
  const mod = parseInt(document.getElementById('dice-modifier').value, 10) || 0;
  const raw = Math.floor(Math.random() * sides) + 1;
  const total = raw + mod;

  const resultEl = document.getElementById('dice-result');
  resultEl.textContent = total;

  // Colour feedback
  if (sides === 20 && raw === 20) resultEl.style.color = '#34d399';
  else if (sides === 20 && raw === 1) resultEl.style.color = '#ef4444';
  else resultEl.style.color = '#fbbf24';

  // History (last 5)
  const desc = mod !== 0 ? `d${sides}${mod >= 0 ? '+' : ''}${mod}=${total}` : `d${sides}=${total}`;
  diceHistory.unshift(desc);
  if (diceHistory.length > 5) diceHistory.pop();

  const histEl = document.getElementById('dice-history');
  histEl.innerHTML = diceHistory.map((h, i) =>
    `<span style="opacity:${1 - i * 0.15}">${h}</span>`
  ).join(' · ');
}

// ─── Combat Roll Resolver (d100) ────────────────────────────────────────────

function rollD100Raw() {
  // 0 is displayed as "00" per requested rules.
  return Math.floor(Math.random() * 100);
}

function formatD100(raw) {
  if (raw === 0) return '00';
  return String(raw).padStart(2, '0');
}

function clampPercentileTarget(value) {
  return Math.max(1, Math.min(100, value));
}

function evaluatePercentileRoll(kind, target, modifier) {
  const raw = rollD100Raw();
  const effectiveTarget = clampPercentileTarget(target + modifier);

  const strategicWin = raw === 0;
  const nearFail = raw === 99;
  const canSaveNearFail = modifier > 0;
  const hardNearFail = nearFail && !canSaveNearFail;

  let success = false;
  let reason = '';

  if (strategicWin) {
    success = true;
    reason = 'Strategic Win (00)';
  } else if (hardNearFail) {
    success = false;
    reason = '99 near-fail with no positive modifier';
  } else {
    success = raw <= effectiveTarget;
    reason = success ? 'Success' : 'Failure';
  }

  const margin = success ? (effectiveTarget - raw) : (raw - effectiveTarget);

  return {
    kind,
    raw,
    rawLabel: formatD100(raw),
    target,
    modifier,
    effectiveTarget,
    success,
    margin,
    strategicWin,
    nearFail,
    hardNearFail,
    reason,
  };
}

function resultLine(r) {
  return `${r.kind}: roll ${r.rawLabel} vs ${r.effectiveTarget} (${r.target >= 0 ? r.target : 0}${r.modifier >= 0 ? ' + ' : ' - '}${Math.abs(r.modifier)}) — ${r.reason}`;
}

function resolveAttackVsDefense(attack, defense) {
  if (attack.strategicWin && !defense.strategicWin) {
    return 'Outcome: HIT. Attack Strategic Win (00) overrides defense.';
  }
  if (defense.strategicWin && !attack.strategicWin) {
    return 'Outcome: DEFENDED. Defense Strategic Win (00) evades the attack.';
  }
  if (attack.success && !defense.success) {
    return 'Outcome: HIT. Attack succeeded while defense failed.';
  }
  if (!attack.success && defense.success) {
    return 'Outcome: DEFENDED. Attack failed while defense succeeded.';
  }
  if (attack.success && defense.success) {
    const atkMargin = attack.effectiveTarget - attack.raw;
    const defMargin = defense.effectiveTarget - defense.raw;
    if (atkMargin >= defMargin) return 'Outcome: HIT. Both succeeded, attack had stronger margin.';
    return 'Outcome: DEFENDED. Both succeeded, defense had stronger margin.';
  }
  return 'Outcome: MISS / NO EFFECT. Both sides failed.';
}

let selectedCombatTargetId = '';
let selectedDistanceHex = 0;

function getCombatTargets(excludeEntryId = null) {
  const targets = [];

  characters.forEach(char => {
    const entryId = `pc:${charId(char)}`;
    if (excludeEntryId === entryId) return;
    const label = `${char.name || 'Unknown'} (PC)`;
    const ac = parseInt(char.stats?.Armor_Class, 10);
    targets.push({
      id: entryId,
      label,
      armorClass: isNaN(ac) ? null : Math.max(0, ac),
    });
  });

  npcs.forEach(npc => {
    const entryId = `npc:${npc._id}`;
    if (excludeEntryId === entryId) return;
    const label = `${npc.name || 'NPC'} (NPC)`;
    const ac = getNpcEffectiveAc(npc);
    targets.push({
      id: entryId,
      label,
      armorClass: isNaN(ac) ? null : Math.max(0, ac),
    });
  });

  return targets;
}

function renderCombatTargetOptions() {
  const list = document.getElementById('combat-target-list');
  if (!list) return;

  const activeEntryId = (seqActiveIdx >= 0 && seqEntries[seqActiveIdx]) ? seqEntries[seqActiveIdx].id : null;
  const targets = getCombatTargets(activeEntryId);

  if (selectedCombatTargetId && !targets.some(t => t.id === selectedCombatTargetId)) {
    selectedCombatTargetId = '';
  }

  if (!targets.length) {
    list.innerHTML = `<span style="font-size:0.72rem;color:var(--muted)">No targets available.</span>`;
    return;
  }

  list.innerHTML = targets.map(t =>
    `<button type="button" class="combat-picker-btn${t.id === selectedCombatTargetId ? ' active' : ''}" data-target-id="${sanitize(t.id)}">${sanitize(t.label)}</button>`
  ).join('');
}

function renderDistanceHexOptions() {
  const list = document.getElementById('distance-hex-list');
  if (!list) return;

  const values = [0];

  for (let hex = 1; hex <= 50; hex += 1) {
    values.push(hex);
  }
  for (let hex = 60; hex <= 500; hex += 10) {
    values.push(hex);
  }

  if (!values.includes(selectedDistanceHex)) selectedDistanceHex = 0;

  list.innerHTML = values.map(v =>
    `<button type="button" class="combat-picker-btn${v === selectedDistanceHex ? ' active' : ''}" data-distance-hex="${v}">${v}</button>`
  ).join('');
}

function getSelectedCombatTarget() {
  const activeEntryId = (seqActiveIdx >= 0 && seqEntries[seqActiveIdx]) ? seqEntries[seqActiveIdx].id : null;
  return getCombatTargets(activeEntryId).find(t => t.id === selectedCombatTargetId) || null;
}

function syncDefenseAcFromSelectedTarget() {
  const defAcModEl = document.getElementById('defense-ac-mod-input');
  if (!defAcModEl) return;
  const target = getSelectedCombatTarget();
  defAcModEl.value = target && target.armorClass !== null ? String(target.armorClass) : '0';
}

function initCombatRollResolver() {
  const atkTargetEl = document.getElementById('attack-target-input');
  const atkModEl = document.getElementById('attack-mod-input');
  const defTargetEl = document.getElementById('defense-target-input');
  const defAcModEl = document.getElementById('defense-ac-mod-input');
  const distanceHexListEl = document.getElementById('distance-hex-list');
  const defModEl = document.getElementById('defense-mod-input');
  const outEl = document.getElementById('combat-roll-result');
  const targetListEl = document.getElementById('combat-target-list');
  const attackBtn = document.getElementById('roll-attack-btn');
  const defenseBtn = document.getElementById('roll-defense-btn');
  const resolveBtn = document.getElementById('resolve-attack-defense-btn');

  if (!atkTargetEl || !atkModEl || !defTargetEl || !defAcModEl || !distanceHexListEl || !defModEl || !outEl || !targetListEl || !attackBtn || !defenseBtn || !resolveBtn) {
    return;
  }

  renderDistanceHexOptions();
  renderCombatTargetOptions();
  syncDefenseAcFromSelectedTarget();

  const readInputs = () => {
    const attackTarget = parseInt(atkTargetEl.value, 10);
    const attackMod = parseInt(atkModEl.value, 10) || 0;
    const defenseTarget = parseInt(defTargetEl.value, 10);
    const defenseAcMod = parseInt(defAcModEl.value, 10) || 0;
    const distanceMod = selectedDistanceHex || 0;
    const defenseModManual = parseInt(defModEl.value, 10) || 0;
    const defenseMod = defenseAcMod + distanceMod + defenseModManual;
    return {
      attackTarget: isNaN(attackTarget) ? 1 : clampPercentileTarget(attackTarget),
      attackMod,
      defenseTarget: isNaN(defenseTarget) ? 1 : clampPercentileTarget(defenseTarget),
      defenseAcMod,
      distanceMod,
      defenseModManual,
      defenseMod,
      selectedTargetId: selectedCombatTargetId,
    };
  };

  targetListEl.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-target-id]');
    if (!btn) return;
    selectedCombatTargetId = btn.dataset.targetId || '';
    renderCombatTargetOptions();
    syncDefenseAcFromSelectedTarget();
  });

  distanceHexListEl.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-distance-hex]');
    if (!btn) return;
    const hex = parseInt(btn.dataset.distanceHex, 10);
    selectedDistanceHex = isNaN(hex) ? 0 : hex;
    renderDistanceHexOptions();
  });

  attackBtn.addEventListener('click', () => {
    const i = readInputs();
    const attack = evaluatePercentileRoll('Attack', i.attackTarget, i.attackMod);
    const selected = getSelectedCombatTarget();
    const targetLine = selected ? `Target: ${selected.label}` : 'Target: (none selected)';
    const defenseLine = `Defense mods -> AC ${i.defenseAcMod}, distance ${i.distanceMod}, manual ${i.defenseModManual}, total ${i.defenseMod}`;
    outEl.innerHTML = `${sanitize(targetLine)}<br>${sanitize(defenseLine)}<br>${sanitize(resultLine(attack))}`;
  });

  defenseBtn.addEventListener('click', () => {
    const i = readInputs();
    const defense = evaluatePercentileRoll('Defense', i.defenseTarget, i.defenseMod);
    const selected = getSelectedCombatTarget();
    const targetLine = selected ? `Target: ${selected.label}` : 'Target: (none selected)';
    const defenseLine = `Defense mods -> AC ${i.defenseAcMod}, distance ${i.distanceMod}, manual ${i.defenseModManual}, total ${i.defenseMod}`;
    outEl.innerHTML = `${sanitize(targetLine)}<br>${sanitize(defenseLine)}<br>${sanitize(resultLine(defense))}`;
  });

  resolveBtn.addEventListener('click', () => {
    const i = readInputs();
    const attack = evaluatePercentileRoll('Attack', i.attackTarget, i.attackMod);
    const defense = evaluatePercentileRoll('Defense', i.defenseTarget, i.defenseMod);
    const selected = getSelectedCombatTarget();
    const targetLine = selected ? `Target: ${selected.label}` : 'Target: (none selected)';
    const defenseLine = `Defense mods -> AC ${i.defenseAcMod}, distance ${i.distanceMod}, manual ${i.defenseModManual}, total ${i.defenseMod}`;
    outEl.innerHTML = `${sanitize(targetLine)}<br>${sanitize(defenseLine)}<br>${sanitize(resultLine(attack))}<br>${sanitize(resultLine(defense))}<br><b>${sanitize(resolveAttackVsDefense(attack, defense))}</b>`;
  });
}

// ─── Session Notes ────────────────────────────────────────────────────────────

let notesSaveTimer = null;

function initNotes() {
  const ta   = document.getElementById('session-notes');
  const saved = document.getElementById('notes-saved');
  ta.value = localStorage.getItem('gm_notes') || '';

  ta.addEventListener('input', () => {
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(() => {
      localStorage.setItem('gm_notes', ta.value);
      saved.classList.add('show');
      setTimeout(() => saved.classList.remove('show'), 1500);
    }, 600);
  });
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-panel-' + btn.dataset.tab).classList.add('active');
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const btn   = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const panel = document.getElementById('tab-panel-' + tabName);
  if (btn)   btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

function updateTabCounts() {
  const pc = document.getElementById('tab-players-count');
  const nc = document.getElementById('tab-encounter-count');
  if (pc) pc.textContent = characters.length || '';
  if (nc) nc.textContent = npcs.length || '';
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

function initUpload() {
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('file-input');
  const dropZone  = document.getElementById('drop-zone');

  uploadBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click',  () => fileInput.click());

  fileInput.addEventListener('change', () => {
    processFiles(fileInput.files);
    fileInput.value = '';
  });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    processFiles(e.dataTransfer.files);
  });
}

function initDiceRoller() {
  document.getElementById('dice-toggle-btn').addEventListener('click', () => {
    document.getElementById('dice-panel').classList.toggle('open');
  });

  document.querySelectorAll('.dice-btn').forEach(btn => {
    btn.addEventListener('click', () => rollDice(parseInt(btn.dataset.sides, 10)));
  });
}

function initNpcTable() {
  const refInput = document.getElementById('npc-ref-input');
  const addNpcBtn = document.getElementById('add-npc-btn');
  let addCritterBtn = document.getElementById('add-critter-btn');
  let addRobotBtn = document.getElementById('add-robot-btn');

  // Fallback: ensure the Add Critter control exists even if markup is stale.
  if (!addCritterBtn && addNpcBtn) {
    const actionRow = addNpcBtn.closest('.encounter-action-row') || addNpcBtn.parentElement;
    if (actionRow) {
      addCritterBtn = document.createElement('button');
      addCritterBtn.id = 'add-critter-btn';
      addCritterBtn.textContent = '🐾 Add Critter';
      actionRow.appendChild(addCritterBtn);
    }
  }

  // Fallback: ensure the Add Robot control exists even if markup is stale.
  if (!addRobotBtn && addNpcBtn) {
    const actionRow = addNpcBtn.closest('.encounter-action-row') || addNpcBtn.parentElement;
    if (actionRow) {
      addRobotBtn = document.createElement('button');
      addRobotBtn.id = 'add-robot-btn';
      addRobotBtn.textContent = '🤖 Generate & Add Robot';
      actionRow.appendChild(addRobotBtn);
    }
  }

  refInput.value = npcReference;

  refInput.addEventListener('input', () => {
    npcReference = refInput.value;
    save();
  });

  if (addNpcBtn) {
    addNpcBtn.addEventListener('click', () => {
      openGenModal();
    });
  }

  if (addCritterBtn) {
    addCritterBtn.addEventListener('click', () => {
      openCritterModal('critter');
    });
  }

  if (addRobotBtn) {
    addRobotBtn.addEventListener('click', () => {
      openCritterModal('robot');
    });
  }
}

function initSequenceTracker() {
  document.getElementById('seq-sort-btn').addEventListener('click', () => {
    seqActiveIdx = -1;
    renderSequenceTracker();
  });

  document.getElementById('seq-next-btn').addEventListener('click', () => {
    if (!seqEntries.length) return;
    seqActiveIdx = (seqActiveIdx + 1) % seqEntries.length;
    renderSequenceTracker();
  });

  document.getElementById('seq-reset-btn').addEventListener('click', () => {
    seqActiveIdx = -1;
    renderSequenceTracker();
  });

  document.getElementById('seq-add-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('seq-npc-name');
    const numInput  = document.getElementById('seq-npc-num');
    const name = nameInput.value.trim();
    const seq  = parseInt(numInput.value, 10);
    if (!name || isNaN(seq)) return;

    seqExtras.push({ id: uid(), name, seq });
    nameInput.value = '';
    numInput.value  = '';
    save();
    renderSequenceTracker();
  });
}

// ─── NPC Generator Modal ────────────────────────────────────────────────────────────────────────────────

let generatedPreviewChar = null; // holds the last generated character
let generatedCritterRow = null;
let critterModalMode = 'critter';
let lastRobotTemplateId = '';

function openGenModal() {
  document.getElementById('npc-gen-modal').style.display = 'flex';
  showGenForm();
}

function closeGenModal() {
  document.getElementById('npc-gen-modal').style.display = 'none';
  generatedPreviewChar = null;
}

function showGenForm() {
  document.getElementById('npc-gen-form-wrap').style.display = '';
  document.getElementById('npc-gen-preview-wrap').style.display = 'none';
}

function showGenPreview(char) {
  const wrap    = document.getElementById('npc-gen-preview-wrap');
  const preview = document.getElementById('npc-gen-preview');

  const id      = charId(char);
  const attr    = char.attributes || {};
  const stats   = char.stats      || {};
  const arch    = char._archetype  ? char._archetype.charAt(0).toUpperCase() + char._archetype.slice(1) : '';

  // SPECIAL pills
  const specialHtml = SPECIAL_KEYS.map(s =>
    `<span class="sp-pill"><span style="font-size:0.6rem;color:var(--muted)">${s.abbr}</span> <b>${attr[s.key] ?? '—'}</b></span>`
  ).join('');

  // Header section
  let html = `
    <div style="margin-bottom:12px">
      <div class="gen-preview-badge">Generated NPC</div>
      <div class="gen-preview-name">${sanitize(char.name)}${char._rank ? ` <span style="font-size:0.7rem;font-weight:600;color:var(--muted);margin-left:6px">${sanitize(char._rank)}</span>` : ''}</div>
      <div class="gen-preview-meta">
        ${sanitize(char.race)} &middot; ${arch} &middot; Level ${char.level}
        ${char._faction && char._faction !== 'Custom' ? '&middot; ' + sanitize(char._faction) : ''}
        &middot; ${sanitize(char.gender || '')} &middot; Age ${char.age || '?'}${char.age > 0 && char.age < 18 ? ' <span style="color:#ef4444;font-weight:700">⚠ Child</span>' : char.age > 0 && char.age <= 19 ? ' <span style="color:#ef4444;font-weight:700">⚠ Teenager</span>' : char.age > 0 && char.age < 25 ? ' <span style="color:#fbbf24;font-weight:700">⚠ Young</span>' : ''}
      </div>
      <div class="char-stats-pill" style="margin-bottom:8px">
        <span class="stat-pill hp">HP ${stats.Hit_Points ?? '—'}</span>
        <span class="stat-pill ac">AC ${stats.Armor_Class ?? '—'}</span>
        <span class="stat-pill ap">AP ${stats.Action_Points ?? '—'}</span>
        <span class="stat-pill seq">SEQ ${stats.Sequence ?? '—'}</span>
      </div>
      <div class="special-pills">${specialHtml}</div>
    </div>`;

  // Full detail (without condition panel — not yet in list)
  html += renderCharDetailNoConditions(char, id);

  preview.innerHTML = html;
  document.getElementById('npc-gen-form-wrap').style.display  = 'none';
  wrap.style.display = '';
}

// Render full detail without the condition toggle panel (for preview use)
function renderCharDetailNoConditions(char, id) {
  const attr    = char.attributes || {};
  const stats   = char.stats      || {};
  const skills  = char.skills     || {};
  const tagSkills = char.tagSkills || {};

  const specialCells = SPECIAL_KEYS.map(s => `
    <div class="special-cell">
      <div class="label">${s.abbr}</div>
      <div class="value">${attr[s.key] ?? '—'}</div>
    </div>`).join('');

  const statsHtml = STAT_DISPLAY.map(s => {
    const val = stats[s.key];
    if (val === undefined || val === null) return '';
    const display = s.unit ? `${val}${s.unit}` : val;
    return `<div class="stat-row${s.seq ? ' seq' : ''}">
      <span class="lbl">${s.label}</span><span class="val">${display}</span></div>`;
  }).join('');

  const skillsHtml = Object.entries(SKILL_CATEGORIES).map(([cat, keys]) => {
    const rows = keys.map(k => {
      const val = skills[k];
      if (val === undefined) return '';
      const tagHtml = tagSkills[k] ? '<span class="tag-badge">T</span>' : '';
      return `<div class="skill-line">
        <span class="sname">${tagHtml}${SKILL_LABELS[k]}</span>
        <span class="sval">${val}%</span></div>`;
    }).join('');
    return `<div class="skills-section"><div class="skills-cat-label">${cat}</div>${rows}</div>`;
  }).join('');

  const perks   = char.selectedPerks || [];
  const perksHtml = perks.length
    ? `<div class="perk-list">${perks.map(p =>
        `<span class="perk-tag" title="Rank ${p.rank} — level ${p.modifiedAtLevel}">${perkLabel(p)}</span>`
      ).join('')}</div>`
    : '<span style="font-size:0.78rem;color:var(--muted)">None</span>';

  const traits = char.selectedTraits || [];
  const traitsHtml = traits.length
    ? `<div class="trait-list">${traits.map(t =>
        `<span class="trait-tag">${traitLabel(t)}</span>`
      ).join('')}</div>`
    : '<span style="font-size:0.78rem;color:var(--muted)">None</span>';

  let equipHtml = '<span style="font-size:0.78rem;color:var(--muted)">None</span>';
  const equip = char.equipment;
  if (equip && equip.items && Object.keys(equip.items).length) {
    const rows = Object.entries(equip.items).map(([n, q]) =>
      `<tr><td>${sanitize(n)}</td><td>×${q}</td></tr>`).join('');
    equipHtml = `<table class="equip-table"><tbody>${rows}</tbody></table>
      <div class="equip-footer">
        <span><b>${equip.totalWeight ?? '?'}</b> lbs</span>
        <span>Value: <b>${equip.totalCost ?? '?'}</b> caps</span>
      </div>`;
  }

  return `<div class="detail-grid">
    <div class="detail-card" style="grid-column:1/-1">
      <div class="detail-card-title">S.P.E.C.I.A.L.</div>
      <div class="special-grid">${specialCells}</div>
    </div>
    <div class="detail-card">
      <div class="detail-card-title">Secondary Stats</div>${statsHtml}
    </div>
    <div class="detail-card">
      <div class="detail-card-title">Skills</div>${skillsHtml}
    </div>
    <div class="detail-card">
      <div class="detail-card-title">Traits</div>${traitsHtml}
    </div>
    <div class="detail-card">
      <div class="detail-card-title">Perks</div>${perksHtml}
    </div>
    <div class="detail-card" style="grid-column:1/-1">
      <div class="detail-card-title">Equipment</div>${equipHtml}
    </div>
  </div>`;
}

function initGenModal() {
  document.getElementById('gen-npc-btn').addEventListener('click', openGenModal);
  document.getElementById('gen-modal-close').addEventListener('click', closeGenModal);

  // Close on backdrop click
  document.getElementById('npc-gen-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('npc-gen-modal')) closeGenModal();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('npc-gen-modal').style.display !== 'none') {
      closeGenModal();
    }
  });

  // Generate button
  document.getElementById('gen-generate-btn').addEventListener('click', () => {
    const config = {
      name:      document.getElementById('gen-name').value.trim(),
      race:      document.getElementById('gen-race').value,
      faction:   document.getElementById('gen-faction').value,
      archetype: document.getElementById('gen-archetype').value,
      level:     parseInt(document.getElementById('gen-level').value, 10) || 5,
      sex:       document.getElementById('gen-sex').value,
      age:       parseInt(document.getElementById('gen-age').value, 10) || null,
      armor:     document.getElementById('gen-armor').value,
    };
    generatedPreviewChar = generateNPC(config);
    showGenPreview(generatedPreviewChar);
  });

  // Reroll button — re-run with same settings
  document.getElementById('gen-reroll-btn').addEventListener('click', () => {
    if (!generatedPreviewChar) return;
    const config = {
      name:      document.getElementById('gen-name').value.trim(),
      race:      generatedPreviewChar.race,
      faction:   generatedPreviewChar._faction,
      archetype: generatedPreviewChar._archetype,
      level:     generatedPreviewChar.level,
      sex:       document.getElementById('gen-sex').value,
      age:       parseInt(document.getElementById('gen-age').value, 10) || null,
      armor:     document.getElementById('gen-armor').value,
    };
    generatedPreviewChar = generateNPC(config);
    showGenPreview(generatedPreviewChar);
  });

  // Add generated NPC to the NPC encounter table
  document.getElementById('gen-add-btn').addEventListener('click', () => {
    if (!generatedPreviewChar) return;
    const c = generatedPreviewChar;

    // Map generated character fields onto an NPC table row
    const faction = (c._faction && c._faction !== 'Custom') ? c._faction : '';
    const row = {
      ...newNpc(),
      name:      c.name || '',
      faction:   FACTIONS.includes(faction) ? faction : (faction ? 'Custom…' : ''),
      customFaction: FACTIONS.includes(faction) ? '' : faction,
      status:    'neutral',
      hpCurrent: String(c.stats?.Hit_Points ?? ''),
      hpMax:     String(c.stats?.Hit_Points ?? ''),
      acBase:    String(Math.max(0, (Number(c.stats?.Armor_Class) || 0) - (Number(c._armorClassFromArmor) || 0))),
      armor:     c.equipment?.items ? Object.keys(c.equipment.items).find(k =>
                   k.toLowerCase().includes('armor') ||
                   k.toLowerCase().includes('jacket') ||
                   k.toLowerCase().includes('suit')  ||
                   k.toLowerCase().includes('robe')
                 ) || '' : '',
      sequence:  String(c.stats?.Sequence ?? ''),
      notes:     `${(c._archetype||'').charAt(0).toUpperCase() + (c._archetype||'').slice(1)} · Lvl ${c.level}`,
      age:       c.age != null ? String(c.age) : '',
    };

    npcs.push(row);
    save();
    renderNpcTable();
    renderSequenceTracker();

    closeGenModal();
    switchTab('encounter');
    setTimeout(() => {
      document.getElementById('npc-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  });

  // Back button
  document.getElementById('gen-back-btn').addEventListener('click', () => {
    showGenForm();
  });
}

function getCritterModalPool() {
  if (critterModalMode === 'robot') {
    return robotTemplates.length ? robotTemplates : DEFAULT_ROBOT_TEMPLATES;
  }
  return critterTemplates;
}

function getCritterModalTypeLabel() {
  return critterModalMode === 'robot' ? 'Robot' : 'Critter';
}

function openCritterModal(mode = 'critter') {
  critterModalMode = mode === 'robot' ? 'robot' : 'critter';
  const nameInput = document.getElementById('critter-name');
  if (nameInput) nameInput.value = '';
  document.getElementById('critter-gen-modal').style.display = 'flex';
  showCritterForm();
}

function closeCritterModal() {
  document.getElementById('critter-gen-modal').style.display = 'none';
  generatedCritterRow = null;
}

function showCritterForm() {
  document.getElementById('critter-gen-form-wrap').style.display = '';
  document.getElementById('critter-gen-preview-wrap').style.display = 'none';

  const typeLabel = getCritterModalTypeLabel();
  const modalTitle = document.getElementById('critter-modal-title');
  const templateLabel = document.getElementById('critter-template-label');
  const generateBtn = document.getElementById('critter-generate-btn');
  if (modalTitle) modalTitle.textContent = critterModalMode === 'robot' ? '🤖 Robot Generator' : '🐾 Critter Generator';
  if (templateLabel) templateLabel.textContent = `${typeLabel} Template`;
  if (generateBtn) generateBtn.textContent = `Generate ${typeLabel}`;

  const templateSelect = document.getElementById('critter-template');
  const pool = getCritterModalPool();
  templateSelect.innerHTML = pool.map(t =>
    `<option value="${sanitize(t.id)}">${sanitize(t.name)}</option>`
  ).join('');

  enforceReadableSelects(document.getElementById('critter-gen-modal'));

  if (pool.length) {
    const preferredId = critterModalMode === 'robot'
      ? (lastRobotTemplateId || pool[0].id)
      : pool[0].id;
    const hasPreferred = pool.some(t => t.id === preferredId);
    templateSelect.value = hasPreferred ? preferredId : pool[0].id;
  }

  if (!pool.length) {
    document.getElementById('critter-name').value = '';
    return;
  }

  if (!document.getElementById('critter-name').value.trim()) {
    const template = findAnyCreatureTemplate(templateSelect.value || pool[0]?.id);
    if (template) document.getElementById('critter-name').value = makeCritterName(template.name);
  }
}

function showCritterPreview(row) {
  const wrap = document.getElementById('critter-gen-preview-wrap');
  const preview = document.getElementById('critter-gen-preview');

  const level = parseInt(row.level, 10) || 1;
  const typeLabel = getCritterModalTypeLabel();
  const badgeHue = critterModalMode === 'robot'
    ? 'background:rgba(96,165,250,0.15);border-color:rgba(96,165,250,0.45);color:#60a5fa'
    : 'background:rgba(74,222,128,0.15);border-color:rgba(74,222,128,0.45);color:#4ade80';
  const html = `
    <div style="margin-bottom:12px">
      <div class="gen-preview-badge" style="${badgeHue}">Generated ${sanitize(typeLabel)}</div>
      <div class="gen-preview-name">${sanitize(row.name)}</div>
      <div class="gen-preview-meta">Level ${sanitize(String(level))} · XP ${sanitize(String(row.xp || 0))}</div>
      <div class="char-stats-pill" style="margin-bottom:8px">
        <span class="stat-pill hp">HP ${sanitize(String(row.hpMax || '—'))}</span>
        <span class="stat-pill ac">AC ${sanitize(String(row.acBase || '—'))}</span>
        <span class="stat-pill ap">AP ${sanitize((row.notes.match(/AP\s+(\d+)/)?.[1]) || '—')}</span>
        <span class="stat-pill seq">SQ ${sanitize(String(row.sequence || '—'))}</span>
      </div>
    </div>
    <div class="detail-card" style="margin-top:8px">
      <div class="detail-card-title">Attacks</div>
      <div style="font-size:0.82rem;line-height:1.5;color:var(--text)">${sanitize(row.attacks || 'None')}</div>
    </div>
    <div class="detail-card" style="margin-top:10px">
      <div class="detail-card-title">Combat Notes</div>
      <div style="font-size:0.82rem;color:var(--muted)">${sanitize(row.notes || '')}</div>
    </div>`;

  preview.innerHTML = html;
  document.getElementById('critter-gen-form-wrap').style.display = 'none';
  wrap.style.display = '';
}

function initCritterModal() {
  const modal = document.getElementById('critter-gen-modal');
  const closeBtn = document.getElementById('critter-modal-close');
  const templateSelect = document.getElementById('critter-template');
  const levelInput = document.getElementById('critter-level');
  const nameInput = document.getElementById('critter-name');
  const generateBtn = document.getElementById('critter-generate-btn');
  const rerollBtn = document.getElementById('critter-reroll-btn');
  const backBtn = document.getElementById('critter-back-btn');
  const addBtn = document.getElementById('critter-add-btn');

  if (!modal || !closeBtn || !templateSelect || !levelInput || !nameInput || !generateBtn || !rerollBtn || !backBtn || !addBtn) return;

  closeBtn.addEventListener('click', closeCritterModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeCritterModal();
  });

  templateSelect.addEventListener('change', () => {
    if (critterModalMode === 'robot') {
      lastRobotTemplateId = templateSelect.value || '';
    }
    const template = findAnyCreatureTemplate(templateSelect.value);
    if (template) nameInput.value = makeCritterName(template.name);
  });

  generateBtn.addEventListener('click', () => {
    const pool = getCritterModalPool();
    const templateId = templateSelect.value || pool[0]?.id;
    if (critterModalMode === 'robot') {
      lastRobotTemplateId = templateId || '';
    }
    const name = nameInput.value.trim();
    const level = parseInt(levelInput.value, 10) || 1;
    const typeLabel = getCritterModalTypeLabel();
    const template = findAnyCreatureTemplate(templateId);
    generatedCritterRow = buildCritterRowFromTemplate(template, name, level, typeLabel);
    if (generatedCritterRow && critterModalMode === 'robot') generatedCritterRow._isRobot = true;
    if (!generatedCritterRow) return;
    showCritterPreview(generatedCritterRow);
  });

  rerollBtn.addEventListener('click', () => {
    const pool = getCritterModalPool();
    const template = findAnyCreatureTemplate(templateSelect.value || pool[0]?.id);
    if (critterModalMode === 'robot') {
      lastRobotTemplateId = templateSelect.value || '';
    }
    if (!template) return;
    nameInput.value = makeCritterName(template.name);
    const level = parseInt(levelInput.value, 10) || 1;
    const typeLabel = getCritterModalTypeLabel();
    generatedCritterRow = buildCritterRowFromTemplate(template, nameInput.value, level, typeLabel);
    if (generatedCritterRow && critterModalMode === 'robot') generatedCritterRow._isRobot = true;
    if (!generatedCritterRow) return;
    showCritterPreview(generatedCritterRow);
  });

  backBtn.addEventListener('click', showCritterForm);

  addBtn.addEventListener('click', () => {
    if (!generatedCritterRow) return;
    npcs.push(generatedCritterRow);
    save();
    renderNpcTable();
    renderSequenceTracker();
    updateTabCounts();
    closeCritterModal();
    switchTab('encounter');
  });
}

// ─── Boot ───────────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadCritterTemplatesFromDatabase();
  load();
  syncPlayerTimersWithCharacters();
  initPlayerTimerTicker();
  initTabs();
  initUpload();
  initDiceRoller();
  initNpcTable();
  initSequenceTracker();
  initCombatRollResolver();
  initNotes();
  initGenModal();
  initCritterModal();
  renderCharacters();
  renderNpcTable();
  renderFollowerPool();
  renderSequenceTracker();
  updateTabCounts();

  // Keep dropdowns readable even when modal/content updates happen later.
  enforceReadableSelects(document);
  const selectObserver = new MutationObserver(() => enforceReadableSelects(document));
  selectObserver.observe(document.body, { childList: true, subtree: true });
});
