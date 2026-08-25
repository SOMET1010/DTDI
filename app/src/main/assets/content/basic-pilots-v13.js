window.PASS_BASIC_PILOTS={
 'voice-note':{id:'voice-note',character:'Mariam',scenes:[
  {voice:'Mariam est loin de sa mère. Sa mère préfère écouter plutôt que lire.',cue:'💬',action:'next'},
  {voice:'Que peut envoyer Mariam ?',cue:'?',action:'choice',choices:[
   {visual:'🎙️',voice:'Une note vocale.',good:true},
   {visual:'🧮',voice:'Une calculatrice.',good:false},
   {visual:'🔋',voice:'La batterie.',good:false}
  ]},
  {voice:'Exact ! Une note vocale permet de parler sans écrire.',cue:'',action:'finish'}
 ]},
 weather:{id:'weather',character:'Yao',scenes:[
  {voice:'Yao doit travailler au champ demain. Il veut savoir s’il risque de pleuvoir.',cue:'🌦️',action:'next'},
  {voice:'Comment son téléphone peut-il l’aider ?',cue:'?',action:'choice',choices:[
   {visual:'🌦️',voice:'Chercher la météo.',good:true},
   {visual:'📵',voice:'Éteindre le téléphone.',good:false},
   {visual:'🗑️',voice:'Supprimer ses contacts.',good:false}
  ]},
  {voice:'Bien joué ! Internet peut fournir une information utile pour son activité.',cue:'',action:'finish'}
 ]},
 'market-photo':{id:'market-photo',character:'Fatou',scenes:[
  {voice:'Fatou vend au marché. Une cliente veut voir ses tomates avant de se déplacer.',cue:'🍅',action:'next'},
  {voice:'Comment son téléphone peut-il l’aider ?',cue:'?',action:'choice',choices:[
   {visual:'📸',voice:'Prendre et envoyer une photo.',good:true},
   {visual:'🧹',voice:'Nettoyer le marché.',good:false},
   {visual:'⚖️',voice:'Peser les tomates.',good:false}
  ]},
  {voice:'Oui ! Une photo peut aider Fatou à présenter ses produits à distance.',cue:'',action:'finish'}
 ]},
 'data-cost':{id:'data-cost',character:'Issa',scenes:[
  {voice:'Issa regarde beaucoup de vidéos et son forfait finit trop vite. Il veut comprendre ce qui consomme ses données.',cue:'📶',action:'next'},
  {voice:'Quel choix peut l’aider à économiser son forfait ?',cue:'?',action:'choice',choices:[
   {visual:'📡',voice:'Utiliser le Wi-Fi quand il est disponible.',good:true},
   {visual:'▶️',voice:'Lancer toutes les vidéos en haute qualité.',good:false},
   {visual:'🔁',voice:'Télécharger plusieurs fois le même fichier.',good:false}
  ]},
  {voice:'Exact ! Le Wi-Fi et une utilisation maîtrisée de la vidéo peuvent aider à économiser les données.',cue:'',action:'finish'}
 ]},
 apps:{id:'apps',character:'Mariam',scenes:[
  {voice:'Mariam veut installer une application d’apprentissage. Elle voit plusieurs résultats qui se ressemblent.',cue:'⬇️',action:'next'},
  {voice:'Que doit-elle vérifier avant d’installer ?',cue:'?',action:'choice',choices:[
   {visual:'✅',voice:'Le nom, l’éditeur et la source officielle.',good:true},
   {visual:'🎨',voice:'Seulement la couleur de l’icône.',good:false},
   {visual:'⭐',voice:'Installer la première application sans regarder.',good:false}
  ]},
  {voice:'Bien ! Vérifier l’application avant l’installation réduit les risques.',cue:'',action:'finish'}
 ]},
 accessibility:{id:'accessibility',character:'Tata Nanti',scenes:[
  {voice:'Tata Nanti lit difficilement les petits textes. SUTA lui montre que le téléphone peut lire certains contenus à voix haute et agrandir l’affichage.',cue:'🔊',action:'next'},
  {voice:'Quelle aide peut rendre le téléphone plus facile à utiliser ?',cue:'?',action:'choice',choices:[
   {visual:'🔊',voice:'Lecture à voix haute et texte agrandi.',good:true},
   {visual:'🔅',voice:'Réduire au minimum la luminosité.',good:false},
   {visual:'🔕',voice:'Couper tous les sons.',good:false}
  ]},
  {voice:'Bravo ! Les fonctions d’accessibilité peuvent adapter le téléphone aux besoins de chacun.',cue:'',action:'finish'}
 ]}
};
