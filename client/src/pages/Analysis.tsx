import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatches, getPlayer, analyzePerformance } from '../api';
import type { MatchData, RankedEntry } from '../types';
import Card from '../components/Card';
import StatBadge from '../components/StatBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function formatAnalysis(text: string): JSX.Element[] {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.map((line, i) => {
    if (line.startsWith('##') || line.startsWith('**') || /^[✅⚠️🎯]/.test(line)) {
      return (
        <h3 key={i} className="text-lg font-bold text-slate-100 mt-4 mb-2">
          {line.replace(/\*\*/g, '')}
        </h3>
      );
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={i} className="text-slate-300 text-sm leading-relaxed ml-4 list-disc">
          {line.replace(/^[-•]\s/, '')}
        </li>
      );
    }
    return (
      <p key={i} className="text-slate-300 text-sm leading-relaxed">
        {line}
      </p>
    );
  });
}

export default function Analysis() {
  const { puuid, gameName, tagLine } = useParams<{
    puuid: string;
    gameName: string;
    tagLine: string;
  }>();

  const hasFetched = useRef(false);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [ranked, setRanked] = useState<RankedEntry | undefined>();
  const [analysis, setAnalysis] = useState('');
  const [summaryStats, setSummaryStats] = useState<Record<string, string> | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');

  const decodedName = decodeURIComponent(gameName || '');
  const decodedTag = decodeURIComponent(tagLine || '');

  const runAnalysis = async (matchList: MatchData[], rankedEntry?: RankedEntry) => {
    if (matchList.length === 0) return;
    setLoadingAI(true);
    setAiError('');
    setAnalysis('');
    setSummaryStats(null);
    try {
      const result = await analyzePerformance(decodedName, decodedTag, matchList, rankedEntry);
      setAnalysis(result.analysis);
      setSummaryStats(result.stats);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setAiError(msg || "Erreur lors de l'analyse IA.");
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!puuid || !gameName || !tagLine || hasFetched.current) return;
    hasFetched.current = true;
    setLoadingData(true);
    Promise.all([getMatches(puuid, 10), getPlayer(decodedName, decodedTag)])
      .then(([m, p]) => {
        setMatches(m);
        const solo = p.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
        setRanked(solo);
        // Auto-déclenche l'analyse dès que les données sont prêtes
        runAnalysis(m, solo);
      })
      .catch((err) => setError(err.response?.data?.error || 'Erreur de chargement.'))
      .finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puuid, gameName, tagLine]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to={`/profile/${gameName}/${tagLine}`}
            className="text-brand-muted hover:text-brand-blue transition-colors"
          >
            ← Retour
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Analyse IA —{' '}
              <span className="text-brand-blue">{decodedName}</span>
              <span className="text-brand-muted font-normal text-lg">#{decodedTag}</span>
            </h1>
            <p className="text-brand-muted text-sm">
              Analyse personnalisée par Mistral 7B via Ollama
            </p>
          </div>
        </div>

        {loadingData && (
          <div className="flex justify-center py-10">
            <LoadingSpinner text="Chargement des données…" />
          </div>
        )}

        {error && (
          <Card>
            <p className="text-red-400 text-center">{error}</p>
          </Card>
        )}

        {!loadingData && !error && (
          <>
            {/* Data summary */}
            {matches.length > 0 && (
              <Card glow="blue">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-3">
                  Données analysées — {matches.length} matchs classés
                </p>
                <div className="flex flex-wrap gap-3 items-center">
                  <StatBadge label="Parties" value={matches.length} color="blue" />
                  {ranked && (
                    <StatBadge
                      label="Rang"
                      value={`${ranked.tier} ${ranked.rank}`}
                      color="purple"
                    />
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={() => runAnalysis(matches, ranked)}
                      disabled={loadingAI}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      {loadingAI ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Analyse en cours…
                        </>
                      ) : (
                        <>🔄 Relancer l'analyse</>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* AI loading state */}
            {loadingAI && (
              <Card className="py-12 text-center">
                <LoadingSpinner size="lg" text="Mistral 7B analyse tes stats… (peut prendre ~30s)" />
              </Card>
            )}

            {/* AI error */}
            {aiError && (
              <Card className="border-red-500/30 bg-red-500/5">
                <p className="text-red-400 font-semibold">⚠️ {aiError}</p>
                <p className="text-brand-muted text-sm mt-2">
                  Assure-toi qu'Ollama tourne en arrière-plan :{' '}
                  <code className="bg-brand-dark px-2 py-0.5 rounded text-xs">ollama serve</code>
                  {' '}puis{' '}
                  <code className="bg-brand-dark px-2 py-0.5 rounded text-xs">ollama pull mistral:7b</code>
                </p>
                <button
                  onClick={() => runAnalysis(matches, ranked)}
                  className="btn-secondary text-sm mt-3"
                >
                  Réessayer
                </button>
              </Card>
            )}

            {/* Summary stats from AI */}
            {summaryStats && (
              <Card glow="purple">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-3">
                  Stats analysées
                </p>
                <div className="flex flex-wrap gap-3">
                  <StatBadge label="Winrate" value={`${summaryStats.winrate}%`}
                    color={parseFloat(summaryStats.winrate) >= 50 ? 'green' : 'red'} />
                  <StatBadge label="KDA moyen" value={summaryStats.avgKDA} color="blue" />
                  <StatBadge label="CS/min" value={summaryStats.avgCSPerMin} color="yellow" />
                  <StatBadge label="Vision moy." value={summaryStats.avgVision} color="purple" />
                </div>
                <p className="text-xs text-brand-muted mt-3">
                  Champions joués : <span className="text-slate-300">{summaryStats.topChamps}</span>
                </p>
              </Card>
            )}

            {/* Analysis result */}
            {analysis && (
              <Card glow="purple" className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-4">
                  Rapport du coach IA
                </p>
                <div className="prose prose-invert max-w-none space-y-1">
                  {formatAnalysis(analysis)}
                </div>
              </Card>
            )}

            {/* Empty state */}
            {matches.length === 0 && (
              <Card className="text-center py-8">
                <p className="text-brand-muted">Aucun match classé trouvé pour analyser.</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
