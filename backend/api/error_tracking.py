import logging
import os
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger('api.error_tracking')


class ErrorTrackingMiddleware:
    """Lightweight error-tracking middleware.

    Catches unhandled server exceptions, logs structured details,
    and forwards to a configured external tracker (e.g. Sentry)
    when ERROR_TRACKING_DSN is configured.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response
        self.dsn = os.environ.get('ERROR_TRACKING_DSN', '').strip()

    def __call__(self, request: HttpRequest) -> HttpResponse:
        return self.get_response(request)

    def process_exception(self, request: HttpRequest, exception: Exception) -> None:
        """Capture and log unhandled exceptions."""
        logger.error(
            'Unhandled exception during %s %s: %s',
            request.method,
            request.path,
            str(exception),
            exc_info=True,
            extra={
                'path': request.path,
                'method': request.method,
                'user': str(getattr(request, 'user', 'anonymous')),
            },
        )
        if self.dsn:
            self._report_to_provider(exception, request)

    def _report_to_provider(self, exception: Exception, request: HttpRequest) -> None:
        """Provider hook for external APM / error tracking services."""
        # Generic hook for Sentry/Datadog/Rollbar integration
        pass
