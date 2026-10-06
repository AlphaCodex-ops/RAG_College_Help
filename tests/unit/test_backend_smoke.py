import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_ROOT = os.path.join(PROJECT_ROOT, "backend", "layers", "common", "python")
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from campus_common.auth import User, current_user, require_role
from campus_common.http import HttpError, response


def test_response_shape():
    result = response(200, {"ok": True})
    assert result["statusCode"] == 200
    assert "body" in result


def test_auth_role_resolution():
    event = {
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "abc",
                        "email": "u@example.com",
                        "name": "User",
                        "cognito:groups": "[ADMIN STUDENT]",
                    }
                }
            }
        }
    }
    user = current_user(event)
    assert user.role == "ADMIN"
    require_role(user, "ADMIN")
    assert isinstance(user, User)


def test_http_error_code():
    err = HttpError(403, "FORBIDDEN", "Bad access")
    assert err.status == 403
    assert err.code == "FORBIDDEN"
