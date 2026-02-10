"""
Gemini AI Service for health analysis and recommendations.
"""
import os
import google.generativeai as genai
from django.conf import settings


# Configure Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")
genai.configure(api_key=GEMINI_API_KEY)


def analyze_health_data(screening_data: dict) -> dict:
    """
    Use Gemini AI to analyze patient health data and provide insights.
    
    Args:
        screening_data: Dictionary containing patient vitals, lifestyle, and lab data
        
    Returns:
        Dictionary with AI-generated analysis including risk assessment, 
        recommendations, and health insights
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert medical AI assistant for rural health workers.
        Analyze this patient's screening data and provide a clinical assessment.
        
        Patient Data:
        - Age: {screening_data.get('age')} | Gender: {screening_data.get('gender')}
        - Vitals: BP {screening_data.get('systolic_bp')}/{screening_data.get('diastolic_bp')}, HR {screening_data.get('heart_rate')}
        - BMI Data: Height {screening_data.get('height_cm')}cm, Weight {screening_data.get('weight_kg')}kg
        - Lab: Glucose {screening_data.get('glucose_level')} mg/dL
        - Lifestyle: Smoking: {screening_data.get('smoking_status')}, Activity: {screening_data.get('physical_activity')}
        - Computed Risk: {screening_data.get('risk_level')} (Score: {screening_data.get('risk_score')})
        
        Output valid JSON with these fields:
        1. "summary": A professional clinical summary (2-3 sentences).
        2. "concerns": List of strings for key health risks.
        3. "recommendations": List of strings for actionable advice.
        4. "formatted_insights": A markdown string exactly matching this structure:
           "**AI Health Assessment**\\n\\nBased on the screening data, the patient is categorized as **[Risk Level] Risk**.\\n\\n**Key Observations:**\\n- [Observation 1]\\n- [Observation 2]\\n\\n**Recommendations:**\\n1. [Action 1]\\n2. [Action 2]"
        """
        
        response = model.generate_content(prompt)
        response_text = response.text
        
        import json
        import re
        
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                ai_analysis = json.loads(json_match.group())
                
                # Ensure formatted_insights exists
                if 'formatted_insights' not in ai_analysis:
                     ai_analysis['formatted_insights'] = f"**AI Health Assessment**\n\n{ai_analysis.get('summary', 'Analysis completed.')}"
                
                return {
                    'success': True,
                    'analysis': ai_analysis
                }
            except json.JSONDecodeError:
                pass
        
        print(f"AI Analysis JSON Parse Error. Response text: {response_text}")
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'analysis': None
        }
        
    except Exception as e:
        import traceback
        print(f"AI Analysis Error: {str(e)}")
        print(traceback.format_exc())
        return {
            'success': False,
            'error': str(e),
            'analysis': None
        }


def generate_health_recommendations(patient_data: dict, screening_results: dict) -> list:
    """
    Generate personalized health recommendations using Gemini AI.
    
    Args:
        patient_data: Patient demographics
        screening_results: Latest screening results with risk factors
        
    Returns:
        List of recommendation dictionaries
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
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
        
        response = model.generate_content(prompt)
        response_text = response.text
        
        import json
        import re
        
        # Find JSON array in response
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            try:
                recommendations = json.loads(json_match.group())
                return recommendations
            except json.JSONDecodeError:
                pass
        
        # Default recommendations if AI fails
        return [
            {
                'category': 'lifestyle',
                'title': 'Regular Health Monitoring',
                'description': 'Monitor blood pressure and glucose levels regularly. Keep a health diary.',
                'priority': 'high'
            }
        ]
        
    except Exception as e:
        print(f"AI recommendation error: {e}")
        return []

def extract_vitals_from_audio(audio_file_path: str) -> dict:
    """
    Extract vitals from an audio file using Gemini 1.5 Flash.
    
    Args:
        audio_file_path: Path to the temporary audio file
        
    Returns:
        Dictionary containing extracted vitals
    """
    try:
        # Upload the file to Gemini
        # Note: In a production environment with high volume, consider managing file lifecycle 
        # (deleting after processing) or using inline data if supported/small enough.
        # For 1.5 Flash, File API is standard for multimodal.
        audio_file = genai.upload_file(path=audio_file_path)
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
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
        
        response = model.generate_content([prompt, audio_file])
        response_text = response.text
        
        # Clean up the file from Gemini storage (good practice)
        # try:
        #     audio_file.delete()
        # except:
        #     pass

        import json
        import re
        
        # Find JSON in the response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                vitals = json.loads(json_match.group())
                return {
                    'success': True,
                    'data': vitals
                }
            except json.JSONDecodeError:
                pass
                
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'raw_response': response_text
        }
        
    except Exception as e:
        print(f"Voice extraction error: {e}")
        return {
            'success': False,
            'error': str(e)
        }
