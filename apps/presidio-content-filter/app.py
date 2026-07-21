import logging
import os

from flask import Flask, jsonify, request
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("presidio-content-filter")

app = Flask(__name__)

# AnalyzerEngine() with no nlp_engine tries to auto-download en_core_web_lg
# (~400MB) on first use — fine on a laptop with real internet access, but
# not something to discover mid-deploy on a buildpack. en_core_web_sm is
# already a pinned dependency in requirements.txt; this just tells the
# analyzer to use exactly that, nothing more.
_nlp_engine = NlpEngineProvider(
    nlp_configuration={
        "nlp_engine_name": "spacy",
        "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
    }
).create_engine()
analyzer = AnalyzerEngine(nlp_engine=_nlp_engine, supported_languages=["en"])
anonymizer = AnonymizerEngine()

ENTITIES = ["US_SSN", "CREDIT_CARD"]
OPERATORS = {
    "US_SSN": OperatorConfig("replace", {"new_value": "<SSN>"}),
    "CREDIT_CARD": OperatorConfig("replace", {"new_value": "<CREDIT_CARD>"}),
}


def mask_text(text):
    """Detect and mask SSNs/credit-card numbers in a single string. Returns
    (masked_text, [entity_type, ...]) — the findings list is empty when
    nothing matched, which callers use to decide whether anything changed.
    """
    if not isinstance(text, str) or not text:
        return text, []
    results = analyzer.analyze(text=text, entities=ENTITIES, language="en")
    if not results:
        return text, []
    anonymized = anonymizer.anonymize(text=text, analyzer_results=results, operators=OPERATORS)
    return anonymized.text, [r.entity_type for r in results]


def mask_value(value, findings):
    """Recursively walk arbitrary JSON, masking every string found. Shape-
    agnostic on purpose — the gateway's actual webhook request/response
    contract isn't publicly documented, so this doesn't assume a specific
    schema (e.g. OpenAI-style `messages[].content`) beyond "JSON with
    strings somewhere in it."
    """
    if isinstance(value, str):
        masked, found = mask_text(value)
        findings.extend(found)
        return masked
    if isinstance(value, dict):
        return {k: mask_value(v, findings) for k, v in value.items()}
    if isinstance(value, list):
        return [mask_value(v, findings) for v in value]
    return value


@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify(status="ok"), 200


@app.route("/analyze", methods=["POST"])
def analyze():
    """Direct-test endpoint — not the webhook contract. POST {"text": "..."}
    and get back what Presidio found and how it was masked, without
    needing a full gateway-shaped payload.
    """
    body = request.get_json(silent=True) or {}
    text = body.get("text", "")
    masked, findings = mask_text(text)
    return jsonify(original=text, masked=masked, findings=findings), 200


@app.route("/", defaults={"path": ""}, methods=["GET", "POST"])
@app.route("/<path:path>", methods=["GET", "POST"])
def webhook(path):
    """The actual webhook target — accepts any path and any JSON body,
    since the gateway's exact request shape and expected path aren't
    published. Logs the raw request so the real contract can be read back
    out of `cf logs` after a live end-to-end test.
    """
    if request.method == "GET":
        return jsonify(status="ok", service="presidio-content-filter"), 200

    raw_body = request.get_data(as_text=True)
    logger.info("webhook request path=/%s content-type=%s body=%s", path, request.content_type, raw_body)

    body = request.get_json(silent=True)
    if body is None:
        masked, findings = mask_text(raw_body)
        logger.info("masked raw (non-JSON) body, findings=%s", findings)
        return masked, 200, {"Content-Type": request.content_type or "text/plain"}

    findings = []
    masked_body = mask_value(body, findings)
    logger.info("masked JSON body, findings=%s", findings)
    return jsonify(masked_body), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
