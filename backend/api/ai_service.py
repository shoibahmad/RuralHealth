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


def try_generate_content(prompt):
    """
    Generate content using gemini-2.5-flash.
    """
    model_name = 'gemini-2.5-flash'
    try:
        print(f"Attempting AI generation with model: {model_name}")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response
    except Exception as e:
        print(f"Model {model_name} failed: {e}")
        raise e





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
        
        # Use fallback mechanism
        response = try_generate_content(prompt)
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
        
        # Use fallback mechanism
        response = try_generate_content(prompt)
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

def extract_screening_data_from_file(file_path: str) -> dict:
    """
    Extract all screening results (Patient Info, Vitals, Lab) from an image or PDF using Gemini.
    
    Args:
        file_path: Path to the laboratory report or health document
        
    Returns:
        Dictionary containing extracted values (demographics, vitals, labs)
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            return {'success': False, 'error': f"File not found: {file_path}"}
            
        # Upload the file to Gemini (supports images and PDF)
        uploaded_file = genai.upload_file(path=file_path)
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        
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
        
        response = model.generate_content([prompt, uploaded_file])
        response_text = response.text
        
        import json
        import re
        
        # Find JSON in the response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                data = json.loads(json_match.group())
                return {
                    'success': True,
                    'data': data
                }
            except json.JSONDecodeError:
                pass
                
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'raw_response': response_text
        }
        
    except Exception as e:
        print(f"File extraction error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


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
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        
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

def extract_vitals_from_text(text: str) -> dict:
    """
    Extract vitals from transcribed text using Gemini.
    
    Args:
        text: Transcribed text from voice input
        
    Returns:
        Dictionary containing extracted vitals
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
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
        
        response = model.generate_content(prompt)
        response_text = response.text
        
        import json
        import re
        
        # Robust JSON extraction
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                extracted_json = json_match.group()
                # Clean potential markdown or extra text
                data = json.loads(extracted_json)
                return {
                    'success': True,
                    'data': data
                }
            except json.JSONDecodeError:
                # Try to clean common issues like leading/trailing text
                try:
                    # Strip any potential markdown wrappers
                    clean_text = extracted_json.strip('`').replace('json\n', '', 1)
                    data = json.loads(clean_text)
                    return {
                        'success': True,
                        'data': data
                    }
                except:
                    pass
                
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'raw_response': response_text
        }
        
    except Exception as e:
        print(f"Text extraction error: {e}")
        return {
            'success': False,
            'error': str(e)
        }
