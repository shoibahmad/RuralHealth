import time
import logging
import json

logger = logging.getLogger(__name__)

class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        # Process the request
        response = request.get_response(request)
        
        duration = time.time() - start_time
        
        # Color codes for terminal output
        # Green for success, Red for error, Yellow for redirect/other
        if response.status_code >= 500:
            color = "\033[91m" # Red
        elif response.status_code >= 400:
            color = "\033[93m" # Yellow
        else:
            color = "\033[92m" # Green
        
        reset = "\033[0m"
        
        # Format: [METHOD] PATH - STATUS - DURATION
        log_message = f"{color}[{request.method}] {request.get_full_path()} - {response.status_code} - {duration:.4f}s{reset}"
        
        print(log_message)
        
        return response
