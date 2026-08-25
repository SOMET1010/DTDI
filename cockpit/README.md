# PASS AI Orchestrator Cockpit

Poste de commandement au-dessus de l'orchestration Claude ↔ ChatGPT ↔ GitHub
pour PASS Academy : humain au-dessus, agents en dessous, preuves au centre.

Le Cockpit ne remplace pas GitHub — GitHub reste la source de vérité pour le
code. Le Cockpit lit les faits GitHub (Pull Requests, workflow runs,
commentaires de revue) et les transforme en un état d'orchestration
consultable et pilotable (missions, cycles, verdicts, anomalies, arbitrages).

Doctrine : **VISIBLE = PROUVÉ**. Un état affiché sans preuve GitHub associée
est affiché `NON VÉRIFIÉ`, jamais comme un succès implicite.

## Ce que ce lot livre (ORCH-1 + ORCH-2)

- **ORCH-1 — Socle + modèle de données + connexion GitHub**
  - Base SQLite (`src/db/schema.sql`) : `projects`, `missions`, `runs`,
    `events`, `reviews`, `findings`, `approvals` (cahier des charges §23).
  - Connecteur GitHub en `fetch` natif (`src/github/client.js`), sans SDK.
  - Parseur du commentaire `PASS-AI-REVIEW` déjà produit par
    `.orchestrator/reviewer.mjs` sur la branche
    `orchestrator/claude-chatgpt-pass-academy` (`src/github/parseReview.js`)
    — le Cockpit **réutilise** ce canal existant au lieu d'en inventer un
    second.
  - Moteur de synchronisation (`src/github/sync.js`) : transforme PR / runs
    de workflow / commentaires en missions/runs/events/reviews/findings,
    applique la doctrine anti-boucle (§40, escalade après `max_cycles`) et
    distingue panne d'orchestration vs NOK produit (§38).
  - API REST minimale (`src/api/server.js`) : projets, missions, runs,
    reviews, findings, approbations, `/health` sans fuite de secret.
- **ORCH-2 — Dashboard temps réel + timeline**
  - Interface statique (`public/`, aucun bundler) : bannière d'état global,
    pipeline visuel, cartes Claude / ChatGPT QA, timeline chronologique,
    panneau d'arbitrage humain, mode sombre, responsive mobile-first.
  - Rafraîchissement par polling toutes les 10 s (§21 — valeur MVP
    acceptable ; le point d'API `/missions/:id/cockpit` est conçu pour être
    remplacé plus tard par SSE/WebSocket sans changer le rendu).

Hors périmètre de ce lot (prévu dans la suite, §49) : builds/artifacts APK
détaillés (ORCH-3), boucle de correction pilotée depuis le Cockpit plutôt
qu'observée (ORCH-5), UI complète d'arbitrage avec effets sur GitHub
(ORCH-6), mémoire projet/doctrine éditable (ORCH-7), coûts API et audit
étendu (ORCH-8), recette E2E outillée (ORCH-9).

## Non-régression

Ce lot n'ajoute que le répertoire `cockpit/` et un workflow CI scopé à ce
répertoire. Aucun fichier de `app/`, `tests/`, `docs/` ou des workflows
Android/orchestrateur existants n'est modifié.

## Démarrer en local

```bash
cd cockpit
npm install
GITHUB_TOKEN=ghp_xxx GITHUB_OWNER=SOMET1010 GITHUB_REPO=DTDI npm start
```

Sans `GITHUB_TOKEN`, le Cockpit démarre quand même : `/health` répond
`github: NOT_CONFIGURED`, les missions existantes restent consultables mais
`POST /missions/:id/sync` répond `503`. Aucune fonctionnalité ne simule une
connexion GitHub absente.

Variables d'environnement :

| Variable | Rôle | Défaut |
|---|---|---|
| `PORT` | port HTTP | `4000` |
| `COCKPIT_DB_PATH` | fichier SQLite | `cockpit/data/cockpit.sqlite` |
| `GITHUB_TOKEN` | jeton GitHub (lecture PR/Actions), **jamais exposé au frontend** | — |
| `GITHUB_OWNER` / `GITHUB_REPO` | dépôt supervisé | — |
| `GITHUB_DEFAULT_BRANCH` | branche par défaut du projet PASS Academy | `pass-academy-v03` |
| `COCKPIT_POLL_INTERVAL_MS` | intervalle de synchronisation en tâche de fond | `10000` |

Ouvrir `http://localhost:4000`, créer une mission via « + Nouvelle mission »
en indiquant le numéro de la Pull Request GitHub à superviser (par exemple
la PR #1, `orchestrator/claude-chatgpt-pass-academy`), puis cliquer sur
« ↻ Sync » ou laisser la synchronisation de fond faire son travail.

## Tests

```bash
cd cockpit
npm test
```

41 tests (`node --test`, sans framework additionnel — cohérent avec les
tests existants du dépôt) couvrant :

- transitions d'état et garde-fou anti-boucle (`tests/states.test.js`) ;
- parsing du commentaire de revue, y compris le cas régressif d'un champ
  vide qui avalait la ligne markdown suivante (`tests/parseReview.test.js`) ;
- modèle de données et idempotence des événements (`tests/repository.test.js`) ;
- moteur de synchronisation : GO, NOK, panne d'orchestration, absence de
  preuve, escalade humaine, ré-exécution idempotente (`tests/sync.test.js`) ;
- API REST : succès, 400, 404, 503, non-fuite de secrets (`tests/api.test.js`).

## Architecture

```
Cockpit Web (public/, vanilla JS, aucun build)
    |
Backend Orchestrateur (src/api/server.js, Express)
    |
    +---- src/github/client.js   (GitHub REST via fetch natif)
    +---- src/github/sync.js     (faits GitHub -> modèle d'orchestration)
    +---- src/db/*                (SQLite, node:sqlite intégré à Node 22+)
```

Le Cockpit n'appelle jamais OpenAI ni Anthropic : ces appels restent dans
`.orchestrator/reviewer.mjs` et le workflow `PASS AI Review` existants. Le
Cockpit observe leurs résultats via GitHub — c'est la source d'autorité
unique pour la revue ChatGPT QA, évitant toute divergence entre deux
implémentations du même contrôle.

## Format de rapport attendu (§52)

Voir le rapport de livraison associé à ce lot pour LOT / OBJECTIF /
CHANGEMENTS / FICHIERS / COMMIT / TESTS EXÉCUTÉS / RÉSULTATS / RISQUES /
NON VÉRIFIÉ / ÉCARTS / VERDICT.
