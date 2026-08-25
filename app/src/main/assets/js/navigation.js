function welcomeVoice(){speak('Bonjour. Je suis SUTA. Touche le grand bouton vert pour continuer, ou touche un personnage.')}
function refresh(){document.getElementById('continue').onclick=()=>openStory(nextStory())}
function goHome(){document.getElementById('detail').classList.remove('on');document.getElementById('home').classList.add('on');activePilot=null;refresh()}
function sutaHelp(){speak('Je suis SUTA. Touche le haut-parleur pour m’écouter et les grandes images pour choisir.')}
function showProgress(){speak('Tu as terminé '+Object.keys(progress).length+' histoires.')}
function toggleRead(){let on=document.getElementById('app').classList.toggle('zeroRead');speak(on?'Mode test sans lecture activé. Les textes sont masqués.':'Mode test sans lecture désactivé.')}
