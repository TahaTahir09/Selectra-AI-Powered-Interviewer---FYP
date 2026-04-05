from flask import Blueprint, request, jsonify
from .chromadb_utils import (
    save_job_description, 
    get_job_description,
    save_application,
    get_application,
    search_similar_applications
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import PyPDF2
import io
import base64
import re

main = Blueprint('main', __name__)


def normalize_text(text):
  """Light normalization to reduce noise before vectorization."""
  if not text:
    return ""

  cleaned = text.lower()
  cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
  cleaned = re.sub(r"\s+", " ", cleaned).strip()
  return cleaned


def calculate_keyword_match_score(job_description, cv_text):
  """
  Calculate keyword matching score - checks if CV contains key skills/terms from job description.
  More permissive than TF-IDF alone.
  """
  job_clean = normalize_text(job_description)
  cv_clean = normalize_text(cv_text)
  
  if not job_clean or not cv_clean:
    return 0.0
  
  # Extract key technical terms (words > 3 characters that aren't common stop words)
  common_stop_words = {
    'the', 'and', 'with', 'from', 'that', 'this', 'have', 'your', 'will', 'work',
    'are', 'for', 'not', 'can', 'but', 'one', 'all', 'our', 'out', 'who', 'been',
    'their', 'more', 'such', 'than', 'them', 'then', 'when', 'what', 'which', 'why',
    'how', 'where', 'use', 'used', 'or', 'as', 'be', 'by', 'to', 'in', 'of', 'is'
  }
  
  job_words = set(w for w in job_clean.split() if len(w) > 3 and w not in common_stop_words)
  cv_words = set(cv_clean.split())
  
  if not job_words:
    return 0.0
  
  # Calculate percentage of job keywords found in CV
  matched_keywords = job_words.intersection(cv_words)
  keyword_match_ratio = len(matched_keywords) / len(job_words)
  
  return keyword_match_ratio


def calculate_tfidf_similarity(job_description, cv_text):
  """
  Calculate TF-IDF cosine similarity between job description and CV.
  """
  job_clean = normalize_text(job_description)
  cv_clean = normalize_text(cv_text)

  if not job_clean or not cv_clean:
    return 0.0

  # Use TF-IDF with more permissive settings (no stop words, broader n-grams)
  vectorizer = TfidfVectorizer(
    stop_words=None,  # Don't remove stop words - they matter for domain content
    ngram_range=(1, 3),  # Include 1, 2, and 3 grams for better context
    min_df=1,
    max_df=1.0,
    lowercase=True
  )
  
  try:
    tfidf_matrix = vectorizer.fit_transform([job_clean, cv_clean])
    score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return float(score)
  except Exception as e:
    print(f"Error in TF-IDF calculation: {e}")
    return 0.0


def calculate_similarity_score(job_description, cv_text):
  """
  Compute combined similarity score using multiple methods for better accuracy.
  
  Returns a score between 0.0 and 1.0
  Combines:
  - TF-IDF cosine similarity (60% weight)
  - Keyword matching (40% weight)
  """
  if not job_description or not cv_text:
    return 0.0
  
  try:
    # Get individual scores
    tfidf_score = calculate_tfidf_similarity(job_description, cv_text)
    keyword_score = calculate_keyword_match_score(job_description, cv_text)
    
    # Combine scores: TF-IDF (60%) + Keyword Match (40%)
    combined_score = (tfidf_score * 0.6) + (keyword_score * 0.4)
    
    # Cap at 1.0
    combined_score = min(combined_score, 1.0)
    
    print(f"Similarity breakdown - TF-IDF: {tfidf_score:.4f}, Keywords: {keyword_score:.4f}, Combined: {combined_score:.4f}")
    
    return float(combined_score)
  except Exception as e:
    print(f"Error calculating combined similarity: {e}")
    return 0.0

def extract_text_from_pdf_bytes(pdf_bytes):
    """Extract text from PDF bytes"""
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

@main.route('/job', methods=['POST'])
def create_job():
    """
    Create a new job description
    ---
    tags:
      - Jobs
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            description:
              type: string
              example: "Software engineer with Python experience"
            job_id:
              type: string
              example: "123"
              description: "Optional job ID from Django (will use hash if not provided)"
    responses:
      201:
        description: Job created
        schema:
          type: object
          properties:
            job_id:
              type: string
      400:
        description: Invalid input
        schema:
          type: object
          properties:
            error:
              type: string
    """
    data = request.json
    job_description = data.get('description')
    job_id = data.get('job_id')  # Optional: Get job_id from Django
    
    if not job_description or not isinstance(job_description, str):
        return jsonify({'error': 'Job description (text) is required'}), 400
    
    print(f"\n=== Saving job to ChromaDB ===")
    print(f"Job ID: {job_id if job_id else 'auto-generated'}")
    print(f"Description length: {len(job_description)} characters")
    
    # Check if job already exists
    if job_id:
        existing_job = get_job_description(job_id)
        if existing_job:
            print(f"✓ Job {job_id} already exists in ChromaDB")
            return jsonify({'job_id': job_id, 'message': 'Job already exists'}), 409
    
    saved_job_id = save_job_description(job_description, job_id=job_id)
    
    return jsonify({'job_id': saved_job_id}), 201

@main.route('/compare/<job_id>', methods=['POST'])
def compare_cv(job_id):
    """
    Compare a CV with a job description
    ---
    tags:
      - Comparison
    consumes:
      - application/json
    parameters:
      - in: path
        name: job_id
        type: string
        required: true
        description: The ID of the job description
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            cv:
              type: string
              example: "Experienced Python developer with 5 years in backend"
    responses:
      200:
        description: Similarity score
        schema:
          type: object
          properties:
            score:
              type: number
      400:
        description: Invalid input
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Job not found
        schema:
          type: object
          properties:
            error:
              type: string
    """
    data = request.json
    cv = data.get('cv')
    
    if not cv or not isinstance(cv, str):
        return jsonify({'error': 'CV (text) is required'}), 400
    
    job_description = get_job_description(job_id)
    
    if job_description is None:
        return jsonify({'error': 'Job not found'}), 404
    
    score = calculate_similarity_score(job_description, cv)
    return jsonify({'score': score}), 200


@main.route('/parsed-cv', methods=['POST'])
def store_parsed_cv():
    """
    Store parsed CV with job association and calculate similarity
    ---
    tags:
      - Parsed CV
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            cv_text:
              type: string
              example: "Experienced software engineer..."
            job_id:
              type: string
              example: "123"
              required: true
            candidate_name:
              type: string
              example: "John Doe"
            candidate_email:
              type: string
              example: "john@example.com"
            user_id:
              type: string
              example: "456"
    responses:
      201:
        description: Parsed CV stored successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
            parsed_cv_id:
              type: string
            job_id:
              type: string
            similarity_score:
              type: number
            message:
              type: string
      400:
        description: Invalid input
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Job not found
        schema:
          type: object
          properties:
            error:
              type: string
    """
    data = request.json
    cv_text = data.get('cv_text')
    job_id = data.get('job_id')
    candidate_name = data.get('candidate_name', 'Unknown')
    candidate_email = data.get('candidate_email', '')
    user_id = data.get('user_id')
    
    print(f"\n=== Storing parsed CV ===")
    print(f"Job ID: {job_id}")
    print(f"Candidate: {candidate_name} ({candidate_email})")
    print(f"User ID: {user_id}")
    print(f"CV text length: {len(cv_text) if cv_text else 0} characters")
    
    # Validate inputs
    if not cv_text or not isinstance(cv_text, str):
        return jsonify({'error': 'cv_text is required'}), 400
    
    if not job_id:
        return jsonify({'error': 'job_id is required'}), 400
    
    # Verify job exists
    job_description = get_job_description(job_id)
    if job_description is None:
        print(f"✗ Job {job_id} not found in ChromaDB")
        return jsonify({'error': f'Job {job_id} not found. Please ensure job is created first.'}), 404
    
    print(f"✓ Job {job_id} found in ChromaDB")
    
    # Generate a unique ID for this parsed CV (using timestamp + user_id + job_id)
    parsed_cv_id = f"parsed_{user_id}_{job_id}_{int(datetime.now().timestamp())}"
    
    # Prepare metadata
    metadata = {
        'candidate_name': candidate_name,
        'candidate_email': candidate_email,
        'job_id': str(job_id),
        'user_id': str(user_id) if user_id else None,
        'type': 'parsed_cv',
        'created_at': datetime.now().isoformat()
    }
    
    # Save to ChromaDB (in applications collection)
    try:
        saved_id = save_application(cv_text, application_id=parsed_cv_id, metadata=metadata)
        print(f"✓ Parsed CV saved with ID: {saved_id}")
    except Exception as e:
        print(f"✗ Error saving parsed CV: {e}")
        return jsonify({'error': f'Failed to save parsed CV: {str(e)}'}), 500
    
    # Calculate similarity score automatically
    try:
        print("Calculating similarity score...")
        similarity_score = calculate_similarity_score(job_description, cv_text)
        print(f"✓ Similarity score: {similarity_score:.4f} ({similarity_score*100:.2f}%)")
    except Exception as e:
        print(f"⚠ Error calculating similarity: {e}")
        similarity_score = None
    
    return jsonify({
        'success': True,
        'parsed_cv_id': saved_id,
        'job_id': job_id,
        'similarity_score': similarity_score,
        'message': 'Parsed CV stored and similarity calculated successfully'
    }), 201


@main.route('/application', methods=['POST'])
def submit_application():
    """
    Submit an application with CV PDF or text
    Extracts text from PDF and saves to ChromaDB
    ---
    tags:
      - Applications
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            application_id:
              type: string
              example: "app-123"
              description: "Application ID from Django"
            cv_text:
              type: string
              description: "CV text (if already extracted)"
            cv_pdf_base64:
              type: string
              description: "Base64 encoded PDF (if text not provided)"
            job_id:
              type: string
              example: "job-456"
            candidate_name:
              type: string
              example: "John Doe"
            candidate_email:
              type: string
              example: "john@example.com"
    responses:
      201:
        description: Application saved
        schema:
          type: object
          properties:
            application_id:
              type: string
            cv_text_length:
              type: integer
            saved_to_chromadb:
              type: boolean
      400:
        description: Invalid input
        schema:
          type: object
          properties:
            error:
              type: string
    """
    data = request.json
    
    application_id = data.get('application_id')
    cv_text = data.get('cv_text')
    cv_pdf_base64 = data.get('cv_pdf_base64')
    job_id = data.get('job_id')
    candidate_name = data.get('candidate_name')
    candidate_email = data.get('candidate_email')
    
    print(f"\n=== Processing application submission ===")
    print(f"Application ID: {application_id}")
    print(f"Job ID: {job_id}")
    print(f"Candidate: {candidate_name} ({candidate_email})")
    
    # Extract text from PDF if provided
    if not cv_text and cv_pdf_base64:
        print("Extracting text from PDF...")
        try:
            pdf_bytes = base64.b64decode(cv_pdf_base64)
            cv_text = extract_text_from_pdf_bytes(pdf_bytes)
            if not cv_text:
                return jsonify({'error': 'Failed to extract text from PDF'}), 400
            print(f"✓ Extracted {len(cv_text)} characters from PDF")
        except Exception as e:
            return jsonify({'error': f'Error processing PDF: {str(e)}'}), 400
    
    if not cv_text:
        return jsonify({'error': 'Either cv_text or cv_pdf_base64 is required'}), 400
    
    # Verify job exists if job_id provided
    job_description = None
    if job_id:
        job_description = get_job_description(job_id)
        if job_description is None:
            print(f"⚠ Job {job_id} not found in ChromaDB - application will be stored without job association")
        else:
            print(f"✓ Job {job_id} found in ChromaDB")
    
    # Prepare metadata
    metadata = {
        'candidate_name': candidate_name,
        'candidate_email': candidate_email,
        'job_id': str(job_id) if job_id else None,
        'type': 'application',
        'created_at': datetime.now().isoformat()
    }
    
    # Save to ChromaDB
    similarity_score = None
    try:
        saved_app_id = save_application(cv_text, application_id=application_id, metadata=metadata)
        print(f"✓ Application saved to ChromaDB with ID: {saved_app_id}")
        
        # Calculate similarity score if job exists
        if job_description:
            try:
                print("Calculating similarity score...")
                similarity_score = calculate_similarity_score(job_description, cv_text)
                print(f"✓ Similarity score: {similarity_score:.4f} ({similarity_score*100:.2f}%)")
            except Exception as e:
                print(f"⚠ Error calculating similarity: {e}")
        
        return jsonify({
            'application_id': saved_app_id,
            'cv_text_length': len(cv_text),
            'saved_to_chromadb': True,
            'job_id': job_id,
            'job_found': job_description is not None,
            'similarity_score': similarity_score
        }), 201
    except Exception as e:
        print(f"✗ Error saving application: {e}")
        return jsonify({'error': f'Failed to save application: {str(e)}'}), 500


@main.route('/search/applications', methods=['POST'])
def search_applications():
    """
    Search for similar applications based on query text
    ---
    tags:
      - Applications
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            query:
              type: string
              example: "Python developer with machine learning experience"
            job_id:
              type: string
              description: "Optional: filter by job ID"
            n_results:
              type: integer
              example: 10
              description: "Number of results to return (default: 10)"
    responses:
      200:
        description: Search results
        schema:
          type: object
          properties:
            results:
              type: array
      400:
        description: Invalid input
        schema:
          type: object
          properties:
            error:
              type: string
    """
    data = request.json
    query = data.get('query')
    job_id = data.get('job_id')
    n_results = data.get('n_results', 10)
    
    if not query:
        return jsonify({'error': 'Query text is required'}), 400
    
    results = search_similar_applications(query, job_id=job_id, n_results=n_results)
    
    if results:
        return jsonify({'results': results}), 200
    else:
        return jsonify({'results': []}), 200


# ==================== INTERVIEW ROUTES ====================

from .interview_service import interview_service
from .tts_service import tts_service
from .stt_service import stt_service

@main.route('/interview/start', methods=['POST'])
def start_interview():
    """
    Start an interview session by generating the first question
    ---
    tags:
      - Interview
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            job_description:
              type: string
              required: true
            resume_summary:
              type: string
              required: true
            interview_id:
              type: string
              description: Optional interview ID for tracking
    responses:
      200:
        description: Initial interview question
        schema:
          type: object
          properties:
            success:
              type: boolean
            question:
              type: string
            type:
              type: string
      400:
        description: Invalid input
    """
    data = request.json
    job_description = data.get('job_description', '')
    resume_summary = data.get('resume_summary', '')
    
    if not job_description:
        return jsonify({'error': 'Job description is required'}), 400
    
    print(f"\n=== Starting Interview ===")
    print(f"Job description length: {len(job_description)}")
    print(f"Resume summary length: {len(resume_summary)}")
    
    result = interview_service.generate_initial_question(job_description, resume_summary)
    
    # Generate audio for the question using TTS
    if result.get('success') and result.get('question'):
        audio_result = tts_service.text_to_speech(result['question'])
        if audio_result:
            result['audio'] = audio_result
    
    return jsonify(result), 200


@main.route('/interview/next-question', methods=['POST'])
def get_next_question():
    """
    Get the next interview question based on conversation history
    ---
    tags:
      - Interview
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            job_description:
              type: string
              required: true
            resume_summary:
              type: string
            conversation_history:
              type: array
              items:
                type: object
                properties:
                  role:
                    type: string
                  content:
                    type: string
            question_number:
              type: integer
              required: true
            total_questions:
              type: integer
              default: 5
    responses:
      200:
        description: Next interview question
        schema:
          type: object
          properties:
            success:
              type: boolean
            question:
              type: string
            question_number:
              type: integer
      400:
        description: Invalid input
    """
    data = request.json
    job_description = data.get('job_description', '')
    resume_summary = data.get('resume_summary', '')
    conversation_history = data.get('conversation_history', [])
    question_number = data.get('question_number', 1)
    total_questions = data.get('total_questions', 5)
    
    if not job_description:
        return jsonify({'error': 'Job description is required'}), 400
    
    print(f"\n=== Getting Question {question_number}/{total_questions} ===")
    
    result = interview_service.generate_followup_question(
        job_description,
        resume_summary,
        conversation_history,
        question_number,
        total_questions
    )
    
    # Generate audio for the question using TTS
    if result.get('success') and result.get('question'):
        audio_result = tts_service.text_to_speech(result['question'])
        if audio_result:
            result['audio'] = audio_result
    
    return jsonify(result), 200


@main.route('/interview/evaluate-answer', methods=['POST'])
def evaluate_answer():
    """
    Evaluate a single interview answer
    ---
    tags:
      - Interview
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            job_description:
              type: string
              required: true
            question:
              type: string
              required: true
            answer:
              type: string
              required: true
            resume_summary:
              type: string
    responses:
      200:
        description: Answer evaluation
        schema:
          type: object
          properties:
            success:
              type: boolean
            score:
              type: integer
            feedback:
              type: string
      400:
        description: Invalid input
    """
    data = request.json
    job_description = data.get('job_description', '')
    question = data.get('question', '')
    answer = data.get('answer', '')
    resume_summary = data.get('resume_summary', '')
    
    if not question or not answer:
        return jsonify({'error': 'Question and answer are required'}), 400
    
    print(f"\n=== Evaluating Answer ===")
    print(f"Question: {question[:100]}...")
    print(f"Answer length: {len(answer)}")
    
    result = interview_service.evaluate_answer(
        job_description,
        question,
        answer,
        resume_summary
    )
    
    return jsonify(result), 200


@main.route('/interview/evaluate', methods=['POST'])
def evaluate_full_interview():
    """
    Evaluate the complete interview and provide final assessment
    ---
    tags:
      - Interview
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            job_description:
              type: string
              required: true
            resume_summary:
              type: string
            conversation_history:
              type: array
              items:
                type: object
            answer_scores:
              type: array
              items:
                type: object
    responses:
      200:
        description: Full interview evaluation
        schema:
          type: object
          properties:
            success:
              type: boolean
            overall_score:
              type: integer
            recommendation:
              type: string
            summary:
              type: string
      400:
        description: Invalid input
    """
    data = request.json
    job_description = data.get('job_description', '')
    resume_summary = data.get('resume_summary', '')
    conversation_history = data.get('conversation_history', [])
    answer_scores = data.get('answer_scores', [])
    
    if not job_description:
        return jsonify({'error': 'Job description is required'}), 400
    
    print(f"\n=== Evaluating Full Interview ===")
    print(f"Total exchanges: {len(conversation_history)}")
    print(f"Answer scores: {len(answer_scores)}")
    
    result = interview_service.evaluate_full_interview(
        job_description,
        resume_summary,
        conversation_history,
        answer_scores
    )
    
    return jsonify(result), 200


@main.route('/tts/convert', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech using ElevenLabs API
    ---
    tags:
      - Text-to-Speech
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            text:
              type: string
              required: true
              description: The text to convert to speech
    responses:
      200:
        description: Audio generated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
            audio_base64:
              type: string
              description: Base64 encoded MP3 audio
            format:
              type: string
      400:
        description: Invalid input or TTS unavailable
    """
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    if not tts_service.is_available():
        return jsonify({'error': 'TTS service is not available. Check ELEVENLABS_API_KEY.'}), 400
    
    print(f"\n=== Converting Text to Speech ===")
    print(f"Text length: {len(text)} characters")
    
    result = tts_service.text_to_speech(text)
    
    if result:
        return jsonify({
            'success': True,
            **result
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': 'TTS conversion failed'
        }), 500


@main.route('/tts/status', methods=['GET'])
def tts_status():
    """
    Check if TTS service is available
    ---
    tags:
      - Text-to-Speech
    responses:
      200:
        description: TTS service status
        schema:
          type: object
          properties:
            available:
              type: boolean
            voice_id:
              type: string
            model_id:
              type: string
    """
    return jsonify({
        'available': tts_service.is_available(),
        'voice_id': tts_service.voice_id,
        'model_id': tts_service.model_id
    }), 200


@main.route('/stt/transcribe', methods=['POST'])
def speech_to_text():
    """
    Transcribe candidate audio to text using ElevenLabs STT API
    ---
    tags:
      - Speech-to-Text
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: audio
        type: file
        required: true
        description: Audio blob recorded from candidate microphone
    responses:
      200:
        description: Audio transcribed successfully
      400:
        description: Invalid input or STT unavailable
      500:
        description: STT processing failed
    """
    if not stt_service.is_available():
        return jsonify({'error': 'STT service is not available. Check ELEVENLABS_STT_API_KEY or ELEVENLABS_API_KEY.'}), 400

    audio_file = request.files.get('audio')
    if not audio_file:
        return jsonify({'error': 'Audio file is required (form field: audio)'}), 400

    try:
        audio_bytes = audio_file.read()
        if not audio_bytes:
            return jsonify({'error': 'Audio file is empty'}), 400

        result = stt_service.transcribe_audio(audio_bytes, filename=audio_file.filename or 'candidate-answer.webm')
        if result is None:
            return jsonify({'success': False, 'error': 'STT transcription failed'}), 500

        return jsonify({'success': True, **result}), 200
    except Exception as exc:
        return jsonify({'success': False, 'error': f'Failed to transcribe audio: {str(exc)}'}), 500


@main.route('/stt/status', methods=['GET'])
def stt_status():
    """Check STT service status."""
    return jsonify({
        'available': stt_service.is_available(),
        'model_id': stt_service.model_id,
        'language_code': stt_service.language_code,
    }), 200
