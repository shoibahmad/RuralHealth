"""Tests for screening creation, validation and role scoping."""
import pytest
from django.urls import reverse

from api.models import Patient, Recommendation, Screening

pytestmark = pytest.mark.django_db


def screening_payload(patient, **overrides):
    payload = {
        'patient_id': patient.id,
        'height_cm': 170,
        'weight_kg': 68,
        'systolic_bp': 118,
        'diastolic_bp': 76,
        'heart_rate': 72,
        'smoking_status': 'Never',
        'physical_activity': 'Moderate',
    }
    payload.update(overrides)
    return payload


class TestCreateScreening:
    def test_scores_a_healthy_screening_as_low_risk(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'), screening_payload(patient), format='json'
        )

        assert response.status_code == 201
        assert response.data['risk_level'] == 'Low'
        assert response.data['risk_score'] == 0
        assert response.data['risk_notes'] == 'No significant risk factors detected.'

    def test_scores_a_dangerous_screening_as_high_risk(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(
                patient,
                systolic_bp=190,
                diastolic_bp=110,
                glucose_level=230,
                smoking_status='Current',
            ),
            format='json',
        )

        assert response.status_code == 201
        assert response.data['risk_level'] == 'High'
        assert response.data['risk_score'] == 95

    def test_persists_the_full_lab_panel(self, auth_client, health_worker, patient):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(
                patient,
                hemoglobin=13.4,
                creatinine=1.1,
                sodium=139,
                alt_sgpt=32,
                total_bilirubin=0.8,
            ),
            format='json',
        )

        assert response.status_code == 201

        saved = Screening.objects.get(id=response.data['id'])
        assert saved.hemoglobin == 13.4
        assert saved.creatinine == 1.1
        assert saved.sodium == 139
        assert saved.alt_sgpt == 32
        assert saved.total_bilirubin == 0.8

    def test_generates_recommendations_for_each_risk_factor(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(patient, systolic_bp=150, smoking_status='Current'),
            format='json',
        )

        recommendations = Recommendation.objects.filter(
            screening_id=response.data['id']
        )
        titles = set(recommendations.values_list('title', flat=True))

        assert 'Blood Pressure Management' in titles
        assert 'Smoking Cessation' in titles

    def test_high_risk_screening_adds_a_follow_up_recommendation(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(patient, systolic_bp=190, glucose_level=230),
            format='json',
        )

        assert Recommendation.objects.filter(
            screening_id=response.data['id'], category='followup'
        ).exists()

    def test_succeeds_without_ai_insights_when_gemini_is_unconfigured(
        self, auth_client, health_worker, patient
    ):
        # The no_gemini_key fixture clears the API key for the whole suite.
        response = auth_client(health_worker).post(
            reverse('screenings'), screening_payload(patient), format='json'
        )

        assert response.status_code == 201
        assert Screening.objects.get(id=response.data['id']).ai_insights is None

    def test_rejects_an_unknown_patient(self, auth_client, health_worker):
        response = auth_client(health_worker).post(
            reverse('screenings'), {'patient_id': 9999}, format='json'
        )

        assert response.status_code == 400
        assert 'patient_id' in response.data

    def test_requires_authentication(self, api_client, patient):
        response = api_client.post(
            reverse('screenings'), screening_payload(patient), format='json'
        )

        assert response.status_code == 401


class TestScreeningValidation:
    @pytest.mark.parametrize(
        'field, value',
        [
            ('systolic_bp', 500),
            ('systolic_bp', 10),
            ('diastolic_bp', 400),
            ('heart_rate', 0),
            ('heart_rate', 900),
            ('height_cm', 5),
            ('height_cm', 400),
            ('weight_kg', 900),
        ],
    )
    def test_rejects_out_of_range_vitals(
        self, auth_client, health_worker, patient, field, value
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(patient, **{field: value}),
            format='json',
        )

        assert response.status_code == 400
        assert field in response.data
        assert not Screening.objects.exists()

    @pytest.mark.parametrize(
        'field, value',
        [
            ('glucose_level', 99999),
            ('hemoglobin', 500),
            ('sodium', 5),
            ('potassium', 200),
            ('creatinine', 0.001),
        ],
    )
    def test_rejects_out_of_range_labs(
        self, auth_client, health_worker, patient, field, value
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(patient, **{field: value}),
            format='json',
        )

        assert response.status_code == 400
        assert field in response.data

    def test_rejects_diastolic_at_or_above_systolic(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(patient, systolic_bp=120, diastolic_bp=130),
            format='json',
        )

        assert response.status_code == 400
        assert 'diastolic_bp' in response.data

    def test_rejects_an_unknown_smoking_status(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(patient, smoking_status='Sometimes'),
            format='json',
        )

        assert response.status_code == 400
        assert 'smoking_status' in response.data

    def test_rejects_a_non_numeric_vital(self, auth_client, health_worker, patient):
        response = auth_client(health_worker).post(
            reverse('screenings'),
            screening_payload(patient, systolic_bp='high'),
            format='json',
        )

        assert response.status_code == 400

    def test_accepts_a_screening_with_only_a_patient_id(
        self, auth_client, health_worker, patient
    ):
        response = auth_client(health_worker).post(
            reverse('screenings'), {'patient_id': patient.id}, format='json'
        )

        assert response.status_code == 201
        assert response.data['risk_level'] == 'Low'


