# Tata Nanti — assets narratifs réels

Cette zone est réservée au prototype UX **Tata Nanti / première photo**.

## Règle absolue

Ne pas recréer les scènes en SVG artisanal.
Ne pas réinterpréter les visuels fournis.
Ne pas remplacer un asset manquant par un pictogramme ou un placeholder narratif.

Si un asset manque, marquer `ASSET_REQUIRED` et arrêter l'intégration de la scène concernée.

## Assets attendus

Le prototype cible 6 scènes principales :

1. `scene-01-situation.png`
   - Tata Nanti avec ses deux petits-enfants.
   - Tata tient le téléphone.
   - La scène doit faire comprendre qu'elle vient de recevoir/utiliser son téléphone.

2. `scene-02-intention-photo.png`
   - Tata pense à ses petits-enfants / souhaite garder leur souvenir.
   - L'intention "prendre une photo" doit être comprise visuellement, sans texte obligatoire.

3. `scene-03-choix-camera.png`
   - Vue du téléphone avec plusieurs gros boutons/actions.
   - L'appareil photo doit être une option parmi les choix.
   - Aucun indice de couleur ne doit révéler la bonne réponse avant sélection.

4. `scene-04-confirmation.png`
   - Tata comprend qu'elle a choisi l'appareil photo.
   - Feedback positif visuel + voix SUTA.

5. `scene-05-prendre-photo.png`
   - Interface appareil photo avec les petits-enfants cadrés.
   - L'action attendue doit être évidente : appuyer sur le déclencheur.

6. `scene-06-resultat.png`
   - Tata avec ses petits-enfants et la photo prise visible.
   - Joie / réussite / résultat concret.

## Contraintes de rendu

- Format conseillé : portrait mobile ou scène recadrable en `object-fit: cover`.
- Pas de texte intégré dans l'image finale si ce texte est nécessaire à la compréhension.
- Aucun emoji comme élément narratif final.
- Style cartoon 2D premium, chaleureux, adulte, contexte ivoirien crédible.
- Conserver exactement les personnages validés entre les scènes : Tata Nanti + même fille + même garçon.
- SUTA reste un guide vocal/UX, pas un personnage qui masque la scène.

## Rôle de Claude Code

Claude Code doit uniquement :

- intégrer les images telles quelles ;
- préserver proportions et cadrage ;
- rendre le prototype responsive ;
- gérer transitions et interactions légères ;
- connecter la voix SUTA ;
- conserver les choix visibles sans scroll lorsque possible ;
- ne modifier aucune autre histoire pendant ce prototype.

## Branche

Travail exclusivement sur :

`pass-academy-tata-nanti-assets`

Ne pas merger vers `pass-academy-v03` avant validation visuelle sur téléphone réel.
