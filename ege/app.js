import {client,rpc,unwrap} from '../js/api.js';
import {escapeHtml as esc} from '../js/domain.js';
import {academicYear,money,correctionOpen,validateProfile,safeDownload,orderLabels} from './domain.js';
const $=id=>document.getElementById(id);
const state={user:null,profile:null,orders:[],dossiers:[],offers:[],themes:[],subthemes:[],tariffs:[],methods:[],admin:false,epoch:0};
const message=error=>error?.message||'La demande a échoué. Vérifiez votre connexion puis réessayez.';
const rows=(table,columns='*')=>client.from(table).select(columns).limit(500);
function modal(title,html){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('dialogMessage').textContent='';if(!$('dialog').open)$('dialog').showModal();}
function clearPrivate(){state.epoch++;Object.assign(state,{user:null,profile:null,orders:[],dossiers:[],methods:[],admin:false});for(const id of ['profilePanel','orders','adminPanel','privateMessage'])$(id).textContent='';$('workspace').hidden=true;$('adminPanel').hidden=true;$('accountButton').textContent='Mon espace';if($('dialog').open)$('dialog').close();$('dialogBody').textContent='';}
function authForm(mode='login'){
 const signup=mode==='signup',reset=mode==='reset',recovery=mode==='recovery';
 modal(signup?'Créer mon compte':reset?'Réinitialiser mon mot de passe':recovery?'Choisir un nouveau mot de passe':'Se connecter',`<p>Votre compte JanaGaleh permet d’accéder à EGE.</p><form id="authForm" data-mode="${mode}">${signup?'<label>Nom complet<input name="nom" autocomplete="name" maxlength="100" required></label>':''}${!recovery?'<label>E-mail<input name="email" type="email" autocomplete="email" maxlength="254" required></label>':''}${!reset?`<label>Mot de passe<input name="password" type="password" autocomplete="${signup||recovery?'new-password':'current-password'}" ${signup||recovery?'minlength="12"':''} required maxlength="200"></label>`:''}<button class="primary">${signup?'Créer mon compte':reset?'Recevoir un lien':recovery?'Enregistrer le mot de passe':'Se connecter'}</button></form>${!recovery?`<div class="auth-links"><button data-auth="${signup?'login':'signup'}">${signup?'J’ai déjà un compte':'Créer un compte'}</button><button data-auth="reset">Mot de passe oublié</button></div>`:''}`);
}
async function catalogue(){
 $('reloadCatalogue').hidden=true;
 try{
  const [themes,subthemes,tariffs,offers]=await Promise.all([
   unwrap(rows('ege_themes','id,titre,annee_scolaire,actif').eq('actif',true).eq('annee_scolaire',academicYear).order('id')),
   unwrap(rows('ege_sous_themes','id,theme_id,numero,intitule,actif').eq('actif',true).order('numero')),
   unwrap(rows('ege_tarifs','code,montant_djf,actif').eq('actif',true)),
   unwrap(rows('ege_catalogue_dossiers','id,sous_theme_id,type_travail,numero,titre,problematique,annee_scolaire').eq('annee_scolaire',academicYear).order('numero')),
  ]);
  Object.assign(state,{themes,subthemes,tariffs,offers});
  $('catalogueCount').textContent=`${themes.length} thèmes · ${subthemes.filter(s=>themes.some(t=>t.id===s.theme_id)).length} sous-thèmes`;
  $('themeFilter').innerHTML='<option value="">Tous les thèmes</option>'+themes.map(t=>`<option value="${esc(t.id)}">${esc(t.titre)}</option>`).join('');
  for(const [id,code] of [['priceIndividual','dossier_individuel'],['pricePair','dossier_binome']]){const t=tariffs.find(t=>t.code===code);$(id).textContent=t?money(t.montant_djf):'Indisponible';}
  $('catalogueMessage').textContent=offers.length?'La disponibilité pour votre établissement sera vérifiée à la réservation.':'Les dossiers documentaires sont en préparation. Vous pouvez explorer les thèmes ; les commandes ouvriront après validation et dépôt des fichiers.';
  renderCatalogue();
 }catch(error){$('catalogueMessage').textContent='Catalogue indisponible. '+message(error);$('catalogueCount').textContent='Chargement à réessayer';$('reloadCatalogue').hidden=false;}
}
function renderCatalogue(){
 const query=$('search').value.trim().toLocaleLowerCase('fr');const filter=$('themeFilter').value;
 $('themeGrid').innerHTML=state.themes.filter(t=>!filter||String(t.id)===filter).map(t=>{
  const subs=state.subthemes.filter(s=>s.theme_id===t.id&&(!query||`${t.titre} ${s.intitule}`.toLocaleLowerCase('fr').includes(query)));
  if(!subs.length)return '';
  return `<article class="theme-card"><span class="number">${String(t.id).padStart(2,'0')}</span><h3>${esc(t.titre)}</h3>${subs.map(s=>{const offers=state.offers.filter(o=>o.sous_theme_id===s.id);return `<details><summary>${esc(s.numero)}. ${esc(s.intitule)}</summary>${offers.length?offers.map(o=>`<div class="offer"><strong>${esc(o.titre)}</strong><p>${esc(o.problematique)}</p><span class="pill">${o.type_travail==='binome'?'Binôme':'Individuel'}</span><br><button class="secondary" data-offer="${esc(o.id)}">Choisir ce sujet</button></div>`).join(''):'<p class="muted">Aucun dossier validé disponible pour le moment.</p>'}</details>`;}).join('')}</article>`;
 }).join('')||'<p>Aucun sous-thème ne correspond à votre recherche.</p>';
}
function renderProfile(){
 const p=state.profile||{};const locked=state.dossiers.some(d=>d.sujet_confirme_le);
 $('profilePanel').innerHTML=`<details ${state.profile?'':'open'}><summary>${state.profile?'Mon profil EGE':'Compléter mon profil EGE'}</summary><p class="small">Année ${academicYear} · Les informations confirmées sont conservées avec chaque commande.</p><form id="profileForm"><div class="form-grid"><label>Nom<input name="nom" autocomplete="family-name" maxlength="100" value="${esc(p.nom||'')}" required ${locked?'readonly':''}></label><label>Prénom<input name="prenom" autocomplete="given-name" maxlength="100" value="${esc(p.prenom||'')}" required ${locked?'readonly':''}></label><label>Candidature<select name="statut_candidat"><option value="scolarise">Élève scolarisé</option><option value="libre" ${p.statut_candidat==='libre'?'selected':''}>Candidat libre</option></select></label><label>WhatsApp<input name="whatsapp" type="tel" autocomplete="tel" maxlength="20" value="${esc(p.whatsapp||'')}" required></label><label>Établissement<input name="etablissement" maxlength="200" value="${esc(p.etablissement||'')}"></label><label>Classe<input name="classe" maxlength="100" value="${esc(p.classe||'Terminale GFM')}"></label></div><p class="small">L’établissement est obligatoire pour les élèves scolarisés. La réservation pour les candidats libres n’est pas encore ouverte.</p><button class="primary">Enregistrer mon profil</button></form></details>`;
}
function renderOrders(){
 $('orders').innerHTML=state.orders.map(c=>`<article class="order"><h3>${esc(orderLabels[c.statut]||c.statut)}</h3><p>Commande <strong>${esc(c.id)}</strong><br>${esc(money(c.prix_convenu_djf))} · ${esc(c.moyen_paiement)} · ${c.type_travail==='binome'?'Binôme':'Individuel'}</p>${c.reference_transaction?`<p>Référence : ${esc(c.reference_transaction)}</p>`:''}<div class="actions">${c.statut==='en_attente'&&c.moyen_paiement!=='cash'?`<button class="secondary" data-receipt="${esc(c.id)}">Déclarer mon reçu</button>`:''}${c.statut==='en_attente'&&c.moyen_paiement==='cash'?'<p class="muted">Contactez l’administration pour régler en espèces. Le paiement sera confirmé après encaissement.</p>':''}${c.statut==='livre'?`<button class="primary" data-download="${esc(c.id)}">Télécharger mon Word</button>`:''}${correctionOpen(c)?`<button class="secondary" data-correction="${esc(c.id)}">Demander une correction</button>`:''}<a href="https://wa.me/25377231904?text=${encodeURIComponent('Bonjour, concernant ma commande EGE '+c.id)}" target="_blank" rel="noopener noreferrer">Contacter l’administration</a></div>${c.date_livraison?`<p class="small">Livré le ${esc(new Date(c.date_livraison).toLocaleDateString('fr-FR'))} · Corrections ${correctionOpen(c)?'ouvertes pendant 7 jours':'clôturées'}.</p>`:''}</article>`).join('')||'<p class="muted">Vous n’avez pas encore de commande. Explorez le catalogue pour choisir un sujet disponible.</p>';
}
async function enter(user){
 const epoch=++state.epoch;state.user=user;$('workspace').hidden=false;$('accountButton').textContent='Mon espace EGE';$('privateMessage').textContent='Chargement de votre espace…';
 try{
  const [profile,orders,dossiers,methods,admin]=await Promise.all([
   unwrap(client.from('ege_profils').select('*').eq('utilisateur_id',user.id).maybeSingle()),
   unwrap(rows('ege_commandes').eq('acheteur_id',user.id).order('date_creation',{ascending:false})),
   unwrap(rows('ege_dossiers','id,sujet_confirme_le').eq('eleve_id',user.id)),
   unwrap(rows('ege_comptes_paiement').eq('actif',true)),rpc('ege_est_admin')
  ]);
  if(epoch!==state.epoch)return;
  Object.assign(state,{profile,orders,dossiers,methods,admin:admin===true});renderProfile();renderOrders();$('privateMessage').textContent='';
  if(state.admin)await renderAdmin(epoch);
 }catch(error){if(epoch===state.epoch)$('privateMessage').textContent=message(error);}
}
async function renderAdmin(epoch){
 const [bilan,orders]=await Promise.all([rpc('ege_admin_bilan'),rpc('ege_admin_commandes',{p_limite:200})]);
 if(epoch!==state.epoch)return;
 $('adminPanel').hidden=false;
 $('adminPanel').innerHTML=`<h2>Administration EGE</h2><div class="stats">${[['Brouillons',bilan.brouillons],['Modèles validés',bilan.valides],['Modèles avec objet Word',bilan.modeles_stockes],['Objets Word privés',bilan.fichiers_word],['Annexes à corriger',bilan.annexes_a_corriger],['Revenus confirmés',money(bilan.revenus_confirmes)]].map(([label,value])=>`<p><strong>${esc(value)}</strong>${label}</p>`).join('')}</div><p class="notice">Un brouillon ou un chemin enregistré ne prouve pas qu’un fichier a été contrôlé et déposé. La validation documentaire et les contrôles Word restent obligatoires avant publication.</p><h3>Commandes récentes</h3>${orders.map(c=>`<article class="order"><p><strong>${esc(c.id)}</strong><br>${esc(orderLabels[c.statut]||c.statut)} · ${esc(money(c.prix_djf))} · ${esc(c.moyen_paiement)}<br>Référence : ${esc(c.reference_transaction||'Non déclarée')}</p>${['en_attente','recu_envoye'].includes(c.statut)?`<button class="secondary" data-decision="${esc(c.id)}">Vérifier le paiement</button>`:''}${c.statut==='confirme'?`<button class="secondary" data-delivery="${esc(c.id)}">Déposer le Word personnalisé</button>`:''}</article>`).join('')||'<p>Aucune commande.</p>'}<h3>Demandes de correction</h3>${(bilan.corrections||[]).map(c=>`<article class="order"><p>${esc(c.champ)} · ${esc(c.statut)}</p><p>${esc(c.detail)}</p><p class="small">Dossier : ${esc(c.dossier_id)}</p></article>`).join('')||'<p>Aucune demande.</p>'}`;
}
function chooseOffer(id){
 if(!state.user){authForm();return;}
 if(!state.profile){$('workspace').scrollIntoView();$('privateMessage').textContent='Complétez votre profil avant de réserver.';return;}
 if(state.profile.statut_candidat==='libre')throw new Error('La réservation pour les candidats libres n’est pas encore ouverte.');
 const offer=state.offers.find(o=>o.id===id);if(!offer)throw new Error('Sujet indisponible.');
 const tariff=state.tariffs.find(t=>t.code===(offer.type_travail==='binome'?'dossier_binome':'dossier_individuel'));
 if(!tariff)throw new Error('Tarif indisponible.');
 const p=state.profile;
 modal('Vérifier et confirmer mon choix',`<h3>${esc(offer.titre)}</h3><p>${esc(offer.problematique)}</p><p>${esc(p.prenom)} ${esc(p.nom)} · ${esc(p.etablissement)} · ${academicYear}</p><p>Tarif affiché : <strong>${esc(money(tariff.montant_djf))}</strong>. Le montant définitif est calculé et figé par le serveur.</p><form id="orderForm" data-id="${esc(id)}">${offer.type_travail==='binome'?'<label>Nom et prénom du deuxième élève<input name="binome" maxlength="200" required></label>':''}<label>Moyen de paiement<select name="moyen" required><option value="cash">Espèces · validation administrative</option>${state.methods.filter(m=>m.numero_reception&&m.titulaire).map(m=>`<option value="${esc(m.moyen)}">${esc(m.moyen)} · ${esc(m.numero_reception)} · ${esc(m.titulaire)}</option>`).join('')}</select></label><label class="check"><input type="checkbox" required><span>J’ai vérifié l’identité des bénéficiaires, l’établissement et le sujet. Je confirme leur verrouillage pour cette commande.</span></label><p class="small">Aucun règlement ne doit être envoyé avant confirmation de la commande et de son montant. L’attribution peut être indisponible pour votre établissement.</p><button class="primary">Confirmer et réserver</button></form>`);
}
async function submit(form){
 const f=new FormData(form),epoch=state.epoch;
 if(form.id==='authForm'){
  const mode=form.dataset.mode,email=String(f.get('email')||'').trim(),password=f.get('password');
  const redirect=new URL('./',location.href).href;
  if(mode==='reset'){await unwrap(client.auth.resetPasswordForEmail(email,{redirectTo:redirect}));$('dialogMessage').textContent='Si cette adresse possède un compte, un lien de récupération sera envoyé. Vérifiez vos courriers indésirables.';return;}
  if(mode==='recovery'){await unwrap(client.auth.updateUser({password}));$('dialog').close();$('status').textContent='Mot de passe mis à jour.';return;}
  if(mode==='signup'){
   if(String(password).length<12)throw new Error('Choisissez au moins 12 caractères.');
   const data=await unwrap(client.auth.signUp({email,password,options:{emailRedirectTo:redirect,data:{nom:String(f.get('nom')).trim(),type_compte_souhaite:'eleve'}}}));
   form.reset();$('dialogMessage').textContent='Si cette adresse peut être inscrite, un lien de confirmation sera envoyé. Confirmez votre e-mail avant de vous connecter.';
   if(data?.session&&data.user){$('dialog').close();await enter(data.user);}return;
  }
  const data=await unwrap(client.auth.signInWithPassword({email,password}));form.reset();$('dialog').close();await enter(data.user);$('workspace').scrollIntoView();return;
 }
 if(!state.user)throw new Error('Reconnectez-vous pour continuer.');
 if(form.id==='profileForm'){
  const profile=validateProfile(Object.fromEntries(['nom','prenom','statut_candidat','whatsapp','etablissement','classe'].map(k=>[k,String(f.get(k)||'').trim()])));
  await unwrap(client.from('ege_profils').upsert({...profile,utilisateur_id:state.user.id},{onConflict:'utilisateur_id'}));
 }else if(form.id==='orderForm'){
  const id=await rpc('ege_preparer_commande',{p_modele:form.dataset.id,p_moyen:f.get('moyen'),p_binome:f.get('binome')||null});
  if(epoch!==state.epoch)return;$('status').textContent='Commande enregistrée : '+id;
 }else if(form.id==='receiptForm'){
  await rpc('ege_declarer_recu',{p_commande:form.dataset.id,p_reference:String(f.get('reference')).trim()});
 }else if(form.id==='correctionForm'){
  const c=state.orders.find(c=>c.id===form.dataset.id);if(!c||!correctionOpen(c))throw new Error('La période de correction est clôturée.');
  await unwrap(client.from('ege_demandes_correction').insert({dossier_id:c.dossier_id,demandeur_id:state.user.id,champ:f.get('champ'),detail:String(f.get('detail')).trim()}));
 }else if(form.id==='decisionForm'){
  await rpc('ege_decider_paiement',{p_commande:form.dataset.id,p_decision:f.get('decision'),p_motif:String(f.get('motif')||'').trim()||null});
 }else if(form.id==='deliveryForm'){
  const file=f.get('word');
  if(!file||!file.name.toLowerCase().endsWith('.docx')||file.size<4||file.size>20*1024*1024)throw new Error('Choisissez un fichier DOCX de moins de 20 Mo.');
  const signature=new Uint8Array(await file.slice(0,4).arrayBuffer());if(signature[0]!==80||signature[1]!==75||signature[2]!==3||signature[3]!==4)throw new Error('Format DOCX invalide.');
  const path=form.dataset.id+'/dossier-personnalise.docx';
  const bucket=client.storage.from('ege-word-prive');
  const uploaded=await bucket.upload(path,file,{upsert:false,contentType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  if(uploaded.error){
   // Si le transfert précédent a abouti mais son accusé s'est perdu, reprendre
   // uniquement avec le même contenu. Aucun écrasement de version existante.
   if(!['409','Duplicate'].includes(String(uploaded.error.statusCode))&&!/already exists|duplicate/i.test(uploaded.error.message||''))throw uploaded.error;
   const existing=await unwrap(bucket.download(path));
   const [a,b]=await Promise.all([file.arrayBuffer(),existing.arrayBuffer()]);
   const [ha,hb]=await Promise.all([crypto.subtle.digest('SHA-256',a),crypto.subtle.digest('SHA-256',b)]);
   if(new Uint8Array(ha).some((value,index)=>value!==new Uint8Array(hb)[index]))throw new Error('Un autre fichier existe déjà pour cette commande. Contactez l’administration pour gérer sa version.');
  }
  await rpc('ege_enregistrer_word_livraison',{p_commande:form.dataset.id,p_chemin:path});
 }
 if(epoch!==state.epoch)return;
 $('dialog').close();await enter(state.user);$('privateMessage').textContent='Enregistrement confirmé.';
}
document.addEventListener('submit',async event=>{
 const form=event.target;if(!form.matches('form'))return;event.preventDefault();const buttons=[...form.querySelectorAll('button')];if(buttons.some(b=>b.disabled))return;buttons.forEach(b=>b.disabled=true);
 try{await submit(form);}catch(error){const target=$('dialog').open?$('dialogMessage'):$('privateMessage');target.textContent=message(error);}finally{buttons.forEach(b=>b.disabled=false);}
});
document.addEventListener('click',async event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 try{
  if(b.dataset.auth){authForm(b.dataset.auth);return;}
  if(b.dataset.offer){chooseOffer(b.dataset.offer);return;}
  const id=b.dataset.receipt||b.dataset.correction||b.dataset.download||b.dataset.decision||b.dataset.delivery;
  if(!id)return;
  if(b.dataset.receipt){modal('Déclarer un reçu',`<p>Transmettez la preuve sur WhatsApp avec le numéro de commande <strong>${esc(id)}</strong>. La déclaration ci-dessous ne confirme pas le paiement.</p><a href="https://wa.me/25377231904?text=${encodeURIComponent('Reçu de paiement EGE pour la commande '+id)}" target="_blank" rel="noopener noreferrer">Ouvrir WhatsApp</a><form id="receiptForm" data-id="${esc(id)}"><label>Référence de transaction<input name="reference" minlength="4" maxlength="120" required></label><button class="primary">Déclarer ma référence</button></form>`);return;}
  if(b.dataset.correction){modal('Demander une correction',`<p>Décrivez précisément la correction souhaitée. Votre demande sera examinée par l’administration.</p><form id="correctionForm" data-id="${esc(id)}"><label>Partie concernée<select name="champ"><option value="problematique">Problématique</option><option value="preliminaires">Préliminaires et identité</option><option value="annexes">Annexes</option><option value="bordure">Bordure</option><option value="couverture">Couverture</option></select></label><label>Détail<textarea name="detail" minlength="10" maxlength="4000" required></textarea></label><button class="primary">Envoyer la demande</button></form>`);return;}
  if(b.dataset.decision){modal('Vérifier un encaissement',`<p>Commande : ${esc(id)}. Vérifiez l’encaissement réel sur votre compte marchand ou en espèces.</p><form id="decisionForm" data-id="${esc(id)}"><label>Décision<select name="decision" required><option value="">Choisir</option><option value="confirme">Encaissement vérifié : confirmer</option><option value="refuse">Refuser le paiement</option></select></label><label>Motif (obligatoire en cas de refus)<textarea name="motif" maxlength="1000"></textarea></label><label class="check"><input type="checkbox" required><span>J’ai vérifié l’encaissement réel et cette décision.</span></label><button class="primary">Enregistrer la décision</button></form>`);return;}
  if(b.dataset.delivery){modal('Livrer le Word personnalisé',`<p>Commande : ${esc(id)}. Le dépôt ne remplace jamais un fichier existant. Vérifiez le document dans Word et son rendu A4 avant de le livrer.</p><form id="deliveryForm" data-id="${esc(id)}"><label>Document personnalisé DOCX<input name="word" type="file" accept=".docx" required></label><label class="check"><input type="checkbox" required><span>J’ai contrôlé la personnalisation, les sources, les annexes, le rendu A4 et la sécurité du fichier.</span></label><button class="primary">Déposer et enregistrer la livraison</button></form>`);return;}
  if(b.dataset.download){b.disabled=true;const epoch=state.epoch;const data=await unwrap(client.functions.invoke('ege-telecharger-word',{body:{commande_id:id}}));if(epoch===state.epoch)location.assign(safeDownload(data.url));}
 }catch(error){$('status').textContent=message(error);}finally{b.disabled=false;}
});
$('accountButton').addEventListener('click',()=>state.user?$('workspace').scrollIntoView():authForm());
$('closeDialog').addEventListener('click',()=>$('dialog').close());
$('logout').addEventListener('click',async()=>{clearPrivate();try{await unwrap(client.auth.signOut({scope:'local'}));}catch(error){$('status').textContent=message(error);}});
$('search').addEventListener('input',renderCatalogue);$('themeFilter').addEventListener('change',renderCatalogue);$('reloadCatalogue').addEventListener('click',catalogue);
function network(){$('offline').hidden=navigator.onLine;}
window.addEventListener('online',network);window.addEventListener('offline',network);network();
client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')clearPrivate();if(event==='PASSWORD_RECOVERY')authForm('recovery');});
catalogue();
const initialEpoch=state.epoch;
client.auth.getUser().then(({data,error})=>{if(initialEpoch===state.epoch&&!error&&data?.user)enter(data.user);}).catch(()=>{});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{$('status').textContent='L’installation hors connexion est indisponible. Le site reste accessible en ligne.';}));
