import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const required = [
  'laboratoire.html',
  'tp-tableur.html',
  'tp-tableur.css',
  'js/tp-tableur.js',
  'js/tableur-engine.js',
  'js/tableur-xlsx.js',
  'js/api.js',
  'vendor/supabase-2.57.4.js',
];

test('tous les fichiers nécessaires au Laboratoire et au tableur existent', () => {
  for (const path of required) {
    assert.ok(existsSync(new URL('../' + path, import.meta.url)), path);
  }
});

test('le Laboratoire conserve son accès au tableur et au site existant', () => {
  const html = read('laboratoire.html');
  assert.match(html, /\.\/tp-tableur\.html/);
  assert.match(html, /href="\/"/);
  assert.match(html, /sandbox="allow-scripts"/);
});

test('le tableur charge ses ressources et renvoie vers monAvenir', () => {
  const html = read('tp-tableur.html');
  for (const path of ['./tp-tableur.css', './vendor/supabase-2.57.4.js', './js/tp-tableur.js']) {
    assert.ok(html.includes(path), path);
  }
  assert.match(html, /href="\/"/);
});

test('le module tableur référence les moteurs et la bonne page de connexion', () => {
  const js = read('js/tp-tableur.js');
  for (const path of ['./tableur-engine.js', './tableur-xlsx.js', './api.js']) {
    assert.ok(js.includes(path), path);
  }
  assert.doesNotMatch(js, /mon-bac\.html/);
  assert.match(js, /location\.replace\('\/'\)/);
});

test('le tableur propose les imports et exports Excel', () => {
  const html = read('tp-tableur.html');
  assert.match(html, /id="xlsxImport"/);
  assert.match(html, /id="xlsxExport"/);
  const js = read('js/tp-tableur.js');
  assert.match(js, /importXlsx/);
  assert.match(js, /exportXlsx/);
});
