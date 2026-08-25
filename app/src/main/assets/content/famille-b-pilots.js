// C2.1 — Pilotes Famille B. Complète PASS_BASIC_PILOTS (voir
// content/basic-pilots-v13.js, chargé avant ce fichier) avec le même
// contrat interne action/good/voice que les 10 histoires existantes.
//
// Les cartes de choix (visual) sont des assets graphiques à fournir : ce
// fichier utilise window.assetRequired(id, description), défini dans
// art/scenes-famille-b.js (chargé avant), au lieu de dessiner un SVG
// artisanal. Voir docs/C2.1-ASSETS-REQUIRED.md pour la liste complète à
// transmettre à l'équipe design, avec la description exacte de chaque
// asset attendu.
Object.assign(window.PASS_BASIC_PILOTS, {
  'crop-price': {
    id: 'crop-price', character: 'Yao', scenes: [
      { voice: 'Yao a récolté ses ignames. Avant d’aller au marché, il veut savoir si le prix est bon aujourd’hui.', cue: '🌾', action: 'next' },
      {
        voice: 'Comment peut-il vérifier le prix avant de partir ?', cue: '?', action: 'choice', choices: [
          { visual: window.assetRequired('crop-price-choice-0', 'Carte de choix : chercher le prix du jour sur le téléphone'), voice: 'Chercher le prix du jour.', good: true },
          { visual: window.assetRequired('crop-price-choice-1', 'Carte de choix : deviner un prix au hasard'), voice: 'Deviner un prix au hasard.', good: false },
          { visual: window.assetRequired('crop-price-choice-2', 'Carte de choix : vendre au premier prix proposé, sans vérifier'), voice: 'Vendre au premier prix proposé, sans vérifier.', good: false },
        ],
      },
      { voice: 'Bien joué ! Vérifier le prix avant de vendre aide Yao à obtenir un prix juste.', cue: '', action: 'finish' },
    ],
  },
  'health-visit': {
    id: 'health-visit', character: 'Konan', scenes: [
      { voice: 'Konan ne se sent pas bien. Il veut consulter un centre de santé, mais ne sait pas comment prendre rendez-vous sans se déplacer d’abord.', cue: '🏥', action: 'next' },
      {
        voice: 'Que peut faire Konan avant de se déplacer ?', cue: '?', action: 'choice', choices: [
          { visual: window.assetRequired('health-visit-choice-0', 'Carte de choix : appeler le centre de santé pour vérifier les horaires'), voice: 'Appeler le centre de santé pour vérifier les horaires.', good: true },
          { visual: window.assetRequired('health-visit-choice-1', 'Carte de choix : partir sans vérifier si le centre est ouvert'), voice: 'Partir sans vérifier si le centre est ouvert.', good: false },
          { visual: window.assetRequired('health-visit-choice-2', 'Carte de choix : ne rien faire et attendre que ça passe'), voice: 'Ne rien faire et attendre que ça passe.', good: false },
        ],
      },
      { voice: 'Bien joué ! Vérifier avant de se déplacer évite un trajet inutile et aide Konan à être reçu au bon moment.', cue: '', action: 'finish' },
    ],
  },
  'job-search': {
    id: 'job-search', character: 'Issa', scenes: [
      { voice: 'Issa a fini sa formation. Il voit une offre d’emploi qui lui plaît, mais on lui demande de payer des frais avant même l’entretien.', cue: '💼', action: 'next' },
      {
        voice: 'Que doit faire Issa ?', cue: '?', action: 'choice', choices: [
          { visual: window.assetRequired('job-search-choice-0', 'Carte de choix : se méfier d’une offre qui demande de l’argent à l’avance'), voice: 'Se méfier d’une offre qui demande de l’argent à l’avance.', good: true },
          { visual: window.assetRequired('job-search-choice-1', 'Carte de choix : payer tout de suite pour ne pas rater sa chance'), voice: 'Payer tout de suite pour ne pas rater sa chance.', good: false },
          { visual: window.assetRequired('job-search-choice-2', 'Carte de choix : envoyer son code Mobile Money pour confirmer son dossier'), voice: 'Envoyer son code Mobile Money pour confirmer son dossier.', good: false },
        ],
      },
      { voice: 'Très bien ! Une vraie offre d’emploi ne demande jamais d’argent ni de code secret à l’avance.', cue: '', action: 'finish' },
    ],
  },
  'study-help': {
    id: 'study-help', character: 'Mariam', scenes: [
      { voice: 'Mariam suit une formation en ligne, mais sa connexion coupe souvent pendant les vidéos.', cue: '🎓', action: 'next' },
      {
        voice: 'Que peut-elle faire pour continuer à apprendre malgré la connexion ?', cue: '?', action: 'choice', choices: [
          { visual: window.assetRequired('study-help-choice-0', 'Carte de choix : télécharger la leçon quand le réseau est bon'), voice: 'Télécharger la leçon quand le réseau est bon.', good: true },
          { visual: window.assetRequired('study-help-choice-1', 'Carte de choix : recommencer sans cesse la vidéo en streaming'), voice: 'Recommencer sans cesse la vidéo en streaming.', good: false },
          { visual: window.assetRequired('study-help-choice-2', 'Carte de choix : abandonner la formation'), voice: 'Abandonner la formation.', good: false },
        ],
      },
      { voice: 'Bravo ! Télécharger une leçon pendant une bonne connexion permet de continuer à apprendre même hors ligne.', cue: '', action: 'finish' },
    ],
  },
});
