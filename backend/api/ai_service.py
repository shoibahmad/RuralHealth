"""
Gemini AI Service for health analysis and recommendations.

The Gemini client is configured lazily so the project can be imported, migrated
and tested without a GEMINI_API_KEY present. Every public function degrades to a
``{'success': False, 'error': ...}`` result when the key is missing rather than
raising at import time.
"""
import json
import logging
import os
import re

import google.generativeai as genai

logger = logging.getLogger(__name__)

DEFAULT_MODEL = 'gemini-2.5-flash'

# Guard so genai.configure() only runs once per process.
_configured = False


class AIServiceUnavailable(RuntimeError):
    """Raised when the Gemini API key is not configured."""


def is_configured() -> bool:
    """Return True when a Gemini API key is available in the environment."""
    return bool(os.environ.get('GEMINI_API_KEY'))


def _configure() -> None:
    """Configure the Gemini client once, raising if no API key is present."""
    global _configured
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise AIServiceUnavailable(
            'GEMINI_API_KEY is not set. AI features are disabled; see .env.example.'
        )
    if not _configured:
        genai.configure(api_key=api_key)
        _configured = True


def get_model(model_name: str = DEFAULT_MODEL):
    """Return a configured Gemini model instance."""
    _configure()
    return genai.GenerativeModel(model_name)


def try_generate_content(prompt, model_name: str = DEFAULT_MODEL):
    """Generate content with the default Gemini model."""
    try:
        logger.debug('Requesting AI generation with model %s', model_name)
        return get_model(model_name).generate_content(prompt)
    except AIServiceUnavailable:
        raise
    except Exception:
        logger.exception('Model %s failed to generate content', model_name)
        raise


def parse_json_payload(text: str, expect: str = 'object'):
    """
    Pull the first JSON object (or array) out of a model response.

    Models routinely wrap JSON in prose or markdown fences, so the raw text is
    not directly parseable. Returns ``None`` when nothing valid can be recovered.
    """
    if not text:
        return None

    pattern = r'\{[\s\S]*\}' if expect == 'object' else r'\[[\s\S]*\]'
    match = re.search(pattern, text)
    if not match:
        return None

    candidate = match.group()
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        # Retry after stripping markdown fences the regex may have swallowed.
        cleaned = re.sub(r'^json\s*', '', candidate.strip().strip('`'))
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return None


def analyze_health_data(screening_data: dict) -> dict:
    """
    Use Gemini AI to analyze patient health data and provide insights.

    Args:
        screening_data: Dictionary containing patient vitals, lifestyle, and lab data

    Returns:
        Dictionary with AI-generated analysis including risk assessment,
        recommendations, and health insights
    """
    prompt = f"""
        You are an expert medical AI assistant for rural health workers.
        Analyze this patient's screening data and provide a clinical assessment.

        Patient Data:
        - Age: {screening_data.get('age')} | Gender: {screening_data.get('gender')}
        - Vitals: BP {screening_data.get('systolic_bp')}/{screening_data.get('diastolic_bp')}, HR {screening_data.get('heart_rate')}
        - BMI Data: Height {screening_data.get('height_cm')}cm, Weight {screening_data.get('weight_kg')}kg
        - Lab: Glucose {screening_data.get('glucose_level')} mg/dL, Chol {screening_data.get('cholesterol_level')} mg/dL
        - Hematology: Hb {screening_data.get('hemoglobin')}, WBC {screening_data.get('wbc_count')}, Plt {screening_data.get('platelet_count')}
        - Metabolic: BUN {screening_data.get('blood_urea_nitrogen')}, Cr {screening_data.get('creatinine')}, Na {screening_data.get('sodium')}, K {screening_data.get('potassium')}
        - Liver: ALT {screening_data.get('alt_sgpt')}, AST {screening_data.get('ast_sgot')}, Alb {screening_data.get('albumin')}, Bilirubin {screening_data.get('total_bilirubin')}
        - Lifestyle: Smoking: {screening_data.get('smoking_status')}, Activity: {screening_data.get('physical_activity')}
        - Computed Risk: {screening_data.get('risk_level')} (Score: {screening_data.get('risk_score')})

        Output valid JSON with these fields:
        1. "summary": A professional clinical summary focusing on any abnormalities.
        2. "summary_hi": Same as summary but in Hindi.
        3. "concerns": List of strings for key health risks.
        4. "concerns_hi": Same as concerns but in Hindi.
        5. "recommendations": List of strings for actionable advice.
        6. "recommendations_hi": Same as recommendations but in Hindi.
        7. "formatted_insights": A markdown string exactly matching this structure:
           "**Medical Diagnostic Overview**\\n\\nThe screening reveals a **[Risk Level]** clinical status. Significant findings include [Findings].\\n\\n**Diagnostic Details:**\\n- [Detail 1]\\n- [Detail 2]\\n\\n**Clinical Guidance:**\\n1. [Guidance 1]\\n2. [Guidance 2]"
        8. "formatted_insights_hi": Same formatted insights but in Hindi.
        """

    try:
        response_text = try_generate_content(prompt).text
    except AIServiceUnavailable as exc:
        logger.info('Skipping AI analysis: %s', exc)
        return {'success': False, 'error': str(exc), 'analysis': None}
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as a result
        logger.exception('AI analysis request failed')
        return {'success': False, 'error': str(exc), 'analysis': None}

    ai_analysis = parse_json_payload(response_text)
    if ai_analysis is None:
        logger.warning('AI analysis returned unparseable JSON: %s', response_text)
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'analysis': None,
        }

    # Some responses omit the markdown block the UI renders; synthesise one.
    if 'formatted_insights' not in ai_analysis:
        summary = ai_analysis.get('summary', 'Analysis completed.')
        ai_analysis['formatted_insights'] = f"**AI Health Assessment**\n\n{summary}"

    return {'success': True, 'analysis': ai_analysis}


