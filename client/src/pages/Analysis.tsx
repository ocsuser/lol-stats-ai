import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatches, analyzePerformance } from '../api';
import type { ArenaMatchData } from '../types';
import Card from '../components/Card';
import StatBadge from '../components/StatBadge';
import LoadingSpinner from '../components/LoadingSpinner';

function formatAnalysis(text: string): JSX.Element[] {
  return text.split('\n').filter((l) => l.trim()).map((line, i) => {
    if (/^[✅⚠️🎯]/.test(line) || line.startsWith('##') || line.startsWith('**')) {
      return <h3 key={i} className="text-lg font-bold text-slate-100 mt-5 mb-2">{line.replace(/\*\*/g, '')}</h3>;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <li key={i} className="text-slate-300 text-sm leading-relaxed ml-5 list-disc">{line.replace(/^[-•]\s/, '')}</li>;
    }
    return <p key={i} className="text-slate-300 text-sm leading-relaxed">{line}</p>;
  });
}

export default function Analysis() {
  const { puuid, gameName, tagLine } = useParams<{ puuid: string; gameName: string; tagLine: string }>();
  const hasFetched = useRef(false);

  const [matches, setMatches] = useState<ArenaMatchData[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [summaryStats, setSummaryStats] = useState<Record<string, string> | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');

  const decodedName = decodeURIComponent(gameName || '');
  const decodedTag = decodeURIComponent(tagLine || '');

  const runAnalysis = async (matchList: ArenaMatchData[]) => {
    if (matchList.length === 0) return;
    setLoadingAI(true);
    setAiError('');
    setAnalysis('');
    setSummaryStats(null);
    try {
      const result = await analyzePerformance(decodedName, decodedTag, matchList);
      setAnalysis(result.analysis);
      setSummaryStats(result.stats);
    } catch (err: unknown) {
      const msg = err instanceof Error && 'response' in err
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

    getMatches(puuid, 10)
      .then((m) => { setMatches(m); runAnalysis(m); })
      .catch((err) => setError(err.response?.data?.error || 'Erreur de chargement.'))
      .finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puuid, gameName, tagLine]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to={`/profile/${gameName}/${tagLine}`} className="text-brand-muted hover:text-brand-blue transition-colors">
            ← Retour
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Coach Arena IA —{' '}
              <span className="text-brand-blue">{decodedName}</span>
              <span className="text-brand-muted font-normal text-lg">#{decodedTag}</span>
            </h1>
            <p className="text-brand-muted text-sm">Analyse Arena par Mistral 7B · placements, duos, champions, augments</p>
          </div>
        </div>

        {loadingData && <div className="flex justify-center py-10"><LoadingSpinner text="Chargement des données Arena…" /></div>}
        {error && <Card><p className="text-red-400 text-center">{error}</p></Card>}

        {!loadingData && !error && (
          <>
            {matches.length > 0 && (
              <Card glow="blue">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-3">
                  Données analysées — {matches.length} parties Arena
                </p>
                <div className="flex flex-wrap gap-3 items-center">
                  <StatBadge label="Parties" value={matches.length} color="blue" />
                  <StatBadge
                    label="Placement moy."
                    value={(matches.reduce((s, m) => s + m.placement, 0) / matches.length).toFixed(2)}
                    color="purple"
                  />
                  <StatBadge
                    label="Top 2"
                    value={`${((matches.filter((m) => m.placement <= 2).length / matches.length) * 100).toFixed(0)}%`}
                    color="green"
                  />
                  <div className="ml-auto">
                    <button
                      onClick={() => runAnalysis(matches)}
                      disabled={loadingAI}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      {loadingAI ? <><LoadingSpinner size="sm" /> Analyse en cours…</> : <>🔄 Relancer l'analyse</>}
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {loadingAI && (
              <Card className="py-12 text-center">
                <LoadingSpinner size="lg" text="Le coach Arena analyse tes stats… (~30s)" />
              </Card>
            )}

            {aiError && (
              <Card className="border-red-500/30 bg-red-500/5">
                <p className="text-red-400 font-semibold">⚠️ {aiError}</p>
                <p className="text-brand-muted text-sm mt-2">
                  Lance Ollama :{' '}
                  <code className="bg-brand-dark px-2 py-0.5 rounded text-xs">ollama serve</code>
                  {' '}puis{' '}
                  <code className="bg-brand-dark px-2 py-0.5 rounded text-xs">ollama pull mistral:7b</code>
                </p>
                <button onClick={() => runAnalysis(matches)} className="btn-secondary text-sm mt-3">
                  Réessayer
                </button>
              </Card>
            )}

            {summaryStats && (
              <Card glow="purple">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-3">Stats Arena analysées</p>
                <div className="flex flex-wrap gap-3">
                  <StatBadge label="Placement moy." value={summaryStats.avgPlacement} color="blue" />
                  <StatBadge label="Top 2 (win)" value={`${summaryStats.winrate}%`} color={parseFloat(summaryStats.winrate) >= 50 ? 'green' : 'red'} />
                  <StatBadge label="Top 1" value={`${summaryStats.top1Rate}%`} color="yellow" />
                  <StatBadge label="KDA moy." value={summaryStats.avgKDA} color="purple" />
                  <StatBadge label="Dégâts moy." value={summaryStats.avgDmg} color="red" />
                </div>
                <p className="text-xs text-brand-muted mt-3">
                  Champions : <span className="text-slate-300">{summaryStats.topChamps}</span>
                </p>
              </Card>
            )}

            {analysis && (
              <Card glow="purple" className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-brand-muted mb-4">Rapport du Coach Arena</p>
                <div className="space-y-1">{formatAnalysis(analysis)}</div>
              </Card>
            )}

            {matches.length === 0 && (
              <Card className="text-center py-8">
                <p className="text-brand-muted">Aucune partie Arena trouvée pour analyser.</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
