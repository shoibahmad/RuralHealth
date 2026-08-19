"""Tests for registration, login and account management endpoints."""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse

from .conftest import TEST_PASSWORD

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestRegister:
    def test_creates_a_health_worker_by_default(self, api_client):
        response = api_client.post(
            reverse('register'),
            {
                'email': 'new.worker@example.com',
                'full_name': 'New Worker',
                'password': 'sup3rsecret',
            },
            format='json',
        )

        assert response.status_code == 201
        assert response.data['email'] == 'new.worker@example.com'
        assert response.data['role'] == 'health_worker'
        assert 'password' not in response.data

        user = User.objects.get(email='new.worker@example.com')
        assert user.check_password('sup3rsecret')
        # Email doubles as the username for this auth model.
        assert user.username == 'new.worker@example.com'

    def test_honours_an_explicit_role(self, api_client):
        response = api_client.post(
            reverse('register'),
            {
                'email': 'officer2@example.com',
                'password': 'sup3rsecret',
                'role': 'health_officer',
            },
            format='json',
        )

        assert response.status_code == 201
        assert response.data['role'] == 'health_officer'

    def test_rejects_an_unknown_role(self, api_client):
        response = api_client.post(
            reverse('register'),
            {
                'email': 'hacker@example.com',
                'password': 'sup3rsecret',
                'role': 'superuser',
            },
            format='json',
        )

        assert response.status_code == 400
        assert not User.objects.filter(email='hacker@example.com').exists()

    def test_rejects_a_duplicate_email(self, api_client, health_worker):
        response = api_client.post(
            reverse('register'),
            {'email': health_worker.email, 'password': 'sup3rsecret'},
            format='json',
        )

        assert response.status_code == 400
        assert response.data['detail'] == 'Email already registered'

    def test_rejects_a_duplicate_email_differing_only_in_case(self, api_client, health_worker):
        response = api_client.post(
            reverse('register'),
            {'email': health_worker.email.upper(), 'password': 'sup3rsecret'},
            format='json',
        )

        assert response.status_code == 400
        assert User.objects.filter(email__iexact=health_worker.email).count() == 1

    def test_rejects_a_malformed_email(self, api_client):
        response = api_client.post(
            reverse('register'),
            {'email': 'not-an-email', 'password': 'sup3rsecret'},
            format='json',
        )

        assert response.status_code == 400

    def test_rejects_a_short_password(self, api_client):
        response = api_client.post(
            reverse('register'),
            {'email': 'short@example.com', 'password': 'abc'},
            format='json',
        )

        assert response.status_code == 400
        assert not User.objects.filter(email='short@example.com').exists()


class TestLogin:
    def test_returns_a_bearer_token_for_valid_credentials(self, api_client, health_worker):
        response = api_client.post(
            reverse('login'),
            {'email': health_worker.email, 'password': TEST_PASSWORD},
            format='json',
        )

        assert response.status_code == 200
        assert response.data['token_type'] == 'bearer'
        assert response.data['access_token']

    def test_accepts_the_email_under_the_oauth_username_field(self, api_client, health_worker):
        response = api_client.post(
            reverse('login'),
            {'username': health_worker.email, 'password': TEST_PASSWORD},
            format='json',
        )

        assert response.status_code == 200
        assert response.data['access_token']

    def test_token_carries_the_role_claim(self, api_client, health_officer):
        from rest_framework_simplejwt.tokens import AccessToken

        response = api_client.post(
            reverse('login'),
            {'email': health_officer.email, 'password': TEST_PASSWORD},
            format='json',
        )

        token = AccessToken(response.data['access_token'])
        assert token['role'] == 'health_officer'
        assert token['email'] == health_officer.email

    def test_rejects_a_wrong_password(self, api_client, health_worker):
        response = api_client.post(
            reverse('login'),
            {'email': health_worker.email, 'password': 'wrong-password'},
            format='json',
        )

        assert response.status_code == 401
        assert response.data['detail'] == 'Incorrect email or password'

    def test_rejects_an_unknown_email(self, api_client):
        response = api_client.post(
            reverse('login'),
            {'email': 'nobody@example.com', 'password': TEST_PASSWORD},
            format='json',
        )

        assert response.status_code == 401

    def test_rejects_a_deactivated_account(self, api_client, health_worker):
        health_worker.is_active = False
        health_worker.save()

        response = api_client.post(
            reverse('login'),
            {'email': health_worker.email, 'password': TEST_PASSWORD},
            format='json',
        )

        assert response.status_code == 401

    def test_requires_both_fields(self, api_client, health_worker):
        response = api_client.post(reverse('login'), {'email': health_worker.email}, format='json')

        assert response.status_code == 400
        assert response.data['detail'] == 'Email and password are required'


