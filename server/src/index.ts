import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

import express from 'express';
import cors from 'cors';
import summonerRoutes from './routes/summoner';
import matchesRoutes from './routes/matches';
import analyzeRoutes from './routes/analyze';
import augmentsRoutes from './routes/augments';
import statsRoutes from './routes/stats';

console.log('[ENV] RIOT_API_KEY:', process.env.RIOT_API_KEY ? process.env.RIOT_API_KEY.slice(0, 12) + '...' : 'NON CHARGÉE ❌');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', summonerRoutes);
app.use('/api', matchesRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', augmentsRoutes);
app.use('/api', statsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: 'Arena', db: 'lol-arena.db' }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [Arena mode · SQLite]`);
});
