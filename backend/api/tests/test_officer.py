"""Tests for health-officer oversight endpoints and their access control."""
import pytest
from django.urls import reverse

from api.models import Patient, Screening

pytestmark = pytest.mark.django_db

OFFICER_ONLY_ROUTES = [
    'health_workers',
    'officer_dashboard',
    'all_patients',
    'system_analytics',
]


class TestOfficerAccessControl:
    @pytest.mark.parametrize('route', OFFICER_ONLY_ROUTES)
    def test_health_workers_are_refused(self, auth_client, health_worker, route):
        assert auth_client(health_worker).get(reverse(route)).status_code == 403

    @pytest.mark.parametrize('route', OFFICER_ONLY_ROUTES)
    def test_patients_are_refused(self, auth_client, patient_user, route):
        assert auth_client(patient_user).get(reverse(route)).status_code == 403

    @pytest.mark.parametrize('route', OFFICER_ONLY_ROUTES)
    def test_anonymous_callers_are_refused(self, api_client, route):
        assert api_client.get(reverse(route)).status_code == 401

    @pytest.mark.parametrize('route', OFFICER_ONLY_ROUTES)
    def test_officers_are_allowed(self, auth_client, health_officer, route):
        assert auth_client(health_officer).get(reverse(route)).status_code == 200


class TestHealthWorkerList:
    def test_reports_caseload_stats_per_worker(
        self, auth_client, health_officer, health_worker, patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=70)
        Screening.objects.create(patient=patient, risk_level='Low', risk_score=5)

        response = auth_client(health_officer).get(reverse('health_workers'))

        assert response.status_code == 200
        worker = next(w for w in response.data if w['id'] == health_worker.id)
        assert worker['stats'] == {
            'total_patients': 1,
            'total_screenings': 2,
            'high_risk_patients': 1,
        }

    def test_only_lists_health_workers(
        self, auth_client, health_officer, health_worker, patient_user
    ):
        response = auth_client(health_officer).get(reverse('health_workers'))

        emails = {w['email'] for w in response.data}
        assert health_worker.email in emails
        assert patient_user.email not in emails
        assert health_officer.email not in emails


class TestHealthWorkerDetail:
    def test_returns_stats_and_a_patient_sample(
        self, auth_client, health_officer, health_worker, patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=80)

        response = auth_client(health_officer).get(
            reverse('health_worker_detail', args=[health_worker.id])
        )

        assert response.status_code == 200
        assert response.data['worker']['email'] == health_worker.email
        assert response.data['stats']['total_patients'] == 1
        assert response.data['stats']['average_risk_score'] == 80.0
        assert response.data['stats']['risk_distribution']['High'] == 1
        assert len(response.data['patients']) == 1

    def test_average_risk_is_zero_without_screenings(
        self, auth_client, health_officer, health_worker
    ):
        response = auth_client(health_officer).get(
            reverse('health_worker_detail', args=[health_worker.id])
        )

        assert response.data['stats']['average_risk_score'] == 0

    def test_unknown_worker_returns_404(self, auth_client, health_officer):
        response = auth_client(health_officer).get(
            reverse('health_worker_detail', args=[9999])
        )

        assert response.status_code == 404

    def test_an_officer_id_is_not_a_valid_worker_id(
        self, auth_client, health_officer
    ):
        response = auth_client(health_officer).get(
            reverse('health_worker_detail', args=[health_officer.id])
        )

        assert response.status_code == 404


class TestAllPatients:
    @pytest.fixture
    def many_patients(self, health_worker):
        return [
            Patient.objects.create(
                full_name=f'Patient {index:02d}',
                age=30 + index,
                gender='Other',
                village='Bulkville',
                health_worker=health_worker,
            )
            for index in range(25)
        ]

    def test_paginates_with_a_default_page_size_of_twenty(
        self, auth_client, health_officer, many_patients
    ):
        response = auth_client(health_officer).get(reverse('all_patients'))

        assert response.data['total'] == 25
        assert response.data['page'] == 1
        assert response.data['page_size'] == 20
        assert len(response.data['results']) == 20

    def test_returns_the_remainder_on_the_second_page(
        self, auth_client, health_officer, many_patients
    ):
        response = auth_client(health_officer).get(reverse('all_patients'), {'page': 2})

        assert len(response.data['results']) == 5

    def test_caps_an_oversized_page_size(
        self, auth_client, health_officer, many_patients
    ):
        response = auth_client(health_officer).get(
            reverse('all_patients'), {'page_size': 10000}
        )

        assert response.data['page_size'] == 100

    def test_rejects_a_non_numeric_page(self, auth_client, health_officer):
        response = auth_client(health_officer).get(
            reverse('all_patients'), {'page': 'first'}
        )

        assert response.status_code == 400

    def test_applies_the_search_filter(
        self, auth_client, health_officer, patient, other_patient
    ):
        response = auth_client(health_officer).get(
            reverse('all_patients'), {'search': 'Sunita'}
        )

        assert response.data['total'] == 1
        assert response.data['results'][0]['full_name'] == 'Sunita Devi'


