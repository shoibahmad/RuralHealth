"""Tests for the patient-facing portal endpoints."""
from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from api.models import Appointment, Patient, Recommendation, Screening

pytestmark = pytest.mark.django_db

PORTAL_ROUTES = [
    'patient_dashboard',
    'patient_screening_history',
    'patient_profile_setup',
]


@pytest.fixture
def patient_profile(patient_user):
    return Patient.objects.create(
        user=patient_user,
        full_name='Self Screener',
        age=30,
        gender='Other',
        village='Selfville',
    )


class TestPortalAccessControl:
    @pytest.mark.parametrize('route', PORTAL_ROUTES)
    def test_health_workers_are_refused(self, auth_client, health_worker, route):
        assert auth_client(health_worker).get(reverse(route)).status_code == 403

    @pytest.mark.parametrize('route', PORTAL_ROUTES)
    def test_officers_are_refused(self, auth_client, health_officer, route):
        assert auth_client(health_officer).get(reverse(route)).status_code == 403

    @pytest.mark.parametrize('route', PORTAL_ROUTES)
    def test_anonymous_callers_are_refused(self, api_client, route):
        assert api_client.get(reverse(route)).status_code == 401


class TestPatientDashboard:
    def test_returns_the_patients_own_summary(
        self, auth_client, patient_user, patient_profile, health_worker
    ):
        Screening.objects.create(
            patient=patient_profile, risk_level='Medium', risk_score=35
        )
        Appointment.objects.create(
            patient=patient_profile,
            health_worker=health_worker,
            scheduled_date=timezone.now() + timedelta(days=4),
            reason='Recheck',
        )
        Recommendation.objects.create(
            patient=patient_profile,
            category='diet',
            title='Cut salt',
            description='x',
        )

        response = auth_client(patient_user).get(reverse('patient_dashboard'))

        assert response.status_code == 200
        assert response.data['patient']['full_name'] == 'Self Screener'
        assert response.data['total_screenings'] == 1
        assert response.data['latest_screening']['risk_level'] == 'Medium'
        assert len(response.data['upcoming_appointments']) == 1
        assert len(response.data['active_recommendations']) == 1

    def test_hides_completed_recommendations(
        self, auth_client, patient_user, patient_profile
    ):
        Recommendation.objects.create(
            patient=patient_profile,
            category='diet',
            title='Done',
            description='x',
            is_completed=True,
        )

        response = auth_client(patient_user).get(reverse('patient_dashboard'))

        assert response.data['active_recommendations'] == []

    def test_latest_screening_is_null_before_any_screening(
        self, auth_client, patient_user, patient_profile
    ):
        response = auth_client(patient_user).get(reverse('patient_dashboard'))

        assert response.data['total_screenings'] == 0
        assert response.data['latest_screening'] is None

    def test_does_not_leak_another_patients_data(
        self, auth_client, patient_user, patient_profile, patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=80)

        response = auth_client(patient_user).get(reverse('patient_dashboard'))

        assert response.data['total_screenings'] == 0

    def test_returns_404_before_the_profile_exists(self, auth_client, patient_user):
        response = auth_client(patient_user).get(reverse('patient_dashboard'))

        assert response.status_code == 404
        assert 'complete your profile' in response.data['detail']


class TestPatientScreeningHistory:
    def test_returns_the_patients_own_records(
        self, auth_client, patient_user, patient_profile
    ):
        Screening.objects.create(patient=patient_profile, risk_level='Low', risk_score=0)
        Screening.objects.create(
            patient=patient_profile, risk_level='High', risk_score=70
        )

        response = auth_client(patient_user).get(
            reverse('patient_screening_history')
        )

        assert response.status_code == 200
        assert len(response.data['screenings']) == 2
        assert response.data['appointments'] == []

    def test_returns_404_before_the_profile_exists(self, auth_client, patient_user):
        response = auth_client(patient_user).get(reverse('patient_screening_history'))

        assert response.status_code == 404


class TestPatientProfileSetup:
    def test_creates_a_profile_linked_to_the_caller(self, auth_client, patient_user):
        response = auth_client(patient_user).post(
            reverse('patient_profile_setup'),
            {
                'full_name': 'New Patient',
                'age': 27,
                'gender': 'Female',
                'village': 'Newville',
            },
            format='json',
        )

        assert response.status_code == 200

        created = Patient.objects.get(full_name='New Patient')
        # Regression: the profile used to be created without a user link, which
        # left the patient permanently unable to reach their own dashboard.
        assert created.user == patient_user

    def test_the_new_profile_is_immediately_readable(
        self, auth_client, patient_user
    ):
        client = auth_client(patient_user)
        client.post(
            reverse('patient_profile_setup'),
            {
                'full_name': 'New Patient',
                'age': 27,
                'gender': 'Female',
                'village': 'Newville',
            },
            format='json',
        )

        response = client.get(reverse('patient_dashboard'))

        assert response.status_code == 200
        assert response.data['patient']['full_name'] == 'New Patient'

    def test_updates_an_existing_profile_in_place(
        self, auth_client, patient_user, patient_profile
    ):
        response = auth_client(patient_user).post(
            reverse('patient_profile_setup'), {'village': 'Moved Town'}, format='json'
        )

        assert response.status_code == 200
        patient_profile.refresh_from_db()
        assert patient_profile.village == 'Moved Town'
        assert Patient.objects.filter(user=patient_user).count() == 1

    def test_validates_the_submitted_profile(self, auth_client, patient_user):
        response = auth_client(patient_user).post(
            reverse('patient_profile_setup'),
            {'full_name': 'New Patient', 'age': 900, 'gender': 'Female',
             'village': 'Newville'},
            format='json',
        )

        assert response.status_code == 400
        assert not Patient.objects.filter(user=patient_user).exists()

    def test_get_returns_the_existing_profile(
        self, auth_client, patient_user, patient_profile
    ):
        response = auth_client(patient_user).get(reverse('patient_profile_setup'))

        assert response.status_code == 200
        assert response.data['full_name'] == 'Self Screener'

    def test_get_returns_404_before_the_profile_exists(
        self, auth_client, patient_user
    ):
        assert auth_client(patient_user).get(
            reverse('patient_profile_setup')
        ).status_code == 404
