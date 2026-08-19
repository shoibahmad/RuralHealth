"""Tests for the Gemini service wrapper's parsing and degradation behaviour."""

import pytest

from api import ai_service
from api.ai_service import (
    AIServiceUnavailable,
    analyze_health_data,
    extract_screening_data_from_file,
    extract_vitals_from_text,
    generate_health_recommendations,
    get_model,
    is_configured,
    parse_json_payload,
)


class FakeResponse:
    def __init__(self, text):
        self.text = text


class TestParseJsonPayload:
    def test_parses_a_bare_object(self):
        assert parse_json_payload('{"summary": "ok"}') == {'summary': 'ok'}

    def test_extracts_an_object_wrapped_in_prose(self):
        text = 'Here is the analysis:\n{"risk": "High"}\nHope that helps!'
        assert parse_json_payload(text) == {'risk': 'High'}

    def test_extracts_an_object_from_a_markdown_fence(self):
        text = '```json\n{"risk": "Low"}\n```'
        assert parse_json_payload(text) == {'risk': 'Low'}

    def test_parses_an_array_when_asked_for_one(self):
        text = 'Recommendations: [{"title": "Walk daily"}]'
        assert parse_json_payload(text, expect='array') == [{'title': 'Walk daily'}]

    def test_returns_none_when_there_is_no_json(self):
        assert parse_json_payload('I could not analyse that.') is None

    def test_returns_none_for_malformed_json(self):
        assert parse_json_payload('{"unterminated": ') is None

    @pytest.mark.parametrize('text', ['', None])
    def test_returns_none_for_empty_input(self, text):
        assert parse_json_payload(text) is None

    def test_an_array_is_not_returned_when_an_object_is_expected(self):
        assert parse_json_payload('[1, 2, 3]', expect='object') is None


class TestConfiguration:
    def test_is_configured_reflects_the_environment(self, monkeypatch):
        monkeypatch.delenv('GEMINI_API_KEY', raising=False)
        assert is_configured() is False

        monkeypatch.setenv('GEMINI_API_KEY', 'test-key')
        assert is_configured() is True

    def test_get_model_raises_a_clear_error_without_a_key(self, monkeypatch):
        monkeypatch.delenv('GEMINI_API_KEY', raising=False)

        with pytest.raises(AIServiceUnavailable, match='GEMINI_API_KEY'):
            get_model()

    def test_importing_the_module_without_a_key_does_not_raise(self, monkeypatch):
        """Regression: the module used to raise at import time and break setup."""
        monkeypatch.delenv('GEMINI_API_KEY', raising=False)

        import importlib

        importlib.reload(ai_service)
        assert ai_service.is_configured() is False


class TestAnalyzeHealthData:
    def test_returns_the_parsed_analysis(self, monkeypatch):
        monkeypatch.setattr(
            ai_service,
            'try_generate_content',
            lambda prompt: FakeResponse(
                '{"summary": "Stable", "formatted_insights": "**Overview**"}'
            ),
        )

        result = analyze_health_data({'age': 40})

        assert result['success'] is True
        assert result['analysis']['summary'] == 'Stable'

    def test_synthesises_formatted_insights_when_the_model_omits_them(self, monkeypatch):
        monkeypatch.setattr(
            ai_service,
            'try_generate_content',
            lambda prompt: FakeResponse('{"summary": "Stable"}'),
        )

        result = analyze_health_data({'age': 40})

        assert 'Stable' in result['analysis']['formatted_insights']

    def test_reports_failure_when_the_response_is_unparseable(self, monkeypatch):
        monkeypatch.setattr(
            ai_service,
            'try_generate_content',
            lambda prompt: FakeResponse('the model refused'),
        )

        result = analyze_health_data({'age': 40})

        assert result['success'] is False
        assert result['analysis'] is None
        assert result['error'] == 'Failed to parse AI response'

    def test_degrades_gracefully_without_an_api_key(self, monkeypatch):
        monkeypatch.delenv('GEMINI_API_KEY', raising=False)

        result = analyze_health_data({'age': 40})

        assert result['success'] is False
        assert 'GEMINI_API_KEY' in result['error']

    def test_reports_failure_when_the_model_raises(self, monkeypatch):
        def boom(prompt):
            raise RuntimeError('upstream exploded')

        monkeypatch.setattr(ai_service, 'try_generate_content', boom)

        result = analyze_health_data({'age': 40})

        assert result['success'] is False
        assert result['error'] == 'upstream exploded'


class TestGenerateHealthRecommendations:
    def test_returns_the_parsed_array(self, monkeypatch):
        monkeypatch.setattr(
            ai_service,
            'try_generate_content',
            lambda prompt: FakeResponse('[{"title": "Walk daily"}]'),
        )

        assert generate_health_recommendations({}, {}) == [{'title': 'Walk daily'}]

    def test_falls_back_to_generic_advice_without_an_api_key(self, monkeypatch):
        monkeypatch.delenv('GEMINI_API_KEY', raising=False)

        recommendations = generate_health_recommendations({}, {})

        assert len(recommendations) == 1
        assert recommendations[0]['title'] == 'Regular Health Monitoring'

    def test_falls_back_when_the_response_is_unparseable(self, monkeypatch):
        monkeypatch.setattr(ai_service, 'try_generate_content', lambda prompt: FakeResponse('nope'))

        assert generate_health_recommendations({}, {})[0]['title'] == ('Regular Health Monitoring')


class TestExtractors:
    def test_missing_file_is_reported_before_any_api_call(self, tmp_path):
        result = extract_screening_data_from_file(str(tmp_path / 'nope.pdf'))

        assert result['success'] is False
        assert 'File not found' in result['error']

    def test_text_extraction_degrades_without_an_api_key(self, monkeypatch):
        monkeypatch.delenv('GEMINI_API_KEY', raising=False)

        result = extract_vitals_from_text('BP is 120 over 80')

        assert result['success'] is False
        assert 'GEMINI_API_KEY' in result['error']

    def test_text_extraction_returns_parsed_vitals(self, monkeypatch):
        monkeypatch.setattr(
            ai_service,
            'try_generate_content',
            lambda prompt: FakeResponse('{"systolic_bp": 120, "diastolic_bp": 80}'),
        )

        result = extract_vitals_from_text('BP is 120 over 80')

        assert result['success'] is True
        assert result['data']['systolic_bp'] == 120

    def test_text_extraction_reports_an_unparseable_response(self, monkeypatch):
        monkeypatch.setattr(
            ai_service,
            'try_generate_content',
            lambda prompt: FakeResponse('I heard nothing useful'),
        )

        result = extract_vitals_from_text('mumble')

        assert result['success'] is False
        assert result['raw_response'] == 'I heard nothing useful'
