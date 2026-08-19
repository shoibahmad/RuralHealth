"""Tests for dashboard statistics, analytics helpers and appointments."""

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from api.models import Appointment, Recommendation, Screening
from api.views.analytics import month_bounds, month_starts

pytestmark = pytest.mark.django_db


class TestMonthHelpers:
    def test_month_starts_returns_consecutive_first_of_month_dates(self):
        months = month_starts(6)

        assert len(months) == 6
        assert all(day.day == 1 for day in months)
        assert months == sorted(months)

    def test_month_starts_does_not_repeat_a_month(self):
        """Regression: 30-day arithmetic used to skip or repeat short months."""
        months = month_starts(12)

        assert len(set(months)) == 12

    def test_month_bounds_covers_a_31_day_month(self):
        from datetime import date

        start, end = month_bounds(date(2026, 1, 1))

        assert start == date(2026, 1, 1)
        assert end == date(2026, 1, 31)

    def test_month_bounds_covers_february_in_a_leap_year(self):
        from datetime import date

        start, end = month_bounds(date(2028, 2, 1))

        assert end == date(2028, 2, 29)


class TestDashboardStats:
    def test_scopes_counts_to_the_workers_own_caseload(
        self, auth_client, health_worker, patient, other_patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=70)
        Screening.objects.create(patient=other_patient, risk_level='High', risk_score=70)

        response = auth_client(health_worker).get(reverse('dashboard_stats'))

        assert response.status_code == 200
        assert response.data['total_patients'] == 1
        assert response.data['total_screenings'] == 1
        assert response.data['high_risk_count'] == 1

    def test_officer_sees_system_wide_counts(
        self, auth_client, health_officer, patient, other_patient
    ):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=70)
        Screening.objects.create(patient=other_patient, risk_level='Low', risk_score=0)

        response = auth_client(health_officer).get(reverse('dashboard_stats'))

        assert response.data['total_patients'] == 2
        assert response.data['total_screenings'] == 2

    def test_risk_distribution_always_reports_all_three_bands(
        self, auth_client, health_worker, patient
    ):
        Screening.objects.create(patient=patient, risk_level='Low', risk_score=0)

        response = auth_client(health_worker).get(reverse('dashboard_stats'))

        assert response.data['risk_distribution'] == {'Low': 1, 'Medium': 0, 'High': 0}

    def test_weekly_trend_covers_seven_days(self, auth_client, health_worker, patient):
        Screening.objects.create(patient=patient, risk_level='High', risk_score=70)

        response = auth_client(health_worker).get(reverse('dashboard_stats'))

        weekly = response.data['weekly_screenings']
        assert len(weekly) == 7
        assert weekly[-1]['screenings'] == 1
        assert weekly[-1]['highRisk'] == 1

    def test_pending_appointments_ignores_past_and_cancelled_ones(
        self, auth_client, health_worker, patient
    ):
        now = timezone.now()
        Appointment.objects.create(
            patient=patient,
            health_worker=health_worker,
            scheduled_date=now + timedelta(days=3),
            reason='Upcoming',
        )
        Appointment.objects.create(
            patient=patient,
            health_worker=health_worker,
            scheduled_date=now - timedelta(days=3),
            reason='Past',
        )
        Appointment.objects.create(
            patient=patient,
            health_worker=health_worker,
            scheduled_date=now + timedelta(days=5),
            reason='Cancelled',
            status='cancelled',
        )

        response = auth_client(health_worker).get(reverse('dashboard_stats'))

        assert response.data['pending_appointments'] == 1

    def test_requires_authentication(self, api_client):
        assert api_client.get(reverse('dashboard_stats')).status_code == 401


