import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// GET /api/matches/:puuid
router.get('/matches/:puuid', async (req: Request, res: Response) => {
  const { puuid } = req.params;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;
  const count = Number(req.query.count) || 20;

  try {
    // Get match IDs
    const matchIdsRes = await axios.get(
      `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=${count}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    const matchIds: string[] = matchIdsRes.data;

    // Fetch match details in parallel (limit to 10 for speed)
    const ids = matchIds.slice(0, 10);
    const matchDetails = await Promise.all(
      ids.map((id) =>
        axios
          .get(`https://europe.api.riotgames.com/lol/match/v5/matches/${id}`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
          })
          .then((r) => r.data)
      )
    );

    // Extract relevant info for each match
    const matches = matchDetails.map((match) => {
      const participant = match.info.participants.find(
        (p: { puuid: string }) => p.puuid === puuid
      );
      if (!participant) return null;

      return {
        matchId: match.metadata.matchId,
        gameCreation: match.info.gameCreation,
        gameDuration: match.info.gameDuration,
        win: participant.win,
        championName: participant.championName,
        champLevel: participant.champLevel,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        totalMinionsKilled: participant.totalMinionsKilled + participant.neutralMinionsKilled,
        visionScore: participant.visionScore,
        goldEarned: participant.goldEarned,
        totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
        item0: participant.item0,
        item1: participant.item1,
        item2: participant.item2,
        item3: participant.item3,
        item4: participant.item4,
        item5: participant.item5,
        item6: participant.item6,
        role: participant.teamPosition,
      };
    });

    res.json(matches.filter(Boolean));
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: 'Erreur lors de la récupération des matchs.' });
    } else {
      res.status(500).json({ error: 'Erreur serveur interne.' });
    }
  }
});

// GET /api/match/:matchId
router.get('/match/:matchId', async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;

  try {
    const matchRes = await axios.get(
      `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    res.json(matchRes.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: 'Match introuvable.' });
    } else {
      res.status(500).json({ error: 'Erreur serveur interne.' });
    }
  }
});

export default router;
