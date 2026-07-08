// Workers-with-assets mirror of the Cloudflare Pages deployment. Same Hono
// app, same D1/R2/KV bindings, same data — just served from workers.dev.
// Exists because some ISPs' DNS filters block *.pages.dev; customers and the
// admin can use whichever domain their network lets through.
import app from './functions/lib/app.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
      return app.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};
