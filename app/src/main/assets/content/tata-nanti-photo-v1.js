window.TATA_NANTI_PHOTO = {
  id: 'phone-photo',
  character: 'Tata Nanti',
  scenes: [
    {
      image: 'art/tata-nanti/01_reception_telephone.png',
      voice: "Tata Nanti vient de recevoir son nouveau téléphone. Elle est avec ses deux petits-enfants.",
      action: 'next'
    },
    {
      image: 'art/tata-nanti/02_intention_photo.png',
      voice: "Elle voudrait garder un souvenir d'eux, comme une photo.",
      action: 'next'
    },
    {
      image: 'art/tata-nanti/03_choix_appareil_photo.png',
      voice: "Écoute chaque bouton, puis touche celui qui sert à prendre une photo.",
      retryVoice: "Ce n'est pas celui-là. Écoute encore, puis essaie un autre bouton.",
      action: 'choice',
      // Zones en % de la boîte image, calées sur la grille 2x2 visible dans l'asset.
      choices: [
        { zone: [4, 6, 45, 45], voice: 'Appareil photo.', good: true },
        { zone: [51, 6, 45, 45], voice: 'Téléphone.', good: false },
        { zone: [4, 53, 45, 43], voice: 'Musique.', good: false },
        { zone: [51, 53, 45, 43], voice: 'Réglages.', good: false }
      ]
    },
    {
      image: 'art/tata-nanti/04_confirmation_bon_bouton.png',
      voice: "Bravo Tata Nanti ! Tu as trouvé le bon bouton, c'est l'appareil photo.",
      action: 'next'
    },
    {
      image: 'art/tata-nanti/05_prise_photo.png',
      voice: "Maintenant, regarde bien tes petits-enfants dans l'écran, puis touche le grand rond blanc pour prendre la photo.",
      captureVoice: "Clic ! La photo est prise.",
      action: 'photo'
    },
    {
      image: 'art/tata-nanti/06_photo_reussie.png',
      voice: "Voici la photo ! Tata Nanti a réussi à prendre une photo de ses petits-enfants toute seule.",
      action: 'finish'
    }
  ]
};
