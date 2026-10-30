import { client, rpc, unwrap } from '../js/api.js';
import { escapeHtml as esc } from '../js/domain.js';
import { academicYear, money, correctionOpen, validateProfile, safeDownload, orderLabels } from './domain.js';
import { timed, userMessage, correctionLabels, methodLabels } from './data.js';
import { validateDocx, extractImport, uploadImmutable } from './files.js';
import { initPwa } from './pwa.js';

const $ = id => document.getElementById(id);
const pageSize = 25;
const state = {
  user: null, profile: null, orders: [], dossiers: [], corrections: [], methods: [],
  themes: [], subthemes: [], tariffs: [], offers: [], offerPages: new Map(),
  admin: false, adminOrders: [], adminCorrections: [], adminMethods: [], importReport: [],
  pendingOffer: null, epoch: 0, catalogEpoch: 0, busy: 0, lastCatalogue: 0,
  adminOrderOffset: 0, adminCorrectionOffset: 0, adminOrderFilter: '', adminCorrectionFilter: 'en_attente',
};
const query = (table, columns = '*') => client.from(table).select(columns);
const read = promise => timed(unwrap(promise));
const call = (name, args = {}) => timed(rpc(name, args));
const current = epoch => state.epoch === epoch && !!state.user;
const note = text => { $('status').textContent = text; };
const date = value => value ? new Date(value).toLocaleString('fr-FR') : '';

function closeModal() {
  if (state.busy) { $('dialogMessage').textContent = 'Une opération est en cours. Patientez avant de fermer.'; return; }
  $('dialog').close(); $('dialogBody').textContent = ''; $('dialogMessage').textContent = '';
}
function modal(title, html) {
  $('dialogTitle').textContent = title; $('dialogBody').innerHTML = html; $('dialogMessage').textContent = '';
  if (!$('dialog').open) $('dialog').showModal();
  $('dialogBody').querySelector('input,select,textarea,button')?.focus();
}
function clearPrivate() {
  state.epoch++;
  Object.assign(state, { user: null, profile: null, orders: [], dossiers: [], corrections: [], methods: [], admin: false, adminOrders: [], adminCorrections: [], adminMethods: [], importReport: [] });
  for (const id of ['profilePanel', 'orders', 'corrections', 'adminPanel', 'privateMessage', 'dialogBody', 'dialogMessage']) $(id).textContent = '';
  $('workspace').hidden = true; $('adminPanel').hidden = true; $('accountButton').textContent = 'Mon espace';
  if ($('dialog').open) $('dialog').close();
}
function authForm(mode = 'login') {
  const signup = mode === 'signup', reset = mode === 'reset', recovery = mode === 'recovery', resend = mode === 'resend';
  const title = { signup: 'Créer mon compte', reset: 'Réinitialiser mon mot de passe', recovery: 'Choisir un nouveau mot de passe', resend: 'Renvoyer le lien de confirmation', login: 'Se connecter' }[mode];
  modal(title, `<p>Votre compte JanaGaleh permet d’accéder à EGE.</p><form id="authForm" data-mode="${mode}">
    ${signup ? '<label>Nom complet<input name="nom" autocomplete="name" maxlength="100" required></label>' : ''}
    ${!recovery ? '<label>E-mail<input name="email" type="email" autocomplete="email" maxlength="254" required></label>' : ''}
    ${!reset && !resend ? `<label>Mot de passe<input name="password" type="password" autocomplete="${signup || recovery ? 'new-password' : 'current-password'}" ${signup || recovery ? 'minlength="12"' : ''} required maxlength="200"></label>` : ''}
    <button class="primary">${signup ? 'Créer mon compte' : reset || resend ? 'Recevoir un lien' : recovery ? 'Enregistrer le mot de passe' : 'Se connecter'}</button></form>
    ${!recovery ? `<div class="auth-links"><button data-auth="${signup ? 'login' : 'signup'}">${signup ? 'J’ai déjà un compte' : 'Créer un compte'}</button><button data-auth="reset">Mot de passe oublié</button><button data-auth="resend">Confirmation non reçue</button></div>` : ''}`);
}
let resendAfter = 0;

