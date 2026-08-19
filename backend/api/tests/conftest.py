import os
import uuid

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ruralhealth.settings')
django.setup()

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from api.models import Patient

User = get_user_model()

# Generated per run so no credential-shaped literal is ever committed; secret
# scanners flag those even in test fixtures. Must satisfy the serializer's
# minimum length and Django's password validators.
TEST_PASSWORD = f'pw-{uuid.uuid4().hex}'


@pytest.fixture(autouse=True)
def no_gemini_key(monkeypatch):
    """
    Keep every test off the real Gemini API.

    ai_service reads GEMINI_API_KEY at call time, so clearing it makes the AI
    paths take their documented "unavailable" branch instead of making a
    network call.
    """
    monkeypatch.delenv('GEMINI_API_KEY', raising=False)


@pytest.fixture(autouse=True)
def fast_password_hashing(settings):
    """
    Swap in a cheap password hasher for the suite.

    Most tests create users, and Django's default PBKDF2 hasher dominates the
    runtime when they do.
    """
    settings.PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']


@pytest.fixture
def api_client():
    return APIClient()


def make_user(email, role, **extra):
    return User.objects.create_user(
        username=email,
        email=email,
        password=TEST_PASSWORD,
        full_name=extra.pop('full_name', email.split('@')[0].title()),
        role=role,
        **extra,
    )


@pytest.fixture
def health_worker(db):
    return make_user('worker@example.com', 'health_worker')


@pytest.fixture
def other_worker(db):
    return make_user('other.worker@example.com', 'health_worker')


@pytest.fixture
def health_officer(db):
    return make_user('officer@example.com', 'health_officer')


@pytest.fixture
def patient_user(db):
    return make_user('patient@example.com', 'patient')


@pytest.fixture
def patient(db, health_worker):
    return Patient.objects.create(
        full_name='Ramesh Kumar',
        age=52,
        gender='Male',
        village='Chandpur',
        phone='9876543210',
        health_worker=health_worker,
    )


@pytest.fixture
def other_patient(db, other_worker):
    return Patient.objects.create(
        full_name='Sunita Devi',
        age=34,
        gender='Female',
        village='Rampur',
        health_worker=other_worker,
    )


@pytest.fixture
def auth_client(api_client):
    """Return a factory that authenticates the shared client as a given user."""

    def _authenticate(user):
        api_client.force_authenticate(user=user)
        return api_client

    return _authenticate
