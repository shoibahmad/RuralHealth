from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Appointment, Patient, Recommendation, Screening

User = get_user_model()

MIN_PASSWORD_LENGTH = 6

# Phone numbers arrive from paper forms and OCR, so allow the usual separators
# and an optional country prefix rather than demanding one canonical format.
PHONE_VALIDATOR = RegexValidator(
    regex=r'^\+?[0-9][0-9\s\-()]{5,19}$',
    message='Enter a valid phone number (6-20 digits, optional +country code).',
)

# Physiologically plausible bounds. Anything outside these is a data-entry
# slip rather than a real reading, and must not reach the risk scorer.
VITALS_BOUNDS = {
    'height_cm': (30, 275),
    'weight_kg': (1, 500),
    'systolic_bp': (40, 300),
    'diastolic_bp': (20, 200),
    'heart_rate': (20, 250),
}

LAB_BOUNDS = {
    'glucose_level': (10, 1500),
    'cholesterol_level': (10, 1000),
    'hemoglobin': (1, 30),
    'rbc_count': (0.5, 15),
    'wbc_count': (0.1, 200),
    'platelet_count': (1, 2000),
    'blood_urea_nitrogen': (1, 300),
    'creatinine': (0.1, 30),
    'sodium': (80, 200),
    'potassium': (1, 15),
    'chloride': (50, 200),
    'calcium': (2, 20),
    'alt_sgpt': (1, 5000),
    'ast_sgot': (1, 5000),
    'albumin': (0.5, 10),
    'total_bilirubin': (0.05, 60),
}

SMOKING_CHOICES = ['Never', 'Former', 'Current']
ALCOHOL_CHOICES = ['None', 'Occasional', 'Moderate', 'Heavy', 'Frequent']
ACTIVITY_CHOICES = ['Sedentary', 'Low', 'Moderate', 'High', 'Active']


def bounded_field(field_class, bounds, **kwargs):
    """Build a numeric serializer field constrained to ``bounds``."""
    minimum, maximum = bounds
    return field_class(
        required=False,
        allow_null=True,
        validators=[MinValueValidator(minimum), MaxValueValidator(maximum)],
        **kwargs,
    )


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active']
        read_only_fields = ['id', 'is_active']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(write_only=True, min_length=MIN_PASSWORD_LENGTH)
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=User.ROLE_CHOICES, required=False, default='health_worker'
    )

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'role']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value

    def create(self, validated_data):
        # Email doubles as the username for this project's auth model.
        email = validated_data['email']
        return User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            role=validated_data.get('role', 'health_worker'),
        )


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for a user editing their own name or email."""

    # Declared explicitly to drop the model's auto-generated UniqueValidator,
    # so validate_email below owns the duplicate-email message.
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = ['full_name', 'email']

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email__iexact=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('Email already in use')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer validating a password change for the signed-in user."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=MIN_PASSWORD_LENGTH)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, self.context['request'].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class WorkerStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for an officer toggling or renaming a health worker."""

    class Meta:
        model = User
        fields = ['is_active', 'full_name']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer to include user data and authenticate by email."""

    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['sub'] = user.email
        token['email'] = user.email
        token['full_name'] = user.full_name or ''
        token['role'] = user.role

        return token

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('Email and password are required')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('Incorrect email or password') from exc

        if not user.check_password(password):
            raise serializers.ValidationError('Incorrect email or password')
        if not user.is_active:
            raise serializers.ValidationError('User is not active')

        refresh = self.get_token(user)

        return {
            'access_token': str(refresh.access_token),
            'token_type': 'bearer',
        }


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for patient details."""

    health_worker_id = serializers.IntegerField(source='health_worker.id', read_only=True)
    screening_count = serializers.SerializerMethodField()
    latest_risk_level = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id',
            'health_worker_id',
            'full_name',
            'age',
            'gender',
            'village',
            'phone',
            'created_at',
            'screening_count',
            'latest_risk_level',
        ]
        read_only_fields = ['id', 'health_worker_id', 'created_at']

    def get_screening_count(self, obj):
        return obj.screenings.count()

    def get_latest_risk_level(self, obj):
        latest = obj.screenings.order_by('-created_at').first()
        return latest.risk_level if latest else None


class PatientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating patients."""

    full_name = serializers.CharField(max_length=255, trim_whitespace=True)
    age = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(130)])
    gender = serializers.ChoiceField(choices=Patient.GENDER_CHOICES)
    village = serializers.CharField(max_length=255, trim_whitespace=True)
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True,
        validators=[PHONE_VALIDATOR],
    )

    class Meta:
        model = Patient
        fields = ['full_name', 'age', 'gender', 'village', 'phone']

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Patient name cannot be blank')
        return value.strip()


class PatientUpdateSerializer(PatientCreateSerializer):
    """Serializer for an officer editing a patient, including reassignment."""

    health_worker_id = serializers.PrimaryKeyRelatedField(
        source='health_worker',
        queryset=User.objects.filter(role='health_worker'),
        required=False,
        allow_null=True,
    )

    class Meta(PatientCreateSerializer.Meta):
        fields = PatientCreateSerializer.Meta.fields + ['health_worker_id']


class PatientProfileSerializer(PatientCreateSerializer):
    """Serializer a patient uses to create or update their own profile."""

    class Meta(PatientCreateSerializer.Meta):
        fields = PatientCreateSerializer.Meta.fields


class ScreeningSerializer(serializers.ModelSerializer):
    """Serializer for screening details."""

    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = Screening
        fields = [
            'id',
            'patient_id',
            'patient_name',
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
            'risk_score',
            'risk_level',
            'risk_notes',
            'ai_insights',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'risk_score',
            'risk_level',
            'risk_notes',
            'ai_insights',
            'created_at',
        ]


class ScreeningCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating screenings.

    Every vital and lab value is range-checked here so out-of-range readings are
    rejected with a 400 before they reach the risk scorer or the AI service.
    """

    patient_id = serializers.IntegerField()

    height_cm = bounded_field(serializers.FloatField, VITALS_BOUNDS['height_cm'])
    weight_kg = bounded_field(serializers.FloatField, VITALS_BOUNDS['weight_kg'])
    systolic_bp = bounded_field(serializers.IntegerField, VITALS_BOUNDS['systolic_bp'])
    diastolic_bp = bounded_field(serializers.IntegerField, VITALS_BOUNDS['diastolic_bp'])
    heart_rate = bounded_field(serializers.IntegerField, VITALS_BOUNDS['heart_rate'])

    smoking_status = serializers.ChoiceField(
        choices=SMOKING_CHOICES, required=False, allow_null=True, allow_blank=True
    )
    alcohol_usage = serializers.ChoiceField(
        choices=ALCOHOL_CHOICES, required=False, allow_null=True, allow_blank=True
    )
    physical_activity = serializers.ChoiceField(
        choices=ACTIVITY_CHOICES, required=False, allow_null=True, allow_blank=True
    )

    class Meta:
        model = Screening
        fields = [
            'patient_id',
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
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Lab panels share one shape, so bound them from the table rather than
        # repeating twenty near-identical field declarations.
        for name, bounds in LAB_BOUNDS.items():
            self.fields[name] = bounded_field(serializers.FloatField, bounds)

    def validate_patient_id(self, value):
        if not Patient.objects.filter(id=value).exists():
            raise serializers.ValidationError('Patient not found')
        return value

    def validate(self, attrs):
        systolic = attrs.get('systolic_bp')
        diastolic = attrs.get('diastolic_bp')
        if systolic and diastolic and diastolic >= systolic:
            raise serializers.ValidationError(
                {'diastolic_bp': 'Diastolic pressure must be lower than systolic.'}
            )
        return attrs


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for appointment details."""

    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    health_worker_name = serializers.CharField(source='health_worker.full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient',
            'patient_name',
            'health_worker',
            'health_worker_name',
            'scheduled_date',
            'reason',
            'notes',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'health_worker', 'created_at', 'updated_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointments."""

    reason = serializers.CharField(max_length=255, trim_whitespace=True)

    class Meta:
        model = Appointment
        fields = ['patient', 'scheduled_date', 'reason', 'notes']

    def validate_reason(self, value):
        if not value.strip():
            raise serializers.ValidationError('A reason for the appointment is required')
        return value.strip()


class RecommendationSerializer(serializers.ModelSerializer):
    """Serializer for recommendation details."""

    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = Recommendation
        fields = [
            'id',
            'patient',
            'patient_name',
            'screening',
            'category',
            'title',
            'description',
            'priority',
            'is_completed',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class PatientDetailSerializer(serializers.ModelSerializer):
    """Detailed patient serializer with screenings and appointments."""

    health_worker_id = serializers.IntegerField(source='health_worker.id', read_only=True)
    health_worker_name = serializers.CharField(source='health_worker.full_name', read_only=True)
    screenings = ScreeningSerializer(many=True, read_only=True)
    appointments = AppointmentSerializer(many=True, read_only=True)
    recommendations = RecommendationSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id',
            'health_worker_id',
            'health_worker_name',
            'full_name',
            'age',
            'gender',
            'village',
            'phone',
            'created_at',
            'screenings',
            'appointments',
            'recommendations',
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""

    total_patients = serializers.IntegerField()
    total_screenings = serializers.IntegerField()
    high_risk_count = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    recent_screenings = ScreeningSerializer(many=True)
    risk_distribution = serializers.DictField()
    weekly_screenings = serializers.ListField()
