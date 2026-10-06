import os
import time

import boto3
from botocore.exceptions import ClientError

from campus_common.auth import current_user
from campus_common.db import new_id, now_iso, table, today
from campus_common.http import HttpError, api_handler, log, parse_body, response

agent = boto3.client("bedrock-agent-runtime")
KB_ID = os.environ.get("KNOWLEDGE_BASE_ID", "REPLACE_WITH_KB_ID")
MODEL_ARN = os.environ.get("MODEL_ARN", "REPLACE_WITH_MODEL_ARN")

NO_ANSWER = (
    "I couldn't verify this from the approved campus knowledge base. "
    "Please contact the relevant office or check the official circulars."
)

PROMPT = """You are CHAAMP, the campus assistant for VIT Chennai. Answer ONLY from the search results below.
Rules:
- Never invent campus rules, dates, fees, contact details or policies.
- If several versions of a document appear, prefer the latest version.
- If the search results do not contain the answer, reply exactly: NO_ANSWER
- Be concise and student-friendly.

Search results:
$search_results$

$output_format_instructions$"""


def _sources(citations):
    seen, out = set(), []
    for citation in citations:
        for ref in citation.get("retrievedReferences", []):
            metadata = ref.get("metadata", {}) or {}
            key = metadata.get("documentId") or ref.get("location", {}).get("s3Location", {}).get("uri")
            if not key or key in seen:
                continue
            seen.add(key)
            out.append({
                "documentId": metadata.get("documentId"),
                "title": metadata.get("title") or "Campus document",
                "version": metadata.get("version"),
                "category": metadata.get("category"),
                "snippet": (ref.get("content", {}).get("text") or "")[:240],
            })
    return out


def _log_query(user, started, success, answered, sources, qlen):
    try:
        table("QUERYLOGS_TABLE").put_item(Item={
            "queryId": new_id(),
            "userId": user.sub,
            "role": user.role,
            "day": today(),
            "timestamp": now_iso(),
            "category": (sources[0].get("category") if sources else "NONE") or "NONE",
            "latencyMs": int((time.time() - started) * 1000),
            "success": success,
            "hadAnswer": answered,
            "sourceCount": len(sources),
            "questionLength": qlen,
            "ttl": int(time.time()) + 90 * 86400,
        })
    except Exception as exc:
        log("ERROR", "querylog_failed", err=str(exc))


@api_handler
def handler(event, context):
    user = current_user(event)
    body = parse_body(event)
    question = body.get("question")
    if not isinstance(question, str) or not (3 <= len(question.strip()) <= 1000):
        raise HttpError(400, "VALIDATION", "'question' must be 3-1000 characters")
    question = question.strip()
    started = time.time()

    vs_cfg = {"numberOfResults": 5}
    if user.role == "STUDENT":
        vs_cfg["filter"] = {"equals": {"key": "audience", "value": "ALL"}}

    try:
        resp = agent.retrieve_and_generate(
            input={"text": question},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": KB_ID,
                    "modelArn": MODEL_ARN,
                    "retrievalConfiguration": {"vectorSearchConfiguration": vs_cfg},
                    "generationConfiguration": {"promptTemplate": {"textPromptTemplate": PROMPT}},
                },
            },
        )
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        log("ERROR", "bedrock_failed", code=code)
        _log_query(user, started, False, False, [], len(question))
        if code == "ThrottlingException":
            raise HttpError(429, "AI_THROTTLED", "The assistant is busy, please retry shortly")
        raise HttpError(502, "AI_SERVICE_ERROR", "The AI service is unavailable. Other campus features still work.")

    text = (resp.get("output", {}).get("text") or "").strip()
    sources = _sources(resp.get("citations", []))
    answered = bool(sources) and "NO_ANSWER" not in text and bool(text)
    latency = int((time.time() - started) * 1000)
    _log_query(user, started, True, answered, sources if answered else [], len(question))
    return response(200, {
        "answer": text if answered else NO_ANSWER,
        "answered": answered,
        "sources": sources if answered else [],
        "latencyMs": latency,
    })
