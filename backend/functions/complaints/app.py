from campus_common.auth import current_user, require_role
from campus_common.http import HttpError, api_handler, parse_body, response


@api_handler
def handler(event, context):
    user = current_user(event)
    route = event.get("routeKey")

    if route == "POST /complaints":
        require_role(user, "STUDENT", "STAFF")
        body = parse_body(event)
        if not isinstance(body.get("description"), str) or len(body["description"].strip()) < 10:
            raise HttpError(400, "VALIDATION", "'description' must be at least 10 characters")
        return response(201, {"complaintId": "c1", "status": "OPEN", "userId": user.sub})

    if route == "GET /complaints":
        return response(200, {"items": [{"complaintId": "c1", "status": "OPEN", "userId": user.sub}]})

    if route == "PATCH /complaints/{id}":
        require_role(user, "ADMIN")
        return response(200, {"message": "Complaint update placeholder"})

    raise HttpError(404, "NOT_FOUND", "Route not implemented yet")
