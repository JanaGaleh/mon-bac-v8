import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync('ege/'+p,'utf8');
const scripts=['portail.js','phase1.js','enseignant.js','mes-groupes.js','admin.js','word-import.js','auth-feedback.js','service-worker-ege-2027.js'];
for(const file of scripts){assert.ok(existsSync('ege/'+file),file+' absent');new Function(read(file));console.log('JS OK',file)}
const pages=['portail.html','assistant-dossier-gfm-2027.html','enseignant.html','mes-groupes.html','admin.html','admin-enseignants.html'];
for(const file of pages){const s=read(file);assert.match(s,/<html\b/i);assert.match(s,/<\/html>/i);assert.ok(s.includes('theme-rouge.css'),file+' theme manquant');console.log('HTML OK',file)}
const student=read('assistant-dossier-gfm-2027.html');
assert.ok(student.includes('annexTitles'));
assert.ok(student.includes('id="annexPreviewBox"'));
assert.ok(student.includes('id="egeNavGroup"'));
const inline=/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;let match,count=0;
while((match=inline.exec(student))!==null){if(match[1].trim()){new Function(match[1]);count++}}
assert.ok(count>=2,'scripts embarqués manquants');
const portal=read('portail.html');
for(const role of ['eleve','enseignant','admin'])assert.ok(portal.includes('data-role="'+role+'"'));
assert.ok(read('portail.js').includes('ege2027_staff'), 'contrôle des rôles manquant');
assert.ok(read('mes-groupes.js').includes('ege2027_group_submissions'));
assert.ok(read('enseignant.js').includes('ege2027_group_submissions'));
assert.ok(read('phase1.js').includes("eq('updated_at',currentRevision)"),'verrouillage optimiste manquant');
assert.ok(read('word-import.js').includes('imported.annexTitles[i]'));
const m=JSON.parse(read('manifest-ege-2027.webmanifest'));assert.equal(m.start_url,'./');
assert.equal(m.theme_color,'#c8102e');
assert.ok(read('service-worker-ege-2027.js').includes('shell-v16'));
assert.ok(read('theme-rouge.css').includes('background:#c91b2c'));
assert.ok(read('portail.html').includes('vendor/supabase-2.57.4.js'));
assert.ok(read('service-worker-ege-2027.js').includes('vendor/supabase-2.57.4.js'));
assert.ok(existsSync('ege/vendor/supabase-2.57.4.js'));
// Nouvelle interface, calquée sur la maquette validée.
for(const path of ['app-2027.js','app-2027-views.js']){assert.ok(existsSync('ege/'+path));new Function(read(path))}
const newApp=read('app-2027.html'),ui=read('app-2027-views.js'),logic=read('app-2027.js');
assert.ok(newApp.includes('--red:#c8102e'));
assert.ok(newApp.includes('app-2027-views.js'));
assert.ok(newApp.includes('vendor/supabase-2.57.4.js'));
const screens=['welcome','auth','student-home','student-docs','student-wizard','student-annex','student-group','teacher-home','teacher-groups','teacher-students','teacher-review','admin-home','admin-users','admin-groups','admin-monitor','profile'];
for(const name of screens)assert.ok(logic.includes('"'+name+'"'),'Écran absent : '+name);
assert.ok(ui.includes('const official=['),'référentiel officiel absent');
assert.ok(logic.includes('ege2027_group_submissions'),'partage enseignant absent');
assert.ok(logic.includes('ege2027_teacher_requests'),'validation enseignant absente');
assert.ok(logic.includes('.eq("updated_at",d.updated_at)'),'prévention conflits absente');
assert.ok(!ui.includes('Vous explorez une maquette'),'texte de démonstration persistant');
assert.ok(read('service-worker-ege-2027.js').includes('app-2027-views.js'));
// Accueil et publicité EGE 2027 — nouveaux parcours.
const adJS=read('app-2027-ads.js');
new Function(adJS);
assert.equal(m.name,'EGE 2027');
assert.ok(newApp.includes('.ege-red-hero'), 'bandeau rouge manquant');
assert.ok(newApp.includes('./app-2027-ads.js'), 'gestionnaire de publicité non chargé');
assert.ok(ui.includes('adBanner("home")'), 'bannière sur accueil manquante');
assert.ok(ui.includes('adBanner("auth")'), 'bannière sur authentification manquante');
assert.ok(ui.includes('egeAdminAdPanel()'), 'emplacements admin manquants');
assert.ok(ui.includes('teacherAdPanel()'), 'dépôt annonce enseignant manquant');
assert.ok(adJS.includes('status!=="approved"'), 'vérification des annonces validées manquante');
assert.ok(existsSync('ege/ad-learning.svg'), 'illustration de la publicité manquante');
assert.ok(read('service-worker-ege-2027.js').includes('app-2027-ads.js'));
assert.ok(read('service-worker-ege-2027.js').includes('ad-learning.svg'));
assert.ok(!newApp.includes('Prof. Jana Galeh'));
assert.ok(!ui.includes('Prof. Jana Galeh'));
// Annonces publiques et classement Premium.
assert.ok(adJS.includes('function egeAdsDirectory()'),'annuaire public manquant');
assert.ok(adJS.includes('href="./annonces.html"'),'lien de la bannière manquant');
assert.ok(adJS.includes('function egeAdRank'),'ordre Premium manquant');
assert.ok(adJS.includes('is_premium:false'),'publication Premium enseignant non verrouillée');
assert.ok(adJS.includes('egeAdAdminPremium'),'contrôle Premium admin manquant');
assert.ok(adJS.includes('filter(egeAdLive)'),'filtrage des annonces non approuvées manquant');
assert.ok(logic.includes('"ads-directory"'),'écran public absent');
assert.ok(logic.includes('location.pathname.endsWith("/annonces.html")'),'navigation directe absente');
assert.ok(ui.includes('case"ads-directory":return egeAdsDirectory()'),'vue annuaire absente');
assert.ok(newApp.includes('.ege-directory-card'),'design des annonces manquant');
// Carrousel Premium et annonces enrichies.
assert.ok(adJS.includes('EGE_CAROUSEL_DELAY=5000'),'rotation toutes les 5 secondes absente');
assert.ok(adJS.includes('a.is_premium===true'),'rotation non limitée aux annonces Premium');
assert.ok(adJS.includes('function egeMoveCarousel'),'boucle manuelle absente');
assert.ok(adJS.includes('data-act="ad-prev"')&&adJS.includes('data-act="ad-next"'),'contrôles du carrousel absents');
assert.ok(adJS.includes('data-act="ad-slide"'),'points de navigation absents');
assert.ok(adJS.includes('prefers-reduced-motion'),'accessibilité animations absente');
assert.ok(adJS.includes('pointerdown'),'pause sur interaction absente');
assert.ok(adJS.includes('whatsapp_number')&&adJS.includes('https://wa.me/'),'contact WhatsApp absent');
assert.ok(adJS.includes('fee_amount')&&adJS.includes('teaching_days'),'détails pédagogiques absents');
assert.ok(logic.includes('if(a==="ad-next"||a==="ad-prev"||a==="ad-slide")'),'événements de rotation non branchés');
assert.ok(ui.includes('egeStartAdCarousel();'),'timer non activé');
console.log('EGE smoke tests : OK');
