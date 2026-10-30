// Contrôles techniques des conteneurs Word. Aucun contrôle pédagogique ou antivirus
// n'est revendiqué par ce module. JSZip 3.10.1 est distribué localement avec sa licence.
const MB = 1024 * 1024;
export async function sha256(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map(value => value.toString(16).padStart(2, '0')).join('');
}

export function inspectZip(bytes, { maxBytes = 20 * MB, maxExpanded = 80 * MB, maxEntries = 2000 } = {}) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (data.length < 22 || data.length > maxBytes) throw new Error('Archive vide ou trop volumineuse.');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let end = -1;
  for (let offset = data.length - 22; offset >= Math.max(0, data.length - 65557); offset--) {
    if (view.getUint32(offset, true) === 0x06054b50 && offset + 22 + view.getUint16(offset + 20, true) === data.length) { end = offset; break; }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('Format ZIP non pris en charge.');
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true);
  let offset = view.getUint32(end + 16, true), expanded = 0;
  const start = offset, names = new Set(), entries = [];
  if (!count || count > maxEntries || count === 65535 || offset + size > end || count !== view.getUint16(end + 8, true)) throw new Error('Archive trop complexe ou endommagée.');
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error('Répertoire ZIP endommagé.');
    const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true);
    const packed = view.getUint32(offset + 20, true), unpacked = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    if (offset + 46 + nameLength + extra + comment > end || local + 30 > start || view.getUint32(local, true) !== 0x04034b50 || local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true) + packed > start) throw new Error('Entrée ZIP invalide.');
    if ((flags & 1) || ![0, 8].includes(method) || unpacked === 0xffffffff) throw new Error('Archives chiffrées ou ZIP64 non prises en charge.');
    const name = new TextDecoder('utf-8', { fatal: true }).decode(data.subarray(offset + 46, offset + 46 + nameLength));
    if (!name || /[\\\0]/.test(name) || name.startsWith('/') || /^[a-z]:/i.test(name) || name.split('/').some(part => part === '..' || part === '.')) throw new Error('Chemin dangereux dans l’archive.');
    const key = name.normalize('NFC').toLowerCase();
    if (names.has(key)) throw new Error('Noms de fichiers en doublon dans l’archive.');
    names.add(key); expanded += unpacked;
    if (expanded > maxExpanded || ((view.getUint32(offset + 38, true) >>> 16) & 0xf000) === 0xa000) throw new Error('Archive trop volumineuse ou lien symbolique interdit.');
    entries.push({ name, size: unpacked });
    offset += 46 + nameLength + extra + comment;
  }
  if (offset !== start + size) throw new Error('Taille du répertoire ZIP incohérente.');
  return entries;
}

