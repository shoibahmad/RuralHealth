"""
WSGI config for RuralHealthAI project.
"""

import os

from django.core.wsgi import get_wsgi_application

# settings.py loads backend/.env via python-dotenv, so no bootstrap is needed here.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ruralhealth.settings')

application = get_wsgi_application()
