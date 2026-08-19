"""Health-officer oversight endpoints: worker management and system analytics."""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Appointment, Patient, Screening
from ..permissions import IsHealthOfficer
from ..responses import first_error_message
from ..serializers import (
    PatientSerializer,
    PatientUpdateSerializer,
    ScreeningSerializer,
    WorkerStatusUpdateSerializer,
)
from .analytics import age_distribution, month_bounds, month_starts, risk_distribution
from .patients import filter_patients

User = get_user_model()

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def worker_stats(worker) -> dict:
    """Caseload counters for a single health worker."""
    screenings = Screening.objects.filter(patient__health_worker=worker)
    return {
        'total_patients': Patient.objects.filter(health_worker=worker).count(),
        'total_screenings': screenings.count(),
        'high_risk_patients': screenings.filter(risk_level='High').count(),
    }


def serialize_worker(worker) -> dict:
    """Public representation of a health worker account."""
    return {
        'id': worker.id,
        'email': worker.email,
        'full_name': worker.full_name,
        'is_active': worker.is_active,
        'date_joined': worker.date_joined,
    }


class HealthWorkerListView(APIView):
    """List all health workers with their caseload statistics."""

    permission_classes = [IsHealthOfficer]

    def get(self, request):
        workers = User.objects.filter(role='health_worker').order_by('-date_joined')

        return Response(
            [
                {**serialize_worker(worker), 'stats': worker_stats(worker)}
                for worker in workers
            ]
        )


class HealthWorkerDetailView(APIView):
    """Get detailed information about a specific health worker."""

    permission_classes = [IsHealthOfficer]

    def get(self, request, pk):
        try:
            worker = User.objects.get(id=pk, role='health_worker')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Health worker not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        patients = Patient.objects.filter(health_worker=worker).order_by('-created_at')
        screenings = Screening.objects.filter(patient__health_worker=worker)

        week_ago = timezone.now() - timedelta(days=7)
        average_risk = screenings.aggregate(avg=Avg('risk_score'))['avg'] or 0

        return Response(
            {
                'worker': serialize_worker(worker),
                'stats': {
                    'total_patients': patients.count(),
                    'total_screenings': screenings.count(),
                    'risk_distribution': risk_distribution(screenings),
                    'recent_screenings_7d': screenings.filter(
                        created_at__gte=week_ago
                    ).count(),
                    'average_risk_score': round(average_risk, 2),
                },
                'patients': PatientSerializer(patients[:10], many=True).data,
            }
        )


class OfficerDashboardStatsView(APIView):
    """Get comprehensive, system-wide dashboard statistics."""

    permission_classes = [IsHealthOfficer]

    def get(self, request):
        screenings = Screening.objects.all()

        def distinct_patients_at(level):
            return screenings.filter(risk_level=level).values('patient').distinct().count()

        monthly_trend = []
        for month_start in month_starts(6):
            start, end = month_bounds(month_start)
            monthly_trend.append(
                {
                    'month': month_start.strftime('%b %Y'),
                    'screenings': screenings.filter(
                        created_at__date__gte=start, created_at__date__lte=end
                    ).count(),
                    'patients': Patient.objects.filter(
                        created_at__date__gte=start, created_at__date__lte=end
                    ).count(),
                }
            )

        village_stats = (
            Patient.objects.values('village')
            .annotate(patient_count=Count('id'))
            .order_by('-patient_count')[:10]
        )

        # Rank active workers by screening volume, dropping those with none.
        top_workers = sorted(
            (
                {
                    'id': worker.id,
                    'name': worker.full_name or worker.email,
                    'screenings': count,
                }
                for worker, count in (
                    (
                        worker,
                        Screening.objects.filter(patient__health_worker=worker).count(),
                    )
                    for worker in User.objects.filter(
                        role='health_worker', is_active=True
                    )
                )
                if count > 0
            ),
            key=lambda row: row['screenings'],
            reverse=True,
        )[:10]

        high_risk_cases = (
            screenings.filter(risk_level='High')
            .select_related('patient')
            .order_by('-created_at')[:10]
        )

        return Response(
            {
                'overview': {
                    'total_patients': Patient.objects.count(),
                    'total_screenings': screenings.count(),
                    'total_workers': User.objects.filter(role='health_worker').count(),
                    'active_workers': User.objects.filter(
                        role='health_worker', is_active=True
                    ).count(),
                    'high_risk_count': distinct_patients_at('High'),
                    'pending_appointments': Appointment.objects.filter(
                        status='scheduled', scheduled_date__gte=timezone.now()
                    ).count(),
                },
                'risk_distribution': {
                    'Low': distinct_patients_at('Low'),
                    'Medium': distinct_patients_at('Medium'),
                    'High': distinct_patients_at('High'),
                },
                'monthly_trend': monthly_trend,
                'village_stats': list(village_stats),
                'top_workers': top_workers,
                'recent_high_risk': ScreeningSerializer(
                    high_risk_cases, many=True
                ).data,
            }
        )


