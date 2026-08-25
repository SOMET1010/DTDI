window.PASS_BASIC_PILOTS={
 'voice-note':{id:'voice-note',character:'Mariam',scenes:[
  {voice:'Mariam est loin de sa mère. Sa mère préfère écouter plutôt que lire.',cue:'💬',action:'next'},
  {voice:'Que peut envoyer Mariam ?',cue:'?',action:'choice',choices:[
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><rect x="56" y="24" width="26" height="40" rx="13" fill="#6C63C8"/><path d="M48 54q21 22 42 0" stroke="#6C63C8" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M69 76v10" stroke="#6C63C8" stroke-width="6" stroke-linecap="round"/><path d="M100 38q16 17 0 34" stroke="#2E9D55" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M114 28q28 27 0 54" stroke="#2E9D55" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/></svg>`,voice:'Une note vocale.',good:true},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><rect x="52" y="20" width="56" height="72" rx="10" fill="#fff" stroke="#F08224" stroke-width="4"/><rect x="61" y="30" width="38" height="16" rx="4" fill="#FFE1C2"/><circle cx="66" cy="60" r="6" fill="#F08224"/><circle cx="80" cy="60" r="6" fill="#F08224"/><circle cx="94" cy="60" r="6" fill="#F08224"/><circle cx="66" cy="78" r="6" fill="#F08224"/><circle cx="80" cy="78" r="6" fill="#F08224"/><circle cx="94" cy="78" r="6" fill="#F08224"/></svg>`,voice:'Une calculatrice.',good:false},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><rect x="44" y="38" width="66" height="34" rx="7" fill="none" stroke="#D64545" stroke-width="5"/><rect x="110" y="48" width="8" height="14" rx="2" fill="#D64545"/><rect x="50" y="44" width="18" height="22" rx="2" fill="#D64545"/></svg>`,voice:'La batterie.',good:false}
  ]},
  {voice:'Exact ! Une note vocale permet de parler sans écrire.',cue:'',action:'finish'}
 ]},
 weather:{id:'weather',character:'Yao',scenes:[
  {voice:'Yao doit travailler au champ demain. Il veut savoir s’il risque de pleuvoir.',cue:'🌦️',action:'next'},
  {voice:'Comment son téléphone peut-il l’aider ?',cue:'?',action:'choice',choices:[
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><circle cx="58" cy="46" r="14" fill="#FFD36C"/><path d="M76 58q6-14 20-14 13 0 16 12 11 1 11 12 0 10-12 10H82" fill="#fff" stroke="#AFC3DF" stroke-width="3"/><circle cx="70" cy="72" r="22" fill="none" stroke="#4D8B45" stroke-width="7"/><path d="M87 89l16 16" stroke="#4D8B45" stroke-width="7" stroke-linecap="round"/></svg>`,voice:'Chercher la météo.',good:true},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><rect x="60" y="18" width="40" height="72" rx="10" fill="#17233C"/><circle cx="80" cy="80" r="3" fill="#fff"/><path d="M80 30v18" stroke="#D64545" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="46" r="12" fill="none" stroke="#D64545" stroke-width="5"/></svg>`,voice:'Éteindre le téléphone.',good:false},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><circle cx="66" cy="42" r="16" fill="#F0C6A8"/><rect x="44" y="62" width="44" height="16" rx="8" fill="#AFC3DF"/><rect x="100" y="34" width="30" height="40" rx="6" fill="#fff" stroke="#D64545" stroke-width="4"/><path d="M106 42h18M106 58h18" stroke="#D64545" stroke-width="4" stroke-linecap="round"/></svg>`,voice:'Supprimer ses contacts.',good:false}
  ]},
  {voice:'Bien joué ! Internet peut fournir une information utile pour son activité.',cue:'',action:'finish'}
 ]},
 'market-photo':{id:'market-photo',character:'Fatou',scenes:[
  {voice:'Fatou vend au marché. Une cliente veut voir ses tomates avant de se déplacer.',cue:'🍅',action:'next'},
  {voice:'Comment son téléphone peut-il l’aider ?',cue:'?',action:'choice',choices:[
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><rect x="34" y="34" width="62" height="46" rx="10" fill="#17233C"/><rect x="52" y="24" width="26" height="12" rx="4" fill="#17233C"/><circle cx="65" cy="57" r="15" fill="#fff"/><circle cx="65" cy="57" r="8" fill="#7DB7E8"/><path d="M112 40v40" stroke="#2E9D55" stroke-width="7" stroke-linecap="round"/><path d="M100 52l12-12 12 12" stroke="#2E9D55" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,voice:'Prendre et envoyer une photo.',good:true},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M96 20l-46 56" stroke="#8C6239" stroke-width="7" stroke-linecap="round"/><path d="M40 92l14-20 18 6-8 18z" fill="#F08224"/><path d="M46 82l10-14M52 88l10-14M58 94l8-12" stroke="#D9862A" stroke-width="3" stroke-linecap="round"/></svg>`,voice:'Nettoyer le marché.',good:false},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M80 24v56" stroke="#D64545" stroke-width="6" stroke-linecap="round"/><path d="M40 40h80" stroke="#D64545" stroke-width="6" stroke-linecap="round"/><path d="M40 40l-14 26h28z" fill="none" stroke="#D64545" stroke-width="5" stroke-linejoin="round"/><path d="M120 40l-14 26h28z" fill="none" stroke="#D64545" stroke-width="5" stroke-linejoin="round"/><rect x="66" y="80" width="28" height="10" rx="4" fill="#D64545"/></svg>`,voice:'Peser les tomates.',good:false}
  ]},
  {voice:'Oui ! Une photo peut aider Fatou à présenter ses produits à distance.',cue:'',action:'finish'}
 ]},
 'data-cost':{id:'data-cost',character:'Issa',scenes:[
  {voice:'Issa regarde beaucoup de vidéos et son forfait finit trop vite. Il veut comprendre ce qui consomme ses données.',cue:'📶',action:'next'},
  {voice:'Quel choix peut l’aider à économiser son forfait ?',cue:'?',action:'choice',choices:[
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M40 60c0-28 22-48 40-48s40 20 40 48" fill="none" stroke="#15928F" stroke-width="8" stroke-linecap="round"/><path d="M58 68c0-16 12-28 22-28s22 12 22 28" fill="none" stroke="#15928F" stroke-width="8" stroke-linecap="round"/><circle cx="80" cy="82" r="8" fill="#15928F"/></svg>`,voice:'Utiliser le Wi-Fi quand il est disponible.',good:true},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><rect x="40" y="28" width="80" height="54" rx="10" fill="#17233C"/><path d="M70 44l24 14-24 14z" fill="#fff"/><path d="M108 24l6 8M118 30l6-8" stroke="#F08224" stroke-width="4" stroke-linecap="round"/><circle cx="126" cy="20" r="4" fill="#F08224"/></svg>`,voice:'Lancer toutes les vidéos en haute qualité.',good:false},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M60 24v30" stroke="#D64545" stroke-width="7" stroke-linecap="round"/><path d="M48 44l12 12 12-12" stroke="#D64545" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="42" y="62" width="36" height="8" rx="4" fill="#D64545"/><path d="M104 24v30" stroke="#D64545" stroke-width="7" stroke-linecap="round" opacity=".55"/><path d="M92 44l12 12 12-12" stroke="#D64545" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/><rect x="86" y="62" width="36" height="8" rx="4" fill="#D64545" opacity=".55"/></svg>`,voice:'Télécharger plusieurs fois le même fichier.',good:false}
  ]},
  {voice:'Exact ! Le Wi-Fi et une utilisation maîtrisée de la vidéo peuvent aider à économiser les données.',cue:'',action:'finish'}
 ]},
 apps:{id:'apps',character:'Mariam',scenes:[
  {voice:'Mariam veut installer une application d’apprentissage. Elle voit plusieurs résultats qui se ressemblent.',cue:'⬇️',action:'next'},
  {voice:'Que doit-elle vérifier avant d’installer ?',cue:'?',action:'choice',choices:[
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M80 18l30 12v22q0 24-30 34-30-10-30-34V30z" fill="#2256A3"/><path d="M67 55l10 10 18-20" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,voice:'Le nom, l’éditeur et la source officielle.',good:true},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M80 26c-24 0-40 16-40 34 0 12 8 18 18 18h4c5 0 8-4 6-9-2-4 1-9 6-9h14c11 0 20-9 20-20 0-8-12-14-28-14z" fill="#fff" stroke="#F08224" stroke-width="4"/><circle cx="62" cy="52" r="6" fill="#D64545"/><circle cx="80" cy="42" r="6" fill="#2E9D55"/><circle cx="98" cy="52" r="6" fill="#2256A3"/></svg>`,voice:'Seulement la couleur de l’icône.',good:false},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><rect x="34" y="35" width="40" height="40" rx="10" fill="#D64545"/><path d="M90 55h40" stroke="#D64545" stroke-width="8" stroke-linecap="round"/><path d="M112 39l22 16-22 16" stroke="#D64545" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,voice:'Installer la première application sans regarder.',good:false}
  ]},
  {voice:'Bien ! Vérifier l’application avant l’installation réduit les risques.',cue:'',action:'finish'}
 ]},
 accessibility:{id:'accessibility',character:'Tata Nanti',scenes:[
  {voice:'Tata Nanti lit difficilement les petits textes. SUTA lui montre que le téléphone peut lire certains contenus à voix haute et agrandir l’affichage.',cue:'🔊',action:'next'},
  {voice:'Quelle aide peut rendre le téléphone plus facile à utiliser ?',cue:'?',action:'choice',choices:[
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M34 46v18h12l16 13V33L46 46z" fill="#F08224"/><path d="M68 42q10 13 0 26" stroke="#F08224" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M78 34q18 21 0 42" stroke="#F08224" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/><text x="118" y="70" text-anchor="middle" font-size="42" font-family="Arial" font-weight="700" fill="#2256A3">A</text></svg>`,voice:'Lecture à voix haute et texte agrandi.',good:true},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><circle cx="80" cy="55" r="16" fill="#D8DDE5"/><path d="M80 27v-8M80 91v8M48 55h-8M120 55h8M58 33l-6-6M108 83l6 6M108 33l6-6M58 83l-6 6" stroke="#AAB3C0" stroke-width="4" stroke-linecap="round"/><rect x="68" y="52" width="24" height="6" rx="3" fill="#8F4F1C"/></svg>`,voice:'Réduire au minimum la luminosité.',good:false},
   {visual:`<svg viewBox="0 0 160 110"><rect width="160" height="110" rx="18" fill="#F5F7FA"/><path d="M40 46v18h12l16 13V33L52 46z" fill="#D64545"/><path d="M92 46l28 18M120 46l-28 18" stroke="#D64545" stroke-width="7" stroke-linecap="round"/></svg>`,voice:'Couper tous les sons.',good:false}
  ]},
  {voice:'Bravo ! Les fonctions d’accessibilité peuvent adapter le téléphone aux besoins de chacun.',cue:'',action:'finish'}
 ]}
};
