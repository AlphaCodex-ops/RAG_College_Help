from campus_common.auth import current_user, require_role
from campus_common.http import api_handler, response


@api_handler
def handler(event, context):
    user = current_user(event)
    require_role(user, "ADMIN")
    return response(200, {
        "days": 14,
        "totalQueries": 0,
        "successRate": 0.0,
        "answeredRate": 0.0,
        "noAnswerRate": 0.0,
        "avgLatencyMs": 0,
        "p95LatencyMs": 0,
        "queriesByDay": [],
        "topCategories": [],
        "complaintsByStatus": {"OPEN": 0, "IN_PROGRESS": 0, "RESOLVED": 0, "REJECTED": 0},
        "documentsByStatus": {"ACTIVE": 0, "ARCHIVED": 0},
    })
