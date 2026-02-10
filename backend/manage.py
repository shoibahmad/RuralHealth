#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def load_env():
    """Load environment variables from .env file."""
    try:
        import pathlib
        env_path = pathlib.Path(__file__).resolve().parent / '.env'
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ.setdefault(key.strip(), value.strip())
    except Exception:
        pass

def main():
    """Run administrative tasks."""
    load_env()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ruralhealth.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
