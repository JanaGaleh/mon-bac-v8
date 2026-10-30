(()=>{
  "use strict";
  const button=document.getElementById("installApp");
  let deferred=null;
  const inStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  if(!button)return;
  const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const showHelp=()=>{
    const old=document.getElementById("pjg-install-help");if(old){old.remove();return}
    const panel=document.createElement("dialog");panel.id="pjg-install-help";panel.setAttribute("aria-label","Installer Prof. Jana Galeh");
    const heading=document.createElement("h2");heading.textContent="Installer l’application";
    const p=document.createElement("p");
    p.textContent=isiOS
      ? "Dans Safari, touchez Partager, puis Ajouter à l’écran d’accueil (ou Ouvrir comme app), et confirmez."
      : "Dans Chrome, Edge ou un autre navigateur compatible, ouvrez le menu du navigateur puis choisissez Installer l’application ou Ajouter à l’écran d’accueil.";
    const close=document.createElement("button");close.type="button";close.textContent="Fermer";close.onclick=()=>panel.close();
    panel.append(heading,p,close);document.body.append(panel);
    panel.addEventListener("close",()=>panel.remove(),{once:true});panel.showModal();
  };
  if(inStandalone()){button.hidden=true;}
  window.addEventListener("beforeinstallprompt",(event)=>{
    event.preventDefault();deferred=event;button.hidden=false;
  });
  window.addEventListener("appinstalled",()=>{deferred=null;button.hidden=true;});
  button.addEventListener("click",async ()=>{
    if(deferred){
      const e=deferred;deferred=null;await e.prompt();try{await e.userChoice;}catch{}
      return;
    }
    showHelp();
  });
  if("serviceWorker" in navigator && location.protocol==="https:"){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{}),{once:true});
  }
})();