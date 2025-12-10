from flask import Blueprint, request, jsonify
from .chromadb_utils import save_job_description, get_job_description
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

main = Blueprint('main', __name__)

_vectorizer = TfidfVectorizer()

def vectorize_text(text):
    # Fit or transform depending on whether vocabulary exists
    if not hasattr(_vectorizer, 'vocabulary_') or not _vectorizer.vocabulary_:
        return _vectorizer.fit_transform([text]).toarray()[0]
    else:
        return _vectorizer.transform([text]).toarray()[0]

def compare_vectors(vec1, vec2):
    # Cosine similarity
    if np.linalg.norm(vec1) == 0 or np.linalg.norm(vec2) == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

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
    
    if not job_description or not isinstance(job_description, str):
        return jsonify({'error': 'Job description (text) is required'}), 400
    
    job_id = save_job_description(job_description)
    return jsonify({'job_id': job_id}), 201

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
    
    job_vector = vectorize_text(job_description)
    cv_vector = vectorize_text(cv)
    
    score = compare_vectors(job_vector, cv_vector)
    return jsonify({'score': score}), 200