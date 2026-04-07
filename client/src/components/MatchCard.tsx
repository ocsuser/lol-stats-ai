import type { MatchData } from '../types';

interface MatchCardProps {
  match: MatchData;
}

const DDRAGON_VERSION = '14.6.1';
const champIconUrl = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${name}.png`;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  return 'récemment';
}

const roleIcons: Record<string, string> = {
  TOP: '🛡️',
  JUNGLE: '🌲',
  MIDDLE: '⚡',
  BOTTOM: '🏹',
  UTILITY: '💊',
};

export default function MatchCard({ match }: MatchCardProps) {
  const kda =
    match.deaths === 0
      ? 'Perfect'
      : ((match.kills + match.assists) / match.deaths).toFixed(2);

  const csPerMin = (match.totalMinionsKilled / Math.max(match.gameDuration / 60, 1)).toFixed(1);

  const kdaColor =
    parseFloat(kda) >= 4
      ? 'text-amber-400'
      : parseFloat(kda) >= 2.5
      ? 'text-emerald-400'
      : parseFloat(kda) >= 1
      ? 'text-slate-300'
      : 'text-red-400';

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${
        match.win
          ? 'border-sky-500/30 bg-sky-500/5 hover:shadow-sky-500/10'
          : 'border-red-500/30 bg-red-500/5 hover:shadow-red-500/10'
      }`}
    >
      {/* Win/Loss indicator */}
      <div
        className={`w-1 self-stretch rounded-full ${match.win ? 'bg-brand-blue' : 'bg-red-500'}`}
      />

      {/* Champion icon */}
      <div className="relative flex-shrink-0">
        <img
          src={champIconUrl(match.championName)}
          alt={match.championName}
          className="w-12 h-12 rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://ddragon.leagueoflegends.com/cdn/14.6.1/img/champion/Aatrox.png';
          }}
        />
        <span className="absolute -bottom-1 -right-1 bg-brand-dark text-xs font-bold px-1 rounded">
          {match.champLevel}
        </span>
      </div>

      {/* Champion name + role */}
      <div className="flex-shrink-0 w-28">
        <p className="font-semibold text-sm text-slate-100 truncate">{match.championName}</p>
        <p className="text-xs text-brand-muted">
          {roleIcons[match.role] || ''} {match.role || 'N/A'}
        </p>
      </div>

      {/* KDA */}
      <div className="flex-1 text-center">
        <p className="font-bold text-base">
          <span className="text-emerald-400">{match.kills}</span>
          <span className="text-brand-muted mx-1">/</span>
          <span className="text-red-400">{match.deaths}</span>
          <span className="text-brand-muted mx-1">/</span>
          <span className="text-sky-400">{match.assists}</span>
        </p>
        <p className={`text-xs font-semibold ${kdaColor}`}>{kda === 'Perfect' ? 'Perfect' : `${kda} KDA`}</p>
      </div>

      {/* CS */}
      <div className="hidden sm:flex flex-col items-center w-20">
        <p className="text-sm font-semibold text-slate-200">{match.totalMinionsKilled} CS</p>
        <p className="text-xs text-brand-muted">{csPerMin}/min</p>
      </div>

      {/* Vision */}
      <div className="hidden md:flex flex-col items-center w-16">
        <p className="text-sm font-semibold text-slate-200">{match.visionScore}</p>
        <p className="text-xs text-brand-muted">Vision</p>
      </div>

      {/* Duration + time */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-medium text-slate-300">{formatDuration(match.gameDuration)}</p>
        <p className="text-xs text-brand-muted">{formatTimeAgo(match.gameCreation)}</p>
      </div>

      {/* Win/Loss badge */}
      <div
        className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-bold uppercase ${
          match.win
            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}
      >
        {match.win ? 'V' : 'D'}
      </div>
    </div>
  );
}