async function catalogue() {
  const revision = ++state.catalogEpoch;
  $('reloadCatalogue').hidden = true; $('catalogueMessage').textContent = 'Chargement…';
  try {
    const [themes, subthemes, tariffs, probe] = await Promise.all([
      read(query('ege_themes', 'id,titre,annee_scolaire,actif').eq('actif', true).eq('annee_scolaire', academicYear).order('id').limit(100)),
      read(query('ege_sous_themes', 'id,theme_id,numero,intitule,actif').eq('actif', true).order('numero').limit(200)),
      read(query('ege_tarifs', 'code,montant_djf,actif').eq('actif', true).limit(20)),
      read(query('ege_catalogue_dossiers', 'id').eq('annee_scolaire', academicYear).limit(1)),
    ]);
    if (revision !== state.catalogEpoch) return;
    Object.assign(state, { themes, subthemes, tariffs, offers: [], lastCatalogue: Date.now() }); state.offerPages.clear();
    const selected = $('themeFilter').value;
    $('catalogueCount').textContent = `${themes.length} thèmes · ${subthemes.filter(s => themes.some(t => t.id === s.theme_id)).length} sous-thèmes`;
    $('themeFilter').innerHTML = '<option value="">Tous les thèmes</option>' + themes.map(t => `<option value="${t.id}">${esc(t.titre)}</option>`).join('');
    if (themes.some(t => String(t.id) === selected)) $('themeFilter').value = selected;
    for (const [id, code] of [['priceIndividual', 'dossier_individuel'], ['pricePair', 'dossier_binome']]) {
      const tariff = tariffs.find(t => t.code === code); $(id).textContent = tariff ? money(tariff.montant_djf) : 'Indisponible';
    }
    $('catalogueMessage').textContent = probe.length ? 'Ouvrez un sous-thème pour consulter ses dossiers. La disponibilité pour votre établissement est vérifiée à la réservation.' : 'Les dossiers documentaires sont en préparation. Les commandes ouvriront après validation et dépôt des fichiers.';
    renderCatalogue();
  } catch (error) {
    if (revision !== state.catalogEpoch) return;
    $('catalogueMessage').textContent = 'Catalogue indisponible. ' + userMessage(error); $('reloadCatalogue').hidden = false;
  }
}
function renderCatalogue() {
  const search = $('search').value.trim().toLocaleLowerCase('fr'), filter = $('themeFilter').value;
  $('themeGrid').innerHTML = state.themes.filter(t => !filter || String(t.id) === filter).map(t => {
    const subs = state.subthemes.filter(s => s.theme_id === t.id && (!search || `${t.titre} ${s.intitule}`.toLocaleLowerCase('fr').includes(search)));
    return subs.length ? `<article class="theme-card"><span class="number">${String(t.id).padStart(2, '0')}</span><h3>${esc(t.titre)}</h3>${subs.map(s => `<details data-subtheme="${s.id}"><summary>${s.numero}. ${esc(s.intitule)}</summary><div id="offers-${s.id}" aria-live="polite">Ouvrez ce sous-thème pour consulter les dossiers.</div></details>`).join('')}</article>` : '';
  }).join('') || '<p>Aucun sous-thème ne correspond à votre recherche.</p>';
}
function renderOffers(id) {
  const page = state.offerPages.get(id), element = $(`offers-${id}`); if (!element || !page) return;
  element.innerHTML = page.items.map(o => `<div class="offer"><strong>${esc(o.titre)}</strong><p>${esc(o.problematique)}</p><span class="pill">${o.type_travail === 'binome' ? 'Binôme' : 'Individuel'}</span><br><button class="secondary" data-offer="${esc(o.id)}">Choisir ce sujet</button></div>`).join('') || '<p class="muted">Aucun dossier validé disponible pour le moment.</p>';
  if (page.more) element.insertAdjacentHTML('beforeend', `<button class="secondary" data-more-offers="${id}">Voir les dossiers suivants</button>`);
}
async function loadOffers(id, append = false) {
  const revision = state.catalogEpoch, old = state.offerPages.get(id);
  if (!append && old) { renderOffers(id); return; }
  if (!append && $(`offers-${id}`)) $(`offers-${id}`).textContent = 'Chargement des dossiers…';
  const offset = append ? old.items.length : 0;
  try {
    const items = await read(query('ege_catalogue_dossiers', 'id,sous_theme_id,type_travail,numero,titre,problematique,annee_scolaire').eq('annee_scolaire', academicYear).eq('sous_theme_id', id).order('numero').order('id').range(offset, offset + 19));
    if (revision !== state.catalogEpoch) return;
    state.offerPages.set(id, { items: [...(append ? old.items : []), ...items], more: items.length === 20 });
    state.offers = [...new Map([...state.offers, ...items].map(o => [o.id, o])).values()]; renderOffers(id);
  } catch (error) {
    if (revision === state.catalogEpoch && $(`offers-${id}`)) $(`offers-${id}`).innerHTML = `<p>${esc(userMessage(error))}</p><button class="secondary" data-retry-offers="${id}">Réessayer</button>`;
  }
}

