import { Router, Request, Response } from 'express';
import { aggregateArenaStats } from '../db/database';

const router = Router();

// GET /api/stats/arena/:puuid
// Returns aggregated Arena stats from DB — covers ALL stored matches (not just last 10)
router.get('/stats/arena/:puuid', (req: Request, res: Response) => {
  const { puuid } = req.params;
  const aggregate = aggregateArenaStats(puuid);

  if (!aggregate) {
    res.json({ totalGames: 0, message: 'Aucune donnée Arena en base pour ce joueur. Consultez d\'abord ses matchs.' });
    return;
  }

  res.json(aggregate);
});

export default router;
