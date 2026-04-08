import { Router, Request, Response } from 'express';
import axios from 'axios';
import {
  getMatchRaw, storeMatchRaw,
  getProcessedMatchIds, upsertArenaStats, getArenaStats,
} from '../db/database';

const router = Router();

interface RiotParticipant {
  puuid: string;
  championName: string;
  champLevel: number;
  kills: number; deaths: number; assists: number;
  placement: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  playerAugment1: number; playerAugment2: number;
  playerAugment3: number; playerAugment4: number;
  subteamId: number;
}

// GET /api/matches/:puuid  — Arena only (queue 1700)
router.get('/matches/:puuid', async (req: Request, res: Response) => {
  const { puuid } = req.params;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  const count = Math.min(Number(req.query.count) || 10, 20);

  try {
    // 1. Fetch latest match IDs from Riot
    const { data: matchIds } = await axios.get<string[]>(
      `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=1700&count=${count}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );

    if (matchIds.length === 0) { res.json([]); return; }

    // 2. Only fetch matches not yet in our DB for this player
    const processed = getProcessedMatchIds(puuid);
    const toFetch = matchIds.filter((id) => !processed.has(id));

    if (toFetch.length > 0) {
      console.log(`[DB] Fetching ${toFetch.length} new Arena matches for ${puuid.slice(0, 8)}…`);

      const rawMatches = await Promise.all(
        toFetch.map(async (id) => {
          // Check raw match cache first (might exist from another player's search)
          const cached = getMatchRaw(id);
          if (cached) return cached;

          const { data } = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/${id}`,
            { headers: { 'X-Riot-Token': RIOT_API_KEY } }
          );
          storeMatchRaw(id, puuid, data);
          return data;
        })
      );

      // 3. Parse and store arena_stats for this player
      for (const match of rawMatches) {
        const m = match as { metadata: { matchId: string }; info: { gameCreation: number; gameDuration: number; participants: RiotParticipant[] } };
        const me = m.info.participants.find((p) => p.puuid === puuid);
        if (!me) continue;

        const duo = m.info.participants.find(
          (p) => p.puuid !== puuid && p.subteamId === me.subteamId
        );

        upsertArenaStats({
          puuid,
          matchId: m.metadata.matchId,
          gameCreation: m.info.gameCreation,
          gameDuration: m.info.gameDuration,
          champion: me.championName,
          champLevel: me.champLevel,
          placement: me.placement,
          kills: me.kills, deaths: me.deaths, assists: me.assists,
          damage: me.totalDamageDealtToChampions,
          goldEarned: me.goldEarned,
          augments: [me.playerAugment1, me.playerAugment2, me.playerAugment3, me.playerAugment4].filter(Boolean),
          partner: duo?.championName ?? null,
        });
      }
    }

    // 4. Return requested matches from DB (already sorted by gameCreation DESC)
    const stats = getArenaStats(puuid);
    const result = stats
      .filter((s) => matchIds.includes(s.matchId))
      .slice(0, count)
      .map((s) => ({
        matchId: s.matchId,
        gameCreation: s.gameCreation,
        gameDuration: s.gameDuration,
        placement: s.placement,
        win: s.placement <= 2,
        championName: s.champion,
        champLevel: s.champLevel,
        kills: s.kills, deaths: s.deaths, assists: s.assists,
        totalDamageDealtToChampions: s.damage,
        goldEarned: s.goldEarned,
        augments: s.augments,
        duoChampion: s.partner,
        duoKills: null, duoDeaths: null, duoAssists: null,
      }));

    res.json(result);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const msg = (error.response?.data as { status?: { message?: string } })?.status?.message || error.message;
      console.error(`[Riot API] ${status} — ${msg}`);
      res.status(status).json({ error: 'Erreur lors de la récupération des matchs Arena.' });
    } else {
      res.status(500).json({ error: 'Erreur serveur interne.' });
    }
  }
});

// GET /api/match/:matchId
router.get('/match/:matchId', async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;

  const cached = getMatchRaw(matchId);
  if (cached) { res.json(cached); return; }

  try {
    const { data } = await axios.get(
      `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    storeMatchRaw(matchId, 'direct', data);
    res.json(data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({ error: 'Match introuvable.' });
    } else {
      res.status(500).json({ error: 'Erreur serveur interne.' });
    }
  }
});

export default router;
