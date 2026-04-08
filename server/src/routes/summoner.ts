import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getPlayer, upsertPlayer } from '../db/database';

const router = Router();

router.get('/summoner/:gameName/:tagLine', async (req: Request, res: Response) => {
  const { gameName, tagLine } = req.params;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;

  // Serve from DB if fresh (< 10 min)
  const cached = getPlayer(gameName, tagLine);
  if (cached) {
    console.log(`[DB HIT] player ${gameName}#${tagLine}`);
    res.json({ puuid: cached.puuid, gameName: cached.gameName, tagLine: cached.tagLine, summoner: cached, ranked: [] });
    return;
  }

  try {
    const accountRes = await axios.get(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { 'X-Riot-Token': RIOT_API_KEY } }
    );
    const { puuid } = accountRes.data as { puuid: string };

    const [summonerRes, rankedRes] = await Promise.all([
      axios.get(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
        headers: { 'X-Riot-Token': RIOT_API_KEY },
      }),
      axios.get(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, {
        headers: { 'X-Riot-Token': RIOT_API_KEY },
      }),
    ]);

    const summoner = summonerRes.data as { profileIconId: number; summonerLevel: number };
    const ranked = rankedRes.data;

    upsertPlayer({
      puuid,
      gameName,
      tagLine,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      last_updated: Date.now(),
    });
    console.log(`[DB SET] player ${gameName}#${tagLine}`);

    res.json({ puuid, gameName, tagLine, summoner, ranked });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const riotMsg = (error.response?.data as { status?: { message?: string } })?.status?.message || '';
      console.error(`[Riot API] ${status} — ${riotMsg || error.message}`);

      const messages: Record<number, string> = {
        404: 'Joueur introuvable. Vérifie le pseudo et le tag (ex: Pseudo#EUW).',
        403: 'Clé API Riot expirée. Renouvelle-la sur developer.riotgames.com (valable 24h).',
        429: 'Limite de requêtes Riot atteinte. Réessaie dans quelques secondes.',
        401: 'Clé API Riot manquante ou invalide dans server/.env.',
      };
      const msg = messages[status]
        ?? (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND'
          ? "Impossible de joindre l'API Riot."
          : `Erreur Riot API (${status})${riotMsg ? ': ' + riotMsg : ''}.`);

      res.status(status).json({ error: msg });
    } else {
      res.status(500).json({ error: 'Erreur serveur interne.' });
    }
  }
});

export default router;