class TestUpdateWorkerStatus:
    def test_deactivates_a_worker(self, auth_client, health_officer, health_worker):
        response = auth_client(health_officer).patch(
            reverse('update_worker', args=[health_worker.id]),
            {'is_active': False},
            format='json',
        )

        assert response.status_code == 200
        health_worker.refresh_from_db()
        assert health_worker.is_active is False

    def test_renames_a_worker(self, auth_client, health_officer, health_worker):
        response = auth_client(health_officer).patch(
            reverse('update_worker', args=[health_worker.id]),
            {'full_name': 'Renamed Worker'},
            format='json',
        )

        assert response.data['full_name'] == 'Renamed Worker'

    def test_unknown_worker_returns_404(self, auth_client, health_officer):
        response = auth_client(health_officer).patch(
            reverse('update_worker', args=[9999]), {'is_active': False}, format='json'
        )

        assert response.status_code == 404

    def test_a_worker_cannot_reactivate_themselves(
        self, auth_client, health_worker
    ):
        response = auth_client(health_worker).patch(
            reverse('update_worker', args=[health_worker.id]),
            {'is_active': True},
            format='json',
        )

        assert response.status_code == 403


class TestUpdatePatient:
    def test_updates_patient_demographics(
        self, auth_client, health_officer, patient
    ):
        response = auth_client(health_officer).patch(
            reverse('update_patient', args=[patient.id]),
            {'village': 'New Village', 'age': 53},
            format='json',
        )

        assert response.status_code == 200
        patient.refresh_from_db()
        assert patient.village == 'New Village'
        assert patient.age == 53

    def test_reassigns_the_patient_to_another_worker(
        self, auth_client, health_officer, patient, other_worker
    ):
        response = auth_client(health_officer).patch(
            reverse('update_patient', args=[patient.id]),
            {'health_worker_id': other_worker.id},
            format='json',
        )

        assert response.status_code == 200
        patient.refresh_from_db()
        assert patient.health_worker == other_worker

    def test_rejects_reassignment_to_a_non_worker(
        self, auth_client, health_officer, patient
    ):
        response = auth_client(health_officer).patch(
            reverse('update_patient', args=[patient.id]),
            {'health_worker_id': health_officer.id},
            format='json',
        )

        assert response.status_code == 400
        patient.refresh_from_db()
        assert patient.health_worker != health_officer

    def test_rejects_an_out_of_range_age(self, auth_client, health_officer, patient):
        response = auth_client(health_officer).patch(
            reverse('update_patient', args=[patient.id]), {'age': 999}, format='json'
        )

        assert response.status_code == 400

    def test_unknown_patient_returns_404(self, auth_client, health_officer):
        response = auth_client(health_officer).patch(
            reverse('update_patient', args=[9999]), {'age': 40}, format='json'
        )

        assert response.status_code == 404


class TestSystemAnalytics:
    def test_reports_prevalence_percentages(
        self, auth_client, health_officer, patient
    ):
        Screening.objects.create(
            patient=patient, systolic_bp=160, risk_level='High', risk_score=25
        )
        Screening.objects.create(
            patient=patient, systolic_bp=110, risk_level='Low', risk_score=0
        )

        response = auth_client(health_officer).get(reverse('system_analytics'))

        assert response.status_code == 200
        assert response.data['risk_factor_prevalence']['High Blood Pressure'] == 50.0

    def test_prevalence_is_empty_when_there_are_no_screenings(
        self, auth_client, health_officer
    ):
        response = auth_client(health_officer).get(reverse('system_analytics'))

        assert response.data['risk_factor_prevalence'] == {}

    def test_worker_performance_skips_workers_without_patients(
        self, auth_client, health_officer, health_worker, other_worker, patient
    ):
        response = auth_client(health_officer).get(reverse('system_analytics'))

        names = [row['worker_name'] for row in response.data['worker_performance']]
        assert health_worker.full_name in names
        assert other_worker.full_name not in names


class TestOfficerDashboard:
    def test_summarises_the_whole_system(
        self, auth_client, health_officer, health_worker, patient, other_patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=70)

        response = auth_client(health_officer).get(reverse('officer_dashboard'))

        assert response.status_code == 200
        assert response.data['overview']['total_patients'] == 2
        assert response.data['overview']['total_screenings'] == 1
        assert response.data['overview']['high_risk_count'] == 1
        assert response.data['risk_distribution']['High'] == 1
        assert len(response.data['monthly_trend']) == 6
        assert len(response.data['recent_high_risk']) == 1

    def test_top_workers_excludes_those_without_screenings(
        self, auth_client, health_officer, other_worker, other_patient
    ):
        response = auth_client(health_officer).get(reverse('officer_dashboard'))

        assert response.data['top_workers'] == []
