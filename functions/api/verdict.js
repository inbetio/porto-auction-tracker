// POST /api/verdict {ref,status,note} -> OWNER ONLY. Martim's calls stay canonical.
const OK = new Set(['watch', 'invest', 'bought', 'dismiss', '']);
export async function onRequestPost({ request, env, data }) {
  if (data.email !== data.owner)
    return new Response(JSON.stringify({ ok: false, error: 'read-only: only ' + data.owner + ' sets verdicts' }),
      { status: 403, headers: { 'content-type': 'application/json' } });
  let b; try { b = await request.json(); } catch { return bad('bad json'); }
  const ref = String(b.ref || '').slice(0, 40);
  const status = String(b.status ?? '');
  if (!ref) return bad('no ref');
  if (!OK.has(status)) return bad('bad status');
  const kv = env.TRACKER;
  const v = (await kv.get('verdicts', 'json')) || {};
  if (status === '') delete v[ref];
  else v[ref] = { status, note: String(b.note || '').slice(0, 2000), at: Date.now(), by: data.email };
  await kv.put('verdicts', JSON.stringify(v));
  return new Response(JSON.stringify({ ok: true, verdicts: v }), { headers: { 'content-type': 'application/json' } });
}
const bad = (m) => new Response(JSON.stringify({ ok: false, error: m }),
  { status: 400, headers: { 'content-type': 'application/json' } });
