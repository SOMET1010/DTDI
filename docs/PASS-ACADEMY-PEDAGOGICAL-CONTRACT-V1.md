# PASS Academy — Contrat pédagogique V1

## Objet
Ce contrat définit ce qu'une histoire PASS Academy doit respecter avant d'être intégrée au produit. Il est destiné aux auteurs, développeurs et agents IA.

## Promesse pédagogique
Une histoire PASS Academy n'est pas un cours ni un quiz. Elle place un personnage récurrent dans une situation réelle, fait intervenir SUTA comme guide vocal, demande une action simple à l'utilisateur puis vérifie une compétence réellement utile.

Boucle cible :

**Voir → Écouter → Comprendre → Choisir/Faire → Voir la conséquence → Réussir → Faire réellement sur le téléphone → Retenir.**

## Doctrine zéro lecture
Une personne ne sachant lire aucun mot doit pouvoir terminer l'histoire. Le texte est complémentaire et ne doit jamais porter seul une instruction, un choix ou un résultat critique.

Toute information essentielle doit avoir au moins deux canaux parmi :
- voix SUTA ;
- illustration/scène ;
- animation/mouvement ;
- geste/action.

## Structure minimale d'une histoire
1. **Situation** — personnage + contexte de vie compréhensible visuellement.
2. **Problème** — SUTA explique en une phrase courte.
3. **Action/choix** — maximum 3 options, 2 préférées.
4. **Conséquence** — réaction visuelle et vocale immédiate.
5. **Règle utile** — SUTA formule une règle simple.
6. **Action réelle** — lorsque possible, l'utilisateur reproduit l'action sur le téléphone.
7. **Réussite** — preuve d'autonomie + clôture positive.

## Niveaux de preuve
Chaque histoire peut produire trois niveaux distincts :

- **understood** : l'utilisateur a compris la situation et choisi correctement ;
- **practiced** : il a réussi une simulation guidée ;
- **performed** : il a réalisé l'action réelle sur le téléphone ou dans le service cible.

Le niveau `performed` est la preuve d'impact la plus forte.

## Personnalisation
PASS Academy ne classe pas l'utilisateur par niveau scolaire, alphabétisation ou catégorie sociale. Le parcours s'adapte à partir de capacités observées : ce que la personne sait déjà faire, ce qu'elle réussit avec aide, et ce qu'elle sait ensuite refaire seule.

La personnalisation pédagogique intervient après attribution du téléphone et ne modifie jamais l'éligibilité PASS.

## Règles d'écriture SUTA
- phrases courtes ;
- vocabulaire quotidien ;
- une idée par phrase ;
- jamais de ton infantilisant ;
- jamais de sanction en cas d'erreur ;
- reformulation et nouvelle tentative ;
- prononcer les nombres et montants de façon non ambiguë ;
- éviter le jargon administratif ou technique sans explication orale simple.

## Règles visuelles
- cartoon 2D premium, adulte, chaleureux ;
- contexte ivoirien crédible ;
- personnages récurrents ;
- gros objets utiles et lisibles ;
- décor simplifié ;
- animations au service de la compréhension ;
- pas d'emoji dans les visuels finaux ;
- maximum une action principale par écran.

## Règles des choix
- 2 choix préférés, 3 maximum ;
- chaque choix possède une illustration distincte ;
- chaque choix possède une phrase audio de prévisualisation ;
- une seule option correcte sauf scénario explicitement multi-réponse ;
- une mauvaise réponse doit expliquer le risque sans humilier ;
- les distracteurs doivent être plausibles, pas absurdes uniquement pour faciliter la réponse.

## Action réelle
Chaque histoire doit indiquer si une preuve réelle est techniquement possible.

Exemples :
- photo → ouvrir l'appareil photo et prendre une vraie photo ;
- appel → ouvrir le composeur/contact ;
- réglage → ouvrir l'écran Android correspondant ;
- service public → identifier le service officiel puis lancer la démarche si le contexte et la sécurité le permettent ;
- Mobile Money → privilégier simulation sûre ; ne jamais déclencher une vraie transaction pour une recette pédagogique.

## Mesure d'impact
Pour les compétences prioritaires, prévoir :
- `baseline` : sait faire avant ?
- `immediate` : sait faire juste après ?
- `retention` : sait refaire plus tard ?

L'application doit privilégier la réussite de l'action plutôt que le temps passé ou le nombre d'écrans consultés.

## Critères de validation d'une histoire
Une histoire est **GO** seulement si :
- elle est terminable sans lecture ;
- chaque instruction essentielle est audio ;
- chaque choix est visuel et pré-écoutable ;
- les cibles tactiles sont grandes ;
- la conséquence d'une réponse est compréhensible sans texte ;
- la progression est sauvegardée ;
- la compétence mesurée est explicite ;
- la preuve `performed` est définie ou explicitement déclarée impossible/non sûre ;
- les contenus officiels externes sont sourcés et autorisés ;
- la formation reste séparée de l'éligibilité PASS.

## Priorités V1
P0 : gestes téléphone, photo, appel/vocal, sécurité/arnaques, Mobile Money sûr, données mobiles/Wi-Fi.

P1 : commerce simple, météo/information utile, e-Justice/services publics, phishing/faux sites.

P2 : recherche vocale, stockage, accessibilité, agriculture/information marché, démarches administratives supplémentaires.

## Contrat machine-readable
Le schéma JSON associé est : `docs/pass-academy-story-contract-v1.schema.json`.

Tout futur générateur d'histoires (Claude, autre agent IA ou Content Studio) doit produire des objets validables contre ce schéma avant intégration au moteur.