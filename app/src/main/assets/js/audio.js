function speak(t){try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang='fr-FR';u.rate=.82;speechSynthesis.speak(u)}catch(e){}}
