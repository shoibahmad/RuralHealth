"""Gemini-backed extraction and analysis endpoints."""
import contextlib
import logging
import os
import tempfile

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

# Uploads are streamed straight to Gemini, so cap them before spending an API
# call on something that is obviously not a report or a dictation.
MAX_UPLOAD_BYTES = 20 * 1024 * 1024

ALLOWED_AUDIO_SUFFIXES = {'.webm', '.mp3', '.wav', '.m4a', '.ogg'}
ALLOWED_DOCUMENT_SUFFIXES = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.pdf'}


def validate_upload(uploaded_file, allowed_suffixes, default_suffix):
    """
    Check an upload's size and extension.

    Returns:
        ``(suffix, None)`` when the file is acceptable, otherwise
        ``(None, error_message)``.
    """
    if uploaded_file.size is not None and uploaded_file.size > MAX_UPLOAD_BYTES:
        limit_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
        return None, f'File is too large. Maximum size is {limit_mb} MB.'

    suffix = os.path.splitext(uploaded_file.name or '')[1].lower() or default_suffix
    if suffix not in allowed_suffixes:
        supported = ', '.join(sorted(allowed_suffixes))
        return None, f'Unsupported file type "{suffix}". Supported types: {supported}.'

    return suffix, None


@contextlib.contextmanager
def spooled_upload(uploaded_file, suffix):
    """Write an upload to a named temp file and always clean it up afterwards."""
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        yield temp_file_path
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except OSError:
                logger.warning('Could not remove temp file %s', temp_file_path)


def ai_result_response(result):
    """Translate an ai_service result dict into a DRF response."""
    if result.get('success'):
        return Response(result.get('data', {}))
    return Response(
        {'detail': result.get('error', 'AI processing failed')},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


class AIAnalysisView(APIView):
    """Get AI-powered health analysis for screening data."""

    permission_classes = [AllowAny]

    def post(self, request):
        from ..ai_service import analyze_health_data

        try:
            return Response(analyze_health_data(request.data))
        except Exception as exc:  # noqa: BLE001 - surfaced to the client
            logger.exception('AI analysis endpoint failed')
            return Response(
                {'success': False, 'error': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AIVoiceVitalsView(APIView):
    """Process a voice recording to extract vitals using AI."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response(
                {'detail': 'No audio file provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        suffix, error = validate_upload(
            audio_file, ALLOWED_AUDIO_SUFFIXES, default_suffix='.webm'
        )
        if error:
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

        from ..ai_service import extract_vitals_from_audio

        with spooled_upload(audio_file, suffix) as path:
            return ai_result_response(extract_vitals_from_audio(path))


class AILabExtractionView(APIView):
    """Process a lab report image or PDF to extract values using AI."""

    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        # The wizard posts under 'image'; the offline sync path uses 'file'.
        file_obj = request.FILES.get('image') or request.FILES.get('file')
        if not file_obj:
            return Response(
                {'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST
            )

        suffix, error = validate_upload(
            file_obj, ALLOWED_DOCUMENT_SUFFIXES, default_suffix='.jpg'
        )
        if error:
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

        from ..ai_service import extract_screening_data_from_file

        with spooled_upload(file_obj, suffix) as path:
            return ai_result_response(extract_screening_data_from_file(path))


class AITextVitalsView(APIView):
    """Process transcribed text to extract vitals using AI."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response(
                {'detail': 'No transcription text provided'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from ..ai_service import extract_vitals_from_text

        return ai_result_response(extract_vitals_from_text(text))
