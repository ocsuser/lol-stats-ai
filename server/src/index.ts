import path from 'path';
import dotenv from 'dotenv';

// Charger le .env AVANT tout le reste
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

import express from 'express';
import cors from 'cors';
import summonerRoutes from './routes/summoner';
import matchesRoutes from './routes/matches';
import analyzeRoutes from './routes/analyze';

console.log('[ENV] RIOT_API_KEY:', process.env.RIOT_API_KEY ? process.env.RIOT_API_KEY.slice(0, 12) + '...' : 'NON CHARGÉE ❌');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', summonerRoutes);
app.use('/api', matchesRoutes);
app.use('/api', analyzeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/test-key', async (_req, res) => {
  const axios = (await import('axios')).default;
  const key = process.env.RIOT_API_KEY;
  try {
    const r = await axios.get(
      'https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Faker/T1',
      { headers: { 'X-Riot-Token': key } }
    );
    res.json({ keyUsed: key?.slice(0, 16) + '...', status: r.status, data: r.data });
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      res.json({ keyUsed: key?.slice(0, 16) + '...', status: e.response?.status, error: e.response?.data });
    } else {
      res.json({ error: String(e) });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
