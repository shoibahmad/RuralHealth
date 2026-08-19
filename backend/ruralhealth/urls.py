"""
URL configuration for RuralHealthAI project.
"""
from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def health_check(request):
    """Health check endpoint."""
    return JsonResponse({"status": "healthy"})


def serve_frontend(request, path=''):
    """Serve the built React frontend, falling back to index.html for SPA routes."""
    static_dir = settings.BASE_DIR / 'static'

    if path:
        file_path = static_dir / path
        if file_path.is_file():
            return FileResponse(open(file_path, 'rb'))

    index_path = static_dir / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'))

    return JsonResponse({"message": "Welcome to RuralHealthAI API"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health', health_check),
    path('health/', health_check),
    # OpenAPI schema and browsable docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/schema/swagger-ui/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path(
        'api/schema/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),
]

# Serve the frontend bundle only when it has been built into backend/static.
if (settings.BASE_DIR / 'static').exists():
    urlpatterns += [
        re_path(
            r'^assets/(?P<path>.*)$',
            serve,
            {'document_root': settings.BASE_DIR / 'static' / 'assets'},
        ),
        # Catch-all must stay last so it does not shadow the API routes above.
        re_path(r'^(?P<path>.*)$', serve_frontend),
    ]
