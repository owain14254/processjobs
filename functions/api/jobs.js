export async function onRequest(context) {
  const { request, env } = context;

  // Handle preflight (browser CORS check)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders(),
    });
  }

  // Ensure the jobs table exists
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `).run();
  } catch (error) {
    console.error("Error creating jobs table:", error);
  }

  // GET /api/jobs → load saved data
  if (request.method === "GET") {
    try {
      const { results } = await env.DB
        .prepare("SELECT id, created_at, data FROM jobs ORDER BY created_at DESC LIMIT 1")
        .all();

      if (results.length === 0) {
        return json({ activeJobs: [], completedJobs: [] });
      }

      const latestRow = results[0];
      const data = JSON.parse(latestRow.data);
      return json(data);
    } catch (error) {
      console.error("Error loading jobs:", error);
      return json({ activeJobs: [], completedJobs: [] });
    }
  }

  // POST /api/jobs → save data
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      // Validate the expected structure
      const data = {
        activeJobs: body.activeJobs || [],
        completedJobs: body.completedJobs || [],
      };

      await env.DB
        .prepare(
          "INSERT INTO jobs (id, created_at, data) VALUES (?, ?, ?)"
        )
        .bind(id, createdAt, JSON.stringify(data))
        .run();

      // Cleanup old entries - keep only last 100
      await env.DB
        .prepare(
          "DELETE FROM jobs WHERE id NOT IN (SELECT id FROM jobs ORDER BY created_at DESC LIMIT 100)"
        )
        .run();

      return json({ ok: true, id, created_at: createdAt });
    } catch (error) {
      console.error("Error saving jobs:", error);
      return json({ ok: false, error: error.message }, 500);
    }
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
