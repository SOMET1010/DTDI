# Tata Nanti — assets narratifs réels

Cette zone est réservée au prototype UX **Tata Nanti / première photo**.

**Statut : C2.1 — assets intégrés.** Les 6 PNG sont en place et branchés dans
`content/tata-nanti-photo-v1.js` / `js/tata-nanti-photo.js`, en remplacement du
seul écran "Ma première photo" (`phone-photo`). Voir l'observation sur l'asset 3
ci-dessous avant validation finale.

## Règle absolue

Ne pas recréer les scènes en SVG artisanal.
Ne pas réinterpréter les visuels fournis.
Ne pas remplacer un asset manquant par un pictogramme ou un placeholder narratif.

Si un asset manque, marquer `ASSET_REQUIRED` et arrêter l'intégration de la scène concernée.

## Assets livrés

Les 6 scènes sont livrées et intégrées, sous ces noms exacts (différents des noms
provisoires ci-dessus utilisés lors de la préparation de ce dossier) :

1. `01_reception_telephone.png`
   - Tata Nanti avec ses deux petits-enfants, elle tient le téléphone.

2. `02_intention_photo.png`
   - Tata Nanti pense à ses petits-enfants (bulle de pensée) — l'intention "garder un souvenir" est lisible sans texte.

3. `03_choix_appareil_photo.png`
   - Vue du téléphone tenu à deux mains, grille de 4 boutons (appareil photo, téléphone, musique, réglages).
   - ⚠️ Observation d'intégration : l'icône appareil photo porte un contour lumineux jaune + éclats dans l'image livrée — un indice visuel préexistant à la sélection, alors que la doctrine du prototype demande une neutralité totale avant choix. Non corrigé ici (interdiction de retoucher l'asset) ; signalé à Patrick pour arbitrage (régénération ou acceptation).

4. `04_confirmation_bon_bouton.png`
   - Tata Nanti souriante, grand badge coche verte à droite.

5. `05_prise_photo.png`
   - Vue caméra avec les deux enfants cadrés, gros bouton déclencheur blanc déjà intégré dans l'image.

6. `06_photo_reussie.png`
   - Tata Nanti et les enfants, vignette de la photo prise avec coche verte.

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
