"""Tests for the AI endpoints' request validation and upload handling."""
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from api.views import ai as ai_views

pytestmark = pytest.mark.django_db


def upload(name, content=b'stub-bytes', content_type='application/octet-stream'):
    return SimpleUploadedFile(name, content, content_type=content_type)


class TestValidateUpload:
    def test_accepts_a_supported_extension(self):
        suffix, error = ai_views.validate_upload(
            upload('report.PDF'), ai_views.ALLOWED_DOCUMENT_SUFFIXES, '.jpg'
        )

        assert error is None
        assert suffix == '.pdf'

    def test_falls_back_to_the_default_suffix_when_there_is_none(self):
        suffix, error = ai_views.validate_upload(
            upload('report'), ai_views.ALLOWED_DOCUMENT_SUFFIXES, '.jpg'
        )

        assert error is None
        assert suffix == '.jpg'

    def test_rejects_an_unsupported_extension(self):
        suffix, error = ai_views.validate_upload(
            upload('payload.exe'), ai_views.ALLOWED_DOCUMENT_SUFFIXES, '.jpg'
        )

        assert suffix is None
        assert 'Unsupported file type' in error

    def test_rejects_an_oversized_file(self, monkeypatch):
        monkeypatch.setattr(ai_views, 'MAX_UPLOAD_BYTES', 10)

        suffix, error = ai_views.validate_upload(
            upload('report.pdf', b'x' * 100), ai_views.ALLOWED_DOCUMENT_SUFFIXES, '.jpg'
        )

        assert suffix is None
        assert 'too large' in error


class TestSpooledUpload:
    def test_writes_the_content_then_removes_the_file(self):
        import os

        uploaded = upload('report.pdf', b'hello world')

        with ai_views.spooled_upload(uploaded, '.pdf') as path:
            assert os.path.exists(path)
            with open(path, 'rb') as handle:
                assert handle.read() == b'hello world'
            captured = path

        assert not os.path.exists(captured)

    def test_removes_the_file_even_when_the_body_raises(self):
        import os

        captured = {}

        with pytest.raises(RuntimeError):  # noqa: PT012 - the raise is the point
            with ai_views.spooled_upload(upload('report.pdf'), '.pdf') as path:
                captured['path'] = path
                raise RuntimeError('processing blew up')

        assert not os.path.exists(captured['path'])


class TestLabExtractionEndpoint:
    def test_requires_a_file(self, api_client):
        response = api_client.post(reverse('lab_extract'), {}, format='multipart')

        assert response.status_code == 400
        assert response.data['detail'] == 'No file provided'

    def test_rejects_an_unsupported_file_type(self, api_client):
        response = api_client.post(
            reverse('lab_extract'), {'image': upload('malware.exe')}, format='multipart'
        )

        assert response.status_code == 400
        assert 'Unsupported file type' in response.data['detail']

    def test_rejects_an_oversized_file(self, api_client, monkeypatch):
        monkeypatch.setattr(ai_views, 'MAX_UPLOAD_BYTES', 10)

        response = api_client.post(
            reverse('lab_extract'),
            {'image': upload('report.pdf', b'x' * 100)},
            format='multipart',
        )

        assert response.status_code == 400
        assert 'too large' in response.data['detail']

    def test_accepts_the_file_under_the_alternate_key(self, api_client, monkeypatch):
        monkeypatch.setattr(
            'api.ai_service.extract_screening_data_from_file',
            lambda path: {'success': True, 'data': {'age': 44}},
        )

        response = api_client.post(
            reverse('lab_extract'), {'file': upload('report.png')}, format='multipart'
        )

        assert response.status_code == 200
        assert response.data == {'age': 44}

    def test_surfaces_an_extraction_failure_as_detail(self, api_client, monkeypatch):
        monkeypatch.setattr(
            'api.ai_service.extract_screening_data_from_file',
            lambda path: {'success': False, 'error': 'model refused'},
        )

        response = api_client.post(
            reverse('lab_extract'), {'image': upload('report.jpg')}, format='multipart'
        )

        assert response.status_code == 500
        assert response.data['detail'] == 'model refused'


class TestVoiceVitalsEndpoint:
    def test_requires_an_audio_file(self, api_client, health_worker, auth_client):
        response = auth_client(health_worker).post(
            reverse('voice_vitals'), {}, format='multipart'
        )

        assert response.status_code == 400
        assert response.data['detail'] == 'No audio file provided'

    def test_rejects_a_non_audio_extension(self, auth_client, health_worker):
        response = auth_client(health_worker).post(
            reverse('voice_vitals'),
            {'audio': upload('notes.pdf')},
            format='multipart',
        )

        assert response.status_code == 400
        assert 'Unsupported file type' in response.data['detail']

    def test_returns_extracted_vitals(self, auth_client, health_worker, monkeypatch):
        monkeypatch.setattr(
            'api.ai_service.extract_vitals_from_audio',
            lambda path: {'success': True, 'data': {'systolic_bp': 130}},
        )

        response = auth_client(health_worker).post(
            reverse('voice_vitals'),
            {'audio': upload('dictation.webm')},
            format='multipart',
        )

        assert response.status_code == 200
        assert response.data == {'systolic_bp': 130}


class TestTextVitalsEndpoint:
    def test_requires_text(self, api_client):
        response = api_client.post(reverse('text_vitals'), {}, format='json')

        assert response.status_code == 400
        assert response.data['detail'] == 'No transcription text provided'

    def test_returns_extracted_vitals(self, api_client, monkeypatch):
        monkeypatch.setattr(
            'api.ai_service.extract_vitals_from_text',
            lambda text: {'success': True, 'data': {'heart_rate': 72}},
        )

        response = api_client.post(
            reverse('text_vitals'), {'text': 'pulse seventy two'}, format='json'
        )

        assert response.status_code == 200
        assert response.data == {'heart_rate': 72}


class TestAnalyzeEndpoint:
    def test_reports_the_unavailable_state_without_an_api_key(self, api_client):
        response = api_client.post(
            reverse('ai_analyze'), {'age': 40, 'systolic_bp': 120}, format='json'
        )

        assert response.status_code == 200
        assert response.data['success'] is False
        assert 'GEMINI_API_KEY' in response.data['error']
