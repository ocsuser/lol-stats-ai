import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface MatchStat {
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  gameDuration: number;
  visionScore: number;
}

interface AnalyzeRequestBody {
  gameName: string;
  tagLine: string;
  matches: MatchStat[];
  ranked?: {
    tier?: string;
    rank?: string;
    leaguePoints?: number;
    wins?: number;
    losses?: number;
  };
}

// POST /api/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  const { gameName, tagLine, matches, ranked }: AnalyzeRequestBody = req.body;

  if (!matches || matches.length === 0) {
    res.status(400).json({ error: 'Aucune donnée de match fournie.' });
    return;
  }

  // Compute aggregated stats
  const totalGames = matches.length;
  const wins = matches.filter((m) => m.win).length;
  const winrate = ((wins / totalGames) * 100).toFixed(1);

  const avgKills = (matches.reduce((s, m) => s + m.kills, 0) / totalGames).toFixed(1);
  const avgDeaths = (matches.reduce((s, m) => s + m.deaths, 0) / totalGames).toFixed(1);
  const avgAssists = (matches.reduce((s, m) => s + m.assists, 0) / totalGames).toFixed(1);
  const avgKDA = avgDeaths === '0'
    ? 'Perfect'
    : (
        (parseFloat(avgKills) + parseFloat(avgAssists)) /
        parseFloat(avgDeaths)
      ).toFixed(2);

  const avgCSPerMin = (
    matches.reduce((s, m) => s + m.totalMinionsKilled / Math.max(m.gameDuration / 60, 1), 0) /
    totalGames
  ).toFixed(1);

  const avgVision = (matches.reduce((s, m) => s + m.visionScore, 0) / totalGames).toFixed(1);

  // Champion frequency
  const champCount: Record<string, number> = {};
  matches.forEach((m) => {
    champCount[m.championName] = (champCount[m.championName] || 0) + 1;
  });
  const topChamps = Object.entries(champCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count} parties)`)
    .join(', ');

  const rankedInfo = ranked
    ? `Rang: ${ranked.tier || 'Non classé'} ${ranked.rank || ''} ${ranked.leaguePoints ?? 0} LP — ${ranked.wins ?? 0}V/${ranked.losses ?? 0}D`
    : 'Rang: Non classé';

  const statsContext = `
Joueur: ${gameName}#${tagLine}
${rankedInfo}
Parties analysées: ${totalGames} (Ranked Solo/Duo)
Winrate: ${winrate}%
KDA moyen: ${avgKills}/${avgDeaths}/${avgAssists} (ratio: ${avgKDA})
CS/min moyen: ${avgCSPerMin}
Vision score moyen: ${avgVision}
Champions les plus joués: ${topChamps}
  `.trim();

  const prompt = `Voici les statistiques du joueur :\n\n${statsContext}\n\nAnalyse ses performances et donne-lui des conseils concrets et personnalisés pour s'améliorer. Structure ta réponse en 3 sections : ✅ Points forts, ⚠️ Points à améliorer, 🎯 Plan d'action (3 objectifs concrets).`;

  try {
    const ollamaRes = await axios.post(
      'http://localhost:11434/api/chat',
      {
        model: 'mistral:7b',
        messages: [
          {
            role: 'system',
            content:
              "Tu es un coach esport League of Legends expert. Analyse les statistiques du joueur et donne des conseils concrets d'amélioration. Sois précis, utilise les données fournies. Réponds en français.",
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      },
      { timeout: 120000 }
    );

    const analysis = ollamaRes.data.message?.content || 'Aucune réponse générée.';
    res.json({ analysis, stats: { winrate, avgKDA, avgCSPerMin, avgVision, topChamps } });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error:
          "Ollama n'est pas démarré. Lance `ollama run mistral:7b` dans un terminal et réessaie.",
      });
    } else {
      res.status(500).json({ error: "Erreur lors de l'analyse IA." });
    }
  }
});

export default router;
