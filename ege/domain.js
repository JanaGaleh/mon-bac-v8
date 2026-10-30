export const academicYear='2026/2027';
export const money=value=>new Intl.NumberFormat('fr-FR').format(value)+' DJF';
export const wordCount=value=>String(value||'').trim().split(/\s+/u).filter(Boolean).length;
export function correctionOpen(order,now=Date.now()){
 const delivered=Date.parse(order.date_livraison);
 return order.statut==='livre'&&Number.isFinite(delivered)&&now>=delivered&&now<=delivered+7*86400000;
}
export function validateProfile(p){
 if(!p.nom.trim()||!p.prenom.trim())throw new Error('Nom et prénom obligatoires.');
 if(!['scolarise','libre'].includes(p.statut_candidat))throw new Error('Statut candidat invalide.');
 if(!/^[+]?[0-9 ]{7,20}$/.test(p.whatsapp))throw new Error('Indiquez un numéro WhatsApp valide.');
 if(p.statut_candidat==='scolarise'&&String(p.etablissement||'').trim().length<3)throw new Error('Indiquez votre établissement.');
 return p;
}
export function safeDownload(value){
 const url=new URL(value);
 if(url.protocol!=='https:'||url.hostname!=='nwcatsmfbkcgvgbanwyl.supabase.co'||!url.pathname.startsWith('/storage/v1/object/sign/ege-word-prive/'))throw new Error('Lien de téléchargement invalide.');
 return url.href;
}
export const orderLabels={en_attente:'En attente de paiement',recu_envoye:'Reçu déclaré · vérification en cours',confirme:'Paiement confirmé · préparation du Word',refuse:'Paiement refusé',livre:'Word livré'};
