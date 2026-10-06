from campus_common.http import HttpError, api_handler, response


@api_handler
def handler(event, context):
    route = event.get("routeKey")
    if route == "GET /announcements":
        return response(200, {"items": [{"announcementId": "a1", "title": "Campus notice", "status": "PUBLISHED"}]})

    if route == "POST /announcements":
        return response(201, {"message": "Announcement create placeholder"})

    if route == "DELETE /announcements/{id}":
        return response(200, {"message": "Announcement archive placeholder"})

    raise HttpError(404, "NOT_FOUND", "Route not implemented yet")
