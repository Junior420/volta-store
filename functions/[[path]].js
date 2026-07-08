// Cloudflare Pages Functions catch-all. /api/* and /uploads/* are handled by
// the Hono app; everything else (index.html, script.js, admin/index.html,
// styles.css, ...) falls through to Cloudflare's static asset serving, same
// as how server/server.js serves both the API and the static site from one
// origin on Render.
import app from './lib/app.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
    return app.fetch(request, env, context);
  }

  return env.ASSETS.fetch(request);
}
