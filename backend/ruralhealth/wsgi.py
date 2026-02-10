"""
WSGI config for RuralHealthAI project.
"""

import os

from django.core.wsgi import get_wsgi_application

def load_env():
    """Load environment variables from .env file."""
    try:
        import pathlib
        env_path = pathlib.Path(__file__).resolve().parent.parent / '.env'
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ.setdefault(key.strip(), value.strip())
    except Exception:
        pass

load_env()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ruralhealth.settings')

application = get_wsgi_application()