class TestListScreenings:
    def test_health_worker_sees_only_screenings_for_their_patients(
        self, auth_client, health_worker, patient, other_patient
    ):
        Screening.objects.create(patient=patient, risk_level='Low', risk_score=0)
        Screening.objects.create(patient=other_patient, risk_level='High', risk_score=70)

        response = auth_client(health_worker).get(reverse('screenings'))

        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['patient_name'] == patient.full_name

    def test_officer_sees_every_screening(
        self, auth_client, health_officer, patient, other_patient
    ):
        Screening.objects.create(patient=patient, risk_level='Low', risk_score=0)
        Screening.objects.create(patient=other_patient, risk_level='High', risk_score=70)

        response = auth_client(health_officer).get(reverse('screenings'))

        assert len(response.data) == 2

    def test_filters_by_patient_and_risk(
        self, auth_client, health_officer, patient, other_patient
    ):
        Screening.objects.create(patient=patient, risk_level='Low', risk_score=0)
        Screening.objects.create(patient=patient, risk_level='High', risk_score=70)
        Screening.objects.create(patient=other_patient, risk_level='High', risk_score=80)

        client = auth_client(health_officer)
        by_patient = client.get(reverse('screenings'), {'patient_id': patient.id})
        by_risk = client.get(reverse('screenings'), {'risk': 'High'})

        assert len(by_patient.data) == 2
        assert len(by_risk.data) == 2


class TestPatientSelfScreening:
    @pytest.fixture
    def patient_profile(self, patient_user):
        return Patient.objects.create(
            user=patient_user,
            full_name='Self Screener',
            age=30,
            gender='Other',
            village='Selfville',
        )

    def test_patient_can_screen_themselves(
        self, auth_client, patient_user, patient_profile
    ):
        response = auth_client(patient_user).post(
            reverse('patient_self_screening'),
            {'systolic_bp': 150, 'diastolic_bp': 95, 'smoking_status': 'Current'},
            format='json',
        )

        assert response.status_code == 201
        assert response.data['risk_level'] == 'Medium'
        assert response.data['risk_score'] == 40

        saved = Screening.objects.get(id=response.data['id'])
        assert saved.patient == patient_profile

    def test_patient_cannot_file_a_screening_against_someone_else(
        self, auth_client, patient_user, patient_profile, patient
    ):
        response = auth_client(patient_user).post(
            reverse('patient_self_screening'),
            {'patient_id': patient.id, 'systolic_bp': 120},
            format='json',
        )

        assert response.status_code == 201
        # The spoofed patient_id is discarded in favour of the caller's own.
        assert Screening.objects.get(id=response.data['id']).patient == patient_profile
        assert not Screening.objects.filter(patient=patient).exists()

    def test_self_screening_is_validated_like_any_other(
        self, auth_client, patient_user, patient_profile
    ):
        response = auth_client(patient_user).post(
            reverse('patient_self_screening'), {'systolic_bp': 900}, format='json'
        )

        assert response.status_code == 400

    def test_returns_404_before_the_profile_is_set_up(
        self, auth_client, patient_user
    ):
        response = auth_client(patient_user).post(
            reverse('patient_self_screening'), {'systolic_bp': 120}, format='json'
        )

        assert response.status_code == 404

    def test_a_health_worker_cannot_use_the_patient_portal(
        self, auth_client, health_worker
    ):
        response = auth_client(health_worker).post(
            reverse('patient_self_screening'), {'systolic_bp': 120}, format='json'
        )

        assert response.status_code == 403