def generate_health_recommendations(patient_data: dict, screening_results: dict) -> list:
    """
    Generate personalized health recommendations using Gemini AI.

    Args:
        patient_data: Patient demographics
        screening_results: Latest screening results with risk factors

    Returns:
        List of recommendation dictionaries. Falls back to a single generic
        monitoring recommendation when the model is unavailable or unparseable.
    """
    fallback = [
        {
            'category': 'lifestyle',
            'title': 'Regular Health Monitoring',
            'description': 'Monitor blood pressure and glucose levels regularly. Keep a health diary.',
            'priority': 'high',
        }
    ]

    prompt = f"""
        As a healthcare AI, generate 3-5 specific, actionable health recommendations for this patient.

        Patient Profile:
        - Age: {patient_data.get('age')} years, {patient_data.get('gender')}
        - Location: Rural area - {patient_data.get('village', 'Unknown')}

        Health Screening Results:
        - Risk Level: {screening_results.get('risk_level', 'Unknown')}
        - Risk Score: {screening_results.get('risk_score', 'N/A')}
        - Key Issues: {screening_results.get('risk_notes', 'None identified')}

        Consider:
        1. Available resources in rural areas
        2. Simple, practical steps the patient can take
        3. Local food and lifestyle considerations
        4. Importance of follow-up care

        Respond as a JSON array of recommendations:
        [
            {{"category": "diet", "title": "...", "description": "...", "priority": "high/medium/low"}},
            ...
        ]
        """

    try:
        response_text = try_generate_content(prompt).text
    except AIServiceUnavailable as exc:
        logger.info('Skipping AI recommendations: %s', exc)
        return fallback
    except Exception:  # noqa: BLE001 - callers only need the fallback
        logger.exception('AI recommendation request failed')
        return []

    recommendations = parse_json_payload(response_text, expect='array')
    return recommendations if recommendations is not None else fallback


def extract_screening_data_from_file(file_path: str) -> dict:
    """
    Extract screening results (demographics, vitals, labs) from an image or PDF.

    Args:
        file_path: Path to the laboratory report or health document

    Returns:
        Dictionary containing extracted values
    """
    prompt = """
        Analyze this health document (image or PDF) and extract all relevant patient, vitals, and medical data.
        Return a JSON object with the following fields (use null if not found):

        - Demographics: full_name, age (number), gender ("Male", "Female"), village, phone
        - Vitals: height_cm, weight_kg, systolic_bp, diastolic_bp, heart_rate
        - Hematology: hemoglobin, rbc_count, wbc_count, platelet_count
        - Metabolic: glucose_level, blood_urea_nitrogen, creatinine, sodium, potassium, chloride, calcium
        - Liver: alt_sgpt, ast_sgot, albumin, total_bilirubin, cholesterol_level
        - Lifestyle: smoking_status ("Never", "Former", "Current"), alcohol_usage ("None", "Moderate", "Heavy"), physical_activity ("Low", "Moderate", "High")

        Ensure all laboratory and vital values are numeric. If a range is given, use the specific result value.
        For demographics, try to find patient identification if available.

        Example:
        {
            "full_name": "Ramesh Kumar",
            "age": 42,
            "systolic_bp": 130,
            "glucose_level": 110,
            "hemoglobin": 14.2
        }
        """

    if not os.path.exists(file_path):
        return {'success': False, 'error': f'File not found: {file_path}'}

    try:
        model = get_model()
        uploaded_file = genai.upload_file(path=file_path)
        response_text = model.generate_content([prompt, uploaded_file]).text
    except AIServiceUnavailable as exc:
        logger.info('Skipping document extraction: %s', exc)
        return {'success': False, 'error': str(exc)}
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as a result
        logger.exception('Document extraction failed for %s', file_path)
        return {'success': False, 'error': str(exc)}

    data = parse_json_payload(response_text)
    if data is None:
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'raw_response': response_text,
        }
    return {'success': True, 'data': data}


