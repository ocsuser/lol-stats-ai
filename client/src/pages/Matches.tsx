import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMatches } from '../api';
import type { MatchData } from '../types';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import StatBadge from '../components/StatBadge';

export default function Matches() {
  const { puuid, gameName, tagLine } = useParams<{ puuid: string; gameName: string; tagLine: string }>();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!puuid) return;
    setLoading(true);
    setError('');
    getMatches(puuid, 10)
      .then(setMatches)
      .catch((err) => setError(err.response?.data?.error || 'Erreur lors du chargement des matchs.'))
      .finally(() => setLoading(false));
  }, [puuid]);

  const wins = matches.filter((m) => m.win).length;
  const losses = matches.length - wins;
  const winrate = matches.length > 0 ? ((wins / matches.length) * 100).toFixed(1) : '0';
  const avgKills = matches.length > 0
    ? (matches.reduce((s, m) => s + m.kills, 0) / matches.length).toFixed(1)
    : '0';
  const avgDeaths = matches.length > 0
    ? (matches.reduce((s, m) => s + m.deaths, 0) / matches.length).toFixed(1)
    : '0';
  const avgAssists = matches.length > 0
    ? (matches.reduce((s, m) => s + m.assists, 0) / matches.length).toFixed(1)
    : '0';

  const decodedName = decodeURIComponent(gameName || '');
  const decodedTag = decodeURIComponent(tagLine || '');

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              to={`/profile/${gameName}/${tagLine}`}
              className="text-brand-muted hover:text-brand-blue transition-colors"
            >
              ← Retour
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {decodedName}
                <span className="text-brand-muted font-normal text-lg ml-1">#{decodedTag}</span>
              </h1>
              <p className="text-brand-muted text-sm">Historique des matchs classés (Solo/Duo)</p>
            </div>
          </div>
          <button
            onClick={() =>
              navigate(`/analysis/${puuid}/${gameName}/${tagLine}`)
            }
            className="btn-secondary text-sm"
          >
            🤖 Analyse IA
          </button>
        </div>

        {/* Summary stats */}
        {!loading && matches.length > 0 && (
          <Card glow="blue">
            <p className="text-xs uppercase tracking-widest text-brand-muted mb-3">
              Résumé — {matches.length} dernières parties
            </p>
            <div className="flex flex-wrap gap-3">
              <StatBadge label="Winrate" value={`${winrate}%`} color={parseFloat(winrate) >= 50 ? 'green' : 'red'} />
              <StatBadge label="Victoires" value={wins} color="green" />
              <StatBadge label="Défaites" value={losses} color="red" />
              <StatBadge label="Moy. Kills" value={avgKills} color="blue" />
              <StatBadge label="Moy. Deaths" value={avgDeaths} color="red" />
              <StatBadge label="Moy. Assists" value={avgAssists} color="purple" />
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Chargement des matchs…" />
          </div>
        )}

        {error && (
          <Card className="text-center py-8">
            <p className="text-red-400 text-lg font-semibold">{error}</p>
          </Card>
        )}

        {!loading && !error && matches.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-brand-muted">Aucun match classé trouvé.</p>
          </Card>
        )}

        {/* Match list */}
        <div className="space-y-2">
          {matches.map((match) => (
            <MatchCard key={match.matchId} match={match} />
          ))}
        </div>
      </div>
    </div>
  );
}
