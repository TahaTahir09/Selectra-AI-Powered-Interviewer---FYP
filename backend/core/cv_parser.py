"""
CV Parser using DeepSeek LLM, NLP, and NER techniques
Extracts structured information from resumes/CVs
"""
import os
import re
import json
import PyPDF2
import docx
from typing import Dict, Any, List, Optional
from datetime import datetime
import spacy
from collections import defaultdict
from openai import OpenAI
import google.generativeai as genai
from pathlib import Path

# Load spaCy model for NER
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If model not found, download it
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")


class CVParser:
    """Parse CV/Resume and extract structured information"""
    
    def __init__(self):
        self.skills_keywords = [
            # Programming Languages
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 
            'swift', 'kotlin', 'go', 'rust', 'scala', 'r', 'matlab', 'perl',
            
            # Web Technologies
            'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 
            'flask', 'fastapi', 'spring', 'asp.net', 'laravel', 'next.js', 'nuxt.js',
            
            # Databases
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'oracle',
            'sqlite', 'dynamodb', 'firebase', 'elasticsearch',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 
            'github actions', 'terraform', 'ansible', 'ci/cd', 'devops',
            
            # Data Science & AI
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow',
            'pytorch', 'scikit-learn', 'pandas', 'numpy', 'keras', 'opencv',
            
            # Mobile
            'android', 'ios', 'react native', 'flutter', 'xamarin',
            
            # Other Technologies
            'git', 'rest api', 'graphql', 'microservices', 'agile', 'scrum',
            'jira', 'linux', 'windows', 'macos', 'blockchain', 'solidity'
        ]
        
        self.education_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'mba', 'b.tech', 'm.tech',
            'b.sc', 'm.sc', 'b.e', 'm.e', 'diploma', 'associate', 'undergraduate',
            'graduate', 'postgraduate', 'university', 'college', 'institute'
        ]
        
        self.experience_keywords = [
            'experience', 'work experience', 'employment', 'professional experience',
            'work history', 'career', 'positions held'
        ]
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
        return text
    
    def extract_text_from_pdf_with_gemini(self, file_path: str) -> str:
        """Extract text from PDF using Google Gemini API (supports images, tables, complex layouts)"""
        try:
            api_key = os.getenv('GEMINI_API_KEY', '')
            
            if not api_key:
                print("GEMINI_API_KEY not set, falling back to PyPDF2")
                return self.extract_text_from_pdf(file_path)
            
            # Configure Gemini
            genai.configure(api_key=api_key)
            
            # Upload the PDF file
            print(f"Uploading PDF to Gemini: {file_path}")
            uploaded_file = genai.upload_file(file_path)
            print(f"Upload complete: {uploaded_file.name}")
            
            # Use Gemini Pro Vision model to extract text
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = """Extract ALL text content from this PDF document. 
            Include:
            - All text from every page
            - Text from tables and structured data
            - Text embedded in images (if any)
            - Preserve formatting and structure where possible
            
            Return the complete text content."""
            
            print("Gemini processing PDF...")
            response = model.generate_content([uploaded_file, prompt])
            
            text = response.text
            print(f"Extracted {len(text)} characters from PDF using Gemini")
            
            # Clean up the uploaded file
            genai.delete_file(uploaded_file.name)
            
            return text
            
        except Exception as e:
            print(f"Gemini PDF extraction failed: {str(e)}")
            print("Falling back to PyPDF2 extraction")
            return self.extract_text_from_pdf(file_path)
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            print(f"Error reading DOCX: {e}")
        return text
    
    def extract_text(self, file_path: str, use_gemini: bool = True) -> str:
        """Extract text from CV file (PDF or DOCX)"""
        if file_path.lower().endswith('.pdf'):
            if use_gemini and os.getenv('GEMINI_API_KEY'):
                return self.extract_text_from_pdf_with_gemini(file_path)
            else:
                return self.extract_text_from_pdf(file_path)
        elif file_path.lower().endswith(('.docx', '.doc')):
            return self.extract_text_from_docx(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
    
    def extract_email(self, text: str) -> Optional[str]:
        """Extract email using regex"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return emails[0] if emails else None
    
    def extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number using regex - enhanced patterns"""
        phone_patterns = [
            r'\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}',  # International
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # US/Standard
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # US format
            r'\+?\d{10,15}',  # Simple international
            r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',  # Simple format
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                # Clean up the phone number
                phone = phones[0].strip()
                if len(phone.replace('-', '').replace('.', '').replace(' ', '').replace('(', '').replace(')', '')) >= 10:
                    return phone
        return None
    
    def extract_name_ner(self, text: str) -> Optional[str]:
        """Extract name using NER"""
        doc = nlp(text[:500])  # Process first 500 chars
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text
        return None
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract skills using keyword matching"""
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.skills_keywords:
            if skill in text_lower:
                found_skills.append(skill.title())
        
        # Remove duplicates and return
        return list(set(found_skills))
    
    def extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information"""
        education_list = []
        text_lower = text.lower()
        lines = text.split('\n')
        
        # Find education section
        education_section_start = -1
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in ['education', 'academic', 'qualification']):
                education_section_start = i
                break
        
        if education_section_start == -1:
            return education_list
        
        # Extract education entries
        current_education = {}
        for i in range(education_section_start, min(education_section_start + 20, len(lines))):
            line = lines[i].strip()
            
            # Look for degree
            for keyword in self.education_keywords:
                if keyword in line.lower():
                    degree_match = re.search(r'(bachelor|master|phd|b\.tech|m\.tech|b\.sc|m\.sc|b\.e|m\.e|mba|diploma)[\w\s.]*', line, re.IGNORECASE)
                    if degree_match:
                        current_education['degree'] = degree_match.group(0).strip()
            
            # Look for year
            year_match = re.findall(r'\b(19|20)\d{2}\b', line)
            if year_match and 'year' not in current_education:
                current_education['year'] = year_match[-1]
            
            # Look for institution
            if 'university' in line.lower() or 'college' in line.lower() or 'institute' in line.lower():
                current_education['institution'] = line.strip()
            
            # If we have collected some education info, save it
            if current_education and len(current_education) >= 2:
                education_list.append(current_education.copy())
                current_education = {}
        
        return education_list[:3]  # Return top 3
    
    def extract_experience_years(self, text: str) -> Optional[str]:
        """Extract years of experience"""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s+)?experience',
            r'experience\s*:?\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s*(?:of\s+)?experience'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return f"{match.group(1)} years"
        
        return None
    
    def extract_work_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience details"""
        experiences = []
        lines = text.split('\n')
        
        # Find experience section
        experience_section_start = -1
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in self.experience_keywords):
                experience_section_start = i
                break
        
        if experience_section_start == -1:
            return experiences
        
        current_job = {}
        for i in range(experience_section_start, min(experience_section_start + 30, len(lines))):
            line = lines[i].strip()
            
            # Look for job title
            if any(title in line.lower() for title in ['developer', 'engineer', 'manager', 'analyst', 'designer', 'consultant']):
                if current_job:
                    experiences.append(current_job.copy())
                current_job = {'title': line}
            
            # Look for company
            if any(word in line.lower() for word in ['company', 'corporation', 'inc', 'ltd', 'pvt']):
                current_job['company'] = line
            
            # Look for duration
            year_matches = re.findall(r'\b(19|20)\d{2}\b', line)
            if len(year_matches) >= 2:
                current_job['duration'] = f"{year_matches[0]} - {year_matches[1]}"
            elif len(year_matches) == 1:
                current_job['duration'] = f"{year_matches[0]} - Present"
        
        if current_job:
            experiences.append(current_job)
        
        return experiences[:3]  # Return top 3
    
    def extract_linkedin(self, text: str) -> Optional[str]:
        """Extract LinkedIn URL"""
        linkedin_pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+'
        match = re.search(linkedin_pattern, text, re.IGNORECASE)
        return match.group(0) if match else None
    
    def extract_github(self, text: str) -> Optional[str]:
        """Extract GitHub URL"""
        github_pattern = r'(?:https?://)?(?:www\.)?github\.com/[\w-]+'
        match = re.search(github_pattern, text, re.IGNORECASE)
        return match.group(0) if match else None
    
    def extract_portfolio(self, text: str) -> Optional[str]:
        """Extract portfolio/website URL"""
        # Skip email and known platforms
        url_pattern = r'(?:https?://)?(?:www\.)?(?!linkedin|github|facebook|twitter|instagram)[\w-]+\.[\w-]+(?:/[\w-]*)*'
        matches = re.findall(url_pattern, text, re.IGNORECASE)
        for match in matches:
            if '@' not in match and len(match) > 5:  # Exclude emails
                return match
        return None
    
    def extract_location(self, text: str) -> Optional[str]:
        """Extract location using NER and patterns"""
        doc = nlp(text[:1000])
        locations = []
        for ent in doc.ents:
            if ent.label_ in ["GPE", "LOC"]:  # Geo-Political Entity or Location
                locations.append(ent.text)
        
        # Also look for address patterns
        if not locations:
            address_pattern = r'(?:Address|Location|City)[\s:]+([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+)*)'
            match = re.search(address_pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return locations[0] if locations else None
    
    def extract_date_of_birth(self, text: str) -> Optional[str]:
        """Extract date of birth"""
        dob_patterns = [
            r'(?:DOB|Date of Birth|Born)[\s:]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            r'(?:DOB|Date of Birth|Born)[\s:]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})'
        ]
        for pattern in dob_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    def extract_nationality(self, text: str) -> Optional[str]:
        """Extract nationality"""
        nationality_pattern = r'(?:Nationality|Citizen)[\s:]+([A-Z][a-z]+)'
        match = re.search(nationality_pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Common nationalities
        nationalities = ['American', 'British', 'Canadian', 'Indian', 'Pakistani', 'Chinese', 
                        'German', 'French', 'Japanese', 'Australian', 'Mexican', 'Brazilian']
        for nat in nationalities:
            if nat.lower() in text.lower():
                return nat
        return None
    
    def extract_summary(self, text: str) -> Optional[str]:
        """Extract professional summary/objective"""
        lines = text.split('\n')
        summary_keywords = ['summary', 'objective', 'profile', 'about', 'overview']
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in summary_keywords):
                # Get next 3-5 lines as summary
                summary_lines = []
                for j in range(i+1, min(i+6, len(lines))):
                    if lines[j].strip() and not any(section in lines[j].lower() 
                        for section in ['experience', 'education', 'skills', 'projects']):
                        summary_lines.append(lines[j].strip())
                    else:
                        break
                if summary_lines:
                    return ' '.join(summary_lines)
        return None
    
    def extract_current_position(self, text: str) -> Optional[str]:
        """Extract current job title/position"""
        position_keywords = ['currently', 'present', 'current position', 'working as']
        lines = text.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in position_keywords):
                # Extract job title
                job_titles = ['developer', 'engineer', 'manager', 'analyst', 'designer', 
                            'consultant', 'architect', 'lead', 'senior', 'junior', 'intern',
                            'director', 'specialist', 'coordinator', 'assistant']
                for title in job_titles:
                    if title in line.lower():
                        return line.strip()
        
        # Check first work experience
        experiences = self.extract_work_experience(text)
        if experiences and 'title' in experiences[0]:
            return experiences[0]['title']
        return None
    
    def extract_current_company(self, text: str) -> Optional[str]:
        """Extract current company name"""
        experiences = self.extract_work_experience(text)
        if experiences and 'company' in experiences[0]:
            # Check if it's current (has "Present" or recent year)
            if 'duration' in experiences[0] and 'present' in experiences[0]['duration'].lower():
                return experiences[0]['company']
        return None
    
    def extract_languages(self, text: str) -> List[str]:
        """Extract spoken languages"""
        languages_section = False
        languages = []
        lines = text.split('\n')
        
        common_languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
                          'Arabic', 'Hindi', 'Urdu', 'Portuguese', 'Russian', 'Italian',
                          'Korean', 'Dutch', 'Turkish', 'Polish', 'Swedish', 'Norwegian']
        
        for i, line in enumerate(lines):
            if 'language' in line.lower():
                languages_section = True
                # Check next few lines
                for j in range(i, min(i+10, len(lines))):
                    for lang in common_languages:
                        if lang.lower() in lines[j].lower() and lang not in languages:
                            languages.append(lang)
                break
        
        return languages if languages else ['English']  # Default to English
    
    def extract_certifications(self, text: str) -> List[str]:
        """Extract certifications"""
        certifications = []
        lines = text.split('\n')
        cert_section = False
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in ['certification', 'certificate', 'licenses']):
                cert_section = True
                # Get next 5-10 lines
                for j in range(i+1, min(i+10, len(lines))):
                    cert_line = lines[j].strip()
                    if cert_line and len(cert_line) > 5:
                        # Check if it's a section header
                        if any(section in cert_line.lower() for section in 
                              ['experience', 'education', 'skills', 'project']):
                            break
                        certifications.append(cert_line)
                break
        
        return certifications[:5]  # Top 5
    
    def extract_references(self, text: str) -> Optional[str]:
        """Extract references information"""
        if 'references available' in text.lower():
            return 'Available upon request'
        elif 'reference' in text.lower():
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if 'reference' in line.lower():
                    # Get next 2-3 lines
                    ref_lines = []
                    for j in range(i+1, min(i+4, len(lines))):
                        if lines[j].strip():
                            ref_lines.append(lines[j].strip())
                    if ref_lines:
                        return ' '.join(ref_lines)
        return None
    
    def parse_cv(self, file_path: str) -> Dict[str, Any]:
        """
        Main method to parse CV and extract ALL information comprehensively
        Returns structured data dictionary with all possible fields
        """
        # Extract text from file
        text = self.extract_text(file_path)
        
        if not text:
            return {'error': 'Could not extract text from CV'}
        
        print("Extracting comprehensive CV information...")
        
        # Extract ALL information using NER and Regex
        parsed_data = {
            # Basic Info
            'full_name': self.extract_name_ner(text),
            'email': self.extract_email(text),
            'phone': self.extract_phone(text),
            'location': self.extract_location(text),
            'date_of_birth': self.extract_date_of_birth(text),
            'nationality': self.extract_nationality(text),
            
            # Professional Info
            'summary': self.extract_summary(text),
            'skills': ', '.join(self.extract_skills(text)) if self.extract_skills(text) else None,
            'total_experience': self.extract_experience_years(text),
            'current_position': self.extract_current_position(text),
            'current_company': self.extract_current_company(text),
            
            # Education
            'education': self._format_education(self.extract_education(text)),
            
            # Additional Info
            'certifications': ', '.join(self.extract_certifications(text)) if self.extract_certifications(text) else None,
            'languages': ', '.join(self.extract_languages(text)) if self.extract_languages(text) else 'English',
            
            # Links
            'portfolio_url': self.extract_portfolio(text),
            'linkedin': self.extract_linkedin(text),
            'github': self.extract_github(text),
            
            # References
            'references': self.extract_references(text),
            
            # Metadata
            'raw_text': text[:500],  # First 500 chars for reference
            'parsed_at': datetime.now().isoformat(),
            'parsing_method': 'ner_nlp'
        }
        
        # Count extracted fields
        extracted_count = sum(1 for v in parsed_data.values() if v)
        print(f"Extracted {extracted_count} fields from CV")
        
        return parsed_data
    
    def _format_education(self, education_list: List[Dict[str, str]]) -> Optional[str]:
        """Format education list into a readable string"""
        if not education_list:
            return None
        
        formatted = []
        for edu in education_list:
            parts = []
            if 'degree' in edu:
                parts.append(edu['degree'])
            if 'institution' in edu:
                parts.append(edu['institution'])
            if 'year' in edu:
                parts.append(f"({edu['year']})")
            if parts:
                formatted.append(' '.join(parts))
        
        return ' | '.join(formatted) if formatted else None
    
    def parse_with_aurora(self, text: str) -> Dict[str, Any]:
        """Parse CV using Aurora Alpha LLM via OpenRouter for enhanced extraction"""
        
        # Initialize OpenRouter API key
        api_key = os.getenv('OPENROUTER_API_KEY', '')
        
        if not api_key:
            print("OPENROUTER_API_KEY not set, skipping LLM parsing")
            return {}
        
        print(f"Using OpenRouter API key: {api_key[:15]}...{api_key[-4:]}")
        
        # Try multiple models in order of preference
        models_to_try = [
            "openrouter/aurora-alpha",
            "meta-llama/llama-3.1-8b-instruct:free",
            "google/gemini-flash-1.5",
            "anthropic/claude-3-haiku"
        ]
        
        prompt = f"""You are an expert CV/Resume parser. Extract ALL structured information from the following CV text.

