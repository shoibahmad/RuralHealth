"""Shared analytics helpers plus the health-worker dashboard endpoints."""

from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Appointment, Patient, Screening
from ..serializers import ScreeningSerializer

EMPTY_RISK_DISTRIBUTION = {'Low': 0, 'Medium': 0, 'High': 0}


def risk_distribution(screenings) -> dict:
    """Count screenings per risk band, always returning all three keys."""
    distribution = dict(EMPTY_RISK_DISTRIBUTION)
    for row in screenings.values('risk_level').annotate(count=Count('id')):
        if row['risk_level'] in distribution:
            distribution[row['risk_level']] = row['count']
    return distribution


def age_distribution(patients) -> dict:
    """Bucket patients into the reporting age bands."""
    return {
        '0-18': patients.filter(age__lte=18).count(),
        '19-35': patients.filter(age__gte=19, age__lte=35).count(),
        '36-50': patients.filter(age__gte=36, age__lte=50).count(),
        '51-65': patients.filter(age__gte=51, age__lte=65).count(),
        '65+': patients.filter(age__gt=65).count(),
    }


def month_starts(count: int):
    """
    Yield the first day of each of the last ``count`` months, oldest first.

    Walking back one month at a time avoids the drift that fixed 30-day
    arithmetic introduces across months of different lengths.
    """
    cursor = timezone.now().date().replace(day=1)
    months = []
    for _ in range(count):
        months.append(cursor)
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    return list(reversed(months))


def month_bounds(month_start):
    """Return the inclusive (start, end) dates covering ``month_start``'s month."""
    next_month = (month_start + timedelta(days=32)).replace(day=1)
    return month_start, next_month - timedelta(days=1)


def monthly_screening_trend(screenings, months: int = 6) -> list:
    """Screening counts per month over the trailing ``months`` window."""
    trend = []
    for month_start in month_starts(months):
        start, end = month_bounds(month_start)
        trend.append(
            {
                'month': month_start.strftime('%b'),
                'count': screenings.filter(
                    created_at__date__gte=start, created_at__date__lte=end
                ).count(),
            }
        )
    return trend


def weekly_screening_trend(screenings, days: int = 7) -> list:
    """Screening and high-risk counts for each of the last ``days`` days."""
    today = timezone.now().date()
    trend = []
    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        trend.append(
            {
                'name': day.strftime('%a'),
                'date': day.isoformat(),
                'screenings': screenings.filter(created_at__date=day).count(),
                'highRisk': screenings.filter(created_at__date=day, risk_level='High').count(),
            }
        )
    return trend


def scope_for(user):
    """
    Return the (patients, screenings, appointments) querysets visible to ``user``.

    Health workers are scoped to their own caseload; every other role sees the
    whole dataset.
    """
    if user.role == 'health_worker':
        patients = Patient.objects.filter(health_worker=user)
        screenings = Screening.objects.filter(patient__health_worker=user)
        appointments = Appointment.objects.filter(health_worker=user)
    else:
        patients = Patient.objects.all()
        screenings = Screening.objects.all()
        appointments = Appointment.objects.all()
    return patients, screenings, appointments


class DashboardStatsView(APIView):
    """Get dashboard statistics for the signed-in user's scope."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients, screenings, appointments = scope_for(request.user)

        pending_appointments = appointments.filter(
            status='scheduled', scheduled_date__gte=timezone.now()
        ).count()

        recent_screenings = screenings.select_related('patient').order_by('-created_at')[:10]

        return Response(
            {
                'total_patients': patients.count(),
                'total_screenings': screenings.count(),
                'high_risk_count': screenings.filter(risk_level='High')
                .values('patient')
                .distinct()
                .count(),
                'pending_appointments': pending_appointments,
                'risk_distribution': risk_distribution(screenings),
                'weekly_screenings': weekly_screening_trend(screenings),
                'recent_screenings': ScreeningSerializer(recent_screenings, many=True).data,
            }
        )


class AnalyticsView(APIView):
    """Get detailed analytics for the signed-in user's scope."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients, screenings, _ = scope_for(request.user)

        village_stats = (
            patients.values('village')
            .annotate(patient_count=Count('id'))
            .order_by('-patient_count')[:10]
        )

        return Response(
            {
                'village_stats': list(village_stats),
                'age_distribution': age_distribution(patients),
                'gender_distribution': list(patients.values('gender').annotate(count=Count('id'))),
                'monthly_trend': monthly_screening_trend(screenings),
                'risk_factor_counts': {
                    'High BP': screenings.filter(systolic_bp__gt=140).count(),
                    'High Glucose': screenings.filter(glucose_level__gt=140).count(),
                    'High Cholesterol': screenings.filter(cholesterol_level__gt=200).count(),
                    'Smoking': screenings.filter(smoking_status='Current').count(),
                },
            }
        )
