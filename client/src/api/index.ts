import axios from 'axios';
import type { PlayerData, MatchData, AnalysisResult, RankedEntry } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function getPlayer(gameName: string, tagLine: string): Promise<PlayerData> {
  const { data } = await api.get(`/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
  return data;
}

export async function getMatches(puuid: string, count = 10): Promise<MatchData[]> {
  const { data } = await api.get(`/matches/${puuid}?count=${count}`);
  return data;
}

export async function analyzePerformance(
  gameName: string,
  tagLine: string,
  matches: MatchData[],
  ranked?: RankedEntry
): Promise<AnalysisResult> {
  const { data } = await api.post('/analyze', { gameName, tagLine, matches, ranked });
  return data;
}
