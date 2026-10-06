import json
import time
import traceback
from decimal import Decimal


class HttpError(Exception):
    def __init__(self, status: int, code: str, message: str | None = None):
        self.status = status
        self.code = code
        self.message = message or code


def _default(o):
    if isinstance(o, Decimal):
        return int(o) if o == o.to_integral_value() else float(o)
    raise TypeError(f"not serializable: {type(o)}")


def response(status: int, body=None):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body if body is not None else {}, default=_default),
    }


def parse_body(event) -> dict:
    try:
        data = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError as exc:
        raise HttpError(400, "INVALID_JSON", "Body must be valid JSON") from exc
    if not isinstance(data, dict):
        raise HttpError(400, "INVALID_BODY", "Body must be a JSON object")
    return data


def log(level: str, msg: str, **ctx):
    print(json.dumps({"level": level, "msg": msg, "ts": time.time(), **ctx}, default=str))


def api_handler(fn):
    def wrapper(event, context):
        try:
            return fn(event, context)
        except HttpError as exc:
            log("WARN", "http_error", route=event.get("routeKey"), status=exc.status, code=exc.code)
            return response(exc.status, {"error": {"code": exc.code, "message": exc.message}})
        except Exception:
            log("ERROR", "unhandled", route=event.get("routeKey"), trace=traceback.format_exc())
            return response(500, {"error": {"code": "INTERNAL", "message": "Unexpected error"}})
    return wrapper
