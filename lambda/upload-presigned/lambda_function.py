import boto3
import json
import os
import uuid

s3 = boto3.client("s3", region_name="us-east-1")
BUCKET = os.environ.get("BUCKET_NAME", "docusmart-idp-grupo-5-docs")
EXPIRY = int(os.environ.get("URL_EXPIRY_SECONDS", "300"))

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
}


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        filename = body.get("filename", f"{uuid.uuid4()}")
        content_type = body.get("content_type", "application/octet-stream")

        key = f"uploads/{uuid.uuid4()}/{filename}"

        url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": BUCKET, "Key": key, "ContentType": content_type},
            ExpiresIn=EXPIRY,
        )

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"upload_url": url, "key": key}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS,
            "body": json.dumps({"erro": str(e)}),
        }