def extract_vitals_from_audio(audio_file_path: str) -> dict:
    """
    Extract vitals from an audio recording of a health worker dictating vitals.

    Args:
        audio_file_path: Path to the temporary audio file

    Returns:
        Dictionary containing extracted vitals
    """
    prompt = """
        Listen to this audio recording of a health worker dictating patient vitals.
        Extract the following information and return it as a JSON object:
        - height_cm (number)
        - weight_kg (number)
        - systolic_bp (number)
        - diastolic_bp (number)
        - heart_rate (number)

        If a value is not mentioned, use null.

        Example JSON format:
        {
            "height_cm": 175,
            "weight_kg": 70,
            "systolic_bp": 120,
            "diastolic_bp": 80,
            "heart_rate": 72
        }
        """

    try:
        model = get_model()
        audio_file = genai.upload_file(path=audio_file_path)
        response_text = model.generate_content([prompt, audio_file]).text
    except AIServiceUnavailable as exc:
        logger.info('Skipping audio extraction: %s', exc)
        return {'success': False, 'error': str(exc)}
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as a result
        logger.exception('Voice extraction failed for %s', audio_file_path)
        return {'success': False, 'error': str(exc)}

    vitals = parse_json_payload(response_text)
    if vitals is None:
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'raw_response': response_text,
        }
    return {'success': True, 'data': vitals}


def extract_vitals_from_text(text: str) -> dict:
    """
    Extract vitals from transcribed speech.

    Args:
        text: Transcribed text from voice input

    Returns:
        Dictionary containing extracted vitals
    """
    prompt = f"""
        Extract patient health data from the following transcribed speech:
        "{text}"

        Return a JSON object with these fields (use null if not found):
        - full_name (string)
        - age (number)
        - gender (string: "Male", "Female", or "Other")
        - village (string)
        - phone (string)
        - height_cm (number)
        - weight_kg (number)
        - systolic_bp (number)
        - diastolic_bp (number)
        - heart_rate (number)
        - smoking_status (string: "Never", "Former", or "Current")
        - alcohol_usage (string: "None", "Moderate", or "Heavy")
        - physical_activity (string: "Low", "Moderate", or "High")
        - glucose_level (number)
        - cholesterol_level (number)
        - hemoglobin (number)
        - rbc_count (number)
        - wbc_count (number)
        - platelet_count (number)
        - blood_urea_nitrogen (number)
        - creatinine (number)
        - sodium (number)
        - potassium (number)
        - chloride (number)
        - calcium (number)
        - alt_sgpt (number)
        - ast_sgot (number)
        - albumin (number)
        - total_bilirubin (number)

        If the text is just a number without context, try to infer which field it belongs to based on common ranges for vitals.
        - BP is usually two numbers (e.g., 120 over 80).
        - Heart rate is usually 60-100.
        - Height is usually 140-200 cm.
        - Weight is usually 40-120 kg.

        Example:
        {{
            "full_name": "John Doe",
            "age": 45,
            "gender": "Male",
            "height_cm": 175,
            "weight_kg": 70,
            "systolic_bp": 120,
            "diastolic_bp": 80,
            "heart_rate": 72,
            "smoking_status": "Current",
            "physical_activity": "Moderate"
        }}
        """

    try:
        response_text = try_generate_content(prompt).text
    except AIServiceUnavailable as exc:
        logger.info('Skipping text extraction: %s', exc)
        return {'success': False, 'error': str(exc)}
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as a result
        logger.exception('Text extraction failed')
        return {'success': False, 'error': str(exc)}

    data = parse_json_payload(response_text)
    if data is None:
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'raw_response': response_text,
        }
    return {'success': True, 'data': data}
