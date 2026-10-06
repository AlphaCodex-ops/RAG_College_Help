from campus_common.auth import current_user, require_role
from campus_common.http import HttpError, api_handler, parse_body, response


@api_handler
def handler(event, context):
    user = current_user(event)
    route = event.get("routeKey")

    if route == "GET /documents":
        require_role(user, "ADMIN")
        return response(200, {"items": [{"documentId": "d1", "status": "ACTIVE", "title": "Academic Regulations"}]})

    if route == "POST /documents":
        require_role(user, "ADMIN")
        body = parse_body(event)
        if not body.get("title"):
            raise HttpError(400, "VALIDATION", "'title' is required")
        return response(201, {"document": {"documentId": "d1", "status": "PENDING", "title": body["title"]}, "uploadUrl": "https://example.com/upload"})

    if route == "GET /documents/{id}":
        require_role(user, "ADMIN")
        return response(200, {"documentId": "d1", "status": "ACTIVE"})

    if route == "PATCH /documents/{id}/status":
        require_role(user, "ADMIN")
        return response(200, {"document": {"documentId": "d1", "status": "ACTIVE"}, "ingestion": {"started": True, "jobId": "job-1"}})

    if route == "POST /documents/sync":
        require_role(user, "ADMIN")
        return response(202, {"jobId": "job-1"})

    if route == "GET /documents/sync-status":
        require_role(user, "ADMIN")
        return response(200, {"latest": {"jobId": "job-1", "status": "COMPLETE", "updatedAt": "2026-10-06T00:00:00Z"}})

    raise HttpError(404, "NOT_FOUND", "Route not implemented yet")
