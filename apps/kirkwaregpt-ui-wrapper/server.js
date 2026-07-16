const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const AGENT_URL = process.env.AGENT_URL || 'https://kirkwaregpt.apps.tanzu.kirkware.net'
const PORT = process.env.PORT || 8080

const app = express()

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Kirkware Assistant</title>
<style>
  html, body { margin: 0; height: 100%; font-family: system-ui, -apple-system, sans-serif; background: #0b0f1a; }
  header {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; background: linear-gradient(90deg, #1e293b, #0f172a);
    border-bottom: 1px solid #22304a;
  }
  header .logo {
    width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, #38bdf8, #6366f1);
  }
  header h1 { color: #e2e8f0; font-size: 15px; font-weight: 600; margin: 0; }
  header .tag {
    margin-left: auto; color: #64748b; font-size: 11px; font-family: monospace;
  }
  iframe { display: block; width: 100%; height: calc(100% - 57px); border: 0; }
</style>
</head>
<body>
  <header>
    <div class="logo"></div>
    <h1>Kirkware Assistant</h1>
    <span class="tag">kirkwaregpt-ui-wrapper · Option A</span>
  </header>
  <iframe src="/agent/" title="KirkwareGPT chat"></iframe>
</body>
</html>`)
})

// Everything under /agent is reverse-proxied to the real agent_buildpack app,
// so the branded shell and the agent UI share one origin — no cross-origin
// cookie or CSP headaches, and the agent itself needs zero changes.
app.use(
  '/agent',
  createProxyMiddleware({
    target: AGENT_URL,
    changeOrigin: true,
    pathRewrite: { '^/agent': '' },
    ws: true,
  }),
)

app.listen(PORT, () => {
  console.log(`kirkwaregpt-ui-wrapper listening on ${PORT}, proxying to ${AGENT_URL}`)
})
