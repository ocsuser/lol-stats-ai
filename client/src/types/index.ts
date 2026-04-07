export interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface PlayerData {
  puuid: string;
  gameName: string;
  tagLine: string;
  summoner: Summoner;
  ranked: RankedEntry[];
}

export interface MatchData {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  win: boolean;
  championName: string;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  visionScore: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  role: string;
}

export interface AnalysisResult {
  analysis: string;
  stats: {
    winrate: string;
    avgKDA: string;
    avgCSPerMin: string;
    avgVision: string;
    topChamps: string;
  };
}
