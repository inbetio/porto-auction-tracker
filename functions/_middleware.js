// Validates the Cloudflare Access JWT on every /api/* request and puts the
// caller's email on `data`. The app sits behind Access, but we verify the token
// properly rather than trusting an injected header, so a request that somehow
// reaches the origin directly cannot impersonate anyone.
const CERT_CACHE = { keys: null, at: 0 };

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const dec = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function getKeys(iss) {
  if (CERT_CACHE.keys && Date.now() - CERT_CACHE.at < 3600e3) return CERT_CACHE.keys;
  const r = await fetch(iss + '/cdn-cgi/access/certs');
  if (!r.ok) throw new Error('certs ' + r.status);
  const j = await r.json();
  CERT_CACHE.keys = j.keys || [];
  CERT_CACHE.at = Date.now();
  return CERT_CACHE.keys;
}

async function verify(token, expectedAud) {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('malformed');
  const head = dec(h), pay = dec(p);
  const iss = String(pay.iss || '');
  // only ever fetch keys from a cloudflareaccess.com issuer
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(iss)) throw new Error('bad iss');
  if (pay.exp && Date.now() / 1000 > pay.exp) throw new Error('expired');
  const auds = Array.isArray(pay.aud) ? pay.aud : [pay.aud];
  if (expectedAud && !auds.includes(expectedAud)) throw new Error('bad aud');
  const jwk = (await getKeys(iss)).find((k) => k.kid === head.kid);
  if (!jwk) throw new Error('no kid');
  const key = await crypto.subtle.importKey('jwk', jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key,
    b64urlToBytes(s), new TextEncoder().encode(h + '.' + p));
  if (!ok) throw new Error('bad sig');
  return pay;
}

export async function onRequest(ctx) {
  const { request, env, next, data } = ctx;
  if (!new URL(request.url).pathname.startsWith('/api/')) return next();
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return json({ ok: false, error: 'no access token' }, 401);
  try {
    const pay = await verify(token, env.ACCESS_AUD);
    data.email = String(pay.email || '').toLowerCase();
    data.owner = String(env.OWNER_EMAIL || 'm@inbet.io').toLowerCase();
  } catch (e) {
    return json({ ok: false, error: 'auth: ' + e.message }, 403);
  }
  return next();
}
export const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