class AllPatientsView(APIView):
    """Get all patients across all health workers, paginated."""

    permission_classes = [IsHealthOfficer]

    def get(self, request):
        patients = filter_patients(
            Patient.objects.all().order_by('-created_at'), request.query_params
        )

        try:
            page = max(1, int(request.query_params.get('page', 1)))
            page_size = int(request.query_params.get('page_size', DEFAULT_PAGE_SIZE))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'page and page_size must be integers'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page_size = min(max(1, page_size), MAX_PAGE_SIZE)
        start = (page - 1) * page_size

        return Response(
            {
                'total': patients.count(),
                'page': page,
                'page_size': page_size,
                'results': PatientSerializer(
                    patients[start:start + page_size], many=True
                ).data,
            }
        )


class SystemAnalyticsView(APIView):
    """Get system-wide analytics."""

    permission_classes = [IsHealthOfficer]

    def get(self, request):
        screenings = Screening.objects.all()
        total_screenings = screenings.count()

        risk_factors = {
            'High Blood Pressure': screenings.filter(systolic_bp__gt=140).count(),
            'High Glucose': screenings.filter(glucose_level__gt=140).count(),
            'High Cholesterol': screenings.filter(cholesterol_level__gt=200).count(),
            'Current Smoker': screenings.filter(smoking_status='Current').count(),
        }

        risk_factor_percentages = {
            factor: round((count / total_screenings) * 100, 1)
            for factor, count in risk_factors.items()
        } if total_screenings else {}

        worker_completion = []
        for worker in User.objects.filter(role='health_worker'):
            patient_count = Patient.objects.filter(health_worker=worker).count()
            if not patient_count:
                continue
            screening_count = Screening.objects.filter(
                patient__health_worker=worker
            ).count()
            worker_completion.append(
                {
                    'worker_name': worker.full_name or worker.email,
                    'patients': patient_count,
                    'screenings': screening_count,
                    'completion_rate': round(
                        (screening_count / patient_count) * 100, 1
                    ),
                }
            )

        geographic_data = (
            Patient.objects.values('village')
            .annotate(
                total=Count('id'),
                high_risk=Count('id', filter=Q(screenings__risk_level='High')),
            )
            .order_by('-total')
        )

        return Response(
            {
                'age_distribution': age_distribution(Patient.objects.all()),
                'gender_distribution': list(
                    Patient.objects.values('gender').annotate(count=Count('id'))
                ),
                'risk_factor_prevalence': risk_factor_percentages,
                'worker_performance': worker_completion,
                'geographic_distribution': list(geographic_data),
            }
        )


class UpdateWorkerStatusView(APIView):
    """Activate, deactivate or rename a health worker."""

    permission_classes = [IsHealthOfficer]

    def patch(self, request, pk):
        try:
            worker = User.objects.get(id=pk, role='health_worker')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Health worker not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = WorkerStatusUpdateSerializer(
            worker, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(
                {'detail': first_error_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        worker = serializer.save()

        return Response(
            {
                'id': worker.id,
                'email': worker.email,
                'full_name': worker.full_name,
                'is_active': worker.is_active,
                'role': worker.role,
            }
        )


class UpdatePatientView(APIView):
    """Update patient details, including reassignment to another health worker."""

    permission_classes = [IsHealthOfficer]

    def patch(self, request, pk):
        try:
            patient = Patient.objects.get(id=pk)
        except Patient.DoesNotExist:
            return Response(
                {'detail': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = PatientUpdateSerializer(patient, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {'detail': first_error_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient = serializer.save()
        return Response(PatientSerializer(patient).data)
