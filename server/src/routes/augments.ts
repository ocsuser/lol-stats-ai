import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getAugmentsFromDB, storeAugments } from '../db/database';

const router = Router();

interface CommunityDragonAugment {
  id: number;
  name: string;
  iconLargeAssetPath?: string;
}

router.get('/augments', async (_req: Request, res: Response) => {
  const cached = getAugmentsFromDB();
  if (cached) { res.json(cached); return; }

  try {
    const { data } = await axios.get<{ augments: CommunityDragonAugment[] }>(
      'https://raw.communitydragon.org/latest/cdragon/arena/en_us.json',
      { timeout: 10000 }
    );

    const map: Record<number, { name: string; iconUrl: string }> = {};
    for (const aug of data.augments) {
      const rawPath = (aug.iconLargeAssetPath ?? '').toLowerCase();
      const iconUrl = rawPath
        ? `https://raw.communitydragon.org/latest/game/${rawPath.replace('/lol-game-data/assets/', '')}`
        : '';
      map[aug.id] = { name: aug.name, iconUrl };
    }

    storeAugments(map);
    res.json(map);
  } catch {
    res.json({});
  }
});

export default router;
