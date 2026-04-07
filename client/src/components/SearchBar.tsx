import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (gameName: string, tagLine: string) => void;
  loading?: boolean;
  initialValue?: string;
}

export default function SearchBar({ onSearch, loading = false, initialValue = '' }: SearchBarProps) {
  const [input, setInput] = useState(initialValue);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    const parts = trimmed.split('#');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError('Format invalide. Utilise : Pseudo#TAG');
      return;
    }
    setError('');
    onSearch(parts[0].trim(), parts[1].trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative flex items-center">
        <span className="absolute left-4 text-brand-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pseudo#EUW"
          disabled={loading}
          className="w-full bg-brand-surface border border-brand-border rounded-xl pl-12 pr-36 py-4 text-slate-100 placeholder-brand-muted focus:outline-none focus:border-brand-blue focus:shadow-lg focus:shadow-sky-500/10 transition-all duration-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>
      {error && <p className="mt-2 text-red-400 text-sm text-center">{error}</p>}
    </form>
  );
}
