"""
Test CV parsing to debug issues
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = backend_path / '.env'
load_dotenv(env_path)

# Set Django settings
os.environ.setdefault('DJANGO_SECRET_KEY', 'test-key')
os.environ.setdefault('DEBUG', 'True')

# Check if OpenRouter API key is loaded
print("Environment Check:")
print(f"  OPENROUTER_API_KEY: {'✓ Set' if os.getenv('OPENROUTER_API_KEY') else '✗ Not set'}")
print()

from core.cv_parser import cv_parser

def test_basic_parsing():
    """Test basic text parsing"""
    test_text = """
    John Doe
    Email: john.doe@example.com
    Phone: +1-555-1234
    
    Experience:
    Senior Software Engineer at Tech Corp (2020-2023)
    
    Skills: Python, JavaScript, React, Django
    
    Education:
    Bachelor of Science in Computer Science
    University of Technology (2016-2020)
    """
    
    print("Testing basic text extraction...")
    
    # Test individual extractors
    print(f"Email: {cv_parser.extract_email(test_text)}")
    print(f"Phone: {cv_parser.extract_phone(test_text)}")
    print(f"Skills: {cv_parser.extract_skills(test_text)}")
    print(f"Name (NER): {cv_parser.extract_name_ner(test_text)}")
    
    print("\nBasic parsing works!")

def test_pdf_parsing():
    """Test PDF parsing - requires a sample PDF CV"""
    print("\n" + "="*60)
    print("Testing PDF CV Parsing")
    print("="*60)
    
    # Look for sample PDF in current directory
    sample_files = list(Path('.').glob('*.pdf')) + list(Path('..').glob('*.pdf'))
    
    if not sample_files:
        print("No PDF files found in current or parent directory.")
        print("Please place a sample CV PDF file here and run again.")
        return False
    
    pdf_file = sample_files[0]
    print(f"\nTesting with: {pdf_file.name}")
    
    try:
        # Test text extraction
        print("\n1. Extracting text from PDF...")
        text = cv_parser.extract_text_from_pdf(str(pdf_file))
        print(f"   Extracted {len(text)} characters")
        print(f"   First 200 chars: {text[:200]}...")
        
        # Test full parsing (without LLM)
        print("\n2. Running NER/NLP parsing...")
        parsed_data = cv_parser.parse_cv(str(pdf_file))
        
        print("\n3. Parsed Results:")
        print(f"   Name: {parsed_data.get('name', 'N/A')}")
        print(f"   Email: {parsed_data.get('email', 'N/A')}")
        print(f"   Phone: {parsed_data.get('phone', 'N/A')}")
        print(f"   Location: {parsed_data.get('location', 'N/A')}")
        print(f"   Skills: {len(parsed_data.get('skills', []))} found")
        print(f"   Education: {len(parsed_data.get('education', []))} entries")
        print(f"   Experience: {len(parsed_data.get('work_experience', []))} entries")
        print(f"   LinkedIn: {parsed_data.get('linkedin', 'N/A')}")
        print(f"   GitHub: {parsed_data.get('github', 'N/A')}")
        
        # Test enhanced parsing with LLM (if API key is set)
        if os.getenv('OPENROUTER_API_KEY'):
            print("\n4. Running LLM-enhanced parsing with OpenRouter...")
            enhanced_data = cv_parser.parse_cv_enhanced(str(pdf_file), use_llm=True)
            print(f"   Parsing method: {enhanced_data.get('parsing_method', 'unknown')}")
            print(f"   Full name: {enhanced_data.get('full_name', 'N/A')}")
            print(f"   Summary: {enhanced_data.get('summary', 'N/A')[:100]}...")
        else:
            print("\n4. Skipping LLM parsing (OPENROUTER_API_KEY not set)")
        
        print("\n✅ PDF parsing successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error parsing PDF: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_docx_parsing():
    """Test DOCX parsing"""
    print("\n" + "="*60)
    print("Testing DOCX CV Parsing")
    print("="*60)
    
    # Look for sample DOCX in current directory
    sample_files = list(Path('.').glob('*.docx')) + list(Path('..').glob('*.docx'))
    
    if not sample_files:
        print("No DOCX files found.")
        return False
    
    docx_file = sample_files[0]
    print(f"\nTesting with: {docx_file.name}")
    
    try:
        text = cv_parser.extract_text_from_docx(str(docx_file))
        print(f"Extracted {len(text)} characters")
        
        parsed_data = cv_parser.parse_cv(str(docx_file))
        print(f"Name: {parsed_data.get('name', 'N/A')}")
        print(f"Email: {parsed_data.get('email', 'N/A')}")
        
        print("\n✅ DOCX parsing successful!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    try:
        test_basic_parsing()
        
        print("\n" + "="*60)
        print("Now testing with actual CV files...")
        print("="*60)
        
        pdf_ok = test_pdf_parsing()
        docx_ok = test_docx_parsing()
        
        print("\n" + "="*60)
        print("Test Summary:")
        print("="*60)
        print(f"Basic parsing: ✅")
        print(f"PDF parsing: {'✅' if pdf_ok else '⚠️  (no PDF found)'}")
        print(f"DOCX parsing: {'✅' if docx_ok else '⚠️  (no DOCX found)'}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