class TestCurrentUser:
    def test_returns_the_signed_in_user(self, auth_client, health_worker):
        response = auth_client(health_worker).get(reverse('current_user'))

        assert response.status_code == 200
        assert response.data['email'] == health_worker.email
        assert response.data['role'] == 'health_worker'

    def test_requires_authentication(self, api_client):
        assert api_client.get(reverse('current_user')).status_code == 401


class TestUpdateProfile:
    def test_updates_the_full_name(self, auth_client, health_worker):
        response = auth_client(health_worker).patch(
            reverse('update_profile'), {'full_name': 'Renamed Worker'}, format='json'
        )

        assert response.status_code == 200
        health_worker.refresh_from_db()
        assert health_worker.full_name == 'Renamed Worker'

    def test_changing_email_reissues_a_token_and_syncs_the_username(
        self, auth_client, health_worker
    ):
        response = auth_client(health_worker).patch(
            reverse('update_profile'),
            {'email': 'renamed@example.com'},
            format='json',
        )

        assert response.status_code == 200
        assert response.data['new_token']

        health_worker.refresh_from_db()
        assert health_worker.email == 'renamed@example.com'
        assert health_worker.username == 'renamed@example.com'

    def test_rejects_an_email_taken_by_another_user(
        self, auth_client, health_worker, health_officer
    ):
        response = auth_client(health_worker).patch(
            reverse('update_profile'), {'email': health_officer.email}, format='json'
        )

        assert response.status_code == 400
        assert response.data['detail'] == 'Email already in use'

    def test_requires_authentication(self, api_client):
        response = api_client.patch(reverse('update_profile'), {'full_name': 'x'}, format='json')
        assert response.status_code == 401


class TestChangePassword:
    def test_changes_the_password(self, auth_client, health_worker):
        response = auth_client(health_worker).patch(
            reverse('change_password'),
            {'current_password': TEST_PASSWORD, 'new_password': 'brand-new-pass'},
            format='json',
        )

        assert response.status_code == 200
        health_worker.refresh_from_db()
        assert health_worker.check_password('brand-new-pass')

    def test_rejects_a_wrong_current_password(self, auth_client, health_worker):
        response = auth_client(health_worker).patch(
            reverse('change_password'),
            {'current_password': 'not-it', 'new_password': 'brand-new-pass'},
            format='json',
        )

        assert response.status_code == 400
        assert response.data['detail'] == 'Current password is incorrect'
        health_worker.refresh_from_db()
        assert health_worker.check_password(TEST_PASSWORD)

    def test_rejects_a_short_new_password(self, auth_client, health_worker):
        response = auth_client(health_worker).patch(
            reverse('change_password'),
            {'current_password': TEST_PASSWORD, 'new_password': 'abc'},
            format='json',
        )

        assert response.status_code == 400
        health_worker.refresh_from_db()
        assert health_worker.check_password(TEST_PASSWORD)

    def test_requires_both_fields(self, auth_client, health_worker):
        response = auth_client(health_worker).patch(
            reverse('change_password'), {'new_password': 'brand-new-pass'}, format='json'
        )

        assert response.status_code == 400
