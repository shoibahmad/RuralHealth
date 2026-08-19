import logging
import time

logger = logging.getLogger(__name__)


class RequestLogMiddleware:
    """Log every request as METHOD PATH - STATUS - DURATION."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time

        # Server errors are worth an ERROR record; client errors a WARNING.
        if response.status_code >= 500:
            level = logging.ERROR
        elif response.status_code >= 400:
            level = logging.WARNING
        else:
            level = logging.INFO

        logger.log(
            level,
            '%s %s - %s - %.4fs',
            request.method,
            request.get_full_path(),
            response.status_code,
            duration,
        )

        return response
