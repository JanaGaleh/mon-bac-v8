import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { inspectZip, validateDocx, extractImport, sha256, uploadImmutable } from '../ege/files.js';
import { timed } from '../ege/data.js';
const window = new Window();
Object.defineProperty(globalThis, 'window', { value: window, configurable: true });
Object.defineProperty(globalThis, 'DOMParser', { value: window.DOMParser, configurable: true });
const context = { module: { exports: {} }, exports: {}, setTimeout, clearTimeout, setImmediate, Promise, Buffer, Uint8Array, ArrayBuffer };
vm.runInNewContext(await readFile(new URL('../vendor/jszip-3.10.1.min.js', import.meta.url), 'utf8'), context);
const JSZip = window.JSZip = context.module.exports;
after(async () => { await window.happyDOM.close(); });
async function fixture(mutator = () => {}) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Document de test technique uniquement.</w:t></w:r></w:p></w:body></w:document>');
  await mutator(zip);
  return new File([await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })], 'T1_ST01_D01_individuel.docx');
}
test('un vrai conteneur Word non vide produit une empreinte vérifiable sans validation pédagogique', async () => {
  const file = await fixture(), info = await validateDocx(file);
  assert.equal(info.sha256, await sha256(await file.arrayBuffer())); assert.equal(info.taille, file.size);
});
test('refus des faux Word, macros, chemins traversants et modèles externes actifs', async () => {
  for (const mutate of [zip => zip.remove('word/document.xml'), zip => zip.file('word/vbaProject.bin', 'bad'), zip => zip.file('../escape.xml', 'bad'), zip => zip.file('word/_rels/document.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="bad" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" TargetMode="External" Target="https://evil.invalid/template"/></Relationships>')]) await assert.rejects(() => fixture(mutate).then(validateDocx));
  await assert.rejects(() => validateDocx(new File(['not-a-word'], 'fake.docx')));
});
test('limites de décompression contrôlées avant ouverture et doublons de dossiers refusés', async () => {
  const file = await fixture();
  const bytes = await file.arrayBuffer(); assert.throws(() => inspectZip(bytes, { maxExpanded: 10 }));
  const zip = new JSZip(); zip.file('a/T1_ST01_D01_individuel.docx', await file.arrayBuffer()); zip.file('b/T1_ST01_D01_individuel.docx', await file.arrayBuffer());
  const archive = new File([await zip.generateAsync({ type: 'uint8array' })], 'lot.zip');
  await assert.rejects(() => extractImport([archive]), /plusieurs fois/);
});
test('reprise de dépôt : même contenu accepté, contenu différent refusé, jamais d’écrasement', async () => {
  const file = await fixture(), hash = await sha256(await file.arrayBuffer());
  const bucket = { upload: async (path, value, options) => { assert.equal(options.upsert, false); return { error: { statusCode: '409' } }; }, download: async () => ({ data: file }) };
  assert.equal(await uploadImmutable(bucket, 'private/test.docx', file, hash), 'déjà présent');
  await assert.rejects(() => uploadImmutable(bucket, 'private/test.docx', file, '0'.repeat(64)), /différent/);
  await assert.rejects(() => uploadImmutable(bucket, 'private/test.docx', file, hash, () => false), /Session terminée/);
});
test('une requête suspendue rend la main à l’utilisateur avec une erreur explicite', async () => {
  await assert.rejects(() => timed(new Promise(() => {}), 5), /Actualisez/);
});
