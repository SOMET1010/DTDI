// C2.1 — Catalogue Famille B (extensions PASS Côte d'Ivoire, cf.
// docs/pass-academy-gsma-mistt-alignment-c2.0.md, section 6). Aucune de ces
// 4 histoires n'a d'équivalent GSMA MISTT direct identifié — elles ne
// doivent jamais être présentées comme du contenu GSMA.
//
// Complète PASS_STORIES sans écraser les 10 histoires existantes (voir
// content/stories-v13.js, chargé avant ce fichier).
window.PASS_STORIES = window.PASS_STORIES.concat([
  {
    id: 'crop-price', category: '🌱 Vie quotidienne', icon: '🌾',
    character: 'Yao', avatar: '👨🏾‍🌾',
    title: 'Yao vend sa récolte', duration: '4 min',
    source: 'PASS Famille B', skill: 'Vérifier une information avant de vendre',
    intro: 'Yao a récolté ses ignames. Avant d’aller au marché, il veut savoir si le prix est bon aujourd’hui pour ne pas vendre trop bas.',
    problem: 'Comment peut-il vérifier le prix avant de partir ?',
    choices: ['📶 Chercher le prix du jour', '🎲 Deviner un prix au hasard', '🤐 Vendre au premier prix proposé, sans vérifier'],
    answer: 0,
    success: 'Bien joué ! Vérifier le prix avant de vendre aide Yao à obtenir un prix juste.',
    chapters: ['Je cherche l’information', 'Je compare avec ce que je sais déjà', 'Je décide d’un prix minimum', 'Je vends informé'],
  },
  {
    id: 'health-visit', category: '🏥 Ma santé', icon: '🏥',
    character: 'Konan', avatar: '👨🏾',
    title: 'Konan prend rendez-vous', duration: '4 min',
    source: 'PASS Famille B', skill: 'Prendre un rendez-vous de santé en toute confiance',
    intro: 'Konan ne se sent pas bien. Il veut consulter un centre de santé, mais ne sait pas comment faire sans se déplacer d’abord pour rien.',
    problem: 'Que peut faire Konan avant de se déplacer ?',
    choices: ['📞 Appeler le centre de santé pour vérifier les horaires', '🚶 Partir sans vérifier si le centre est ouvert', '🙅 Ne rien faire et attendre que ça passe'],
    answer: 0,
    success: 'Bien joué ! Vérifier avant de se déplacer évite un trajet inutile et aide Konan à être reçu au bon moment.',
    chapters: ['Je cherche le contact du centre de santé', 'Je vérifie les horaires ou je prends rendez-vous', 'Je note l’heure convenue', 'Je me déplace informé'],
  },
  {
    id: 'job-search', category: '💼 Mon travail', icon: '💼',
    character: 'Issa', avatar: '👨🏾‍🎓',
    title: 'Issa cherche un emploi', duration: '4 min',
    source: 'PASS Famille B', skill: 'Répondre à une offre d’emploi en ligne sans se faire piéger',
    intro: 'Issa a fini sa formation. Il voit une offre d’emploi qui lui plaît, mais on lui demande de payer des frais avant même l’entretien.',
    problem: 'Que doit faire Issa ?',
    choices: ['🛑 Se méfier d’une offre qui demande de l’argent à l’avance', '💸 Payer tout de suite pour ne pas rater sa chance', '🔑 Envoyer son code Mobile Money pour “confirmer son dossier”'],
    answer: 0,
    success: 'Très bien ! Une vraie offre d’emploi ne demande jamais d’argent ni de code secret à l’avance.',
    chapters: ['Je lis l’offre avec attention', 'Je repère un signe suspect', 'Je ne paie pas et je ne partage pas mes codes', 'Je cherche une offre fiable'],
  },
  {
    id: 'study-help', category: '🎓 Apprendre', icon: '🎓',
    character: 'Mariam', avatar: '👩🏾‍🎓',
    title: 'Mariam suit sa formation', duration: '4 min',
    source: 'PASS Famille B', skill: 'Suivre une formation en ligne malgré une connexion limitée',
    intro: 'Mariam suit une formation en ligne, mais sa connexion coupe souvent pendant les vidéos.',
    problem: 'Que peut-elle faire pour continuer à apprendre malgré la connexion ?',
    choices: ['📥 Télécharger la leçon quand le réseau est bon', '🔁 Recommencer sans cesse la vidéo en streaming', '🚫 Abandonner la formation'],
    answer: 0,
    success: 'Bravo ! Télécharger une leçon pendant une bonne connexion permet de continuer à apprendre même hors ligne.',
    chapters: ['Je repère un bon moment de connexion', 'Je télécharge la leçon', 'Je la regarde hors ligne', 'Je continue ma formation'],
  },
]);
