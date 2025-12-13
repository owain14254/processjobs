export async function onRequest(context) {
  const { request, env } = context;

  // Handle preflight (browser CORS check)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders(),
    });
  }

  // GET /api/items  → load saved data
  if (request.method === "GET") {
    const { results } = await env.DB
      .prepare("SELECT id, created_at, data FROM items ORDER BY created_at DESC")
      .all();

    return json(
      results.map((row) => ({
        id: row.id,
        created_at: row.created_at,
        data: JSON.parse(row.data),
      }))
    );
  }

  // POST /api/items → save data
  if (request.method === "POST") {
    const body = await request.json();

    const id = body.id || crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = body.data ?? body;

    await env.DB
      .prepare(
        "INSERT OR REPLACE INTO items (id, created_at, data) VALUES (?, ?, ?)"
      )
      .bind(id, createdAt, JSON.stringify(data))
      .run();

    return json({ ok: true, id, created_at: createdAt });
  }

  return new Response("Method not allowed", { status: 405 });
}

// Helpers
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}
