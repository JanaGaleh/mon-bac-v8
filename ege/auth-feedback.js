/* EGE GFM 2027 — Retour de confirmation Supabase Auth, sans lecture des jetons. */
(()=>{'use strict';
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const search = new URLSearchParams(window.location.search);
  const error = hash.get('error') || hash.get('error_code') || search.get('error') || search.get('error_code');
  const isSignup = hash.get('type') === 'signup' && hash.has('access_token');
  const isRecovery = hash.get('type') === 'recovery' && hash.has('access_token');
  if (!error && !isSignup && !isRecovery) return;
  const teacher = /\/enseignant\.html$/i.test(window.location.pathname);
  let title, description, good = !error;
  if (error) {
    title = 'Lien de confirmation non valide';
    description = 'Ce lien a peut-être expiré ou déjà été utilisé. Si votre adresse est confirmée, connectez-vous avec votre compte. Sinon, demandez un nouveau lien depuis l’application.';
  } else if (isSignup) {
    title = 'Votre adresse e-mail est confirmée';
    description = teacher
      ? 'Bienvenue sur EGE GFM 2027. Vous pouvez vous connecter et demander votre accès enseignant.'
      : 'Bienvenue sur EGE GFM 2027. Votre compte est activé. Vous pouvez maintenant accéder à vos dossiers.';
  } else {
    title = 'Réinitialisation du mot de passe';
    description = teacher
      ? 'Ouvrez l’application principale pour définir un nouveau mot de passe.'
      : 'Choisissez un nouveau mot de passe dans la fenêtre de récupération de votre compte.';
  }
  function show() {
    if (document.getElementById('egeAuthReturnMessage')) return;
    const box = document.createElement('section');
    box.id = 'egeAuthReturnMessage';
    box.setAttribute('role','status');
    box.setAttribute('aria-live','polite');
    box.style.cssText = 'max-width:1020px;margin:14px auto 8px;padding:16px 18px;border-radius:14px;border:1px solid '+(good?'#b9e1ce':'#e9c4b5')+';background:'+(good?'#ebf8f1':'#fff4ef')+';color:#193b4b;box-sizing:border-box;font:14px/1.5 system-ui,sans-serif;';
    const heading = document.createElement('strong');
    heading.textContent=title;
    heading.style.cssText='display:block;font-size:17px;margin-bottom:5px';
    const p = document.createElement('p');
    p.textContent=description;
    p.style.margin='0';
    box.append(heading,p);
    const main = document.querySelector('main');
    if (main?.parentNode) main.parentNode.insertBefore(box,main);
    else document.body.prepend(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',show,{once:true});
  else show();
})();