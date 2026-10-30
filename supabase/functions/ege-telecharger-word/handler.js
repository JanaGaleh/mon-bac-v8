const origins = new Set([
  'https://janagaleh.com', 'https://www.janagaleh.com', 'https://monbac.janagaleh.com',
  'https://janagaleh.github.io', 'https://mon-bac-v8.vercel.app',
  'https://mon-bac-v8-janakaleh-1875.vercel.app',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function boundedJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > 4096) { await reader.cancel(); throw new Error('body'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function createDownloadHandler({ createClient, env }) {
  return async request => {
    const origin = request.headers.get('Origin');
    const headers = {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      ...(origins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    };
    const response = (status, error) => new Response(JSON.stringify({ error }), { status, headers });
    if (origin && !origins.has(origin)) return response(403, 'Origine non autorisée');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return response(405, 'Méthode interdite');
    const token = request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) return response(401, 'Authentification requise');
    const url = env('SUPABASE_URL'), anon = env('SUPABASE_ANON_KEY'), service = env('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anon || !service) return response(503, 'Téléchargement temporairement indisponible');
    try {
      const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
      const { data: { user }, error } = await userClient.auth.getUser(token);
      if (error || !user) return response(401, 'Session invalide');
      const body = await boundedJson(request), id = body?.commande_id, version = body?.version_id;
      if (typeof id !== 'string' || !uuid.test(id) || (version !== undefined && (typeof version !== 'string' || !uuid.test(version)))) return response(400, 'Commande ou version invalide');
      const command = id.toLowerCase();
      const { data: path, error: denied } = await userClient.rpc(version ? 'ege_word_version_autorisee' : 'ege_word_autorise', { p_commande: command, ...(version ? { p_version: version.toLowerCase() } : {}) });
      if (denied || typeof path !== 'string' || !(new RegExp(`^${command}/(?:versions/[0-9]{4}/)?dossier-personnalise[.]docx$`)).test(path)) return response(403, 'Word indisponible ou non autorisé');
      const admin = createClient(url, service, { auth: { persistSession: false } });
      const { data, error: missing } = await admin.storage.from('ege-word-prive').createSignedUrl(path, 60, { download: true });
      if (missing || !data?.signedUrl) return response(404, 'Fichier non disponible');
      return new Response(JSON.stringify({ url: data.signedUrl, expires_in: 60 }), { status: 200, headers });
    } catch { return response(400, 'Requête invalide ou non confirmée'); }
  };
}
