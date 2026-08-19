"""Tests for patient listing, creation, scoping and history."""

import pytest
from django.urls import reverse

from api.models import Appointment, Patient, Screening

pytestmark = pytest.mark.django_db


def valid_patient_payload(**overrides):
    payload = {
        'full_name': 'Anita Sharma',
        'age': 41,
        'gender': 'Female',
        'village': 'Basantpur',
        'phone': '9876500011',
    }
    payload.update(overrides)
    return payload


class TestListPatients:
    def test_health_worker_sees_only_their_own_patients(
        self, auth_client, health_worker, patient, other_patient
    ):
        response = auth_client(health_worker).get(reverse('patients'))

        assert response.status_code == 200
        names = [row['full_name'] for row in response.data]
        assert names == [patient.full_name]

    def test_health_officer_sees_every_patient(
        self, auth_client, health_officer, patient, other_patient
    ):
        response = auth_client(health_officer).get(reverse('patients'))

        assert response.status_code == 200
        assert len(response.data) == 2

    def test_search_matches_name_village_or_phone(
        self, auth_client, health_officer, patient, other_patient
    ):
        client = auth_client(health_officer)

        by_name = client.get(reverse('patients'), {'search': 'Ramesh'})
        by_village = client.get(reverse('patients'), {'search': 'Rampur'})
        by_phone = client.get(reverse('patients'), {'search': '9876543210'})

        assert [r['full_name'] for r in by_name.data] == ['Ramesh Kumar']
        assert [r['full_name'] for r in by_village.data] == ['Sunita Devi']
        assert [r['full_name'] for r in by_phone.data] == ['Ramesh Kumar']

    def test_village_filter_is_case_insensitive(self, auth_client, health_officer, patient):
        response = auth_client(health_officer).get(reverse('patients'), {'village': 'chandpur'})

        assert [r['full_name'] for r in response.data] == ['Ramesh Kumar']

    def test_risk_filter_returns_patients_with_a_matching_screening(
        self, auth_client, health_officer, patient, other_patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=70)

        response = auth_client(health_officer).get(reverse('patients'), {'risk': 'High'})

        assert [r['full_name'] for r in response.data] == ['Ramesh Kumar']

    def test_a_worker_cannot_use_the_worker_filter_to_reach_other_caseloads(
        self, auth_client, health_worker, other_worker, other_patient
    ):
        response = auth_client(health_worker).get(
            reverse('patients'), {'health_worker_id': other_worker.id}
        )

        assert response.status_code == 200
        assert response.data == []

    def test_requires_authentication(self, api_client):
        assert api_client.get(reverse('patients')).status_code == 401


class TestCreatePatient:
    def test_creates_a_patient_owned_by_the_caller(self, auth_client, health_worker):
        response = auth_client(health_worker).post(
            reverse('patients'), valid_patient_payload(), format='json'
        )

        assert response.status_code == 201
        assert response.data['full_name'] == 'Anita Sharma'
        assert response.data['screening_count'] == 0
        assert response.data['latest_risk_level'] is None

        created = Patient.objects.get(full_name='Anita Sharma')
        assert created.health_worker == health_worker

    def test_trims_surrounding_whitespace_from_the_name(self, auth_client, health_worker):
        response = auth_client(health_worker).post(
            reverse('patients'),
            valid_patient_payload(full_name='  Anita Sharma  '),
            format='json',
        )

        assert response.status_code == 201
        assert response.data['full_name'] == 'Anita Sharma'

    def test_rejects_a_blank_name(self, auth_client, health_worker):
        response = auth_client(health_worker).post(
            reverse('patients'), valid_patient_payload(full_name='   '), format='json'
        )

        assert response.status_code == 400
        assert not Patient.objects.filter(village='Basantpur').exists()

    @pytest.mark.parametrize('age', [-1, 131, 500])
    def test_rejects_an_implausible_age(self, auth_client, health_worker, age):
        response = auth_client(health_worker).post(
            reverse('patients'), valid_patient_payload(age=age), format='json'
        )

        assert response.status_code == 400
        assert 'age' in response.data

    def test_rejects_an_unknown_gender(self, auth_client, health_worker):
        response = auth_client(health_worker).post(
            reverse('patients'), valid_patient_payload(gender='Unknown'), format='json'
        )

        assert response.status_code == 400

    @pytest.mark.parametrize('phone', ['abc', '12', 'drop table patients'])
    def test_rejects_a_malformed_phone_number(self, auth_client, health_worker, phone):
        response = auth_client(health_worker).post(
            reverse('patients'), valid_patient_payload(phone=phone), format='json'
        )

        assert response.status_code == 400
        assert 'phone' in response.data

    def test_accepts_an_international_phone_number(self, auth_client, health_worker):
        response = auth_client(health_worker).post(
            reverse('patients'),
            valid_patient_payload(phone='+91 98765-43210'),
            format='json',
        )

        assert response.status_code == 201

    def test_phone_is_optional(self, auth_client, health_worker):
        payload = valid_patient_payload()
        del payload['phone']

        response = auth_client(health_worker).post(reverse('patients'), payload, format='json')

        assert response.status_code == 201


class TestPatientDetail:
    def test_returns_nested_screenings_and_appointments(self, auth_client, health_worker, patient):
        Screening.objects.create(patient=patient, risk_level='Low', risk_score=5)

        response = auth_client(health_worker).get(reverse('patient_detail', args=[patient.id]))

        assert response.status_code == 200
        assert response.data['full_name'] == patient.full_name
        assert len(response.data['screenings']) == 1
        assert response.data['appointments'] == []

    def test_delete_removes_the_patient_and_confirms_by_name(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).delete(reverse('patient_detail', args=[patient.id]))

        assert response.status_code == 200
        assert patient.full_name in response.data['detail']
        assert not Patient.objects.filter(id=patient.id).exists()

    def test_missing_patient_returns_404(self, auth_client, health_worker):
        response = auth_client(health_worker).get(reverse('patient_detail', args=[9999]))

        assert response.status_code == 404


class TestPatientHistory:
    def test_returns_the_full_timeline_for_an_owned_patient(
        self, auth_client, health_worker, patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=65)
        Screening.objects.create(patient=patient, risk_level='Low', risk_score=5)
        Appointment.objects.create(
            patient=patient,
            health_worker=health_worker,
            scheduled_date='2030-01-01T09:00:00Z',
            reason='Follow-up',
        )

        response = auth_client(health_worker).get(reverse('patient_history', args=[patient.id]))

        assert response.status_code == 200
        assert response.data['total_screenings'] == 2
        assert response.data['latest_screening'] is not None
        assert len(response.data['appointments']) == 1

    def test_latest_screening_is_null_when_there_are_none(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).get(reverse('patient_history', args=[patient.id]))

        assert response.data['total_screenings'] == 0
        assert response.data['latest_screening'] is None

    def test_a_worker_cannot_read_another_workers_patient(
        self, auth_client, health_worker, other_patient
    ):
        response = auth_client(health_worker).get(
            reverse('patient_history', args=[other_patient.id])
        )

        assert response.status_code == 403

    def test_an_officer_can_read_any_patient(self, auth_client, health_officer, other_patient):
        response = auth_client(health_officer).get(
            reverse('patient_history', args=[other_patient.id])
        )

        assert response.status_code == 200

    def test_missing_patient_returns_404(self, auth_client, health_worker):
        response = auth_client(health_worker).get(reverse('patient_history', args=[9999]))

        assert response.status_code == 404
