"""Screening creation with risk scoring and AI enrichment."""
import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Patient, Recommendation, Screening
from ..risk import build_recommendations, calculate_risk
from ..serializers import ScreeningCreateSerializer, ScreeningSerializer

logger = logging.getLogger(__name__)

# Screening fields copied straight from the validated payload onto the record.
SCREENING_FIELDS = (
    'height_cm',
    'weight_kg',
    'systolic_bp',
    'diastolic_bp',
    'heart_rate',
    'smoking_status',
    'alcohol_usage',
    'physical_activity',
    'glucose_level',
    'cholesterol_level',
    'hemoglobin',
    'rbc_count',
    'wbc_count',
    'platelet_count',
    'blood_urea_nitrogen',
    'creatinine',
    'sodium',
    'potassium',
    'chloride',
    'calcium',
    'alt_sgpt',
    'ast_sgot',
    'albumin',
    'total_bilirubin',
)


def attach_ai_insights(screening, patient, data, assessment):
    """
    Ask Gemini to interpret the screening and store the markdown insight.

    Failures are logged and swallowed: a missing AI narrative must never block
    the health worker from recording a screening.
    """
    from ..ai_service import analyze_health_data

    ai_data = {field: data.get(field) for field in SCREENING_FIELDS}
    ai_data.update(
        {
            'age': patient.age,
            'gender': patient.gender,
            'risk_level': assessment.level,
            'risk_score': assessment.score,
        }
    )

    try:
        result = analyze_health_data(ai_data)
    except Exception:  # noqa: BLE001 - screening creation must still succeed
        logger.exception('AI analysis raised during screening creation')
        return

    if not result.get('success'):
        logger.info(
            'AI analysis unavailable for screening %s: %s',
            screening.id,
            result.get('error'),
        )
        return

    screening.ai_insights = result['analysis'].get('formatted_insights')
    screening.save(update_fields=['ai_insights'])


def record_screening(patient, data):
    """
    Score, persist and enrich one screening for ``patient``.

    Shared by the health-worker endpoint and the patient self-screening portal
    so both paths produce identically scored records.

    Args:
        patient: The Patient the screening belongs to.
        data: Validated payload from ``ScreeningCreateSerializer``.

    Returns:
        The saved Screening instance.
    """
    assessment = calculate_risk(data)

    screening = Screening.objects.create(
        patient=patient,
        risk_score=assessment.score,
        risk_level=assessment.level,
        risk_notes=assessment.notes_text,
        **{field: data.get(field) for field in SCREENING_FIELDS},
    )

    for recommendation in build_recommendations(assessment.notes, assessment.level):
        Recommendation.objects.create(
            patient=patient, screening=screening, **recommendation
        )

    attach_ai_insights(screening, patient, data, assessment)

    return screening


class ScreeningListCreateView(generics.ListCreateAPIView):
    """List and create screenings with risk calculation."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ScreeningCreateSerializer
        return ScreeningSerializer

    def get_queryset(self):
        queryset = Screening.objects.all().order_by('-created_at')

        # Health workers only see screenings belonging to their own patients.
        if self.request.user.role == 'health_worker':
            queryset = queryset.filter(patient__health_worker=self.request.user)

        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        risk = self.request.query_params.get('risk')
        if risk:
            queryset = queryset.filter(risk_level=risk)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = ScreeningCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        patient = Patient.objects.get(id=data['patient_id'])
        screening = record_screening(patient, data)

        return Response(
            ScreeningSerializer(screening).data, status=status.HTTP_201_CREATED
        )
