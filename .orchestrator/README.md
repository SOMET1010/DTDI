# PASS Academy AI Orchestrator

Une Pull Request sert de canal de conversation traçable entre Claude Code et le reviewer ChatGPT indépendant.

Flux :
1. Un changement est poussé sur la branche de la PR PASS Academy.
2. `PASS AI Review` exécute les tests de structure et le build Android debug et capture les preuves.
3. OpenAI Responses API (`gpt-5.6` par défaut) effectue une revue structurée selon `PASS_ACADEMY_REVIEW_CONTRACT.md`.
4. Le verdict GO/NOK et les preuves sont publiés dans la PR.
5. Si le verdict est NOK / `CORRECT_AND_RESUBMIT`, le workflow invoque `anthropics/claude-code-action@v1` avec les constats structurés. Claude corrige la branche de PR.
6. Le nouveau push relance une revue indépendante. Après deux NOK automatiques antérieurs, le système demande un arbitrage humain au lieu de boucler indéfiniment.

Secrets GitHub requis :
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

Aucun secret n'est stocké dans le dépôt.

Garde-fous : release/production, changements destructifs, données sensibles, argent réel, changements de sécurité, changement majeur de doctrine/périmètre et désaccord persistant exigent un arbitrage humain.
