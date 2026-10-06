from dataclasses import dataclass

from .http import HttpError

ROLE_ORDER = ["ADMIN", "STAFF", "STUDENT"]


@dataclass
class User:
    sub: str
    email: str
    name: str
    role: str


def current_user(event) -> User:
    claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
    raw = claims.get("cognito:groups", [])
    if isinstance(raw, str):
        raw = raw.strip("[]").replace(",", " ").split()
    groups = [g for g in raw if g in ROLE_ORDER]
    role = next((r for r in ROLE_ORDER if r in groups), None)
    if role is None:
        raise HttpError(403, "NO_ROLE", "Your account has no role yet")
    return User(sub=claims["sub"], email=claims.get("email", ""), name=claims.get("name", ""), role=role)


def require_role(user: User, *allowed: str):
    if user.role not in allowed:
        raise HttpError(403, "FORBIDDEN", "You do not have access to this operation")
