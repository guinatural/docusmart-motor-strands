"""
Cria/atualiza o CloudWatch Dashboard do DocuSmart (Grupo 5).

Widgets: invocações, erros, duração e throttles das 11 Lambdas;
execuções do Step Functions; e requisições/erros/latência do API Gateway.

Rodar com: AWS_PROFILE=hackathon python3 scripts/cloudwatch_dashboard.py
"""
import json
import boto3

REGION = "us-east-1"
DASHBOARD = "docusmart-idp-grupo-5"
API_NAME = "docusmart-api-grupo5"
STATE_MACHINE = "docusmart-idp-grupo-5-pipeline"
TABLE = "docusmart-idp-grupo-5-documents"

LAMBDAS = [
    "docusmart-idp-grupo-5-upload-presigned",
    "docusmart-idp-grupo-5-intake",
    "docusmart-idp-grupo-5-processar-sinistro",
    "docusmart-idp-grupo-5-agregar-decisao",
    "docusmart-idp-grupo-5-indexar-sinistro",
    "docusmart-idp-grupo-5-get-sinistro",
    "docusmart-idp-grupo-5-list-sinistros",
    "docusmart-idp-grupo-5-put-sinistro",
    "docusmart-idp-grupo-5-delete-sinistro",
    "docusmart-idp-grupo-5-chat",
    "docusmart-idp-consultar-status-grupo-5",
]

cw = boto3.client("cloudwatch", region_name=REGION)
sts = boto3.client("sts", region_name=REGION)
ACCOUNT = sts.get_caller_identity()["Account"]
SM_ARN = f"arn:aws:states:{REGION}:{ACCOUNT}:stateMachine:{STATE_MACHINE}"


def lambda_metric(metric, stat):
    """Uma série por função para a métrica/estatística dada."""
    return [["AWS/Lambda", metric, "FunctionName", fn] for fn in LAMBDAS]


def widget(x, y, w, h, title, metrics, stat="Sum", period=300, extra=None):
    props = {
        "title": title, "region": REGION, "view": "timeSeries",
        "stacked": False, "stat": stat, "period": period, "metrics": metrics,
    }
    if extra:
        props.update(extra)
    return {"type": "metric", "x": x, "y": y, "width": w, "height": h, "properties": props}


def build():
    widgets = []
    # Linha 1 — Lambdas: invocações | erros
    widgets.append(widget(0, 0, 12, 7, "Lambdas — Invocações", lambda_metric("Invocations", "Sum")))
    widgets.append(widget(12, 0, 12, 7, "Lambdas — Erros", lambda_metric("Errors", "Sum")))
    # Linha 2 — Lambdas: duração (média) | throttles
    widgets.append(widget(0, 7, 12, 7, "Lambdas — Duração (média, ms)", lambda_metric("Duration", "Average"), stat="Average"))
    widgets.append(widget(12, 7, 12, 7, "Lambdas — Throttles", lambda_metric("Throttles", "Sum")))
    # Linha 3 — Step Functions | API Gateway requisições/erros
    sfn = [
        ["AWS/States", "ExecutionsStarted", "StateMachineArn", SM_ARN],
        ["AWS/States", "ExecutionsSucceeded", "StateMachineArn", SM_ARN],
        ["AWS/States", "ExecutionsFailed", "StateMachineArn", SM_ARN],
        ["AWS/States", "ExecutionsTimedOut", "StateMachineArn", SM_ARN],
    ]
    widgets.append(widget(0, 14, 12, 7, "Step Functions — Execuções", sfn))
    apigw = [
        ["AWS/ApiGateway", "Count", "ApiName", API_NAME],
        ["AWS/ApiGateway", "4XXError", "ApiName", API_NAME],
        ["AWS/ApiGateway", "5XXError", "ApiName", API_NAME],
    ]
    widgets.append(widget(12, 14, 12, 7, "API Gateway — Requisições e erros", apigw))
    # Linha 4 — API Gateway latência
    lat = [
        ["AWS/ApiGateway", "Latency", "ApiName", API_NAME, {"stat": "Average"}],
        ["AWS/ApiGateway", "Latency", "ApiName", API_NAME, {"stat": "p99"}],
    ]
    widgets.append(widget(0, 21, 24, 6, "API Gateway — Latência (ms)", lat, stat="Average"))

    # Linha 5 — Bedrock (SEARCH descobre o ModelId automaticamente)
    bedrock_inv = [[{"expression": "SEARCH('{AWS/Bedrock,ModelId} MetricName=\"Invocations\"', 'Sum', 300)", "id": "bi", "region": REGION, "label": "Invocações"}]]
    widgets.append(widget(0, 27, 12, 7, "Bedrock — Invocações (Haiku)", bedrock_inv))
    bedrock_tok = [
        [{"expression": "SEARCH('{AWS/Bedrock,ModelId} MetricName=\"InputTokenCount\"', 'Sum', 300)", "id": "ti", "region": REGION, "label": "Tokens de entrada"}],
        [{"expression": "SEARCH('{AWS/Bedrock,ModelId} MetricName=\"OutputTokenCount\"', 'Sum', 300)", "id": "to", "region": REGION, "label": "Tokens de saída"}],
    ]
    widgets.append(widget(12, 27, 12, 7, "Bedrock — Tokens", bedrock_tok))

    # Linha 6 — DynamoDB
    ddb_cap = [
        ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", TABLE],
        ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", TABLE],
    ]
    widgets.append(widget(0, 34, 12, 7, "DynamoDB — Capacidade consumida (RCU/WCU)", ddb_cap))
    ddb_err = [
        ["AWS/DynamoDB", "ThrottledRequests", "TableName", TABLE],
        ["AWS/DynamoDB", "SystemErrors", "TableName", TABLE],
        ["AWS/DynamoDB", "UserErrors", "TableName", TABLE],
    ]
    widgets.append(widget(12, 34, 12, 7, "DynamoDB — Throttles e erros", ddb_err))
    return {"widgets": widgets}


if __name__ == "__main__":
    body = build()
    cw.put_dashboard(DashboardName=DASHBOARD, DashboardBody=json.dumps(body))
    print(f"dashboard '{DASHBOARD}' publicado ({len(body['widgets'])} widgets)")
    print(f"https://{REGION}.console.aws.amazon.com/cloudwatch/home?region={REGION}#dashboards/dashboard/{DASHBOARD}")
