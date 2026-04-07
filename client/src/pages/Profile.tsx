import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPlayer } from '../api';
import type { PlayerData, RankedEntry } from '../types';
import Card from '../components/Card';
import StatBadge from '../components/StatBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';

const DDRAGON_VERSION = '14.6.1';
const tierColors: Record<string, string> = {
  IRON: 'text-slate-400',
  BRONZE: 'text-amber-700',
  SILVER: 'text-slate-300',
  GOLD: 'text-amber-400',
  PLATINUM: 'text-teal-400',
  EMERALD: 'text-emerald-400',
  DIAMOND: 'text-sky-400',
  MASTER: 'text-purple-400',
  GRANDMASTER: 'text-red-400',
  CHALLENGER: 'text-yellow-300',
};

function RankedCard({ entry }: { entry: RankedEntry }) {
  const wr = ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1);
  const color = tierColors[entry.tier] || 'text-slate-300';

  return (
    <Card glow="blue">
      <p className="text-xs uppercase tracking-widest text-brand-muted mb-3">
        {entry.queueType === 'RANKED_SOLO_5x5' ? 'Solo / Duo' : 'Flex'}
      </p>
      <div className="flex items-center gap-4">
        <div>
          <p className={`text-2xl font-extrabold ${color}`}>
            {entry.tier} {entry.rank}
          </p>
          <p className="text-brand-blue font-semibold">{entry.leaguePoints} LP</p>
        </div>
        <div className="ml-auto flex gap-3">
          <StatBadge label="Victoires" value={entry.wins} color="green" />
          <StatBadge label="Défaites" value={entry.losses} color="red" />
          <StatBadge label="Winrate" value={`${wr}%`} color={parseFloat(wr) >= 50 ? 'green' : 'red'} />
        </div>
      </div>
    </Card>
  );
}

export default function Profile() {
  const { gameName, tagLine } = useParams<{ gameName: string; tagLine: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameName || !tagLine) return;
    setLoading(true);
    setError('');
    getPlayer(decodeURIComponent(gameName), decodeURIComponent(tagLine))
      .then(setPlayer)
      .catch((err) => setError(err.response?.data?.error || 'Erreur lors du chargement.'))
      .finally(() => setLoading(false));
  }, [gameName, tagLine]);

  const handleSearch = (gn: string, tl: string) => {
    navigate(`/profile/${encodeURIComponent(gn)}/${encodeURIComponent(tl)}`);
  };

  const soloEntry = player?.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const flexEntry = player?.ranked.find((r) => r.queueType === 'RANKED_FLEX_SR');

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/" className="text-brand-muted hover:text-brand-blue transition-colors">
            ← Retour
          </Link>
          <div className="flex-1">
            <SearchBar
              onSearch={handleSearch}
              initialValue={`${decodeURIComponent(gameName || '')}#${decodeURIComponent(tagLine || '')}`}
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Chargement du profil…" />
          </div>
        )}

        {error && (
          <Card className="text-center py-8">
            <p className="text-red-400 text-lg font-semibold">{error}</p>
          </Card>
        )}

        {player && !loading && (
          <>
            {/* Profile header */}
            <Card glow="purple">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.summoner.profileIconId}.png`}
                    alt="Profile icon"
                    className="w-20 h-20 rounded-xl border-2 border-brand-purple"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-purple text-xs font-bold px-2 py-0.5 rounded-full">
                    {player.summoner.summonerLevel}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-100">
                    {player.gameName}
                    <span className="text-brand-muted font-normal text-xl ml-1">#{player.tagLine}</span>
                  </h1>
                  <p className="text-brand-muted text-sm mt-1">EUW · Niveau {player.summoner.summonerLevel}</p>
                </div>
                <div className="ml-auto flex gap-3 flex-wrap">
                  <Link
                    to={`/matches/${player.puuid}/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`}
                    className="btn-primary text-sm"
                  >
                    Voir les matchs
                  </Link>
                  <Link
                    to={`/analysis/${player.puuid}/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`}
                    className="btn-secondary text-sm"
                  >
                    🤖 Analyse IA
                  </Link>
                </div>
              </div>
            </Card>

            {/* Ranked entries */}
            {soloEntry && <RankedCard entry={soloEntry} />}
            {flexEntry && <RankedCard entry={flexEntry} />}
            {!soloEntry && !flexEntry && (
              <Card>
                <p className="text-center text-brand-muted py-4">
                  Aucune donnée classée pour cette saison.
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
