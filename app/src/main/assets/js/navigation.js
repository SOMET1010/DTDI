function welcomeVoice(){speak('Bonjour. Je suis SUTA. Touche le grand bouton vert pour continuer, ou touche un personnage.')}
function refresh(){document.getElementById('continue').onclick=()=>openStory(nextStory())}
function goHome(){document.getElementById('detail').classList.remove('on');document.getElementById('home').classList.add('on');activePilot=null;refresh()}
function sutaHelp(){speak('Je suis SUTA. Touche le haut-parleur pour m’écouter et les grandes images pour choisir.')}
function showProgress(){speak('Tu as terminé '+Object.keys(progress).length+' histoires.')}
function toggleRead(){document.getElementById('app').classList.toggle('zeroRead');speak('Mode test sans lecture.')}
