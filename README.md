# LoL Stats — Analyse IA

Application web d'analyse de statistiques League of Legends avec IA locale (Ollama + Mistral 7B).

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **IA**: Ollama (Mistral 7B) — modèle local, aucune API externe
- **Data**: Riot Games API v5

## Installation

### 1. Prérequis

- Node.js 18+
- [Ollama](https://ollama.ai) installé (pour l'analyse IA)

### 2. Clé API Riot

Le fichier `server/.env` contient déjà ta clé. Pour la renouveler :
```
RIOT_API_KEY=RGAPI-xxxx
PORT=3001
```

### 3. Lancer l'application

```bash
npm run install:all   # installe toutes les dépendances (racine + client + server)
npm run dev           # lance client (port 5173) et server (port 3001) en parallèle
```

Ouvre http://localhost:5173

### 4. Activer l'analyse IA (optionnel)

Dans un terminal séparé :
```bash
ollama run mistral:7b
```

## Fonctionnalités

- **Recherche** par Riot ID (pseudo#tag)
- **Profil joueur** : rang, niveau, winrate, LP
- **Historique des matchs** : KDA, CS/min, durée, rôle, champion
- **Analyse IA** : conseils personnalisés via Mistral 7B (points forts, axes d'amélioration, plan d'action)

## Structure

```
lol-app/
├── client/          # React + Vite
│   └── src/
│       ├── pages/   # Home, Profile, Matches, Analysis
│       ├── components/
│       ├── api/
│       └── types/
└── server/          # Express
    └── src/
        └── routes/  # summoner, matches, analyze
```

## Notes

- La clé API Riot "Development" expire après 24h. Renouvelle-la sur developer.riotgames.com.
- La région est configurée sur **EUW**. Pour NA/KR, modifie les URLs dans `server/src/routes/`.
- L'analyse IA nécessite environ 4 Go de RAM pour Mistral 7B.
