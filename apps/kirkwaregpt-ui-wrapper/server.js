const express = require('express')
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware')

const AGENT_URL = process.env.AGENT_URL || 'https://kirkwaregpt-agent.apps.tanzu.kirkware.net'
const PORT = process.env.PORT || 8080

// Kirkware's "K" mark — inlined so it can back the overridden
// /favicon.svg with no extra request.
const KIRKWARE_LOGO_SVG_BODY =
  '<path d="m32 2c-16.568 0-30 13.432-30 30s13.432 30 30 30 30-13.432 30-30-13.432-30-30-30m6.016 44.508l-8.939-12.666-2.922 2.961v9.705h-5.963v-29.016h5.963v11.955l11.211-11.955h7.836l-11.909 11.934 12.518 17.082h-7.795" fill="#fdd835"/>'
const KIRKWARE_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${KIRKWARE_LOGO_SVG_BODY}</svg>`

// The agent's own chat UI is a Vite SPA that references its JS/CSS at
// root-absolute paths (e.g. /assets/index-*.js). An iframe pointed at a
// path-prefixed proxy (like /agent/) breaks those references, since the
// browser requests them relative to the iframe's own origin, not the
// prefix. Proxying transparently at the root sidesteps that entirely —
// every path the agent expects just resolves correctly — and the branding
// is injected directly into the proxied HTML instead of wrapping it in an
// iframe.

// The agent's UI is Tailwind v4 + shadcn/ui, whose entire color scheme is
// centralized in these CSS custom properties on :root/.dark — Tailwind's
// generated --color-* utility variables just pass through to these, so
// overriding the base tokens recolors every .bg-primary / .text-accent /
// .border / .ring usage in the app without touching its own stylesheet.
// destructive/-foreground are deliberately left alone — errors should stay
// red regardless of brand color.
const THEME_OVERRIDE_CSS = `
<style>
:root{--background:#fafafa;--foreground:#52525b;--card:#fff;--card-foreground:#52525b;--popover:#fff;--popover-foreground:#52525b;--primary:#ca8a04;--primary-foreground:#1c1917;--secondary:#f4f4f5;--secondary-foreground:#52525b;--muted:#f4f4f5;--muted-foreground:#71717a;--accent:#71717a;--accent-foreground:#fff;--warning:#eab308;--warning-foreground:#1c1917;--muted-hover:#e4e4e7;--border:#d4d4d8;--input:#d4d4d8;--ring:#ca8a04}
.dark{--background:#18181b;--foreground:#e4e4e7;--card:#27272a;--card-foreground:#e4e4e7;--popover:#27272a;--popover-foreground:#e4e4e7;--primary:#eab308;--primary-foreground:#18181b;--secondary:#27272a;--secondary-foreground:#e4e4e7;--muted:#27272a;--muted-foreground:#a1a1aa;--accent:#a1a1aa;--accent-foreground:#18181b;--warning:#eab308;--warning-foreground:#18181b;--muted-hover:#3f3f46;--border:#3f3f46;--input:#3f3f46;--ring:#eab308}
</style>`

// The chat layout's outer container is sized with Tailwind's `h-dvh`
// utility directly (a real viewport unit), not a percentage inherited from
// #root or <body> — so a plain `body{padding-bottom}` never shrinks it,
// and a fixed footer would just sit on top of the sticky message input
// instead of leaving room above it. Shrinking that specific class is what
// actually reflows the whole chat layout to make real space underneath.
const FOOTER_HTML = `
<style>[class*="h-dvh"]{height:calc(100dvh - 32px)!important;}</style>
<div style="position:fixed;bottom:0;left:0;right:0;height:32px;z-index:999999;display:flex;align-items:center;justify-content:center;padding:0 16px;background:#18181b;border-top:1px solid #3f3f46;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;">
  <span style="color:#a1a1aa;font-size:11px;text-align:center;">&copy; Kirkware Enterprises. All rights reserved. Do not use prompts containing PII/PCI such as credit card numbers, employee IDs, etc.</span>
</div>`

const app = express()

// Registered before the catch-all proxy below, so this short-circuits the
// agent's own /favicon.svg instead of it ever reaching the proxy — the
// agent's HTML still references the same href, it just resolves to ours.
app.get('/favicon.svg', (req, res) => {
  res.type('image/svg+xml').send(KIRKWARE_FAVICON_SVG)
})

app.use(
  '/',
  createProxyMiddleware({
    target: AGENT_URL,
    changeOrigin: true,
    ws: true,
    selfHandleResponse: true,
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || ''
      if (!contentType.includes('text/html')) return responseBuffer
      const html = responseBuffer.toString('utf8')
      return html.replace(/<body[^>]*>/i, (match) => `${match}${THEME_OVERRIDE_CSS}${FOOTER_HTML}`)
    }),
  }),
)

app.listen(PORT, () => {
  console.log(`kirkwaregpt-ui-wrapper listening on ${PORT}, proxying to ${AGENT_URL}`)
})
