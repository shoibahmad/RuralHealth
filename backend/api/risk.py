"""
Deterministic screening risk scoring.

Kept free of Django request/response types so the algorithm can be exercised
directly in tests and reused outside the screening endpoint.
"""

from dataclasses import dataclass, field

HIGH_RISK_THRESHOLD = 60
MEDIUM_RISK_THRESHOLD = 30

NO_RISK_FACTORS_NOTE = 'No significant risk factors detected.'


@dataclass
class RiskAssessment:
    """Result of scoring one screening."""

    score: int = 0
    level: str = 'Low'
    notes: list = field(default_factory=list)

    @property
    def notes_text(self) -> str:
        """Risk notes joined for storage on the Screening record."""
        return '; '.join(self.notes) if self.notes else NO_RISK_FACTORS_NOTE


def calculate_bmi(height_cm, weight_kg):
    """Return BMI, or None when height/weight are missing or nonsensical."""
    if not height_cm or not weight_kg or height_cm <= 0:
        return None
    return weight_kg / ((height_cm / 100) ** 2)


def _score_blood_pressure(systolic_bp):
    if not systolic_bp:
        return 0, None
    if systolic_bp > 180:
        return 40, 'Very high blood pressure (>180 systolic)'
    if systolic_bp > 140:
        return 25, 'High blood pressure (>140 systolic)'
    if systolic_bp > 120:
        return 10, 'Elevated blood pressure (>120 systolic)'
    return 0, None


def _score_glucose(glucose_level):
    if not glucose_level:
        return 0, None
    if glucose_level > 200:
        return 40, 'Very high glucose (>200 mg/dL)'
    if glucose_level > 140:
        return 25, 'High glucose (>140 mg/dL)'
    if glucose_level > 100:
        return 10, 'Elevated glucose (>100 mg/dL)'
    return 0, None


def _score_cholesterol(cholesterol_level):
    if not cholesterol_level:
        return 0, None
    if cholesterol_level > 240:
        return 20, 'High cholesterol (>240 mg/dL)'
    if cholesterol_level > 200:
        return 10, 'Borderline high cholesterol (>200 mg/dL)'
    return 0, None


def _score_smoking(smoking_status):
    if smoking_status == 'Current':
        return 15, 'Current smoker'
    if smoking_status == 'Former':
        return 5, 'Former smoker'
    return 0, None


def _score_bmi(height_cm, weight_kg):
    bmi = calculate_bmi(height_cm, weight_kg)
    if bmi is None:
        return 0, None
    if bmi > 30:
        return 15, f'Obese (BMI: {bmi:.1f})'
    if bmi > 25:
        return 8, f'Overweight (BMI: {bmi:.1f})'
    return 0, None


def _score_activity(physical_activity):
    if physical_activity == 'Sedentary':
        return 10, 'Sedentary lifestyle'
    return 0, None


def classify(score: int) -> str:
    """Map a numeric risk score onto a Low/Medium/High band."""
    if score >= HIGH_RISK_THRESHOLD:
        return 'High'
    if score >= MEDIUM_RISK_THRESHOLD:
        return 'Medium'
    return 'Low'


def calculate_risk(data: dict) -> RiskAssessment:
    """
    Score a screening payload into a RiskAssessment.

    Args:
        data: Validated screening fields (vitals, labs and lifestyle answers).

    Returns:
        RiskAssessment carrying the score, the Low/Medium/High band and the
        human-readable notes explaining each contribution.
    """
    contributions = [
        _score_blood_pressure(data.get('systolic_bp')),
        _score_glucose(data.get('glucose_level')),
        _score_cholesterol(data.get('cholesterol_level')),
        _score_smoking(data.get('smoking_status')),
        _score_bmi(data.get('height_cm'), data.get('weight_kg')),
        _score_activity(data.get('physical_activity')),
    ]

    score = sum(points for points, _ in contributions)
    notes = [note for _, note in contributions if note]

    return RiskAssessment(score=score, level=classify(score), notes=notes)


# Risk-note keyword -> recommendation template. Ordered so the generated advice
# reads the same way every time for a given set of notes.
RECOMMENDATION_TEMPLATES = (
    (
        'blood pressure',
        {
            'category': 'lifestyle',
            'title': 'Blood Pressure Management',
            'description': (
                'Reduce sodium intake, exercise regularly, limit alcohol, and '
                'manage stress. Consider DASH diet.'
            ),
        },
    ),
    (
        'glucose',
        {
            'category': 'diet',
            'title': 'Blood Sugar Control',
            'description': (
                'Limit refined carbohydrates, eat more fiber, exercise after '
                'meals, and monitor blood sugar regularly.'
            ),
        },
    ),
    (
        'cholesterol',
        {
            'category': 'diet',
            'title': 'Cholesterol Management',
            'description': (
                'Reduce saturated fats, eat omega-3 rich foods, increase '
                'soluble fiber, and consider plant sterols.'
            ),
            'priority': 'medium',
        },
    ),
    (
        'smoker',
        {
            'category': 'lifestyle',
            'title': 'Smoking Cessation',
            'description': (
                'Consider nicotine replacement therapy, counseling, or '
                'medication. Quitting smoking significantly reduces '
                'cardiovascular risk.'
            ),
            'priority': 'high',
        },
    ),
    (
        'bmi',
        {
            'category': 'exercise',
            'title': 'Weight Management',
            'description': (
                'Aim for 150 minutes of moderate exercise weekly, reduce '
                'calorie intake, and consult a nutritionist.'
            ),
            'priority': 'medium',
        },
    ),
    (
        'sedentary',
        {
            'category': 'exercise',
            'title': 'Increase Physical Activity',
            'description': (
                'Start with 30 minutes of walking daily, take breaks from '
                'sitting, and gradually increase activity level.'
            ),
            'priority': 'medium',
        },
    ),
)

HIGH_RISK_FOLLOW_UP = {
    'category': 'followup',
    'title': 'Schedule Follow-up Appointment',
    'description': (
        'High risk detected. Please schedule a follow-up appointment within '
        '2 weeks for detailed assessment.'
    ),
    'priority': 'high',
}


def build_recommendations(risk_notes, risk_level: str) -> list:
    """
    Turn risk notes into recommendation payloads.

    Args:
        risk_notes: Notes produced by :func:`calculate_risk`.
        risk_level: The Low/Medium/High band for the screening.

    Returns:
        List of dicts ready to be passed to ``Recommendation.objects.create``.
    """
    recommendations = []

    for note in risk_notes:
        lowered = note.lower()
        for keyword, template in RECOMMENDATION_TEMPLATES:
            if keyword not in lowered:
                continue
            recommendation = dict(template)
            # Templates without a fixed priority escalate on "Very high" notes.
            recommendation.setdefault('priority', 'high' if 'Very high' in note else 'medium')
            recommendations.append(recommendation)

    if risk_level == 'High':
        recommendations.append(dict(HIGH_RISK_FOLLOW_UP))

    return recommendations
