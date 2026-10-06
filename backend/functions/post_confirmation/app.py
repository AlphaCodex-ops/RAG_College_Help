import os

from campus_common.http import api_handler, log


@api_handler
def handler(event, context):
    log("INFO", "post_confirmation_trigger", triggerSource=event.get("triggerSource"), userPoolId=event.get("userPoolId"))
    return event
