import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMatches, getAugments } from '../api';
import type { ArenaMatchData, AugmentMap } from '../types';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import StatBadge from '../components/StatBadge';

export default function Matches() {
  const { puuid, gameName, tagLine } = useParams<{ puuid: string; gameName: string; tagLine: string }>();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<ArenaMatchData[]>([]);
  const [augments, setAugments] = useState<AugmentMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!puuid) return;
    setLoading(true);
    Promise.all([
      getMatches(puuid, 10),
      getAugments(),
    ])
      .then(([m, a]) => { setMatches(m); setAugments(a); })
      .catch((err) => setError(err.response?.data?.error || 'Erreur lors du chargement des matchs.'))
      .finally(() => setLoading(false));
  }, [puuid]);

  const decodedName = decodeURIComponent(gameName || '');
  const decodedTag = decodeURIComponent(tagLine || '');

  // Arena summary stats
  const top1 = matches.filter((m) => m.placement === 1).length;
  const top2 = matches.filter((m) => m.placement <= 2).length;
  const avgPlacement = matches.length > 0
    ? (matches.reduce((s, m) => s + m.placement, 0) / matches.length).toFixed(2)
    : '0';
  const avgKDA = matches.length > 0
    ? (() => {
        const d = matches.reduce((s, m) => s + m.deaths, 0) / matches.length;
        const k = matches.reduce((s, m) => s + m.kills, 0) / matches.length;
        const a = matches.reduce((s, m) => s + m.assists, 0) / matches.length;
        return d === 0 ? 'Perfect' : ((k + a) / d).toFixed(2);
      })()
    : '0';
  const avgDmg = matches.length > 0
    ? Math.round(matches.reduce((s, m) => s + m.totalDamageDealtToChampions, 0) / matches.length)
    : 0;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${gameName}/${tagLine}`} className="text-brand-muted hover:text-brand-blue transition-colors">
              ← Retour
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {decodedName}
                <span className="text-brand-muted font-normal text-lg ml-1">#{decodedTag}</span>
              </h1>
              <p className="text-brand-muted text-sm">⚔️ Historique Arena — 10 dernières parties</p>
            </div>
          </div>
          <button onClick={() => navigate(`/analysis/${puuid}/${gameName}/${tagLine}`)} className="btn-secondary text-sm">
            🤖 Analyse IA
          </button>
        </div>

        {/* Summary */}
        {!loading && matches.length > 0 && (
          <Card glow="blue">
            <p className="text-xs uppercase tracking-widest text-brand-muted mb-3">
              Résumé — {matches.length} parties Arena
            </p>
            <div className="flex flex-wrap gap-3">
              <StatBadge label="Placement moy." value={avgPlacement} color="blue" />
              <StatBadge label="Top 1" value={`${top1}x`} color="yellow" />
              <StatBadge label="Top 2" value={`${top2}x`} color="green" />
              <StatBadge label="KDA moy." value={avgKDA} color="purple" />
              <StatBadge label="Dégâts moy." value={`${(avgDmg / 1000).toFixed(1)}k`} color="red" />
            </div>

            {/* Placement bar */}
            <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
              {[
                { p: 1, color: 'bg-amber-400' },
                { p: 2, color: 'bg-slate-400' },
                { p: 3, color: 'bg-orange-700' },
                { p: 4, color: 'bg-red-500' },
              ].map(({ p, color }) => {
                const pct = (matches.filter((m) => m.placement === p).length / matches.length) * 100;
                return <div key={p} className={`${color} transition-all`} style={{ width: `${pct}%` }} />;
              })}
            </div>
            <div className="flex justify-between text-[10px] text-brand-muted mt-1">
              <span>1er: {matches.filter((m) => m.placement === 1).length}</span>
              <span>2ème: {matches.filter((m) => m.placement === 2).length}</span>
              <span>3ème: {matches.filter((m) => m.placement === 3).length}</span>
              <span>4ème: {matches.filter((m) => m.placement === 4).length}</span>
            </div>
          </Card>
        )}

        {loading && <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Chargement des matchs Arena…" /></div>}
        {error && <Card><p className="text-red-400 text-center py-4">{error}</p></Card>}
        {!loading && !error && matches.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-brand-muted">Aucune partie Arena trouvée.</p>
          </Card>
        )}

        <div className="space-y-2">
          {matches.map((match) => (
            <MatchCard key={match.matchId} match={match} augments={augments} />
          ))}
        </div>
      </div>
    </div>
  );
}
