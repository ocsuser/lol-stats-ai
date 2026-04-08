import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(__dirname, '../../../data');
const DB_PATH = path.join(DATA_DIR, 'lol-arena.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    puuid         TEXT    PRIMARY KEY,
    gameName      TEXT    NOT NULL,
    tagLine       TEXT    NOT NULL,
    profileIconId INTEGER NOT NULL,
    summonerLevel INTEGER NOT NULL,
    last_updated  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS matches (
    matchId    TEXT    PRIMARY KEY,
    puuid      TEXT    NOT NULL,
    data       TEXT    NOT NULL,
    fetched_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_matches_puuid ON matches(puuid);

  CREATE TABLE IF NOT EXISTS arena_stats (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    puuid        TEXT    NOT NULL,
    matchId      TEXT    NOT NULL,
    gameCreation INTEGER NOT NULL,
    gameDuration INTEGER NOT NULL,
    champion     TEXT    NOT NULL,
    champLevel   INTEGER NOT NULL,
    placement    INTEGER NOT NULL,
    kills        INTEGER NOT NULL,
    deaths       INTEGER NOT NULL,
    assists      INTEGER NOT NULL,
    damage       INTEGER NOT NULL,
    goldEarned   INTEGER NOT NULL DEFAULT 0,
    augments     TEXT    NOT NULL DEFAULT '[]',
    partner      TEXT,
    UNIQUE(puuid, matchId)
  );
  CREATE INDEX IF NOT EXISTS idx_stats_puuid ON arena_stats(puuid);

  CREATE TABLE IF NOT EXISTS augments_cache (
    id        INTEGER PRIMARY KEY,
    name      TEXT    NOT NULL,
    icon_url  TEXT    NOT NULL,
    cached_at INTEGER NOT NULL
  );
`);

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PlayerRow {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
  last_updated: number;
}

export interface ArenaStatsRow {
  puuid: string;
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  champion: string;
  champLevel: number;
  placement: number;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  goldEarned: number;
  augments: number[];
  partner: string | null;
}

// ─── Players ───────────────────────────────────────────────────────────────

const PLAYER_TTL = 10 * 60 * 1000; // 10 minutes

export function getPlayer(gameName: string, tagLine: string): PlayerRow | null {
  const row = db
    .prepare('SELECT * FROM players WHERE lower(gameName) = lower(?) AND lower(tagLine) = lower(?)')
    .get(gameName, tagLine) as PlayerRow | undefined;
  if (!row) return null;
  if (Date.now() - row.last_updated > PLAYER_TTL) return null; // stale — re-fetch
  return row;
}

export function upsertPlayer(p: PlayerRow): void {
  db.prepare(`
    INSERT OR REPLACE INTO players (puuid, gameName, tagLine, profileIconId, summonerLevel, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(p.puuid, p.gameName, p.tagLine, p.profileIconId, p.summonerLevel, p.last_updated);
}

// ─── Matches (raw JSON cache) ───────────────────────────────────────────────

export function getMatchRaw(matchId: string): unknown | null {
  const row = db.prepare('SELECT data FROM matches WHERE matchId = ?').get(matchId) as
    | { data: string }
    | undefined;
  if (!row) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}

export function storeMatchRaw(matchId: string, puuid: string, data: unknown): void {
  db.prepare('INSERT OR IGNORE INTO matches (matchId, puuid, data, fetched_at) VALUES (?, ?, ?, ?)').run(
    matchId, puuid, JSON.stringify(data), Date.now()
  );
}

/** Match IDs already processed into arena_stats for this player */
export function getProcessedMatchIds(puuid: string): Set<string> {
  const rows = db.prepare('SELECT matchId FROM arena_stats WHERE puuid = ?').all(puuid) as {
    matchId: string;
  }[];
  return new Set(rows.map((r) => r.matchId));
}

// ─── Arena Stats ───────────────────────────────────────────────────────────

export function upsertArenaStats(s: ArenaStatsRow): void {
  db.prepare(`
    INSERT OR IGNORE INTO arena_stats
      (puuid, matchId, gameCreation, gameDuration, champion, champLevel,
       placement, kills, deaths, assists, damage, goldEarned, augments, partner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    s.puuid, s.matchId, s.gameCreation, s.gameDuration,
    s.champion, s.champLevel, s.placement,
    s.kills, s.deaths, s.assists, s.damage, s.goldEarned,
    JSON.stringify(s.augments), s.partner ?? null
  );
}

export function getArenaStats(puuid: string): ArenaStatsRow[] {
  const rows = db
    .prepare('SELECT * FROM arena_stats WHERE puuid = ? ORDER BY gameCreation DESC')
    .all(puuid) as (Omit<ArenaStatsRow, 'augments'> & { augments: string })[];
  return rows.map((r) => ({ ...r, augments: JSON.parse(r.augments) as number[] }));
}

// ─── Augments Cache ────────────────────────────────────────────────────────

const AUGMENTS_TTL = 24 * 60 * 60 * 1000; // 24h

export function getAugmentsFromDB(): Record<number, { name: string; iconUrl: string }> | null {
  const rows = db.prepare('SELECT id, name, icon_url, cached_at FROM augments_cache LIMIT 1').all() as {
    id: number; name: string; icon_url: string; cached_at: number;
  }[];
  if (rows.length === 0) return null;
  if (Date.now() - rows[0].cached_at > AUGMENTS_TTL) return null; // stale

  const all = db.prepare('SELECT id, name, icon_url FROM augments_cache').all() as {
    id: number; name: string; icon_url: string;
  }[];
  return Object.fromEntries(all.map((r) => [r.id, { name: r.name, iconUrl: r.icon_url }]));
}

export function storeAugments(map: Record<number, { name: string; iconUrl: string }>): void {
  const now = Date.now();
  const insert = db.prepare(
    'INSERT OR REPLACE INTO augments_cache (id, name, icon_url, cached_at) VALUES (?, ?, ?, ?)'
  );
  // Batch via explicit loop (node:sqlite has no transaction helper but is sync)
  db.exec('DELETE FROM augments_cache');
  for (const [id, { name, iconUrl }] of Object.entries(map)) {
    insert.run(Number(id), name, iconUrl, now);
  }
}

// ─── Aggregated Arena Stats ─────────────────────────────────────────────────

export interface ArenaAggregate {
  totalGames: number;
  top1: number; top2: number;
  top1Rate: number; winrate: number;
  avgPlacement: number;
  avgKills: number; avgDeaths: number; avgAssists: number;
  avgDamage: number;
  placementDistribution: { p1: number; p2: number; p3: number; p4: number };
  topChampions: ChampionStat[];
  topDuos: DuoStat[];
}

export interface ChampionStat {
  name: string; games: number;
  avgPlacement: number; winrate: number;
  avgKills: number; avgDeaths: number; avgAssists: number; avgDamage: number;
}

export interface DuoStat {
  partner: string; games: number; avgPlacement: number; winrate: number;
}

export function aggregateArenaStats(puuid: string): ArenaAggregate | null {
  const stats = getArenaStats(puuid);
  if (stats.length === 0) return null;

  const n = stats.length;
  const top1 = stats.filter((s) => s.placement === 1).length;
  const top2 = stats.filter((s) => s.placement <= 2).length;

  // Champion map
  const champMap: Record<string, { games: number; placements: number[]; k: number; d: number; a: number; dmg: number }> = {};
  for (const s of stats) {
    const c = champMap[s.champion] ?? (champMap[s.champion] = { games: 0, placements: [], k: 0, d: 0, a: 0, dmg: 0 });
    c.games++; c.placements.push(s.placement);
    c.k += s.kills; c.d += s.deaths; c.a += s.assists; c.dmg += s.damage;
  }
  const topChampions: ChampionStat[] = Object.entries(champMap)
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 5)
    .map(([name, c]) => ({
      name, games: c.games,
      avgPlacement: round2(avg(c.placements)),
      winrate: round1((c.placements.filter((p) => p <= 2).length / c.games) * 100),
      avgKills: round1(c.k / c.games), avgDeaths: round1(c.d / c.games),
      avgAssists: round1(c.a / c.games), avgDamage: Math.round(c.dmg / c.games),
    }));

  // Duo map
  const duoMap: Record<string, { games: number; placements: number[] }> = {};
  for (const s of stats) {
    if (s.partner) {
      const d = duoMap[s.partner] ?? (duoMap[s.partner] = { games: 0, placements: [] });
      d.games++; d.placements.push(s.placement);
    }
  }
  const topDuos: DuoStat[] = Object.entries(duoMap)
    .filter(([, d]) => d.games >= 2)
    .sort((a, b) => avg(a[1].placements) - avg(b[1].placements))
    .slice(0, 3)
    .map(([partner, d]) => ({
      partner, games: d.games,
      avgPlacement: round2(avg(d.placements)),
      winrate: round1((d.placements.filter((p) => p <= 2).length / d.games) * 100),
    }));

  const sumField = (f: keyof ArenaStatsRow) =>
    stats.reduce((acc, s) => acc + (s[f] as number), 0);

  return {
    totalGames: n, top1, top2,
    top1Rate: round1((top1 / n) * 100),
    winrate: round1((top2 / n) * 100),
    avgPlacement: round2(sumField('placement') / n),
    avgKills: round1(sumField('kills') / n),
    avgDeaths: round1(sumField('deaths') / n),
    avgAssists: round1(sumField('assists') / n),
    avgDamage: Math.round(sumField('damage') / n),
    placementDistribution: {
      p1: top1,
      p2: stats.filter((s) => s.placement === 2).length,
      p3: stats.filter((s) => s.placement === 3).length,
      p4: stats.filter((s) => s.placement === 4).length,
    },
    topChampions, topDuos,
  };
}

function avg(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
