const page = "__INLINED_PAGE__"
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } })

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/markers' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, city_name as name, country, lat, lng, created_at as createdAt FROM markers ORDER BY created_at DESC LIMIT 5000').all()
      return json({ markers: results })
    }
    if (url.pathname === '/api/markers' && request.method === 'POST') {
      let body
      try { body = await request.json() } catch { return json({ error: 'invalid_json' }, 400) }
      if (!body.name || !body.country || typeof body.lat !== 'number' || typeof body.lng !== 'number' || body.lat < -90 || body.lat > 90 || body.lng < -180 || body.lng > 180) return json({ error: 'invalid_marker' }, 400)
      const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
      await env.DB.prepare('INSERT INTO markers (id, city_name, country, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, body.name, body.country, body.lat, body.lng, createdAt).run()
      return json({ marker: { id, name: body.name, country: body.country, lat: body.lat, lng: body.lng, createdAt } }, 201)
    }
    if (url.pathname === '/' || url.pathname === '/index.html') return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    return new Response('Not found', { status: 404 })
  },
}
