import test from 'node:test';
import assert from 'node:assert/strict';
import { createDownloadHandler } from '../supabase/functions/ege-telecharger-word/handler.js';
const id = '11111111-1111-4111-8111-111111111111', version = '22222222-2222-4222-8222-222222222222';
function setup(options = {}) {
  const calls = [];
  const handler = createDownloadHandler({ env: name => ({ SUPABASE_URL: 'https://example.invalid', SUPABASE_ANON_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'server-test' })[name],
    createClient(url, key) {
      calls.push({ client: key });
      return key === 'public-test' ? { auth: { getUser: async () => ({ data: { user: options.invalid ? null : { id: 'test' } } }) }, rpc: async (name, args) => { calls.push({ name, args }); return options.denied ? { error: {} } : { data: `${id}/versions/0001/dossier-personnalise.docx` }; } } : { storage: { from: bucket => ({ createSignedUrl: async (path, ttl) => { calls.push({ bucket, path, ttl }); return options.missing ? { error: {} } : { data: { signedUrl: 'https://example.invalid/signed-test' } }; } }) } };
    } });
  const request = (body = { commande_id: id }, origin = 'https://mon-bac-v8.vercel.app') => new Request('https://example.invalid/word', { method: 'POST', headers: { Origin: origin, Authorization: 'Bearer test-token', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { handler, calls, request };
}
test('CORS accepte la version de consultation et le header Supabase x-client-info', async () => {
  const { handler } = setup();
  const response = await handler(new Request('https://example.invalid', { method: 'OPTIONS', headers: { Origin: 'https://mon-bac-v8.vercel.app' } }));
  assert.equal(response.status, 204); assert.match(response.headers.get('access-control-allow-headers'), /x-client-info/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('une version historique utilise les droits du JWT avant la signature serveur', async () => {
  const { handler, request, calls } = setup(); const response = await handler(request({ commande_id: id, version_id: version }));
  assert.equal(response.status, 200);
  assert(calls.some(c => c.name === 'ege_word_version_autorisee' && c.args.p_version === version));
  assert(calls.some(c => c.ttl === 60)); assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('aucune signature serveur après un refus, un JWT invalide, une version invalide ou une origine tierce', async () => {
  for (const [options, body, origin, status] of [[{ denied: true }, { commande_id: id }, undefined, 403], [{ invalid: true }, { commande_id: id }, undefined, 401], [{}, { commande_id: id, version_id: '../other' }, undefined, 400], [{}, { commande_id: id }, 'https://evil.invalid', 403]]) {
    const { handler, request, calls } = setup(options); const response = await handler(request(body, origin));
    assert.equal(response.status, status); assert(!calls.some(c => c.client === 'server-test'));
  }
});
test('un objet absent ne produit aucun faux lien de téléchargement', async () => {
  const { handler, request } = setup({ missing: true }); assert.equal((await handler(request())).status, 404);
});