function renderProfile() {
  const p = state.profile || {}, locked = state.dossiers.some(d => d.sujet_confirme_le);
  $('profilePanel').innerHTML = `<details ${state.profile ? '' : 'open'}><summary>${state.profile ? 'Mon profil EGE' : 'Compléter mon profil EGE'}</summary><p class="small">Année ${academicYear} · Les informations confirmées sont conservées avec chaque commande.</p><form id="profileForm"><div class="form-grid">
    <label>Nom<input name="nom" autocomplete="family-name" maxlength="100" value="${esc(p.nom)}" required ${locked ? 'readonly' : ''}></label>
    <label>Prénom<input name="prenom" autocomplete="given-name" maxlength="100" value="${esc(p.prenom)}" required ${locked ? 'readonly' : ''}></label>
    <label>Candidature<select name="statut_candidat"><option value="scolarise">Élève scolarisé</option><option value="libre" ${p.statut_candidat === 'libre' ? 'selected' : ''}>Candidat libre</option></select></label>
    <label>WhatsApp<input name="whatsapp" type="tel" autocomplete="tel" maxlength="20" value="${esc(p.whatsapp)}" required></label>
    <label>Établissement<input name="etablissement" maxlength="200" value="${esc(p.etablissement)}"></label><label>Classe<input name="classe" maxlength="100" value="${esc(p.classe || 'Terminale GFM')}"></label></div>
    <p class="small">L’établissement est obligatoire pour les élèves scolarisés. La réservation pour les candidats libres n’est pas encore ouverte.</p><button class="primary">Enregistrer mon profil</button></form></details>`;
}
function renderOrders() {
  $('orders').innerHTML = state.orders.map(c => `<article class="order"><h3>${esc(orderLabels[c.statut] || c.statut)}</h3><p>Commande <strong>${esc(c.id)}</strong><br>${esc(money(c.prix_convenu_djf))} · ${esc(methodLabels[c.moyen_paiement] || c.moyen_paiement)} · ${c.type_travail === 'binome' ? 'Binôme' : 'Individuel'}</p>
    ${c.reference_transaction ? `<p>Référence : ${esc(c.reference_transaction)}</p>` : ''}<div class="actions">
    ${c.statut === 'en_attente' && c.moyen_paiement !== 'cash' ? `<button class="secondary" data-receipt="${c.id}">Déclarer mon reçu</button>` : ''}
    ${c.statut === 'en_attente' && c.moyen_paiement === 'cash' ? '<p class="muted">Contactez l’administration pour régler en espèces. Le paiement sera confirmé après encaissement.</p>' : ''}
    ${c.statut === 'livre' ? `<button class="primary" data-download="${c.id}">Télécharger mon Word</button><button class="secondary" data-versions="${c.id}">Versions précédentes</button>` : ''}
    ${correctionOpen(c) ? `<button class="secondary" data-correction="${c.id}">Demander une correction</button>` : ''}
    <a href="https://wa.me/25377231904?text=${encodeURIComponent('Bonjour, concernant ma commande EGE ' + c.id)}" target="_blank" rel="noopener noreferrer">Contacter l’administration</a></div>
    ${c.date_livraison ? `<p class="small">Première livraison : ${esc(date(c.date_livraison))} · Corrections ${correctionOpen(c) ? 'ouvertes pendant 7 jours' : 'clôturées'}.</p>` : ''}</article>`).join('') || '<p class="muted">Vous n’avez pas encore de commande. Explorez le catalogue pour choisir un sujet disponible.</p>';
  $('moreOrders').hidden = !state.orders.length || state.orders.length % pageSize !== 0;
}
function renderCorrections() {
  $('corrections').innerHTML = state.corrections.map(d => `<article class="order"><h4>${esc(correctionLabels[d.statut])}</h4><p>${esc(d.champ)} · ${esc(date(d.cree_le))}</p><p>${esc(d.detail)}</p>${d.reponse ? `<p class="notice"><strong>Réponse de l’administration</strong><br>${esc(d.reponse)}</p>` : ''}</article>`).join('') || '<p class="muted">Aucune demande de correction. Les réponses de l’administration apparaîtront ici.</p>';
}
async function enter(user) {
  if (state.user && state.user.id !== user.id) clearPrivate();
  const epoch = ++state.epoch; state.user = user; $('workspace').hidden = false; $('accountButton').textContent = 'Mon espace EGE'; $('privateMessage').textContent = 'Chargement de votre espace…';
  try {
    const [profile, orders, dossiers, methods, admin, corrections] = await Promise.all([
      read(query('ege_profils').eq('utilisateur_id', user.id).maybeSingle()),
      read(query('ege_commandes').eq('acheteur_id', user.id).order('date_creation', { ascending: false }).order('id', { ascending: false }).range(0, pageSize - 1)),
      read(query('ege_dossiers', 'id,sujet_confirme_le').eq('eleve_id', user.id).limit(500)),
      read(query('ege_comptes_paiement').eq('actif', true).limit(10)), call('ege_est_admin'),
      read(query('ege_demandes_correction', 'id,dossier_id,champ,detail,statut,cree_le,traite_le,reponse').eq('demandeur_id', user.id).order('cree_le', { ascending: false }).limit(100)),
    ]);
    if (!current(epoch)) return;
    Object.assign(state, { profile, orders, dossiers, methods, admin: admin === true, corrections });
    renderProfile(); renderOrders(); renderCorrections(); $('privateMessage').textContent = '';
    if (state.admin) await renderAdmin(epoch);
  } catch (error) { if (current(epoch)) $('privateMessage').textContent = userMessage(error); }
}
function options(labels, selected, all = 'Tous les états') {
  return `<option value="">${all}</option>` + Object.entries(labels).map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${esc(label)}</option>`).join('');
}
async function renderAdmin(epoch = state.epoch) {
  const revision = state.adminRevision = (state.adminRevision || 0) + 1;
  const [bilan, commands, corrections, configuration] = await Promise.all([
    call('ege_admin_bilan'), call('ege_admin_lister_commandes', { p_statut: state.adminOrderFilter || null, p_offset: state.adminOrderOffset, p_limite: pageSize }),
    call('ege_admin_lister_corrections', { p_statut: state.adminCorrectionFilter || null, p_offset: state.adminCorrectionOffset, p_limite: pageSize }),
    call('ege_admin_configuration'),
  ]);
  if (!current(epoch) || revision !== state.adminRevision) return;
  state.adminOrders = commands.items; state.adminCorrections = corrections.items; state.adminMethods = configuration.moyens; $('adminPanel').hidden = false;
  $('adminPanel').innerHTML = `<h2>Administration EGE</h2><div class="stats">${[['Brouillons', bilan.brouillons], ['Modèles validés', bilan.valides], ['Modèles avec objet Word', bilan.modeles_stockes], ['Objets Word privés', bilan.fichiers_word], ['Annexes à corriger', bilan.annexes_a_corriger], ['Revenus confirmés', money(bilan.revenus_confirmes)]].map(([label, value]) => `<p><strong>${esc(value)}</strong>${label}</p>`).join('')}</div>
    <details><summary>Importer les brouillons Word</summary><p>Les fichiers sont déposés dans le stockage privé avec leur empreinte SHA-256. Ils restent au statut « contrôle requis ». La vérification du format ne remplace pas l’analyse antivirus ni le contrôle des sources et du rendu A4.</p>
    <form id="importForm"><label>Archive ZIP ou documents DOCX<input name="files" type="file" accept=".zip,.docx" multiple required></label><label class="check"><input type="checkbox" required><span>J’ai analysé ces fichiers avec mon outil antivirus avant ce dépôt.</span></label><button class="primary">Contrôler et importer les fichiers</button></form><p id="importStatus" role="status"></p><progress id="importProgress" value="0" max="1" hidden></progress><div id="importReport"></div></details>
    <details><summary>Coordonnées de paiement marchand</summary><p>Les moyens actifs sont affichés aux élèves. Le titulaire et le numéro doivent correspondre à votre compte marchand vérifié. Les tarifs restent inchangés.</p>${state.adminMethods.map(m => `<p>${esc(methodLabels[m.moyen])} · ${m.actif ? 'Actif' : 'Inactif'} <button class="secondary" data-payment-config="${m.moyen}">Configurer</button></p>`).join('')}</details>
    <h3>Commandes</h3><label>État de commande<select id="adminOrderFilter">${options(orderLabels, state.adminOrderFilter)}</select></label><p>${commands.total} commande(s) · page ${1 + Math.floor(state.adminOrderOffset / pageSize)}</p>
    ${commands.items.map(c => `<article class="order"><p><strong>${esc(c.id)}</strong><br>${esc(orderLabels[c.statut])} · ${money(c.prix_djf)} · ${esc(methodLabels[c.moyen_paiement])}</p><button class="secondary" data-command-detail="${c.id}">Ouvrir la commande</button>${['en_attente', 'recu_envoye'].includes(c.statut) ? ` <button class="secondary" data-decision="${c.id}">Vérifier le paiement</button>` : ''}${c.statut === 'confirme' ? ` <button class="secondary" data-delivery="${c.id}">Déposer le Word personnalisé</button>` : ''}</article>`).join('') || '<p>Aucune commande dans cet état.</p>'}
    <div class="actions"><button class="secondary" data-admin-orders="previous" ${state.adminOrderOffset ? '' : 'disabled'}>Précédent</button><button class="secondary" data-admin-orders="next" ${state.adminOrderOffset + pageSize < commands.total ? '' : 'disabled'}>Suivant</button></div>
    <h3>Demandes de correction</h3><label>État de la demande<select id="adminCorrectionFilter">${options(correctionLabels, state.adminCorrectionFilter)}</select></label><p>${corrections.total} demande(s) · page ${1 + Math.floor(state.adminCorrectionOffset / pageSize)}</p>
    ${corrections.items.map(d => `<article class="order"><p><strong>${esc(correctionLabels[d.statut])}</strong> · ${esc(d.champ)}</p><p>${esc(d.detail)}</p>${d.reponse ? `<p>Réponse : ${esc(d.reponse)}</p>` : ''}<p class="small">Commande : ${esc(d.commande_id)}</p>${['en_attente', 'acceptee'].includes(d.statut) ? `<button class="secondary" data-review-correction="${d.id}">Répondre à la demande</button>` : ''}${d.statut === 'acceptee' ? ` <button class="primary" data-delivery="${d.commande_id}" data-correction-id="${d.id}">Livrer la correction</button>` : ''}</article>`).join('') || '<p>Aucune demande dans cet état.</p>'}
    <div class="actions"><button class="secondary" data-admin-corrections="previous" ${state.adminCorrectionOffset ? '' : 'disabled'}>Précédent</button><button class="secondary" data-admin-corrections="next" ${state.adminCorrectionOffset + pageSize < corrections.total ? '' : 'disabled'}>Suivant</button></div>`;
  renderImportReport();
}
function renderImportReport() {
  if (!$('importReport')) return;
  const report = state.importReport;
  $('importReport').innerHTML = report.length ? `<p>${report.filter(r => r.ok).length} fichier(s) confirmé(s) dans le stockage et la base ; ${report.filter(r => !r.ok).length} échec(s).</p><button class="secondary" id="exportImport">Télécharger le rapport complet</button><ul>${report.slice(0, 50).map(r => `<li>${esc(r.nom)} : ${esc(r.resultat)}</li>`).join('')}</ul>${report.length > 50 ? '<p>Les 50 premières lignes sont affichées. Le rapport complet contient tous les résultats.</p>' : ''}` : '';
}

function chooseOffer(id) {
  state.pendingOffer = id;
  if (!state.user) { authForm(); return; }
  if (!state.profile) { $('workspace').scrollIntoView(); $('privateMessage').textContent = 'Complétez votre profil avant de réserver.'; return; }
  validateProfile(state.profile);
  if (state.profile.statut_candidat === 'libre') throw new Error('La réservation pour les candidats libres n’est pas encore ouverte.');
  const offer = state.offers.find(o => o.id === id); if (!offer) throw new Error('Sujet indisponible. Ouvrez à nouveau le sous-thème.');
  const tariff = state.tariffs.find(t => t.code === (offer.type_travail === 'binome' ? 'dossier_binome' : 'dossier_individuel'));
  if (!tariff) throw new Error('Tarif indisponible.');
  const p = state.profile;
  modal('Vérifier et confirmer mon choix', `<h3>${esc(offer.titre)}</h3><p>${esc(offer.problematique)}</p><p>${esc(p.prenom)} ${esc(p.nom)} · ${esc(p.etablissement)} · ${academicYear}</p><p>Tarif affiché : <strong>${money(tariff.montant_djf)}</strong>. Le montant définitif est calculé et figé par le serveur.</p><form id="orderForm" data-id="${id}">${offer.type_travail === 'binome' ? '<label>Nom et prénom du deuxième élève<input name="binome" maxlength="200" required></label>' : ''}<label>Moyen de paiement<select name="moyen" required><option value="cash">Espèces · validation administrative</option>${state.methods.filter(m => m.numero_reception && m.titulaire).map(m => `<option value="${m.moyen}">${esc(methodLabels[m.moyen])} · ${esc(m.numero_reception)} · ${esc(m.titulaire)}</option>`).join('')}</select></label><label class="check"><input type="checkbox" required><span>J’ai vérifié l’identité des bénéficiaires, l’établissement et le sujet. Je confirme leur verrouillage pour cette commande.</span></label><p class="small">Aucun règlement avant confirmation de la commande. L’attribution peut être indisponible pour votre établissement.</p><button class="primary">Confirmer et réserver</button></form>`);
}
async function prepareDelivery(id, correction = null) {
  const epoch = state.epoch;
  const [detail, preparation] = await Promise.all([call('ege_admin_commande_detail', { p_commande: id }), call('ege_admin_preparer_livraison', { p_commande: id, p_correction: correction })]);
  if (!current(epoch)) return;
  const identity = detail.dossier.identite_figee || {};
  modal(correction ? 'Livrer le Word corrigé' : 'Livrer le Word personnalisé', `<p>Commande : ${esc(id)} · Version ${preparation.numero}</p><p><strong>${esc(identity.prenom)} ${esc(identity.nom)}</strong>${identity.binome ? ' et ' + esc(identity.binome) : ''}<br>${esc(identity.etablissement)} · ${esc(identity.classe)}</p><p>${esc(detail.dossier.problematique)}</p><form id="deliveryForm" data-id="${id}" data-path="${esc(preparation.chemin)}" data-correction="${correction || ''}"><label>Document personnalisé DOCX<input name="word" type="file" accept=".docx" required></label><label class="check"><input type="checkbox" required><span>J’ai contrôlé la personnalisation, les sources, les annexes, le rendu A4 et l’analyse antivirus du fichier.</span></label><p class="small">Une nouvelle version sera créée. Aucun fichier déjà livré ne sera écrasé. La période de réclamation reste calculée sur la première livraison.</p><button class="primary">Déposer et enregistrer la livraison</button></form>`);
}
async function importFiles(form, epoch) {
  $('importStatus').textContent = 'Lecture de la sélection…'; state.importReport = [];
  const files = await extractImport([...form.elements.files.files]);
  const lots = await call('ege_admin_lots_import'); if (!current(epoch)) return;
  const expected = new Map(lots.map(l => [l.nom_fichier, l]));
  $('importProgress').hidden = false; $('importProgress').max = files.length;
  for (const [index, entry] of files.entries()) {
    if (!current(epoch)) return;
    $('importStatus').textContent = `Contrôle et dépôt : ${index + 1}/${files.length} · ${entry.name}`;
    let item;
    try {
      const lot = expected.get(entry.name); if (!lot) throw new Error('Nom absent de la liste des fichiers attendus.');
      const file = await entry.read(), info = await validateDocx(file);
      if (!current(epoch)) return;
      const path = `brouillons/theme1/${info.sha256}/${entry.name}`;
      if (!(lot.sha256 === info.sha256 && lot.chemin_stockage === path && lot.objet_present)) {
        if (lot.sha256 && lot.sha256 !== info.sha256) throw new Error('Un autre document est déjà associé à ce numéro. Révision nécessaire.');
        await uploadImmutable(client.storage.from('ege-word-prive'), path, file, info.sha256, () => current(epoch));
        if (!current(epoch)) return;
        await call('ege_admin_enregistrer_import', { p_fichier: entry.name, p_sha256: info.sha256, p_taille: info.taille });
      }
      item = { nom: entry.name, sha256: info.sha256, taille: info.taille, ok: true, resultat: 'Objet et référence confirmés · contrôle documentaire requis' };
    } catch (error) { item = { nom: entry.name, ok: false, resultat: userMessage(error) }; }
    if (!current(epoch)) return;
    state.importReport.push(item); $('importProgress').value = index + 1; renderImportReport();
  }
  $('importStatus').textContent = 'Import terminé. Les échecs peuvent être repris en sélectionnant à nouveau la même archive.';
}

async function submit(form) {
  const f = new FormData(form), epoch = state.epoch;
  if (form.id === 'authForm') {
    const mode = form.dataset.mode, email = String(f.get('email') || '').trim(), password = f.get('password'), redirect = new URL('./', location.href).href;
    if (mode === 'resend') {
      if (Date.now() < resendAfter) throw new Error('Attendez une minute avant de renvoyer un lien.');
      await read(client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirect } })); resendAfter = Date.now() + 60000;
      $('dialogMessage').textContent = 'Si une confirmation est nécessaire, un lien sera envoyé. Vérifiez aussi les courriers indésirables.'; return;
    }
    if (mode === 'reset') { await read(client.auth.resetPasswordForEmail(email, { redirectTo: redirect })); $('dialogMessage').textContent = 'Si cette adresse possède un compte, un lien de récupération sera envoyé.'; return; }
    if (mode === 'recovery') {
      if (String(password).length < 12) throw new Error('Choisissez au moins 12 caractères.');
      await read(client.auth.updateUser({ password })); $('dialog').close(); note('Mot de passe mis à jour.'); return;
    }
    if (mode === 'signup') {
      if (String(password).length < 12) throw new Error('Choisissez au moins 12 caractères.');
      const data = await read(client.auth.signUp({ email, password, options: { emailRedirectTo: redirect, data: { nom: String(f.get('nom')).trim(), type_compte_souhaite: 'eleve' } } }));
      form.reset(); resendAfter = Date.now() + 60000; $('dialogMessage').textContent = 'Si cette adresse peut être inscrite, un lien de confirmation sera envoyé. Confirmez votre e-mail avant de vous connecter.';
      if (data?.session && data.user) { $('dialog').close(); await enter(data.user); } return;
    }
    const data = await read(client.auth.signInWithPassword({ email, password })); form.reset(); $('dialog').close(); await enter(data.user);
    $('workspace').scrollIntoView(); if (state.pendingOffer && state.profile) chooseOffer(state.pendingOffer); return;
  }
  if (!state.user) throw new Error('Reconnectez-vous pour continuer.');
  if (form.id === 'importForm') { await importFiles(form, epoch); return; }
  if (form.id === 'profileForm') {
    const profile = validateProfile(Object.fromEntries(['nom', 'prenom', 'statut_candidat', 'whatsapp', 'etablissement', 'classe'].map(k => [k, String(f.get(k) || '').trim()])));
    await read(client.from('ege_profils').upsert({ ...profile, utilisateur_id: state.user.id }, { onConflict: 'utilisateur_id' }));
  } else if (form.id === 'orderForm') {
    const id = await call('ege_preparer_commande', { p_modele: form.dataset.id, p_moyen: f.get('moyen'), p_binome: f.get('binome') || null });
    if (!current(epoch)) return; state.pendingOffer = null; note('Commande enregistrée : ' + id);
  } else if (form.id === 'receiptForm') {
    await call('ege_declarer_recu', { p_commande: form.dataset.id, p_reference: String(f.get('reference')).trim() });
  } else if (form.id === 'correctionForm') {
    const c = state.orders.find(c => c.id === form.dataset.id); if (!c || !correctionOpen(c)) throw new Error('La période de correction est clôturée.');
    await read(client.from('ege_demandes_correction').insert({ dossier_id: c.dossier_id, demandeur_id: state.user.id, champ: f.get('champ'), detail: String(f.get('detail')).trim() }));
  } else if (form.id === 'correctionDecisionForm') {
    await call('ege_admin_repondre_correction', { p_demande: form.dataset.id, p_statut: f.get('statut'), p_reponse: String(f.get('reponse')).trim() });
  } else if (form.id === 'decisionForm') {
    if (f.get('decision') === 'refuse' && String(f.get('motif')).trim().length < 5) throw new Error('Expliquez le motif du refus (5 caractères minimum).');
    await call('ege_decider_paiement', { p_commande: form.dataset.id, p_decision: f.get('decision'), p_motif: String(f.get('motif') || '').trim() || null });
  } else if (form.id === 'paymentConfigForm') {
    await call('ege_admin_enregistrer_moyen', { p_moyen: form.dataset.moyen, p_actif: f.get('actif') === 'on', p_numero: String(f.get('numero')).trim(), p_titulaire: String(f.get('titulaire')).trim() });
  } else if (form.id === 'deliveryForm') {
    $('dialogMessage').textContent = 'Contrôle du format Word et calcul de l’empreinte…';
    const file = f.get('word'), info = await validateDocx(file); if (!current(epoch)) return;
    $('dialogMessage').textContent = 'Dépôt dans le stockage privé…';
    await uploadImmutable(client.storage.from('ege-word-prive'), form.dataset.path, file, info.sha256, () => current(epoch)); if (!current(epoch)) return;
    $('dialogMessage').textContent = 'Enregistrement de la livraison…';
    await call('ege_admin_finaliser_livraison', { p_commande: form.dataset.id, p_chemin: form.dataset.path, p_sha256: info.sha256, p_taille: info.taille, p_correction: form.dataset.correction || null });
  }
  if (!current(epoch)) return;
  $('dialog').close(); await enter(state.user); $('privateMessage').textContent = 'Enregistrement confirmé.';
  if (form.id === 'profileForm' && state.pendingOffer) chooseOffer(state.pendingOffer);
}

async function action(button) {
  const d = button.dataset, epoch = state.epoch;
  if (d.auth) { authForm(d.auth); return; }
  if (d.offer) { chooseOffer(d.offer); return; }
  if (d.paymentConfig) {
    const method = state.adminMethods.find(m => m.moyen === d.paymentConfig); if (!method) return;
    modal('Configurer ' + methodLabels[method.moyen], `<form id="paymentConfigForm" data-moyen="${method.moyen}"><label>Numéro marchand<input name="numero" type="tel" maxlength="20" value="${esc(method.numero_reception)}"></label><label>Titulaire du compte<input name="titulaire" maxlength="100" value="${esc(method.titulaire)}"></label><label class="check"><input type="checkbox" name="actif" ${method.actif ? 'checked' : ''}><span>Afficher ce moyen de paiement aux élèves</span></label><label class="check"><input type="checkbox" required><span>J’ai vérifié ces coordonnées marchandes.</span></label><button class="primary">Enregistrer les coordonnées</button></form>`); return;
  }
  if (d.moreOffers) { await loadOffers(Number(d.moreOffers), true); return; }
  if (d.retryOffers) { await loadOffers(Number(d.retryOffers)); return; }
  if (d.adminOrders || d.adminCorrections) {
    const key = d.adminOrders ? 'adminOrderOffset' : 'adminCorrectionOffset';
    state[key] = Math.max(0, state[key] + ((d.adminOrders || d.adminCorrections) === 'next' ? pageSize : -pageSize)); await renderAdmin(); return;
  }
  if (d.commandDetail) {
    const detail = await call('ege_admin_commande_detail', { p_commande: d.commandDetail }); if (!current(epoch)) return;
    const p = detail.dossier.identite_figee || {}, c = detail.commande;
    modal('Détail de la commande', `<p>${esc(c.id)} · ${esc(orderLabels[c.statut])} · ${money(c.prix_convenu_djf)}</p><p>${esc(p.prenom)} ${esc(p.nom)}${p.binome ? ' et ' + esc(p.binome) : ''}<br>${esc(p.etablissement)} · ${esc(p.classe)}</p><p>${esc(detail.dossier.problematique)}</p><p>Référence : ${esc(c.reference_transaction || 'Non déclarée')}</p><h3>Historique Word</h3>${detail.versions.map(v => `<p>Version ${v.numero} · ${esc(date(v.cree_le))}<br><span class="small">SHA-256 : ${esc(v.sha256)}</span></p>`).join('') || '<p>Aucune version enregistrée.</p>'}`); return;
  }
  if (d.reviewCorrection) {
    const request = state.adminCorrections.find(r => r.id === d.reviewCorrection); if (!request) return;
    modal('Répondre à une correction', `<p>${esc(request.detail)}</p><form id="correctionDecisionForm" data-id="${request.id}"><label>Décision<select name="statut"><option value="acceptee">Accepter et préparer un Word corrigé</option><option value="refusee">Refuser en expliquant le motif</option></select></label><label>Réponse à l’élève<textarea name="reponse" minlength="10" maxlength="2000" required>${esc(request.reponse)}</textarea></label><p class="small">La demande sera marquée « traitée » uniquement après dépôt de la nouvelle version.</p><button class="primary">Enregistrer la réponse</button></form>`); return;
  }
  if (d.delivery) { await prepareDelivery(d.delivery, d.correctionId || null); return; }
  if (d.versions) {
    const versions = await read(query('ege_versions_word', 'id,numero,cree_le,taille_octets').eq('commande_id', d.versions).order('numero', { ascending: false }).limit(20)); if (!current(epoch)) return;
    modal('Versions de votre dossier', `<p>Les 20 dernières versions sont affichées. La dernière version reste accessible depuis votre commande.</p>${versions.map(v => `<p>Version ${v.numero} · ${esc(date(v.cree_le))} <button class="secondary" data-download="${d.versions}" data-version="${v.id}">Télécharger cette version</button></p>`).join('') || '<p>Aucune version antérieure enregistrée.</p>'}`); return;
  }
  if (d.download) {
    const data = await read(client.functions.invoke('ege-telecharger-word', { body: { commande_id: d.download, ...(d.version ? { version_id: d.version } : {}) } }));
    if (current(epoch)) location.assign(safeDownload(data.url)); return;
  }
  if (d.receipt) {
    const order = state.orders.find(c => c.id === d.receipt), method = state.methods.find(m => m.moyen === order?.moyen_paiement);
    modal('Déclarer un reçu', `<p>Commande : <strong>${esc(d.receipt)}</strong></p>${method ? `<p>${esc(methodLabels[method.moyen])} · ${esc(method.numero_reception)} · ${esc(method.titulaire)}</p>` : ''}<p>Transmettez la preuve sur WhatsApp avec ce numéro. Cette déclaration ne confirme pas l’encaissement.</p><a href="https://wa.me/25377231904?text=${encodeURIComponent('Reçu EGE commande ' + d.receipt)}" target="_blank" rel="noopener noreferrer">Ouvrir WhatsApp</a><form id="receiptForm" data-id="${d.receipt}"><label>Référence de transaction<input name="reference" minlength="4" maxlength="120" required></label><button class="primary">Déclarer ma référence</button></form>`); return;
  }
  if (d.correction) {
    modal('Demander une correction', `<form id="correctionForm" data-id="${d.correction}"><label>Partie concernée<select name="champ"><option value="problematique">Problématique</option><option value="preliminaires">Préliminaires et identité</option><option value="annexes">Annexes</option><option value="bordure">Bordure</option><option value="couverture">Couverture</option></select></label><label>Détail<textarea name="detail" minlength="10" maxlength="4000" required></textarea></label><button class="primary">Envoyer la demande</button></form>`); return;
  }
  if (d.decision) modal('Vérifier un encaissement', `<p>Commande : ${esc(d.decision)}. Vérifiez l’encaissement réel sur votre compte marchand ou en espèces.</p><form id="decisionForm" data-id="${d.decision}"><label>Décision<select name="decision" required><option value="">Choisir</option><option value="confirme">Encaissement vérifié : confirmer</option><option value="refuse">Refuser le paiement</option></select></label><label>Motif (obligatoire en cas de refus)<textarea name="motif" maxlength="1000"></textarea></label><label class="check"><input type="checkbox" required><span>J’ai vérifié l’encaissement réel et cette décision.</span></label><button class="primary">Enregistrer la décision</button></form>`);
}

document.addEventListener('submit', async event => {
  const form = event.target; if (!form.matches('form')) return; event.preventDefault();
  const buttons = [...form.querySelectorAll('button')]; if (buttons.some(b => b.disabled) || state.busy) return;
  state.busy++; buttons.forEach(b => b.disabled = true); const epoch = state.epoch;
  try { await submit(form); }
  catch (error) { if (epoch === state.epoch) ($('dialog').open ? $('dialogMessage') : $('privateMessage')).textContent = userMessage(error); }
  finally { state.busy--; buttons.forEach(b => b.disabled = false); }
});
document.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button || button.disabled || state.busy) return;
  if (!Object.keys(button.dataset).length) return;
  button.disabled = true; const epoch = state.epoch;
  try { await action(button); } catch (error) { if (epoch === state.epoch) ($('dialog').open ? $('dialogMessage') : $('status')).textContent = userMessage(error); }
  finally { button.disabled = false; }
});
document.addEventListener('toggle', event => {
  const details = event.target;
  if (details.open && details.dataset?.subtheme) loadOffers(Number(details.dataset.subtheme));
}, true);
document.addEventListener('change', async event => {
  const id = event.target.id;
  if (!['adminOrderFilter', 'adminCorrectionFilter'].includes(id) || state.busy) return;
  if (id === 'adminOrderFilter') { state.adminOrderFilter = event.target.value; state.adminOrderOffset = 0; }
  else { state.adminCorrectionFilter = event.target.value; state.adminCorrectionOffset = 0; }
  try { await renderAdmin(); } catch (error) { note(userMessage(error)); }
});
document.addEventListener('click', event => {
  if (event.target.closest('#exportImport')) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state.importReport, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'rapport-import-ege.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
$('accountButton').addEventListener('click', () => { if (!state.busy) state.user ? $('workspace').scrollIntoView() : authForm(); });
$('closeDialog').addEventListener('click', closeModal);
$('dialog').addEventListener('cancel', event => { if (state.busy) { event.preventDefault(); $('dialogMessage').textContent = 'Enregistrement en cours…'; } });
$('logout').addEventListener('click', async () => { state.pendingOffer = null; clearPrivate(); try { await read(client.auth.signOut({ scope: 'local' })); } catch (error) { note(userMessage(error)); } });
$('refreshSpace').addEventListener('click', () => { if (state.user && !state.busy) enter(state.user); });
$('moreOrders').addEventListener('click', async () => {
  if (!state.user || state.busy) return; const epoch = state.epoch, offset = state.orders.length; $('moreOrders').disabled = true;
  try { const orders = await read(query('ege_commandes').eq('acheteur_id', state.user.id).order('date_creation', { ascending: false }).order('id', { ascending: false }).range(offset, offset + pageSize - 1)); if (current(epoch)) { state.orders.push(...orders); renderOrders(); $('moreOrders').hidden = orders.length < pageSize; } }
  catch (error) { note(userMessage(error)); } finally { $('moreOrders').disabled = false; }
});
$('search').addEventListener('input', renderCatalogue); $('themeFilter').addEventListener('change', renderCatalogue); $('reloadCatalogue').addEventListener('click', catalogue);
function network() { $('offline').hidden = navigator.onLine; if (navigator.onLine && state.user) $('privateMessage').textContent = 'Connexion disponible. Actualisez votre espace pour vérifier les dernières opérations.'; }
window.addEventListener('online', network); window.addEventListener('offline', network); network();
client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') clearPrivate(); if (event === 'PASSWORD_RECOVERY') authForm('recovery'); });
catalogue(); const initialEpoch = state.epoch;
client.auth.getUser().then(({ data, error }) => { if (initialEpoch === state.epoch && !error && data?.user) enter(data.user); }).catch(() => {});
initPwa({ isBusy: () => state.busy > 0, notify: note });
