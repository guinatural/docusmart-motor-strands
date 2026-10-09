import importlib.util
import json
import os
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


ROOT = Path(__file__).resolve().parents[1]


def load_handler(relative_path, table, aws_client=None):
    resource = Mock()
    resource.Table.return_value = table
    client = aws_client or Mock()
    module_name = f"handler_{relative_path.replace('/', '_').replace('-', '_')}"
    spec = importlib.util.spec_from_file_location(
        module_name, ROOT / relative_path
    )
    module = importlib.util.module_from_spec(spec)
    with (
        patch.dict(os.environ, {"DYNAMO_TABLE_NAME": "test-table"}),
        patch("boto3.resource", return_value=resource),
        patch("boto3.client", return_value=client),
    ):
        spec.loader.exec_module(module)
    return module, resource, client


class IntakeHandlerTests(unittest.TestCase):
    def test_rejects_empty_document_list_without_writing_or_starting_pipeline(self):
        table = Mock()
        module, _, sfn = load_handler("lambda/intake/lambda_function.py", table)

        response = module.lambda_handler({"body": json.dumps({"keys": []})}, None)

        self.assertEqual(response["statusCode"], 400)
        self.assertEqual(json.loads(response["body"])["erro"], "Campo 'keys' obrigatório")
        table.put_item.assert_not_called()
        sfn.start_execution.assert_not_called()

    def test_creates_one_claim_and_starts_pipeline_once_for_document_package(self):
        table = Mock()
        table.get_item.return_value = {"Item": {"id": "APOLICE#AP-1"}}
        module, _, sfn = load_handler("lambda/intake/lambda_function.py", table)
        payload = {
            "keys": ["uploads/one/cnh.jpg", "uploads/one/orcamento.pdf"],
            "dados_formulario": {"numero_apolice": "AP-1"},
        }

        response = module.lambda_handler({"body": json.dumps(payload)}, None)
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(body["status"], "EM_PROCESSAMENTO")
        self.assertEqual(table.put_item.call_count, 4)
        self.assertEqual(sfn.start_execution.call_count, 1)
        execution = sfn.start_execution.call_args.kwargs
        state = json.loads(execution["input"])
        self.assertEqual(state["sinistro_id"], body["sinistro_id"])
        self.assertEqual(len(state["documentos"]), 2)
        self.assertEqual(state["documentos"][1]["documento_id"], "DOC-02")


class DecisionHandlerTests(unittest.TestCase):
    SINISTRO_ID = "claim-123"

    def setUp(self):
        self.table = Mock()
        self.sinistro = {
            "id": self.SINISTRO_ID,
            "numero_apolice": "AP-1",
            "dados_formulario": {
                "tipo_sinistro": "colisao",
                "data_sinistro": "2026-03-10",
                "terceiros_envolvidos": False,
            },
        }
        self.apolice = {
            "id": "APOLICE#AP-1",
            "cpf_titular": "12345678900",
            "veiculo": {"placa": "ABC1234"},
            "vigencia": {"inicio": "2026-01-01", "fim": "2026-12-31"},
        }
        self.documents = [
            {
                "documento_id": "DOC-01",
                "tipo_documento": "CNH",
                "confianca": 0.95,
                "campos_extraidos": {"cpf": "123.456.789-00"},
            },
            {
                "documento_id": "DOC-02",
                "tipo_documento": "CRLV",
                "confianca": 0.96,
                "campos_extraidos": {"placa_veiculo": "ABC-1234"},
            },
            {
                "documento_id": "DOC-03",
                "tipo_documento": "Orçamento",
                "confianca": 0.94,
                "campos_extraidos": {"valor_total": "R$ 4.200,00"},
            },
        ]
        self.table.get_item.side_effect = [
            {"Item": self.sinistro},
            {"Item": self.apolice},
        ]
        self.table.scan.return_value = {"Items": self.documents}
        self.module, _, self.sns = load_handler(
            "lambda/agregar-decisao/lambda_function.py", self.table
        )

    def decide(self):
        return self.module.lambda_handler({"sinistro_id": self.SINISTRO_ID}, None)

    def test_approves_complete_consistent_claim_below_auto_approval_limit(self):
        result = self.decide()

        self.assertEqual(result, {
            "sinistro_id": self.SINISTRO_ID,
            "status": "APROVADO",
            "automatica": True,
        })
        self.table.update_item.assert_called_once()
        self.sns.publish.assert_called_once()

    def test_requests_missing_required_documents(self):
        self.documents.pop(1)

        result = self.decide()

        self.assertEqual(result["status"], "PENDENTE_DOCUMENTACAO")
        self.assertIn("crlv", self.table.update_item.call_args.kwargs["ExpressionAttributeValues"][":f"])

    def test_sends_cpf_mismatch_to_human_review(self):
        self.documents[0]["campos_extraidos"]["cpf"] = "98765432100"

        result = self.decide()

        self.assertEqual(result["status"], "EM_ANALISE")
        self.assertFalse(result["automatica"])

    def test_sends_low_confidence_document_to_human_review(self):
        self.documents[0]["confianca"] = 0.5

        result = self.decide()

        self.assertEqual(result["status"], "EM_ANALISE")

    def test_sends_amount_above_auto_approval_limit_to_human_review(self):
        self.documents[2]["campos_extraidos"]["valor_total"] = "R$ 6.200,00"

        result = self.decide()

        self.assertEqual(result["status"], "EM_ANALISE")
        self.assertFalse(result["automatica"])


class ManualReviewHandlerTests(unittest.TestCase):
    def test_rejects_invalid_status_without_reading_claim(self):
        table = Mock()
        module, _, _ = load_handler("lambda/put-sinistro/lambda_function.py", table)

        response = module.lambda_handler({
            "pathParameters": {"id": "claim-123"},
            "body": json.dumps({"status": "UNKNOWN"}),
        }, None)

        self.assertEqual(response["statusCode"], 400)
        table.get_item.assert_not_called()

    def test_records_manual_status_change_and_audit(self):
        table = Mock()
        table.get_item.return_value = {"Item": {"id": "claim-123"}}
        module, _, _ = load_handler("lambda/put-sinistro/lambda_function.py", table)

        response = module.lambda_handler({
            "pathParameters": {"id": "claim-123"},
            "body": json.dumps({"status": "APROVADO", "observacao": "Conferido"}),
        }, None)

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(json.loads(response["body"])["status"], "APROVADO")
        table.update_item.assert_called_once()
        table.put_item.assert_called_once()
        audit = table.put_item.call_args.kwargs["Item"]
        self.assertEqual(audit["etapa"], "revisao_manual")
        self.assertIn("Conferido", audit["detalhes"])


if __name__ == "__main__":
    unittest.main()
