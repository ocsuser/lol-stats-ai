import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Analysis from './pages/Analysis';

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/80 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
          <span>⚔️</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
            LoL Stats
          </span>
        </a>
        <div className="flex items-center gap-4 text-sm text-brand-muted">
          <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer"
            className="hover:text-brand-blue transition-colors">
            Riot API
          </a>
          <span className="px-2 py-0.5 rounded-full bg-brand-surface border border-brand-border text-xs">
            EUW
          </span>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="pt-14">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:gameName/:tagLine" element={<Profile />} />
          <Route path="/matches/:puuid/:gameName/:tagLine" element={<Matches />} />
          <Route path="/analysis/:puuid/:gameName/:tagLine" element={<Analysis />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
