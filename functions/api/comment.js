// POST /api/comment {ref,text} -> anyone signed in through Access may comment.
// DELETE body {ref,at} -> you may remove your own comment; the owner may remove any.
export async function onRequestPost({ request, env, data }) {
  let b; try { b = await request.json(); } catch { return bad('bad json'); }
  const ref = String(b.ref || '').slice(0, 40);
  const text = String(b.text || '').trim().slice(0, 2000);
  if (!ref || !text) return bad('need ref and text');
  const kv = env.TRACKER;
  const c = (await kv.get('comments', 'json')) || {};
  (c[ref] = c[ref] || []).push({ by: data.email, text, at: Date.now() });
  if (c[ref].length > 50) c[ref] = c[ref].slice(-50);
  await kv.put('comments', JSON.stringify(c));
  return new Response(JSON.stringify({ ok: true, comments: c }), { headers: { 'content-type': 'application/json' } });
}
export async function onRequestDelete({ request, env, data }) {
  let b; try { b = await request.json(); } catch { return bad('bad json'); }
  const ref = String(b.ref || ''), at = Number(b.at || 0);
  const kv = env.TRACKER;
  const c = (await kv.get('comments', 'json')) || {};
  if (c[ref]) c[ref] = c[ref].filter(x => !(x.at === at && (x.by === data.email || data.email === data.owner)));
  await kv.put('comments', JSON.stringify(c));
  return new Response(JSON.stringify({ ok: true, comments: c }), { headers: { 'content-type': 'application/json' } });
}
const bad = (m) => new Response(JSON.stringify({ ok: false, error: m }),
  { status: 400, headers: { 'content-type': 'application/json' } });
