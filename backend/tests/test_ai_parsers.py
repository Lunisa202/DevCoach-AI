"""Unit tests for AI agent response parsers.

Tests the _parse_response functions from each agent to ensure they:
- Accept valid JSON responses
- Reject missing fields
- Reject wrong types
- Reject empty or malformed responses
- Handle markdown code fences gracefully
"""

import pytest

from app.ai.agents.code_reviewer import _parse_response as parse_code_review
from app.ai.agents.ticket_generator import _parse_response as parse_tickets
from app.ai.agents.tech_lead import _parse_response as parse_tech_lead
from app.ai.agents.evaluator import _parse_response as parse_evaluator


# =============================================================================
# Code_Reviewer parser tests
# =============================================================================


class TestCodeReviewerParser:
    """Tests for the Code_Reviewer response parser."""

    def test_valid_response(self):
        raw = '{"fortalezas": ["Buena estructura", "Código limpio"], "debilidades": ["Falta manejo de errores"]}'
        result = parse_code_review(raw)
        assert result.fortalezas == ["Buena estructura", "Código limpio"]
        assert result.debilidades == ["Falta manejo de errores"]

    def test_valid_response_with_markdown_fences(self):
        raw = '```json\n{"fortalezas": ["Bien"], "debilidades": ["Mal"]}\n```'
        result = parse_code_review(raw)
        assert result.fortalezas == ["Bien"]
        assert result.debilidades == ["Mal"]

    def test_missing_fortalezas(self):
        raw = '{"debilidades": ["Algo malo"]}'
        with pytest.raises(ValueError, match="schema"):
            parse_code_review(raw)

    def test_missing_debilidades(self):
        raw = '{"fortalezas": ["Algo bueno"]}'
        with pytest.raises(ValueError, match="schema"):
            parse_code_review(raw)

    def test_wrong_type_fortalezas_not_list(self):
        raw = '{"fortalezas": "una sola string", "debilidades": ["ok"]}'
        with pytest.raises(ValueError, match="schema"):
            parse_code_review(raw)

    def test_empty_response(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            parse_code_review("")

    def test_not_json(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            parse_code_review("Aquí está mi análisis del código...")

    def test_empty_lists_are_valid(self):
        raw = '{"fortalezas": [], "debilidades": []}'
        result = parse_code_review(raw)
        assert result.fortalezas == []
        assert result.debilidades == []


# =============================================================================
# Ticket_Generator parser tests
# =============================================================================


class TestTicketGeneratorParser:
    """Tests for the Ticket_Generator response parser."""

    def _valid_ticket(self, **overrides):
        base = {
            "titulo": "Agregar manejo de errores",
            "descripcion": "Implementar try/except en funciones críticas",
            "prioridad": "alta",
            "dificultad": "media",
            "tiempo_estimado_minutos": 60,
        }
        base.update(overrides)
        return base

    def test_valid_3_tickets(self):
        data = {"tickets": [self._valid_ticket() for _ in range(3)]}
        import json

        result = parse_tickets(json.dumps(data))
        assert len(result.tickets) == 3
        assert result.tickets[0].titulo == "Agregar manejo de errores"
        assert result.tickets[0].prioridad.value == "alta"

    def test_valid_list_without_wrapper(self):
        """LLM sometimes returns a list directly instead of {tickets: [...]}."""
        import json

        data = [self._valid_ticket() for _ in range(3)]
        result = parse_tickets(json.dumps(data))
        assert len(result.tickets) == 3

    def test_wrong_count_2_tickets(self):
        import json

        data = {"tickets": [self._valid_ticket() for _ in range(2)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_wrong_count_4_tickets(self):
        import json

        data = {"tickets": [self._valid_ticket() for _ in range(4)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_invalid_prioridad_enum(self):
        import json

        data = {"tickets": [self._valid_ticket(prioridad="urgente") for _ in range(3)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_invalid_dificultad_enum(self):
        import json

        data = {"tickets": [self._valid_ticket(dificultad="imposible") for _ in range(3)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_tiempo_below_minimum(self):
        import json

        data = {"tickets": [self._valid_ticket(tiempo_estimado_minutos=5) for _ in range(3)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_tiempo_above_maximum(self):
        import json

        data = {"tickets": [self._valid_ticket(tiempo_estimado_minutos=999) for _ in range(3)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_titulo_too_long(self):
        import json

        data = {"tickets": [self._valid_ticket(titulo="x" * 121) for _ in range(3)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_missing_field(self):
        import json

        ticket = self._valid_ticket()
        del ticket["descripcion"]
        data = {"tickets": [ticket for _ in range(3)]}
        with pytest.raises(ValueError, match="schema"):
            parse_tickets(json.dumps(data))

    def test_empty_response(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            parse_tickets("")


# =============================================================================
# Tech_Lead parser tests
# =============================================================================


class TestTechLeadParser:
    """Tests for the Tech_Lead response parser."""

    def test_valid_2_questions(self):
        import json

        data = {"preguntas": ["¿Por qué usaste X?", "¿Qué pasa si Y?"]}
        result = parse_tech_lead(json.dumps(data))
        assert len(result.preguntas) == 2

    def test_valid_3_questions(self):
        import json

        data = {"preguntas": ["Q1", "Q2", "Q3"]}
        result = parse_tech_lead(json.dumps(data))
        assert len(result.preguntas) == 3

    def test_valid_list_without_wrapper(self):
        import json

        data = ["Pregunta 1", "Pregunta 2"]
        result = parse_tech_lead(json.dumps(data))
        assert len(result.preguntas) == 2

    def test_too_few_questions_1(self):
        import json

        data = {"preguntas": ["Solo una"]}
        with pytest.raises(ValueError, match="schema"):
            parse_tech_lead(json.dumps(data))

    def test_too_many_questions_4(self):
        import json

        data = {"preguntas": ["Q1", "Q2", "Q3", "Q4"]}
        with pytest.raises(ValueError, match="schema"):
            parse_tech_lead(json.dumps(data))

    def test_empty_list(self):
        import json

        data = {"preguntas": []}
        with pytest.raises(ValueError, match="schema"):
            parse_tech_lead(json.dumps(data))

    def test_not_json(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            parse_tech_lead("Acá van las preguntas que se me ocurren...")

    def test_empty_response(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            parse_tech_lead("")


# =============================================================================
# Evaluator parser tests
# =============================================================================


class TestEvaluatorParser:
    """Tests for the Evaluator response parser."""

    def test_valid_approved(self):
        import json

        data = {"feedback": "Excelente comprensión del problema.", "aprobado": True}
        result = parse_evaluator(json.dumps(data))
        assert result.aprobado is True
        assert "Excelente" in result.feedback

    def test_valid_rejected(self):
        import json

        data = {"feedback": "Las respuestas son vagas.", "aprobado": False}
        result = parse_evaluator(json.dumps(data))
        assert result.aprobado is False

    def test_missing_feedback(self):
        import json

        data = {"aprobado": True}
        with pytest.raises(ValueError, match="schema"):
            parse_evaluator(json.dumps(data))

    def test_missing_aprobado(self):
        import json

        data = {"feedback": "Todo bien"}
        with pytest.raises(ValueError, match="schema"):
            parse_evaluator(json.dumps(data))

    def test_aprobado_not_boolean(self):
        import json

        data = {"feedback": "Ok", "aprobado": "si"}
        with pytest.raises(ValueError, match="schema"):
            parse_evaluator(json.dumps(data))

    def test_feedback_too_long(self):
        import json

        data = {"feedback": "x" * 3001, "aprobado": True}
        with pytest.raises(ValueError, match="schema"):
            parse_evaluator(json.dumps(data))

    def test_empty_response(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            parse_evaluator("")

    def test_not_json(self):
        with pytest.raises(ValueError, match="not valid JSON"):
            parse_evaluator("El desarrollador demostró buen conocimiento...")

    def test_with_markdown_fences(self):
        raw = '```json\n{"feedback": "Bien hecho", "aprobado": true}\n```'
        result = parse_evaluator(raw)
        assert result.aprobado is True