let zipLoading;
async function zipLibrary() {
  if (window.JSZip) return window.JSZip;
  if (!zipLoading) zipLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('./vendor/jszip-3.10.1.min.js', import.meta.url).href;
    script.onload = () => window.JSZip ? resolve(window.JSZip) : reject(new Error('Lecteur Word indisponible.'));
    script.onerror = () => { zipLoading = null; script.remove(); reject(new Error('Le lecteur Word est indisponible. Vérifiez votre connexion puis réessayez.')); };
    document.head.append(script);
  });
  return zipLoading;
}
function xmlDocument(source) {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('Déclarations XML externes interdites.');
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Document XML endommagé.');
  return doc;
}
export async function validateDocx(file) {
  if (!file || !/\.docx$/i.test(file.name)) throw new Error('Choisissez un document Word DOCX.');
  if (file.size < 22 || file.size > 20 * MB) throw new Error('Choisissez un document Word de moins de 20 Mo.');
  const buffer = await file.arrayBuffer(), entries = inspectZip(buffer);
  const names = new Set(entries.map(entry => entry.name));
  for (const name of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']) {
    if (!names.has(name)) throw new Error('Ce fichier ZIP n’est pas un document Word DOCX.');
  }
  if (entries.some(entry => /vbaProject|(?:^|\/)(?:embeddings|activeX)\/|\.(?:exe|dll|scr|js|vbs|bat|com|cmd|ps1|jar|hta)$/i.test(entry.name))) throw new Error('Macros, objets incorporés ou programmes interdits dans les dossiers.');
  const zip = await (await zipLibrary()).loadAsync(buffer, { checkCRC32: true });
  const types = xmlDocument(await zip.file('[Content_Types].xml').async('string'));
  if (!Array.from(types.getElementsByTagNameNS('*', 'Override')).some(node => node.getAttribute('PartName') === '/word/document.xml' && node.getAttribute('ContentType') === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')) throw new Error('Type Word non conforme ou document à macros.');
  const document = xmlDocument(await zip.file('word/document.xml').async('string'));
  if (document.documentElement.localName !== 'document' || !['http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'http://purl.oclc.org/ooxml/wordprocessingml/main'].includes(document.documentElement.namespaceURI) || !document.documentElement.textContent.trim()) throw new Error('Document Word vide ou invalide.');
  const instructions = [...document.getElementsByTagNameNS('*', 'instrText')].map(node => node.textContent).concat([...document.getElementsByTagNameNS('*', 'fldSimple')].map(node => node.getAttribute('w:instr') || node.getAttribute('instr') || ''));
  if (instructions.some(value => /\b(?:DDEAUTO|DDE|INCLUDETEXT|INCLUDEPICTURE)\b/i.test(value))) throw new Error('Champ Word externe interdit.');
  for (const entry of entries.filter(entry => /\.rels$/i.test(entry.name))) {
    const relations = xmlDocument(await zip.file(entry.name).async('string'));
    for (const relation of relations.getElementsByTagNameNS('*', 'Relationship')) {
      if (relation.getAttribute('TargetMode') !== 'External') continue;
      if (!relation.getAttribute('Type')?.endsWith('/hyperlink') || !/^(https?:|mailto:|tel:)/i.test(relation.getAttribute('Target') || '')) throw new Error('Lien externe actif interdit dans le document Word.');
    }
  }
  return { sha256: await sha256(buffer), taille: buffer.byteLength };
}

export async function extractImport(files) {
  const output = [], names = new Set();
  for (const file of files) {
    if (/\.zip$/i.test(file.name)) {
      if (file.size > 100 * MB) throw new Error('L’archive ZIP doit faire moins de 100 Mo.');
      const buffer = await file.arrayBuffer();
      const entries = inspectZip(buffer, { maxBytes: 100 * MB, maxExpanded: 256 * MB, maxEntries: 1500 });
      const zip = await (await zipLibrary()).loadAsync(buffer);
      for (const entry of entries.filter(entry => /\.docx$/i.test(entry.name) && !entry.name.startsWith('__MACOSX/'))) {
        const name = entry.name.split('/').pop();
        if (names.has(name)) throw new Error('Un même dossier apparaît plusieurs fois dans la sélection.');
        names.add(name);
        if (entry.size > 20 * MB) throw new Error('Un document de l’archive dépasse 20 Mo.');
        output.push({ name, read: async () => new File([await zip.file(entry.name).async('uint8array')], name) });
      }
    } else {
      if (!/\.docx$/i.test(file.name)) throw new Error('Sélectionnez uniquement des DOCX ou une archive ZIP.');
      if (names.has(file.name)) throw new Error('Un même dossier apparaît plusieurs fois dans la sélection.');
      names.add(file.name); output.push({ name: file.name, read: async () => file });
    }
  }
  if (!output.length || output.length > 1000) throw new Error('La sélection doit contenir entre 1 et 1 000 documents Word.');
  return output;
}

export async function uploadImmutable(bucket, path, file, hash, isCurrent = () => true) {
  if (!isCurrent()) throw new Error('Session terminée.');
  const { error } = await bucket.upload(path, file, { upsert: false, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  if (!error) return 'déposé';
  if (!['409', 'Duplicate'].includes(String(error.statusCode)) && !/already exists|duplicate/i.test(error.message || '')) throw error;
  const result = await bucket.download(path);
  if (result.error) throw result.error;
  if (await sha256(await result.data.arrayBuffer()) !== hash) throw new Error('Un fichier différent occupe déjà ce chemin. Aucune version n’a été écrasée.');
  return 'déjà présent';
}
