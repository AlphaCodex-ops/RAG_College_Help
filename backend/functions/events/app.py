import json

from campus_common.http import HttpError, api_handler, response


@api_handler
def handler(event, context):
    route = event.get("routeKey")
    if route == "GET /events":
        return response(200, {"items": []})

    if route == "POST /events":
        return response(201, {"message": "Event create placeholder"})

    raise HttpError(404, "NOT_FOUND", "Route not implemented yet")
