# presidio-content-filter

A Python/Flask webhook target for Tanzu AI Services Gateway's webhook
content-filtering policy, built on [Microsoft
Presidio](https://microsoft.github.io/presidio/) to mask Social Security
Numbers and credit card numbers before they ever reach a model — and again
on the way back out, in case a model echoes one back.

## Why this exists

Broadcom's own docs describe webhook policies but don't publish the exact
request/response wire format the gateway actually sends. This app was
built by deploying a permissive, verbosely-logged catch-all endpoint first,
then reading the real contract back out of `cf logs` after a live test —
see below for what that contract turned out to be on this foundation.

## The actual webhook contract (observed, not documented)

The gateway calls this app at **two different paths**, both with
`Content-Type: application/json`, both expecting the same JSON body back
(modified or not):

- `POST /prompt` — the outbound chat request, OpenAI-style:
  `{"messages": [{"role": ..., "content": ...}, ...], "model": ..., "stream": true, ...}`
- `POST /response/stream` — individual streamed response chunks coming
  back from the model, OpenAI streaming-chunk shaped:
  `{"id": ..., "object": "chat.completion.chunk", "choices": [...], ...}`

This app doesn't special-case either shape. `mask_value()` walks whatever
JSON it's given recursively and masks every string it finds, so it
handles both paths — and would handle a differently-shaped payload too —
with the same code.

## Running it

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PORT=8080 python3 app.py
```

- `GET /healthz` — liveness check
- `POST /analyze` — direct test endpoint, not the webhook contract:
  `{"text": "..."}` in, `{"original", "masked", "findings"}` out
- `POST /<anything>` — the actual webhook target; logs the raw request,
  masks every string in the JSON body, returns the same shape

## Deploying

```bash
cf push -f apps/presidio-content-filter/manifest.yml -p apps/presidio-content-filter
```

Run from the repo root, not from inside this directory — `-f` points at
the manifest, `-p` points at the app bits; `-f` alone isn't enough,
Cloud Foundry still looks for app bits in the current directory unless
`-p` (or a `path:` in the manifest) says otherwise.

## Notes on the implementation

- **`en_core_web_sm`, pinned in `requirements.txt`, not `spacy download`.**
  spaCy models are plain pip wheels — installing the model's GitHub
  release URL directly means the buildpack's normal `pip install -r
  requirements.txt` step is the only install step needed, no extra
  buildpack hook. `AnalyzerEngine()` with no `nlp_engine` argument
  auto-downloads `en_core_web_lg` (~400MB) on first use instead of using
  whatever's already installed — `app.py` explicitly builds an
  `NlpEngineProvider` pointed at `en_core_web_sm` to avoid that.
- **Only `US_SSN` and `CREDIT_CARD` are enabled.** Presidio ships many more
  recognizers (email, phone, IP, IBAN, names via NER, ...); `ENTITIES` in
  `app.py` restricts detection to exactly the two types this app is for.
- **`078-05-1120` will never match.** It's the fake SSN printed in a
  1938 Social Security card wallet-insert ad, reused so often since that
  Presidio's own `UsSsnRecognizer` specifically excludes it (along with a
  handful of other well-known fake SSNs) — this is correct behavior, not
  a bug, and it's worth knowing about before you pick a number for a demo
  or a test.
