import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('la configuration et les CSP utilisent le même projet JanaGaleh',async()=>{
  const api=await readFile(new URL('js/api.js',root),'utf8');
  const url=api.match(/https:\/\/[a-z]+\.supabase\.co/)?.[0];
  assert.equal(url,'https://yxlyfgyviupkzoboxpte.supabase.co');
  assert.match(api,/sb_publishable_/);
  assert.doesNotMatch(api,/sb_secret_|service_role/);
  for(const file of ['index.html','mon-bac.html']){
    const html=await readFile(new URL(file,root),'utf8');
    const csp=html.match(/content="default-src[^\"]+"/)?.[0]||'';
    assert(csp.includes(url),file+' : nouvelle API autorisée par la CSP');
    assert(!csp.includes('nwcatsmfbkcgvgbanwyl'),file+' : ancienne API retirée de la CSP');
  }
});