class TestAnalytics:
    def test_buckets_patients_by_age(self, auth_client, health_officer, patient):
        response = auth_client(health_officer).get(reverse('analytics'))

        assert response.status_code == 200
        # The shared patient fixture is 52 years old.
        assert response.data['age_distribution']['51-65'] == 1
        assert response.data['age_distribution']['0-18'] == 0

    def test_monthly_trend_covers_six_months(self, auth_client, health_officer):
        response = auth_client(health_officer).get(reverse('analytics'))

        assert len(response.data['monthly_trend']) == 6

    def test_smoking_count_is_scoped_to_the_caller(
        self, auth_client, health_worker, patient, other_patient
    ):
        """Regression: the smoking tally used to ignore the caller's scope."""
        Screening.objects.create(
            patient=patient, smoking_status='Current', risk_level='Medium', risk_score=15
        )
        Screening.objects.create(
            patient=other_patient,
            smoking_status='Current',
            risk_level='Medium',
            risk_score=15,
        )

        response = auth_client(health_worker).get(reverse('analytics'))

        assert response.data['risk_factor_counts']['Smoking'] == 1


class TestAppointments:
    def test_creates_an_appointment_owned_by_the_caller(self, auth_client, health_worker, patient):
        response = auth_client(health_worker).post(
            reverse('appointments'),
            {
                'patient': patient.id,
                'scheduled_date': (timezone.now() + timedelta(days=2)).isoformat(),
                'reason': 'Blood pressure recheck',
            },
            format='json',
        )

        assert response.status_code == 201
        assert response.data['patient_name'] == patient.full_name
        assert Appointment.objects.get(id=response.data['id']).health_worker == (health_worker)

    def test_rejects_a_blank_reason(self, auth_client, health_worker, patient):
        response = auth_client(health_worker).post(
            reverse('appointments'),
            {
                'patient': patient.id,
                'scheduled_date': (timezone.now() + timedelta(days=2)).isoformat(),
                'reason': '   ',
            },
            format='json',
        )

        assert response.status_code == 400

    def test_worker_only_lists_their_own_appointments(
        self, auth_client, health_worker, other_worker, patient, other_patient
    ):
        scheduled = timezone.now() + timedelta(days=1)
        Appointment.objects.create(
            patient=patient,
            health_worker=health_worker,
            scheduled_date=scheduled,
            reason='Mine',
        )
        Appointment.objects.create(
            patient=other_patient,
            health_worker=other_worker,
            scheduled_date=scheduled,
            reason='Theirs',
        )

        response = auth_client(health_worker).get(reverse('appointments'))

        assert [a['reason'] for a in response.data] == ['Mine']

    def test_upcoming_filter_excludes_past_appointments(self, auth_client, health_worker, patient):
        now = timezone.now()
        Appointment.objects.create(
            patient=patient,
            health_worker=health_worker,
            scheduled_date=now + timedelta(days=1),
            reason='Future',
        )
        Appointment.objects.create(
            patient=patient,
            health_worker=health_worker,
            scheduled_date=now - timedelta(days=1),
            reason='Past',
        )

        response = auth_client(health_worker).get(reverse('appointments'), {'upcoming': 'true'})

        assert [a['reason'] for a in response.data] == ['Future']


class TestRecommendations:
    def test_worker_only_sees_recommendations_for_their_patients(
        self, auth_client, health_worker, patient, other_patient
    ):
        Recommendation.objects.create(
            patient=patient, category='diet', title='Mine', description='x'
        )
        Recommendation.objects.create(
            patient=other_patient, category='diet', title='Theirs', description='x'
        )

        response = auth_client(health_worker).get(reverse('recommendations'))

        assert [r['title'] for r in response.data] == ['Mine']

    def test_incomplete_filter_hides_completed_recommendations(
        self, auth_client, health_worker, patient
    ):
        Recommendation.objects.create(
            patient=patient, category='diet', title='Open', description='x'
        )
        Recommendation.objects.create(
            patient=patient,
            category='diet',
            title='Done',
            description='x',
            is_completed=True,
        )

        response = auth_client(health_worker).get(
            reverse('recommendations'), {'incomplete': 'true'}
        )

        assert [r['title'] for r in response.data] == ['Open']

    def test_can_be_marked_completed(self, auth_client, health_worker, patient):
        recommendation = Recommendation.objects.create(
            patient=patient, category='diet', title='Open', description='x'
        )

        response = auth_client(health_worker).patch(
            reverse('recommendation_detail', args=[recommendation.id]),
            {'is_completed': True},
            format='json',
        )

        assert response.status_code == 200
        recommendation.refresh_from_db()
        assert recommendation.is_completed is True
