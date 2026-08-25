// C2.1 — Familles B (agriculture, santé, emploi, éducation).
//
// Doctrine à partir de C2.1 : plus d’illustration narrative artisanale en
// SVG pour les nouvelles scènes. Les scènes, personnages, situations et
// cartes de choix sont fournis comme assets graphiques validés par
// l’équipe design ; ce fichier ne fait qu’intégrer ces assets une fois
// livrés. Tant qu’un asset n’est pas livré, la scène affiche un repère
// ASSET_REQUIRED neutre (jamais une interprétation graphique de mon cru,
// jamais un indice de couleur good/bad) — voir docs/C2.1-ASSETS-REQUIRED.md
// pour la liste exacte, avec description, à transmettre à l’équipe design.

window.PASS_ASSET_REQUIRED_LIST = window.PASS_ASSET_REQUIRED_LIST || [];

// Repère neutre, pas une illustration : même gabarit pour tout le monde,
// quel que soit good/bad, pour ne jamais rejouer le problème d’indice de
// couleur déjà corrigé en C1.9d sur les histoires existantes.
window.assetRequired = function (id, desc) {
  window.PASS_ASSET_REQUIRED_LIST.push({ id: id, desc: desc });
  return '<div class="assetRequired" role="img" aria-label="Asset à fournir : ' + desc + '">' +
    '<span class="arTag">ASSET_REQUIRED</span>' +
    '<span class="arId">' + id + '</span>' +
    '<span class="arDesc">' + desc + '</span>' +
    '</div>';
};

Object.assign(window.PASS_SCENES, {
  'crop-price': [
    window.assetRequired('crop-price-scene-0', 'Yao dans son champ, entouré d’ignames récoltées, l’air pensif avant d’aller au marché'),
    window.assetRequired('crop-price-scene-1', 'Yao consulte son téléphone pour chercher le prix du jour'),
    window.assetRequired('crop-price-scene-2', 'Yao au marché, vend sa récolte informé, badge de réussite'),
  ],
  'health-visit': [
    window.assetRequired('health-visit-scene-0', 'Konan chez lui, ne se sent pas bien, hésite à se déplacer au centre de santé'),
    window.assetRequired('health-visit-scene-1', 'Konan au téléphone avec le centre de santé pour vérifier les horaires'),
    window.assetRequired('health-visit-scene-2', 'Konan reçu au centre de santé au bon moment, badge de réussite'),
  ],
  'job-search': [
    window.assetRequired('job-search-scene-0', 'Issa lit une offre d’emploi sur son téléphone, intéressé'),
    window.assetRequired('job-search-scene-1', 'Issa hésite devant un message qui demande un paiement avant l’entretien'),
    window.assetRequired('job-search-scene-2', 'Issa a repéré une offre fiable, badge de réussite'),
  ],
  'study-help': [
    window.assetRequired('study-help-scene-0', 'Mariam regarde une vidéo de formation, la connexion internet coupe'),
    window.assetRequired('study-help-scene-1', 'Mariam télécharge la leçon pendant que la connexion est bonne'),
    window.assetRequired('study-help-scene-2', 'Mariam termine sa leçon hors ligne, badge de réussite'),
  ],
});
