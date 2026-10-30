export async function timed(operation, milliseconds = 20000) {
  let timer;
  try {
    return await Promise.race([operation, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Le serveur met trop de temps à répondre. Actualisez avant de recommencer.')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
export function userMessage(error) {
  const text = error?.message || '';
  if (error?.code === 'email_not_confirmed') return 'Confirmez votre adresse e-mail avec le lien reçu avant de vous connecter.';
  if (error?.code === 'invalid_credentials') return 'E-mail ou mot de passe incorrect.';
  if (error?.code === '23505') return 'Cette référence ou cette opération a déjà été enregistrée. Actualisez pour vérifier son état.';
  if (error?.status === 429 || /rate.limit/i.test(error?.code || '')) return 'Trop de demandes. Patientez quelques minutes avant de réessayer.';
  if (/JWT|session.*expired|refresh.token/i.test(text)) return 'Votre session a expiré. Reconnectez-vous.';
  if (/fetch|network|offline/i.test(text)) return 'Connexion interrompue. Actualisez pour vérifier si votre dernière opération a été enregistrée.';
  if (error?.code && !['P0001', 'weak_password'].includes(error.code)) return 'Action non confirmée. Actualisez votre espace puis réessayez, ou contactez l’administration.';
  return text || 'Action non confirmée. Actualisez votre espace avant de recommencer.';
}
export const correctionLabels = { en_attente: 'À examiner', acceptee: 'Acceptée · correction en préparation', refusee: 'Refusée', traitee: 'Traitée · nouveau Word disponible' };
export const methodLabels = { cash: 'Espèces', waafi: 'Waafi', dmoney: 'D-Money', cacpay: 'CAC Pay', sabapay: 'SabaPay' };
