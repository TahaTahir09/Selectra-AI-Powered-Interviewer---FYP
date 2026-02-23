"""
CV Parsing API Views
"""
import os
import tempfile
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .cv_parser import cv_parser

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_cv_endpoint(request):
    """Test endpoint to verify CV parsing is accessible"""
    return Response({
        'status': 'ok',
        'message': 'CV parsing endpoint is accessible',
        'user': str(request.user),
        'openrouter_key_set': bool(os.getenv('OPENROUTER_API_KEY'))
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_cv_api(request):
    """
    Parse uploaded CV and return extracted data
    
    Expected: multipart/form-data with 'cv_file' field and optional 'job_id' field
    Returns: JSON with parsed CV data
    """
    
    if 'cv_file' not in request.FILES:
        return Response(
            {'success': False, 'error': 'No CV file uploaded'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get job_id from request (optional)
    job_id = request.data.get('job_id', None)
    
    cv_file = request.FILES['cv_file']
    
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc']
    file_ext = os.path.splitext(cv_file.name)[1].lower()
    
    if file_ext not in allowed_extensions:
        return Response(
            {'success': False, 'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024
    if cv_file.size > max_size:
        return Response(
            {'success': False, 'error': 'File too large. Maximum size is 5MB'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            for chunk in cv_file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name
        
        logger.info(f"CV file saved to: {tmp_file_path}")
        
        # Parse CV with enhanced method (uses Aurora Alpha if API key is set)
        use_llm = request.query_params.get('use_llm', 'true').lower() == 'true'
        
        logger.info(f"Starting CV parsing with use_llm={use_llm}")
        parsed_data = cv_parser.parse_cv_enhanced(tmp_file_path, use_llm=use_llm)
        
        logger.info(f"Parser returned: parsing_method={parsed_data.get('parsing_method')}, has_error={bool(parsed_data.get('error'))}")
        logger.info(f"Parsed data keys: {list(parsed_data.keys())[:10]}")
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        # Check if parsing returned data
        if not parsed_data:
            return Response({
                'success': False,
                'error': 'Parser returned empty data',
                'data': {
                    'full_name': '',
                    'email': '',
                    'phone': '',
                    'location': '',
                    'summary': '',
                    'skills': [],
                    'experience': [],
                    'education': [],
                    'certifications': [],
                    'languages': [],
                    'linkedin': '',
                    'github': '',
                    'total_experience': '',
                    'parsing_method': 'failed'
                }
            }, status=status.HTTP_200_OK)
        
        # Check if there was a parsing error
        parsing_method = parsed_data.get('parsing_method', 'unknown')
        has_error = parsed_data.get('error') or parsing_method == 'failed'
        
        if has_error:
            return Response({
                'success': False,
                'error': parsed_data.get('error', 'Unknown parsing error'),
                'data': {
                    'full_name': parsed_data.get('full_name', ''),
                    'email': parsed_data.get('email', ''),
                    'phone': parsed_data.get('phone', ''),
                    'location': parsed_data.get('location', ''),
                    'summary': parsed_data.get('summary', ''),
                    'skills': parsed_data.get('skills', []),
                    'experience': parsed_data.get('experience', []),
                    'education': parsed_data.get('education', []),
                    'certifications': parsed_data.get('certifications', []),
                    'languages': parsed_data.get('languages', []),
                    'linkedin': parsed_data.get('linkedin', ''),
                    'github': parsed_data.get('github', ''),
                    'total_experience': parsed_data.get('total_experience', ''),
                    'parsing_method': 'failed'
                }
            }, status=status.HTTP_200_OK)
        
        # Success - now send to Flask server for storage if job_id provided
        if job_id:
            try:
                import requests
                from .models import JobPost
                
                # First, ensure job exists in Django and Flask
                logger.info(f"Ensuring job {job_id} exists on Flask server")
                try:
                    job = JobPost.objects.get(id=job_id)
                    flask_url = os.getenv('FLASK_AI_SERVICE_URL', 'http://localhost:5000')
                    
                    # Check if job exists on Flask, if not, create it
                    logger.info(f"Sending job {job_id} to Flask server")
                    job_response = requests.post(
                        f"{flask_url}/job",
                        json={
                            'description': job.job_description,
                            'job_id': str(job.id)
                        },
                        timeout=10
                    )
                    
                    if job_response.status_code in [201, 409]:  # 201 Created or 409 Already exists
                        logger.info(f"✓ Job {job_id} available on Flask server")
                    else:
                        logger.warning(f"⚠ Unexpected response for job creation: {job_response.status_code}")
                        
                except JobPost.DoesNotExist:
                    logger.error(f"Job {job_id} not found in Django database")
                    parsed_data['stored_on_flask'] = False
                    return Response({
                        'success': True,
                        'data': parsed_data,
                        'message': 'CV parsed successfully',
                        'parsing_method': parsing_method,
                        'warning': f'Job {job_id} not found'
                    }, status=status.HTTP_200_OK)
                
                # Build CV text from parsed data for Flask storage
                cv_text_parts = []
                if parsed_data.get('summary'):
                    cv_text_parts.append(parsed_data['summary'])
                if parsed_data.get('skills'):
                    skills = parsed_data['skills']
                    if isinstance(skills, list):
                        cv_text_parts.append(' '.join(skills))
                    elif isinstance(skills, str):
                        cv_text_parts.append(skills)
                if parsed_data.get('experience'):
                    exp = parsed_data['experience']
                    if isinstance(exp, list):
                        for e in exp:
                            if isinstance(e, dict):
                                cv_text_parts.append(f"{e.get('title', '')} at {e.get('company', '')}. {e.get('description', '')}")
                            else:
                                cv_text_parts.append(str(e))
                    elif isinstance(exp, str):
                        cv_text_parts.append(exp)
                if parsed_data.get('education'):
                    edu = parsed_data['education']
                    if isinstance(edu, list):
                        for e in edu:
                            if isinstance(e, dict):
                                cv_text_parts.append(f"{e.get('degree', '')} from {e.get('institution', '')}")
                            else:
                                cv_text_parts.append(str(e))
                    elif isinstance(edu, str):
                        cv_text_parts.append(edu)
                
                cv_text = ' '.join(cv_text_parts)
                
                if cv_text:
                    candidate_name = parsed_data.get('full_name', request.user.get_full_name() or request.user.username)
                    candidate_email = parsed_data.get('email', request.user.email)
                    
                    logger.info(f"Sending parsed CV to Flask for job_id={job_id}")
                    
                    # Send to Flask immediately after parsing
                    flask_response = requests.post(
                        f"{flask_url}/parsed-cv",
                        json={
                            'cv_text': cv_text,
                            'job_id': str(job_id),
                            'candidate_name': candidate_name,
                            'candidate_email': candidate_email,
                            'user_id': str(request.user.id)
                        },
                        timeout=10
                    )
                    
                    if flask_response.status_code == 201:
                        result = flask_response.json()
                        logger.info(f"✓ Parsed CV stored on Flask for job {job_id}")
                        parsed_data['stored_on_flask'] = True
                        parsed_data['similarity_score'] = result.get('similarity_score')
                    else:
                        logger.warning(f"⚠ Failed to store on Flask: {flask_response.status_code}")
                        parsed_data['stored_on_flask'] = False
                else:
                    logger.warning("No CV text extracted to send to Flask")
                    parsed_data['stored_on_flask'] = False
                    
            except Exception as e:
                logger.error(f"Error sending parsed CV to Flask: {e}")
                import traceback
                traceback.print_exc()
                parsed_data['stored_on_flask'] = False
        
        # Return parsed data
        return Response({
            'success': True,
            'data': parsed_data,
            'message': 'CV parsed successfully',
            'parsing_method': parsing_method
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Clean up temp file if it exists
        if 'tmp_file_path' in locals():
            try:
                os.unlink(tmp_file_path)
            except Exception:
                pass
        
        # Always return successful response with empty data so form can be filled manually
        return Response({
            'success': False,
            'error': f'Parsing error: {str(e)}',
            'message': 'Please fill the form manually',
            'data': {
                'full_name': '',
                'email': '',
                'phone': '',
                'location': '',
                'summary': '',
                'skills': [],
                'experience': [],
                'education': [],
                'certifications': [],
                'languages': [],
                'linkedin': '',
                'github': '',
                'total_experience': '',
                'parsing_method': 'failed'
            }
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_cv_text(request):
    """
    Parse CV from raw text (for testing/debugging)
    
    Expected: JSON with 'text' field
    Returns: JSON with parsed data
    """
    if 'text' not in request.data:
        return Response(
            {'success': False, 'error': 'No text provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    text = request.data['text']
    
    try:
        # Create temp file with text
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8') as tmp_file:
            tmp_file.write(text)
            tmp_file_path = tmp_file.name
        
        # Parse
        use_llm = request.data.get('use_llm', True)
        parsed_data = cv_parser.parse_cv_enhanced(tmp_file_path, use_llm=use_llm)
        
        # Clean up
        os.unlink(tmp_file_path)
        
        return Response({
            'success': True,
            'data': parsed_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'success': False, 'error': f'Error parsing text: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
