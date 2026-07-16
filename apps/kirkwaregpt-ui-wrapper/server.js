const express = require('express')
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware')

const AGENT_URL = process.env.AGENT_URL || 'https://kirkwaregpt.apps.tanzu.kirkware.net'
const PORT = process.env.PORT || 8080

// The agent's own chat UI is a Vite SPA that references its JS/CSS at
// root-absolute paths (e.g. /assets/index-*.js). An iframe pointed at a
// path-prefixed proxy (like /agent/) breaks those references, since the
// browser requests them relative to the iframe's own origin, not the
// prefix. Proxying transparently at the root sidesteps that entirely —
// every path the agent expects just resolves correctly — and the branding
// is injected directly into the proxied HTML instead of wrapping it in an
// iframe.
const BANNER_HTML = `
<style>body{padding-top:44px!important;}</style>
<div style="position:fixed;top:0;left:0;right:0;height:44px;z-index:999999;display:flex;align-items:center;gap:10px;padding:0 16px;background:linear-gradient(90deg,#1e293b,#0f172a);border-bottom:1px solid #22304a;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;">
  <div style="width:20px;height:20px;border-radius:6px;flex-shrink:0;background:linear-gradient(135deg,#38bdf8,#6366f1);"></div>
  <span style="color:#e2e8f0;font-size:13px;font-weight:600;">Kirkware Assistant</span>
  <span style="margin-left:auto;color:#64748b;font-size:10px;font-family:monospace;">kirkwaregpt-ui-wrapper · Option A</span>
</div>`

const app = express()

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
      return html.replace(/<body[^>]*>/i, (match) => `${match}${BANNER_HTML}`)
    }),
  }),
)

app.listen(PORT, () => {
  console.log(`kirkwaregpt-ui-wrapper listening on ${PORT}, proxying to ${AGENT_URL}`)
})
