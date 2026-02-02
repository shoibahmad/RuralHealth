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
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        You are a healthcare AI assistant helping rural health workers assess patient health risks.
        
        Analyze the following patient health data and provide:
        1. Overall health risk assessment (Low, Medium, or High)
        2. Key health concerns identified
        3. Personalized health recommendations
        4. Suggested follow-up actions
        
        Patient Data:
        - Age: {screening_data.get('age', 'Unknown')} years
        - Gender: {screening_data.get('gender', 'Unknown')}
        - Height: {screening_data.get('height_cm', 'N/A')} cm
        - Weight: {screening_data.get('weight_kg', 'N/A')} kg
        - Systolic Blood Pressure: {screening_data.get('systolic_bp', 'N/A')} mmHg
        - Diastolic Blood Pressure: {screening_data.get('diastolic_bp', 'N/A')} mmHg
        - Heart Rate: {screening_data.get('heart_rate', 'N/A')} bpm
        - Glucose Level: {screening_data.get('glucose_level', 'N/A')} mg/dL
        - Cholesterol Level: {screening_data.get('cholesterol_level', 'N/A')} mg/dL
        - Smoking Status: {screening_data.get('smoking_status', 'Unknown')}
        - Alcohol Usage: {screening_data.get('alcohol_usage', 'Unknown')}
        - Physical Activity: {screening_data.get('physical_activity', 'Unknown')}
        
        Respond in the following JSON format:
        {{
            "risk_level": "Low/Medium/High",
            "risk_score": 0-100,
            "summary": "Brief overall assessment",
            "concerns": ["concern1", "concern2"],
            "recommendations": [
                {{"category": "diet/exercise/lifestyle/medication", "title": "Title", "description": "Detailed advice"}}
            ],
            "follow_up": "Suggested follow-up timeline and actions"
        }}
        """
        
        response = model.generate_content(prompt)
        
        # Parse the response
        response_text = response.text
        
        # Try to extract JSON from response
        import json
        import re
        
        # Find JSON in the response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                ai_analysis = json.loads(json_match.group())
                return {
                    'success': True,
                    'analysis': ai_analysis
                }
            except json.JSONDecodeError:
                pass
        
        # Fallback: return raw text analysis
        return {
            'success': True,
            'analysis': {
                'risk_level': 'Medium',
                'risk_score': 50,
                'summary': response_text[:500] if response_text else 'Analysis completed',
                'concerns': [],
                'recommendations': [],
                'follow_up': 'Schedule follow-up in 2 weeks'
            }
        }
        
    except Exception as e:
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
        model = genai.GenerativeModel('gemini-pro')
        
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
