import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPlayer, getArenaAggregate } from '../api';
import type { PlayerData, ArenaAggregate, ChampionStat, DuoStat } from '../types';
import Card from '../components/Card';
import StatBadge from '../components/StatBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';

const DDRAGON = '14.6.1';
const champImg = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DDRAGON}/img/champion/${name}.png`;

const PLACEMENT_COLORS = ['bg-amber-400', 'bg-slate-400', 'bg-orange-700', 'bg-red-500'];
const PLACEMENT_TEXT   = ['text-amber-400', 'text-slate-300', 'text-orange-500', 'text-red-400'];

function PlacementBar({ dist, total }: { dist: ArenaAggregate['placementDistribution']; total: number }) {
  const counts = [dist.p1, dist.p2, dist.p3, dist.p4];
  return (
    <div>
      <div className="flex gap-1 h-2 rounded-full overflow-hidden mt-3">
        {counts.map((c, i) => (
          <div key={i} className={PLACEMENT_COLORS[i]} style={{ width: `${(c / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-brand-muted mt-1">
        {counts.map((c, i) => (
          <span key={i} className={PLACEMENT_TEXT[i]}>{i + 1}e: {c}</span>
        ))}
      </div>
    </div>
  );
}

function ChampionCard({ champ }: { champ: ChampionStat }) {
  return (
    <div className="glass-card p-3 flex items-center gap-3 hover:border-brand-blue/40 transition-colors">
      <img src={champImg(champ.name)} alt={champ.name} className="w-10 h-10 rounded-lg flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = champImg('Aatrox'); }} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate">{champ.name}</p>
        <p className="text-xs text-brand-muted">{champ.games} parties · moy. {champ.avgPlacement}</p>
        <p className="text-xs text-emerald-400">{champ.winrate}% top 2</p>
      </div>
      <div className="ml-auto text-right flex-shrink-0">
        <p className="text-xs text-slate-300">{champ.avgKills}/{champ.avgDeaths}/{champ.avgAssists}</p>
        <p className="text-xs text-red-300">{(champ.avgDamage / 1000).toFixed(1)}k dmg</p>
      </div>
    </div>
  );
}

function DuoCard({ duo }: { duo: DuoStat }) {
  return (
    <div className="glass-card p-3 flex items-center gap-3">
      <img src={champImg(duo.partner)} alt={duo.partner} className="w-9 h-9 rounded-lg"
        onError={(e) => { (e.target as HTMLImageElement).src = champImg('Aatrox'); }} />
      <div>
        <p className="text-sm font-semibold text-slate-200">{duo.partner}</p>
        <p className="text-xs text-brand-muted">{duo.games} parties ensemble</p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-xs font-bold text-brand-blue">moy. {duo.avgPlacement}</p>
        <p className="text-xs text-emerald-400">{duo.winrate}% top 2</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { gameName, tagLine } = useParams<{ gameName: string; tagLine: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [aggregate, setAggregate] = useState<ArenaAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const decodedName = decodeURIComponent(gameName || '');
  const decodedTag  = decodeURIComponent(tagLine  || '');

  useEffect(() => {
    if (!gameName || !tagLine) return;
    setLoading(true);
    setError('');

    getPlayer(decodedName, decodedTag)
      .then(async (p) => {
        setPlayer(p);
        const agg = await getArenaAggregate(p.puuid).catch(() => null);
        setAggregate(agg);
      })
      .catch((err) => setError(err.response?.data?.error || 'Erreur lors du chargement.'))
      .finally(() => setLoading(false));
  }, [gameName, tagLine, decodedName, decodedTag]);

  const handleSearch = (gn: string, tl: string) =>
    navigate(`/profile/${encodeURIComponent(gn)}/${encodeURIComponent(tl)}`);

  const hasStats = aggregate && aggregate.totalGames > 0;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/" className="text-brand-muted hover:text-brand-blue transition-colors">← Retour</Link>
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} initialValue={`${decodedName}#${decodedTag}`} />
          </div>
        </div>

        {loading && <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Chargement du profil…" /></div>}
        {error   && <Card><p className="text-red-400 text-center py-4">{error}</p></Card>}

        {player && !loading && (
          <>
            {/* Profile header */}
            <Card glow="purple">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="relative">
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON}/img/profileicon/${player.summoner.profileIconId}.png`}
                    alt="icon" className="w-20 h-20 rounded-xl border-2 border-brand-purple"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-purple text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    Niv. {player.summoner.summonerLevel}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-100">
                    {player.gameName}
                    <span className="text-brand-muted font-normal text-xl ml-1">#{player.tagLine}</span>
                  </h1>
                  <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-xs font-semibold">
                    ⚔️ Spécialiste Arena
                  </span>
                </div>
                <div className="ml-auto flex gap-2 flex-wrap">
                  <Link to={`/matches/${player.puuid}/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`} className="btn-primary text-sm">
                    Voir les matchs
                  </Link>
                  <Link to={`/analysis/${player.puuid}/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`} className="btn-secondary text-sm">
                    🤖 Analyse IA
                  </Link>
                </div>
              </div>
            </Card>

            {/* No data yet */}
            {!hasStats && (
              <Card className="text-center py-8">
                <p className="text-brand-muted">Aucune partie Arena en base pour ce joueur.</p>
                <p className="text-brand-muted text-sm mt-1">
                  <Link to={`/matches/${player.puuid}/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`} className="text-brand-blue hover:underline">
                    Charge ses matchs
                  </Link>{' '}pour alimenter la base de données.
                </p>
              </Card>
            )}

            {hasStats && (
              <>
                {/* Global stats */}
                <Card glow="blue">
                  <p className="text-xs uppercase tracking-widest text-brand-muted mb-4">
                    Statistiques Arena · {aggregate.totalGames} parties en base
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <StatBadge label="Placement moy." value={aggregate.avgPlacement} color="blue" />
                    <StatBadge label="Top 2 (victoire)" value={`${aggregate.winrate}%`} color={aggregate.winrate >= 50 ? 'green' : 'red'} />
                    <StatBadge label="Top 1" value={`${aggregate.top1}x`} color="yellow" />
                    <StatBadge label="KDA moy." value={`${aggregate.avgKills}/${aggregate.avgDeaths}/${aggregate.avgAssists}`} color="purple" />
                    <StatBadge label="Dégâts moy." value={`${(aggregate.avgDamage / 1000).toFixed(1)}k`} color="red" />
                  </div>
                  <PlacementBar dist={aggregate.placementDistribution} total={aggregate.totalGames} />
                </Card>

                {/* Top champions */}
                {aggregate.topChampions.length > 0 && (
                  <Card>
                    <p className="text-xs uppercase tracking-widest text-brand-muted mb-4">Champions les plus joués</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aggregate.topChampions.map((c) => <ChampionCard key={c.name} champ={c} />)}
                    </div>
                  </Card>
                )}

                {/* Best duos */}
                {aggregate.topDuos.length > 0 && (
                  <Card>
                    <p className="text-xs uppercase tracking-widest text-brand-muted mb-4">
                      Meilleures synergies duo <span className="text-brand-muted font-normal normal-case">(min. 2 parties)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {aggregate.topDuos.map((d) => <DuoCard key={d.partner} duo={d} />)}
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
