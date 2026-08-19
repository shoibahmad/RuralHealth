"""Tests for the deterministic screening risk scorer."""
import pytest

from api.risk import (
    build_recommendations,
    calculate_bmi,
    calculate_risk,
    classify,
)


class TestCalculateBmi:
    def test_returns_bmi_for_valid_measurements(self):
        assert calculate_bmi(170, 72.25) == pytest.approx(25.0)

    @pytest.mark.parametrize(
        'height_cm, weight_kg',
        [(None, 70), (170, None), (0, 70), (-170, 70)],
    )
    def test_returns_none_for_unusable_measurements(self, height_cm, weight_kg):
        assert calculate_bmi(height_cm, weight_kg) is None


class TestClassify:
    @pytest.mark.parametrize(
        'score, expected',
        [
            (0, 'Low'),
            (29, 'Low'),
            (30, 'Medium'),
            (59, 'Medium'),
            (60, 'High'),
            (120, 'High'),
        ],
    )
    def test_bands_are_inclusive_at_their_lower_bound(self, score, expected):
        assert classify(score) == expected


class TestCalculateRisk:
    def test_empty_screening_scores_zero_and_reads_low(self):
        assessment = calculate_risk({})

        assert assessment.score == 0
        assert assessment.level == 'Low'
        assert assessment.notes == []
        assert assessment.notes_text == 'No significant risk factors detected.'

    @pytest.mark.parametrize(
        'systolic_bp, expected_score',
        [(110, 0), (125, 10), (150, 25), (190, 40)],
    )
    def test_blood_pressure_bands(self, systolic_bp, expected_score):
        assert calculate_risk({'systolic_bp': systolic_bp}).score == expected_score

    @pytest.mark.parametrize(
        'glucose_level, expected_score',
        [(90, 0), (110, 10), (150, 25), (220, 40)],
    )
    def test_glucose_bands(self, glucose_level, expected_score):
        assert calculate_risk({'glucose_level': glucose_level}).score == expected_score

    @pytest.mark.parametrize(
        'cholesterol_level, expected_score',
        [(180, 0), (210, 10), (260, 20)],
    )
    def test_cholesterol_bands(self, cholesterol_level, expected_score):
        assessment = calculate_risk({'cholesterol_level': cholesterol_level})
        assert assessment.score == expected_score

    @pytest.mark.parametrize(
        'smoking_status, expected_score',
        [('Never', 0), ('Former', 5), ('Current', 15)],
    )
    def test_smoking_bands(self, smoking_status, expected_score):
        assessment = calculate_risk({'smoking_status': smoking_status})
        assert assessment.score == expected_score

    def test_obese_bmi_adds_fifteen_and_reports_the_value(self):
        # 100kg at 160cm is a BMI of 39.1.
        assessment = calculate_risk({'height_cm': 160, 'weight_kg': 100})

        assert assessment.score == 15
        assert assessment.notes == ['Obese (BMI: 39.1)']

    def test_overweight_bmi_adds_eight(self):
        # 80kg at 175cm is a BMI of 26.1.
        assessment = calculate_risk({'height_cm': 175, 'weight_kg': 80})

        assert assessment.score == 8
        assert 'Overweight' in assessment.notes[0]

    def test_healthy_bmi_contributes_nothing(self):
        assert calculate_risk({'height_cm': 175, 'weight_kg': 68}).score == 0

    def test_sedentary_lifestyle_adds_ten(self):
        assessment = calculate_risk({'physical_activity': 'Sedentary'})

        assert assessment.score == 10
        assert assessment.notes == ['Sedentary lifestyle']

    def test_factors_accumulate_into_a_high_risk_assessment(self):
        assessment = calculate_risk(
            {
                'systolic_bp': 185,     # +40
                'glucose_level': 210,   # +40
                'smoking_status': 'Current',  # +15
            }
        )

        assert assessment.score == 95
        assert assessment.level == 'High'
        assert len(assessment.notes) == 3

    def test_notes_text_joins_every_contributing_factor(self):
        assessment = calculate_risk(
            {'systolic_bp': 150, 'smoking_status': 'Former'}
        )

        assert assessment.notes_text == (
            'High blood pressure (>140 systolic); Former smoker'
        )

    def test_moderate_combination_lands_in_the_medium_band(self):
        assessment = calculate_risk(
            {'systolic_bp': 125, 'glucose_level': 110, 'physical_activity': 'Sedentary'}
        )

        assert assessment.score == 30
        assert assessment.level == 'Medium'


class TestBuildRecommendations:
    def test_no_notes_and_low_risk_produces_nothing(self):
        assert build_recommendations([], 'Low') == []

    def test_blood_pressure_note_yields_a_lifestyle_recommendation(self):
        recommendations = build_recommendations(
            ['High blood pressure (>140 systolic)'], 'Medium'
        )

        assert len(recommendations) == 1
        assert recommendations[0]['title'] == 'Blood Pressure Management'
        assert recommendations[0]['category'] == 'lifestyle'
        assert recommendations[0]['priority'] == 'medium'

    def test_very_high_note_escalates_priority_to_high(self):
        recommendations = build_recommendations(
            ['Very high blood pressure (>180 systolic)'], 'High'
        )

        assert recommendations[0]['priority'] == 'high'

    def test_smoking_recommendation_is_always_high_priority(self):
        recommendations = build_recommendations(['Current smoker'], 'Low')

        assert recommendations[0]['title'] == 'Smoking Cessation'
        assert recommendations[0]['priority'] == 'high'

    def test_high_risk_appends_a_follow_up_recommendation(self):
        recommendations = build_recommendations(['Current smoker'], 'High')

        assert recommendations[-1]['category'] == 'followup'
        assert recommendations[-1]['priority'] == 'high'

    def test_each_note_maps_to_its_own_recommendation(self):
        recommendations = build_recommendations(
            [
                'High blood pressure (>140 systolic)',
                'High glucose (>140 mg/dL)',
                'Sedentary lifestyle',
            ],
            'Medium',
        )

        titles = [rec['title'] for rec in recommendations]
        assert titles == [
            'Blood Pressure Management',
            'Blood Sugar Control',
            'Increase Physical Activity',
        ]

    def test_returned_dicts_are_independent_copies(self):
        first = build_recommendations(['Current smoker'], 'Low')
        first[0]['priority'] = 'mutated'

        second = build_recommendations(['Current smoker'], 'Low')
        assert second[0]['priority'] == 'high'
