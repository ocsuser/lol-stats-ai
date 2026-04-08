import axios from 'axios';
import type { PlayerData, ArenaMatchData, AnalysisResult, AugmentMap, ArenaAggregate } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function getPlayer(gameName: string, tagLine: string): Promise<PlayerData> {
  const { data } = await api.get(`/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
  return data;
}

export async function getMatches(puuid: string, count = 10): Promise<ArenaMatchData[]> {
  const { data } = await api.get(`/matches/${puuid}?count=${count}`);
  return data;
}

export async function getArenaAggregate(puuid: string): Promise<ArenaAggregate> {
  const { data } = await api.get(`/stats/arena/${puuid}`);
  return data;
}

export async function getAugments(): Promise<AugmentMap> {
  const { data } = await api.get('/augments');
  return data;
}

export async function analyzePerformance(
  gameName: string,
  tagLine: string,
  matches: ArenaMatchData[]
): Promise<AnalysisResult> {
  const { data } = await api.post('/analyze', { gameName, tagLine, matches });
  return data;
}
