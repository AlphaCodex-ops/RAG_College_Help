import datetime as dt
import os
import uuid

import boto3

_ddb = boto3.resource("dynamodb")


def table(env_name: str):
    return _ddb.Table(os.environ[env_name])


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def today() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")


def require_str(body: dict, key: str, min_len=1, max_len=500) -> str:
    from .http import HttpError

    value = body.get(key)
    if not isinstance(value, str) or not (min_len <= len(value.strip()) <= max_len):
        raise HttpError(400, "VALIDATION", f"'{key}' must be a string of {min_len}-{max_len} characters")
    return value.strip()
