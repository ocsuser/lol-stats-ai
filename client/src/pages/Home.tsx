import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SearchBar from '../components/SearchBar';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSearch = (gameName: string, tagLine: string) => {
    setLoading(true);
    navigate(`/profile/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-5xl">⚔️</span>
            <h1 className="text-5xl md:text-6xl font-extrabold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
                LoL
              </span>
              <span className="text-slate-100"> Stats</span>
            </h1>
          </div>
          <p className="text-brand-muted text-lg max-w-md">
            Analyse tes performances en mode <span className="text-brand-blue font-semibold">Arena</span> avec l'IA locale.
            Placements, duos, champions et augments — coaching personnalisé Mistral 7B.
          </p>
        </div>

        {/* Search bar */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        <p className="text-brand-muted text-sm">
          Exemples :{' '}
          <button
            onClick={() => handleSearch('Faker', 'T1')}
            className="text-brand-blue hover:underline"
          >
            Faker#T1
          </button>
          {' · '}
          <button
            onClick={() => handleSearch('Caps', 'EUW')}
            className="text-brand-blue hover:underline"
          >
            Caps#EUW
          </button>
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 max-w-2xl w-full">
          {[
            { icon: '🏆', title: 'Stats Arena', desc: 'Placement, dégâts, duos et augments' },
            { icon: '⚔️', title: 'Historique Arena', desc: '10 dernières parties avec code couleur' },
            { icon: '🤖', title: 'Coach IA local', desc: 'Coaching Arena via Mistral 7B (Ollama)' },
          ].map((f) => (
            <div
              key={f.title}
              className="glass-card p-4 flex flex-col items-center gap-2 text-center hover:border-brand-blue/50 transition-colors"
            >
              <span className="text-2xl">{f.icon}</span>
              <p className="font-semibold text-sm text-slate-200">{f.title}</p>
              <p className="text-xs text-brand-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
