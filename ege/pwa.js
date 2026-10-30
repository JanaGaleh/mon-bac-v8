export function initPwa({ isBusy = () => false, notify = () => {} } = {}) {
  const install = document.getElementById('installPwa');
  const update = document.getElementById('updatePwa');
  let prompt, registration, reloading = false;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); prompt = event; install.hidden = false;
  });
  window.addEventListener('appinstalled', () => { prompt = null; install.hidden = true; });
  install.addEventListener('click', async () => {
    if (!prompt) return;
    await prompt.prompt(); await prompt.userChoice;
    prompt = null; install.hidden = true;
  });
  update.addEventListener('click', () => {
    if (isBusy()) { notify('Terminez l’enregistrement ou l’import avant de mettre à jour.'); return; }
    if (!registration?.waiting) return;
    reloading = true; registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  });
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) location.reload(); });
  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
      if (registration.waiting) update.hidden = false;
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) update.hidden = false;
        });
      });
    } catch { notify('L’installation hors connexion est indisponible. Le site reste accessible en ligne.'); }
  });
}
