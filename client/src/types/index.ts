export interface Summoner {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface PlayerData {
  puuid: string;
  gameName: string;
  tagLine: string;
  summoner: Summoner;
}

export interface ArenaMatchData {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  placement: number;
  win: boolean;
  championName: string;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  augments: number[];
  duoChampion: string | null;
  duoKills: number | null;
  duoDeaths: number | null;
  duoAssists: number | null;
}

export interface AugmentInfo { name: string; iconUrl: string; }
export type AugmentMap = Record<number, AugmentInfo>;

export interface ChampionStat {
  name: string; games: number;
  avgPlacement: number; winrate: number;
  avgKills: number; avgDeaths: number; avgAssists: number; avgDamage: number;
}

export interface DuoStat {
  partner: string; games: number; avgPlacement: number; winrate: number;
}

export interface ArenaAggregate {
  totalGames: number;
  top1: number; top2: number;
  top1Rate: number; winrate: number;
  avgPlacement: number;
  avgKills: number; avgDeaths: number; avgAssists: number;
  avgDamage: number;
  placementDistribution: { p1: number; p2: number; p3: number; p4: number };
  topChampions: ChampionStat[];
  topDuos: DuoStat[];
  message?: string;
}

export interface AnalysisResult {
  analysis: string;
  stats: {
    avgPlacement: string; winrate: string; top1Rate: string;
    avgKDA: string; avgDmg: string; topChamps: string;
  };
}
