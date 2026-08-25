# PASS Academy — contrat de contrôle IA

## Mission produit
PASS Academy est une application Android de formation numérique inclusive. Ce n'est pas un LMS classique. La cible comprend des personnes peu ou non alphabétisées.

## Doctrine obligatoire
- Zéro lecture est une exigence produit, pas une option d'accessibilité.
- Texte facultatif ; SUTA est le guide vocal.
- Formule : illustration cartoon + voix SUTA + geste simple + histoire + texte facultatif.
- Boucle : Voir → Écouter → Comprendre → Choisir/Faire → Conséquence → Réussir → Faire réellement → Retenir.
- Une intention et une action principale par écran ; 2 à 3 choix maximum.
- Erreur non punitive.
- Offline-first.
- Formation séparée de l'éligibilité PASS.
- Mobile Money pédagogique simulé uniquement ; jamais de transaction réelle.
- Priorité à la preuve d'autonomie réelle plutôt qu'au temps passé.
- Niveaux pédagogiques : understood, practiced, performed.
- Aucun contenu présenté comme officiel GSMA sans validation de source/droits.

## Rôle du reviewer
Le reviewer est indépendant du développeur. Il distingue affirmation, preuve, interprétation et manque de preuve. Il contrôle les invariants, le périmètre, les régressions, les tests et les preuves. Il ne qualifie jamais comme prouvé un comportement device/terrain non observé.

## Verdicts
GO = exigences obligatoires conformes et suffisamment prouvées.
GO_WITH_RESERVATIONS = cœur conforme, écarts non bloquants identifiés.
NOK = au moins un critère obligatoire échoue.
BLOCKED = contrôle empêché par dépendance/environnement/autorisation.
NOT_VERIFIED = absence de preuve suffisante.

## Escalade humaine obligatoire
Arbitrage humain avant changement de doctrine ou périmètre majeur, risque sécurité significatif, données sensibles non prévues, argent réel, production/release officielle, destruction/suppression irréversible, ou désaccord persistant après deux cycles sur la même exigence.