Return a JSON object with these EXACT fields (extract all available data):
- full_name: candidate's full name
- email: email address
- phone: phone number with country code if available
- location: current location/city/country
- date_of_birth: date of birth if mentioned
- nationality: nationality if mentioned
- summary: professional summary or objective (2-3 sentences)
- skills: comma-separated list of ALL technical and soft skills found
- total_experience: total years of professional experience (e.g., "5 years")
- current_position: current job title
- current_company: current company name
- experience: array of work experience objects with title, company, duration, and description
- education: array of education objects or formatted string with degree, institution, and year
- projects: array of project objects with name, description, technologies used, and links (if any)
- certifications: comma-separated list of ALL certifications
- languages: comma-separated list of ALL languages spoken
- awards: comma-separated list of awards and achievements
- publications: comma-separated list of publications or research papers
- volunteer_work: comma-separated list of volunteer experiences
- interests: comma-separated list of hobbies and interests
- professional_memberships: comma-separated list of professional organizations
- portfolio_url: personal website or portfolio URL
- linkedin: LinkedIn profile URL
- github: GitHub profile URL
- references: reference information or "Available upon request"

CV Text:
{text[:3000]}

IMPORTANT: 
- Extract EVERY piece of information available including projects, awards, interests, volunteer work, etc.
- For projects, extract project name, description, technologies/tools used, duration, and any links
- For experience, extract company name, job title, duration, and key responsibilities
- Return ONLY valid JSON, no markdown, no code blocks
- Use null for fields not found in the CV"""

        print("Calling OpenRouter API...")
        
        last_error = None
        
        # Try each model until one succeeds
        for model in models_to_try:
            try:
                print(f"Trying model: {model}")
                import requests
                
                response = requests.post(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://selectra-ai.com",
                        "X-Title": "Selectra AI Interviews",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": "You are a professional CV parser. Return only valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 3000
                    },
                    timeout=30
                )
                
                result_data = response.json()
                
                # Check if response contains an error
                if 'error' in result_data:
                    error_msg = result_data['error'].get('message', 'Unknown error')
                    error_code = result_data['error'].get('code', 'N/A')
                    provider = result_data['error'].get('metadata', {}).get('provider_name', 'Unknown')
                    
                    print(f"Model {model} failed - Error {error_code}: {error_msg} (Provider: {provider})")
                    last_error = f"{error_msg} (Code: {error_code})"
                    continue  # Try next model
                
                if response.status_code != 200:
                    print(f"Model {model} failed - HTTP {response.status_code}")
                    last_error = f"HTTP {response.status_code}"
                    continue  # Try next model
                
                # Check if choices exists in response
                if 'choices' not in result_data or not result_data['choices']:
                    print(f"Model {model} failed - No choices in response")
                    last_error = "No choices in response"
                    continue  # Try next model
                
                print(f"SUCCESS! Using model: {model}")
                
                result = result_data['choices'][0]['message']['content'].strip()
                print(f"SUCCESS! Using model: {model}")
                
                result = result_data['choices'][0]['message']['content'].strip()
                
                print(f"Extracted content ({len(result)} chars)")
                
                # Clean up response
                if result.startswith('```json'):
                    result = result[7:]
                elif result.startswith('```'):
                    result = result[3:]
                if result.endswith('```'):
                    result = result[:-3]
                
                parsed_json = json.loads(result.strip())
                
                print("\n" + "="*70)
                print("PARSED CV DATA (JSON):")
                print("="*70)
                print(json.dumps(parsed_json, indent=2))
                print("="*70 + "\n")
                
                print("LLM parsing successful!")
                return parsed_json
                
            except requests.exceptions.RequestException as e:
                print(f"Model {model} failed - Request error: {str(e)[:100]}")
                last_error = str(e)[:100]
                continue  # Try next model
            except json.JSONDecodeError as e:
                print(f"Model {model} failed - JSON parse error: {str(e)[:100]}")
                last_error = f"JSON parse error: {str(e)[:100]}"
                continue  # Try next model
            except Exception as e:
                print(f"Model {model} failed - Unexpected error: {str(e)[:100]}")
                last_error = str(e)[:100]
                continue  # Try next model
        
        # All models failed
        print(f"All models failed. Last error: {last_error}")
        return {}
    
    def parse_with_gemini(self, file_path: str) -> Dict[str, Any]:
        """Parse CV directly using Google Gemini API (can process PDF directly)"""
        try:
            api_key = os.getenv('GEMINI_API_KEY', '')
            
            if not api_key:
                print("⚠️ GEMINI_API_KEY not set, skipping Gemini parsing")
                return {}
            
            # Configure Gemini
            genai.configure(api_key=api_key)
            
            # Upload the file
            print(f"Uploading file to Gemini for parsing: {file_path}")
            uploaded_file = genai.upload_file(file_path)
            print(f"Upload complete: {uploaded_file.name}")
            
            # Use Gemini Pro model for structured extraction
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = """You are an expert CV/Resume parser. Analyze this CV document and extract ALL structured information.

