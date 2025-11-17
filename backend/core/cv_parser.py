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
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from CV file (PDF or DOCX)"""
        if file_path.lower().endswith('.pdf'):
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
        
        print("🔍 Extracting comprehensive CV information...")
        
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
        print(f"✅ Extracted {extracted_count} fields from CV")
        
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
    
    def parse_with_deepseek(self, text: str) -> Dict[str, Any]:
        """Parse CV using DeepSeek LLM via OpenRouter (FREE) for enhanced extraction"""
        
        # Initialize OpenRouter client for FREE DeepSeek access
        api_key = os.getenv('OPENROUTER_API_KEY', '')
        
        if not api_key:
            print("OPENROUTER_API_KEY not set, skipping LLM parsing")
            return {}
        
        try:
            client = OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1"
            )
        except Exception as e:
            print(f"Failed to initialize OpenRouter client: {e}")
            return {}
        
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
- education: formatted education history with degree, institution, and year (e.g., "B.S. Computer Science, MIT (2020)")
- certifications: comma-separated list of ALL certifications
- languages: comma-separated list of ALL languages spoken
- portfolio_url: personal website or portfolio URL
- linkedin: LinkedIn profile URL
- github: GitHub profile URL
- references: reference information or "Available upon request"

CV Text:
{text[:3000]}

IMPORTANT: Extract EVERY piece of information available. Return ONLY valid JSON, no markdown, no code blocks."""

        try:
            response = client.chat.completions.create(
                model="deepseek/deepseek-r1:free",  # FREE DeepSeek model via OpenRouter
                messages=[
                    {"role": "system", "content": "You are a professional CV parser. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content.strip()
            
            print(f"LLM Response received: {len(result)} characters")
            print(f"First 200 chars: {result[:200]}")
            
            # Clean up response
            if result.startswith('```json'):
                result = result[7:]
            elif result.startswith('```'):
                result = result[3:]
            if result.endswith('```'):
                result = result[:-3]
            
            parsed_json = json.loads(result.strip())
            print("LLM parsing successful!")
            return parsed_json
            
        except Exception as e:
            error_name = type(e).__name__
            
            # Handle rate limits gracefully
            if error_name == 'RateLimitError':
                print("⚠️ OpenRouter Rate Limit (temporary) - Falling back to NER/NLP")
            else:
                print(f"❌ OpenRouter API Error ({error_name}): {str(e)[:300]}")
            
            return {}
    
    def parse_cv_enhanced(self, file_path: str, use_llm: bool = True) -> Dict[str, Any]:
        """
        Enhanced parsing combining NER/NLP with DeepSeek LLM
        """
        try:
            # Get base data using NER/NLP
            base_data = self.parse_cv(file_path)
            
            if 'error' in base_data:
                return base_data
            
            if use_llm and os.getenv('OPENROUTER_API_KEY'):
                try:
                    # Get text for LLM parsing
                    text = self.extract_text(file_path)
                    llm_data = self.parse_with_deepseek(text)
                    
                    if not llm_data:
                        # LLM parsing failed, return base data
                        base_data['parsing_method'] = 'ner_nlp_only'
                        return base_data
                    
                    # Merge LLM data with base data (LLM takes priority)
                    enhanced_data = {
                        'full_name': llm_data.get('full_name') or base_data.get('name', ''),
                        'email': llm_data.get('email') or base_data.get('email', ''),
                        'phone': llm_data.get('phone') or base_data.get('phone', ''),
                        'location': llm_data.get('location') or base_data.get('location', ''),
                        'summary': llm_data.get('summary', ''),
                        'skills': llm_data.get('skills') or base_data.get('skills', []),
                        'experience': llm_data.get('experience') or base_data.get('work_experience', []),
                        'education': llm_data.get('education') or base_data.get('education', []),
                        'certifications': llm_data.get('certifications', []),
                        'languages': llm_data.get('languages', []),
                        'linkedin': llm_data.get('linkedin') or base_data.get('linkedin', ''),
                        'github': llm_data.get('github') or base_data.get('github', ''),
                        'total_experience': llm_data.get('total_experience') or base_data.get('experience_years', ''),
                        'parsed_at': datetime.now().isoformat(),
                        'parsing_method': 'deepseek_llm'
                    }
                    
                    return enhanced_data
                except Exception as e:
                    print(f"Error in LLM parsing, falling back to NER/NLP: {e}")
                    base_data['parsing_method'] = 'ner_nlp_fallback'
                    base_data['llm_error'] = str(e)
                    return base_data
            
            base_data['parsing_method'] = 'ner_nlp_only'
            return base_data
            
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
