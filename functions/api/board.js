// GET /api/board -> the shared state plus who you are.
export async function onRequestGet({ env, data }) {
  const kv = env.TRACKER;
  const [v, c] = await Promise.all([kv.get('verdicts', 'json'), kv.get('comments', 'json')]);
  return new Response(JSON.stringify({
    ok: true,
    me: data.email,
    owner: data.owner,
    canEdit: data.email === data.owner,
    verdicts: v || {},
    comments: c || {}
  }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
