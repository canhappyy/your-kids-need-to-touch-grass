import json
import recommendation_pipeline as rp
import recommendation_functions as rf

MAX_CHARS = 500
HEADERS = {"Content-Type": "application/json"}

def handler(event, context):
    """
    AWS Lambda handler function for processing recommendation requests.
    This function processes incoming requests and returns recommendations based on the provided text.

    Args:
        event (dict): Event data passed to the Lambda function.
        context (object): Context in which the Lambda function is called. Unused in this function, but included to avoid a TypeError.

    Returns:
        dict: A dictionary containing the HTTP response with status code and body.
            Keys:
                - statusCode (int): HTTP status code of the response.
                - headers (dict): HTTP headers for the response.
                - body (str): JSON-encoded string containing the recommendations or error message.
    """

    # Extract 'free_text' parameter from the incoming event
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": HEADERS,
            "body": json.dumps({"error": "Invalid JSON body."}),
        }
    free_text = body.get("free_text" or "").strip()[:MAX_CHARS]

    # Validate 'free_text' parameter
    if not free_text:
        return {
            "statusCode": 400,
            "headers": HEADERS,
            "body": json.dumps({"error": "Missing or empty 'free_text' parameter."}),
        }

    ranked_activities = rp.rank_activities(free_text)
    top_activities = ranked_activities[[rf.ACTIVITY_ID_COLUMN, rf.ACTIVITY_TITLE_COLUMN, "final_score"]].head(10)

    return {
        "statusCode": 200,
        "headers": HEADERS,
        "body": json.dumps(top_activities.to_dict(orient="records"))
    }

