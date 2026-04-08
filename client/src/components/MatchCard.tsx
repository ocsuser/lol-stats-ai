import type { ArenaMatchData, AugmentMap } from '../types';

interface MatchCardProps {
  match: ArenaMatchData;
  augments: AugmentMap;
}

const DDRAGON = '14.6.1';
const champIcon = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DDRAGON}/img/champion/${name}.png`;

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}m ${(s % 60).toString().padStart(2, '0')}s`;
}
function formatTimeAgo(ts: number) {
  const h = Math.floor((Date.now() - ts) / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `il y a ${d}j`;
  if (h > 0) return `il y a ${h}h`;
  return 'récemment';
}

const PLACEMENT_STYLE: Record<number, { label: string; bg: string; text: string; border: string; cardBorder: string }> = {
  1: { label: '1er', bg: 'bg-amber-500/20',   text: 'text-amber-400',  border: 'border-amber-400',  cardBorder: 'border-amber-500/40' },
  2: { label: '2ème', bg: 'bg-slate-400/20',  text: 'text-slate-300',  border: 'border-slate-400',  cardBorder: 'border-slate-400/40' },
  3: { label: '3ème', bg: 'bg-orange-700/20', text: 'text-orange-600', border: 'border-orange-700', cardBorder: 'border-orange-700/40' },
  4: { label: '4ème', bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500',    cardBorder: 'border-red-500/40' },
};

function AugmentBadge({ id, augments }: { id: number; augments: AugmentMap }) {
  const aug = augments[id];
  if (!aug) return (
    <div className="w-7 h-7 rounded bg-brand-border flex items-center justify-center text-[10px] text-brand-muted" title={`#${id}`}>
      ?
    </div>
  );
  return aug.iconUrl ? (
    <img src={aug.iconUrl} alt={aug.name} title={aug.name}
      className="w-7 h-7 rounded object-cover border border-brand-border"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <div className="w-7 h-7 rounded bg-brand-surface border border-brand-border flex items-center justify-center text-[9px] text-brand-muted leading-tight text-center px-0.5" title={aug.name}>
      {aug.name.slice(0, 4)}
    </div>
  );
}

export default function MatchCard({ match, augments }: MatchCardProps) {
  const p = PLACEMENT_STYLE[match.placement] ?? PLACEMENT_STYLE[4];
  const kda = match.deaths === 0
    ? 'Perfect'
    : ((match.kills + match.assists) / match.deaths).toFixed(2);
  const kdaColor =
    kda === 'Perfect' || parseFloat(kda) >= 4 ? 'text-amber-400'
    : parseFloat(kda) >= 2.5 ? 'text-emerald-400'
    : parseFloat(kda) >= 1 ? 'text-slate-300'
    : 'text-red-400';

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border bg-brand-surface/60 transition-all duration-200 hover:scale-[1.005] hover:shadow-lg ${p.cardBorder}`}>

      {/* Placement badge */}
      <div className={`flex-shrink-0 w-14 flex flex-col items-center justify-center py-2 rounded-lg border ${p.bg} ${p.border}`}>
        <span className={`text-xl font-extrabold leading-none ${p.text}`}>
          {match.placement}
        </span>
        <span className={`text-[10px] font-semibold ${p.text}`}>{p.label}</span>
      </div>

      {/* Champion */}
      <div className="flex-shrink-0 relative">
        <img src={champIcon(match.championName)} alt={match.championName}
          className="w-11 h-11 rounded-lg object-cover border border-brand-border"
          onError={(e) => { (e.target as HTMLImageElement).src = champIcon('Aatrox'); }} />
        <span className="absolute -bottom-1 -right-1 bg-brand-dark text-[10px] font-bold px-1 rounded">
          {match.champLevel}
        </span>
      </div>

      {/* Champ name + augments */}
      <div className="flex-shrink-0 w-28">
        <p className="font-semibold text-sm text-slate-100 truncate">{match.championName}</p>
        <div className="flex gap-1 mt-1">
          {match.augments.map((id) => (
            <AugmentBadge key={id} id={id} augments={augments} />
          ))}
        </div>
      </div>

      {/* KDA */}
      <div className="flex-1 text-center">
        <p className="font-bold text-sm">
          <span className="text-emerald-400">{match.kills}</span>
          <span className="text-brand-muted mx-0.5">/</span>
          <span className="text-red-400">{match.deaths}</span>
          <span className="text-brand-muted mx-0.5">/</span>
          <span className="text-sky-400">{match.assists}</span>
        </p>
        <p className={`text-xs font-semibold ${kdaColor}`}>
          {kda === 'Perfect' ? 'Perfect' : `${kda} KDA`}
        </p>
      </div>

      {/* Damage */}
      <div className="hidden sm:flex flex-col items-center w-24">
        <p className="text-sm font-semibold text-red-300">
          {(match.totalDamageDealtToChampions / 1000).toFixed(1)}k
        </p>
        <p className="text-[10px] text-brand-muted">Dégâts</p>
      </div>

      {/* Duo partner */}
      {match.duoChampion && (
        <div className="hidden md:flex flex-col items-center w-20">
          <div className="flex items-center gap-1">
            <img src={champIcon(match.duoChampion)} alt={match.duoChampion}
              className="w-6 h-6 rounded object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = champIcon('Aatrox'); }} />
            <span className="text-[11px] text-slate-300 truncate max-w-[48px]">{match.duoChampion}</span>
          </div>
          <p className="text-[10px] text-brand-muted">Duo</p>
        </div>
      )}

      {/* Duration + time */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-medium text-slate-300">{formatDuration(match.gameDuration)}</p>
        <p className="text-[11px] text-brand-muted">{formatTimeAgo(match.gameCreation)}</p>
      </div>
    </div>
  );
}
