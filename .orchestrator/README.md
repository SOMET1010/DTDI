# PASS Academy AI Orchestrator

Une Pull Request sert de canal de conversation traçable entre Claude Code et le reviewer ChatGPT indépendant.

Flux :
1. Un changement est poussé sur la branche de la PR PASS Academy.
2. `PASS AI Review` exécute les tests de structure et le build Android debug et capture les preuves (y compris une capture d'écran sur émulateur).
3. OpenAI Responses API (`gpt-5.6` par défaut) effectue une revue structurée selon `PASS_ACADEMY_REVIEW_CONTRACT.md`.
4. Le verdict GO/NOK et les preuves sont publiés dans la PR.

**Correction automatique désactivée (décision humaine, 26/08/2026) :** l'étape « Claude corrige et pousse automatiquement » a été retirée. Chaque cycle de durcissement sécurité faisait apparaître un nouveau constat plus profond sans converger ; en attendant une revue de sécurité complète et dédiée, tout NOK est traité manuellement (par Patrick, ou par Claude sur demande explicite dans une session). Ce README sera mis à jour si la boucle automatique est réactivée.

Secrets GitHub requis :
- `OPENAI_API_KEY` — seul secret lu par ce workflow actuellement.

`ANTHROPIC_API_KEY` et `GH_PAT` ne sont plus utilisés tant que la correction automatique reste désactivée ; ils peuvent être retirés des secrets du dépôt sans casser ce workflow.

Aucun secret n'est stocké dans le dépôt.

Garde-fous : release/production, changements destructifs, données sensibles, argent réel, changements de sécurité, changement majeur de doctrine/périmètre et désaccord persistant exigent un arbitrage humain.
