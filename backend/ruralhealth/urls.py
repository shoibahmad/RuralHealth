"""
URL configuration for RuralHealthAI project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import JsonResponse, FileResponse
from django.views.static import serve
import os

def health_check(request):
    """Health check endpoint."""
    return JsonResponse({"status": "healthy"})

# Serve index.html for SPA routing
def serve_frontend(request, path=''):
    """Serve the React frontend for SPA routing."""
    static_dir = settings.BASE_DIR / 'static'
    
    if path:
        # Check if the requested file exists
        file_path = static_dir / path
        if file_path.is_file():
            return FileResponse(open(file_path, 'rb'))
    
    # Fallback to index.html for SPA routing
    index_path = static_dir / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'))
    
    return JsonResponse({"message": "Welcome to RuralHealthAI API"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health', health_check),
    path('health/', health_check),
]

# Serve frontend if static directory exists
if (settings.BASE_DIR / 'static').exists():
    # Serve assets
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, {
            'document_root': settings.BASE_DIR / 'static' / 'assets'
        }),
    ]
    # Catch-all for SPA routing
    urlpatterns += [
        re_path(r'^(?P<path>.*)$', serve_frontend),
    ]
