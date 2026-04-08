import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface ArenaMatchStat {
  championName: string;
  placement: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  gameDuration: number;
  augments: number[];
  duoChampion: string | null;
}

interface AnalyzeRequestBody {
  gameName: string;
  tagLine: string;
  matches: ArenaMatchStat[];
  ranked?: {
    tier?: string;
    rank?: string;
    leaguePoints?: number;
    wins?: number;
    losses?: number;
  };
}

router.post('/analyze', async (req: Request, res: Response) => {
  const { gameName, tagLine, matches, ranked }: AnalyzeRequestBody = req.body;

  if (!matches || matches.length === 0) {
    res.status(400).json({ error: 'Aucune donnée de match Arena fournie.' });
    return;
  }

  const totalGames = matches.length;
  const top1 = matches.filter((m) => m.placement === 1).length;
  const top2 = matches.filter((m) => m.placement <= 2).length;
  const top4 = matches.filter((m) => m.placement <= 4).length;
  const avgPlacement = (matches.reduce((s, m) => s + m.placement, 0) / totalGames).toFixed(2);
  const winrate = ((top2 / totalGames) * 100).toFixed(1);

  const avgKills = (matches.reduce((s, m) => s + m.kills, 0) / totalGames).toFixed(1);
  const avgDeaths = (matches.reduce((s, m) => s + m.deaths, 0) / totalGames).toFixed(1);
  const avgAssists = (matches.reduce((s, m) => s + m.assists, 0) / totalGames).toFixed(1);
  const avgKDA =
    parseFloat(avgDeaths) === 0
      ? 'Perfect'
      : ((parseFloat(avgKills) + parseFloat(avgAssists)) / parseFloat(avgDeaths)).toFixed(2);

  const avgDmg = Math.round(
    matches.reduce((s, m) => s + m.totalDamageDealtToChampions, 0) / totalGames
  ).toLocaleString('fr-FR');

  // Champion frequency
  const champCount: Record<string, number> = {};
  matches.forEach((m) => { champCount[m.championName] = (champCount[m.championName] || 0) + 1; });
  const topChamps = Object.entries(champCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count} parties)`)
    .join(', ');

  // Champion win rate (top 2)
  const champPlacement: Record<string, number[]> = {};
  matches.forEach((m) => {
    if (!champPlacement[m.championName]) champPlacement[m.championName] = [];
    champPlacement[m.championName].push(m.placement);
  });
  const champStats = Object.entries(champPlacement)
    .filter(([, placements]) => placements.length >= 2)
    .map(([name, placements]) => {
      const avg = (placements.reduce((a, b) => a + b, 0) / placements.length).toFixed(1);
      return `${name}: placement moy. ${avg}`;
    })
    .join(', ');

  // Duo synergy
  const duoCount: Record<string, number> = {};
  matches.forEach((m) => {
    if (m.duoChampion) duoCount[m.duoChampion] = (duoCount[m.duoChampion] || 0) + 1;
  });
  const topDuos = Object.entries(duoCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count} fois)`)
    .join(', ');

  // Placement distribution
  const placementDist = [1, 2, 3, 4]
    .map((p) => `${p}er: ${matches.filter((m) => m.placement === p).length}`)
    .join(', ');

  const rankedInfo = ranked
    ? `Rang: ${ranked.tier || 'Non classé'} ${ranked.rank || ''} ${ranked.leaguePoints ?? 0} LP`
    : '';

  const statsContext = `
Joueur: ${gameName}#${tagLine}
${rankedInfo}
Parties Arena analysées: ${totalGames}
Placement moyen: ${avgPlacement}/4
Distribution: ${placementDist}
Top 1: ${top1} (${((top1 / totalGames) * 100).toFixed(0)}%) | Top 2: ${top2} (${winrate}%) | Top 4: ${top4} (${((top4 / totalGames) * 100).toFixed(0)}%)
KDA moyen: ${avgKills}/${avgDeaths}/${avgAssists} (ratio ${avgKDA})
Dégâts moyens: ${avgDmg}
Champions joués: ${topChamps}
Stats par champion: ${champStats || 'pas assez de données'}
Duos les plus fréquents: ${topDuos || 'données insuffisantes'}
  `.trim();

  const prompt = `Voici les statistiques Arena du joueur :\n\n${statsContext}\n\nAnalyse ses performances Arena et donne des conseils concrets. Structure en 3 sections :
✅ Points forts (ce qu'il fait bien)
⚠️ Points à améliorer (placement, duo, champions)
🎯 Plan d'action (3 objectifs concrets avec des exemples de champions/augments efficaces)`;

  try {
    const ollamaRes = await axios.post(
      'http://localhost:11434/api/chat',
      {
        model: 'mistral:7b',
        messages: [
          {
            role: 'system',
            content:
              "Tu es un coach expert du mode Arena de League of Legends. Analyse les statistiques Arena du joueur : placements, synergies duo, choix de champions et augments. Donne des conseils concrets pour améliorer le placement moyen. Suggère des combos champion + augments efficaces. Réponds en français.",
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
      },
      { timeout: 120000 }
    );

    const analysis = ollamaRes.data.message?.content || 'Aucune réponse générée.';
    res.json({
      analysis,
      stats: { avgPlacement, winrate, top1Rate: ((top1 / totalGames) * 100).toFixed(0), avgKDA, avgDmg, topChamps },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: "Ollama n'est pas démarré. Lance `ollama serve` puis `ollama run mistral:7b`.",
      });
    } else {
      res.status(500).json({ error: "Erreur lors de l'analyse IA." });
    }
  }
});

export default router;
