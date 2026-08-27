// Prototype narratif isolé — Tata Nanti / première photo (LOT C2.1).
// N'est utilisé que pour l'histoire 'phone-photo' (voir openStory() dans
// narrative-engine.js). Ne touche à aucune autre histoire, ne réutilise pas
// renderPilot()/pilotAnswer()/pilotNext() du moteur partagé.

let tnpIndex = 0;

function tnpData() {
  return window.TATA_NANTI_PHOTO;
}

function tnpDotsHtml(total, current) {
  let out = '';
  for (let i = 0; i < total; i++) out += '<i class="' + (i === current ? 'on' : '') + '"></i>';
  return out;
}

function tnpImageBlock(scene, overlay) {
  return '<div class="tnp-imgwrap">'
    + '<img class="tnp-img" src="' + scene.image + '" alt="" onerror="this.closest(\'.tnp-imgwrap\').classList.add(\'tnp-missing\')">'
    + '<div class="tnp-missing-flag">ASSET_REQUIRED<br>' + scene.image + '</div>'
    + (overlay || '')
    + '</div>';
}

function renderTataNantiPhoto() {
  const data = tnpData();
  const scene = data.scenes[tnpIndex];
  const dots = tnpDotsHtml(data.scenes.length, tnpIndex);
  let overlay = '';
  let controls = '';

  if (scene.action === 'choice') {
    overlay = '<div class="tnp-zones">' + scene.choices.map((c, i) => {
      const z = c.zone;
      return '<button class="tnp-zone" style="left:' + z[0] + '%;top:' + z[1] + '%;width:' + z[2] + '%;height:' + z[3] + '%" onclick="tnpAnswer(' + i + ')" aria-label="Option ' + (i + 1) + '"></button>';
    }).join('') + '</div>';
  } else if (scene.action === 'photo') {
    // Le déclencheur est déjà dessiné dans l'image (05_prise_photo.png) : toute
    // la scène est tactile plutôt que de tenter d'aligner un second bouton
    // par-dessus, ce qui créerait un doublon visuel.
    overlay = '<button class="tnp-shutter" onclick="tnpCapture()" aria-label="Prendre la photo"></button>';
  }

  if (scene.action === 'next') {
    controls = '<button class="tnp-continue" onclick="tnpNext()" aria-label="Continuer">' + ICON_PLAY + '</button>';
  } else if (scene.action === 'finish') {
    controls = '<button class="tnp-continue tnp-finish" onclick="tnpFinish()" aria-label="Terminer">' + ICON_PLAY + '</button>';
  }

  document.getElementById('content').innerHTML =
    '<div class="tnp">'
    + '<div class="tnp-dots">' + dots + '</div>'
    + tnpImageBlock(scene, overlay)
    + '<div class="tnp-bubble">'
    +   '<span class="tnp-av">' + ((window.PASS_ART && window.PASS_ART.suta) || '') + '</span>'
    +   '<span class="tnp-bubble-text textOptional">' + scene.voice + '</span>'
    +   '<button class="tnp-replay" onclick="tnpReplay()" aria-label="Réécouter">' + ICON_SOUND + '</button>'
    + '</div>'
    + controls
    + '</div>';

  setTimeout(() => speak(scene.voice), 300);
}

function tnpReplay() {
  speak(tnpData().scenes[tnpIndex].voice);
}

function tnpNext() {
  tnpIndex = Math.min(tnpIndex + 1, tnpData().scenes.length - 1);
  renderTataNantiPhoto();
}

function tnpAnswer(i) {
  const scene = tnpData().scenes[tnpIndex];
  const choice = scene.choices[i];
  const btn = document.querySelectorAll('.tnp-zone')[i];
  speak(choice.voice);
  if (choice.good) {
    if (btn) btn.classList.add('tnp-correct');
    setTimeout(tnpNext, 700);
  } else {
    if (btn) {
      btn.classList.add('tnp-wrong');
      setTimeout(() => btn.classList.remove('tnp-wrong'), 450);
    }
    setTimeout(() => speak(scene.retryVoice || 'Essaie encore.'), 650);
  }
}

function tnpCapture() {
  const scene = tnpData().scenes[tnpIndex];
  const wrap = document.querySelector('.tnp-imgwrap');
  if (wrap) {
    const flash = document.createElement('div');
    flash.className = 'tnp-flash';
    wrap.appendChild(flash);
    setTimeout(() => flash.remove(), 550);
  }
  speak(scene.captureVoice || 'Photo prise.');
  setTimeout(tnpNext, 700);
}

function tnpFinish() {
  finish(tnpData().id);
}
