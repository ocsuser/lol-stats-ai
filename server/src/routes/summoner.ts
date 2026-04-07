import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// GET /api/summoner/:gameName/:tagLine
router.get('/summoner/:gameName/:tagLine', async (req: Request, res: Response) => {
  const { gameName, tagLine } = req.params;
  const RIOT_API_KEY = process.env.RIOT_API_KEY;

  try {
    // Step 1: Get PUUID from Riot Account API (Europe routing)
    const url1 = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    console.log('[Step 1]', url1);
    const accountRes = await axios.get(url1, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    const { puuid } = accountRes.data;
    console.log('[Step 1] OK — puuid:', puuid.slice(0, 10) + '...');

    // Step 2: Get summoner data from EUW1 (profileIconId, summonerLevel)
    const url2 = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summonerRes = await axios.get(url2, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    const summoner = summonerRes.data;

    // Step 3: Get ranked stats via PUUID (Riot a supprimé summonerId de la réponse summoner)
    const url3 = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    const rankedRes = await axios.get(url3, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    const ranked = rankedRes.data;

    res.json({
      puuid,
      gameName,
      tagLine,
      summoner,
      ranked,
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const riotMessage = error.response?.data?.status?.message || '';
      console.error(`[Riot API] ${status} — ${riotMessage || error.message}`);

      let message: string;
      if (status === 404) {
        message = 'Joueur introuvable. Vérifie le pseudo et le tag (ex: Pseudo#EUW).';
      } else if (status === 403) {
        message = 'Clé API Riot expirée. Renouvelle-la sur developer.riotgames.com (valable 24h).';
      } else if (status === 429) {
        message = 'Limite de requêtes Riot atteinte. Réessaie dans quelques secondes.';
      } else if (status === 401) {
        message = 'Clé API Riot manquante ou invalide dans server/.env.';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        message = 'Impossible de joindre l\'API Riot. Vérifie ta connexion internet.';
      } else {
        message = `Erreur Riot API (${status})${riotMessage ? ': ' + riotMessage : ''}.`;
      }
      res.status(status).json({ error: message });
    } else {
      console.error('[Server] Erreur interne:', error);
      res.status(500).json({ error: 'Erreur serveur interne.' });
    }
  }
});

export default router;
