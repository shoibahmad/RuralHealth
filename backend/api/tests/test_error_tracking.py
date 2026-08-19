from unittest.mock import MagicMock, patch

from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase

from api.error_tracking import ErrorTrackingMiddleware


class ErrorTrackingMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_successful_request_passes_through(self):
        get_response = MagicMock(return_value=HttpResponse('OK', status=200))
        middleware = ErrorTrackingMiddleware(get_response)

        request = self.factory.get('/health')
        response = middleware(request)

        self.assertEqual(response.status_code, 200)
        get_response.assert_called_once_with(request)

    @patch('api.error_tracking.logger')
    def test_process_exception_logs_structured_error(self, mock_logger):
        get_response = MagicMock()
        middleware = ErrorTrackingMiddleware(get_response)

        request = self.factory.get('/api/test-failure')
        exception = ValueError('Simulated database breakdown')

        middleware.process_exception(request, exception)

        mock_logger.error.assert_called_once()
        log_args = mock_logger.error.call_args
        self.assertIn('Unhandled exception', log_args[0][0])
        self.assertIn('/api/test-failure', log_args[0])

    @patch('api.error_tracking.ErrorTrackingMiddleware._report_to_provider')
    def test_reports_to_provider_when_dsn_configured(self, mock_report):
        with patch.dict('os.environ', {'ERROR_TRACKING_DSN': 'https://sentry.example.com/123'}):
            middleware = ErrorTrackingMiddleware(MagicMock())
            request = self.factory.get('/api/failure')
            exception = RuntimeError('Provider notification test')

            middleware.process_exception(request, exception)
            mock_report.assert_called_once_with(exception, request)