Return a JSON object with these EXACT fields (extract all available data):
{
  "full_name": "candidate's full name",
  "email": "email address",
  "phone": "phone number with country code if available",
  "location": "current location/city/country",
  "date_of_birth": "date of birth if mentioned",
  "nationality": "nationality if mentioned",
  "summary": "professional summary or objective (2-3 sentences)",
  "skills": "comma-separated list of ALL technical and soft skills found",
  "total_experience": "total years of professional experience (e.g., '5 years')",
  "current_position": "current job title",
  "current_company": "current company name",
  "education": "formatted education history with degree, institution, and year",
  "certifications": "comma-separated list of ALL certifications",
  "languages": "comma-separated list of ALL languages spoken",
  "portfolio_url": "personal website or portfolio URL",
  "linkedin": "LinkedIn profile URL",
  "github": "GitHub profile URL",
  "references": "reference information or 'Available upon request'"
}

IMPORTANT: 
- Extract EVERY piece of information available from the document
- Handle tables, images, and complex layouts
- Return ONLY valid JSON, no markdown, no code blocks
- Use null for fields not found"""
            
            print("Gemini parsing CV...")
            response = model.generate_content([uploaded_file, prompt])
            
            result = response.text.strip()
            print(f"Gemini response received: {len(result)} characters")
            
            # Clean up response
            if result.startswith('```json'):
                result = result[7:]
            elif result.startswith('```'):
                result = result[3:]
            if result.endswith('```'):
                result = result[:-3]
            
            parsed_json = json.loads(result.strip())
            print("Gemini parsing successful!")
            
            # Clean up the uploaded file
            genai.delete_file(uploaded_file.name)
            
            return parsed_json
            
        except Exception as e:
            print(f"Gemini CV parsing failed: {str(e)[:300]}")
            return {}
    
    def parse_cv_enhanced(self, file_path: str, use_llm: bool = True, use_gemini: bool = True) -> Dict[str, Any]:
        """
        Enhanced parsing using Aurora Alpha LLM only (NER/NLP disabled for testing)
        Priority: Gemini (if available) > Aurora Alpha
        """
        try:
            # Try Gemini first if available and requested
            if use_gemini and os.getenv('GEMINI_API_KEY'):
                try:
                    print("Attempting Gemini API parsing...")
                    gemini_data = self.parse_with_gemini(file_path)
                    
                    if gemini_data:
                        gemini_data['parsed_at'] = datetime.now().isoformat()
                        gemini_data['parsing_method'] = 'gemini_api'
                        print("Successfully parsed with Gemini API")
                        return gemini_data
                except Exception as e:
                    print(f"Gemini parsing failed, trying Aurora Alpha: {str(e)[:200]}")
            
            # Try Aurora Alpha if Gemini failed or not available
            if use_llm and os.getenv('OPENROUTER_API_KEY'):
                try:
                    print("Attempting Aurora Alpha API parsing...")
                    # Get text for LLM parsing
                    text = self.extract_text(file_path)
                    llm_data = self.parse_with_aurora(text)
                    
                    if llm_data:
                        llm_data['parsed_at'] = datetime.now().isoformat()
                        llm_data['parsing_method'] = 'aurora_llm'
                        print("Successfully parsed with Aurora Alpha")
                        return llm_data
                    else:
                        print("Aurora Alpha parsing returned empty data")
                        return {
                            'error': 'Aurora Alpha parsing failed - no data returned',
                            'parsing_method': 'failed'
                        }
                except Exception as e:
                    print(f"Error in Aurora Alpha parsing: {str(e)[:300]}")
                    import traceback
                    traceback.print_exc()
                    return {
                        'error': f'Aurora Alpha parsing failed: {str(e)}',
                        'parsing_method': 'failed'
                    }
            
            # No API keys available
            return {
                'error': 'No API keys configured (GEMINI_API_KEY or OPENROUTER_API_KEY required)',
                'parsing_method': 'failed'
            }
            
        except Exception as e:
            print(f"Critical error in CV parsing: {e}")
            return {
                'error': f'Failed to parse CV: {str(e)}',
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


# Singleton instance
cv_parser = CVParser()
