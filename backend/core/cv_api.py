"""
CV Parsing API Views
"""
import os
import tempfile
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .cv_parser import cv_parser


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
    
    Expected: multipart/form-data with 'cv_file' field
    Returns: JSON with parsed CV data
    """
    print("=" * 60)
    print("CV PARSE REQUEST RECEIVED")
    print(f"User: {request.user}")
    print(f"Files: {request.FILES.keys()}")
    print("=" * 60)
    
    if 'cv_file' not in request.FILES:
        print("ERROR: No cv_file in request.FILES")
        return Response(
            {'error': 'No CV file uploaded'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cv_file = request.FILES['cv_file']
    
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc']
    file_ext = os.path.splitext(cv_file.name)[1].lower()
    
    if file_ext not in allowed_extensions:
        return Response(
            {'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024
    if cv_file.size > max_size:
        return Response(
            {'error': 'File too large. Maximum size is 5MB'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        print(f"Processing file: {cv_file.name}, size: {cv_file.size} bytes")
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            for chunk in cv_file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name
        
        print(f"Saved to temp file: {tmp_file_path}")
        
        # Parse CV with enhanced method (uses DeepSeek if API key is set)
        use_llm = request.query_params.get('use_llm', 'true').lower() == 'true'
        print(f"Parsing with LLM: {use_llm}")
        
        parsed_data = cv_parser.parse_cv_enhanced(tmp_file_path, use_llm=use_llm)
        
        print(f"Parsing result: {parsed_data.get('parsing_method', 'unknown')}")
        print(f"Extracted name: {parsed_data.get('full_name', 'N/A')}")
        print(f"Extracted email: {parsed_data.get('email', 'N/A')}")
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        print("Temp file cleaned up")
        
        # Check if there was a parsing error
        if parsed_data.get('parsing_method') == 'failed':
            print(f"PARSING FAILED: {parsed_data.get('error')}")
            return Response({
                'success': False,
                'error': parsed_data.get('error', 'Unknown parsing error'),
                'data': parsed_data
            }, status=status.HTTP_200_OK)  # Still return 200 with empty data
        
        print("Returning successful response")
        return Response({
            'success': True,
            'data': parsed_data,
            'message': 'CV parsed successfully',
            'parsing_method': parsed_data.get('parsing_method', 'unknown')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"CV Parsing Error: {error_trace}")
        
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
            {'error': 'No text provided'},
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
            {'error': f'Error parsing text: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
