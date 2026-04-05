"""
AI Recruitment Screening Agent
Evaluates CV-to-Job Description similarity using hybrid approach
"""

import re
from typing import Dict, List, Tuple
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

# Technical skill mappings for partial matches
SKILL_SYNONYMS = {
    'machine learning': ['ml', 'deep learning', 'neural networks', 'ai', 'artificial intelligence'],
    'natural language processing': ['nlp', 'text processing', 'language models'],
    'python': ['py', 'django', 'flask', 'fastapi'],
    'javascript': ['js', 'typescript', 'react', 'node', 'nodejs'],
    'sql': ['mysql', 'postgresql', 'database', 'oracle', 'sqlserver'],
    'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'cloudcomputing'],
    'devops': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'gitlab'],
    'data science': ['analytics', 'data analysis', 'big data'],
    'frontend': ['react', 'vue', 'angular', 'ui', 'ux'],
    'backend': ['rest api', 'microservices', 'backend development'],
}

COMMON_STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'are', 'were',
    'been', 'being', 'having', 'doing', 'that', 'this', 'these', 'those', 'i', 'you',
    'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just',
    'am', 'my', 'our', 'your', 'their', 'his', 'her', 'its', 'about', 'before', 'after'
}


class CVMatcher:
    """
    Hybrid CV to Job Description matcher using semantic and keyword-based approaches
    """

    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            stop_words=None,
            ngram_range=(1, 3),
            min_df=1,
            max_df=1.0,
            lowercase=True,
            max_features=500
        )

    def normalize_text(self, text: str) -> str:
        """Normalize text for processing"""
        if not text:
            return ""
        
        # Lowercase
        text = text.lower()
        
        # Expand common abbreviations
        abbreviations = {
            r'\bnlp\b': 'natural language processing',
            r'\bml\b': 'machine learning',
            r'\bai\b': 'artificial intelligence',
            r'\bapi\b': 'application programming interface',
            r'\brest\b': 'representational state transfer',
            r'\bui\b': 'user interface',
            r'\bux\b': 'user experience',
            r'\bdb\b': 'database',
            r'\bci\/cd\b': 'continuous integration continuous deployment',
            r'\baws\b': 'amazon web services',
            r'\bgcp\b': 'google cloud platform',
            r'\bsql\b': 'structured query language',
            r'\bhttp\b': 'hypertext transfer protocol',
            r'\bvcs\b': 'version control system',
            r'\bos\b': 'operating system',
        }
        
        for abbr_pattern, expansion in abbreviations.items():
            text = re.sub(abbr_pattern, expansion, text)
        
        # Remove special characters but keep spaces and alphanumeric
        text = re.sub(r'[^a-z0-9\s\-\+]', ' ', text)
        
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def extract_sections(self, cv_text: str) -> Dict[str, str]:
        """
        Extract main sections from CV
        Returns: Dict with sections like skills, experience, projects, education
        """
        sections = {
            'skills': '',
            'experience': '',
            'projects': '',
            'education': '',
            'summary': ''
        }
        
        text = cv_text.lower()
        
        # Define patterns for section headers
        patterns = {
            'skills': r'(skill|competenc|expertise|technical skill|programming|technology).*?(?=\n(?:experience|project|education|work|qualification|award|certification|objective|summary)|$)',
            'experience': r'(work experience|employment|experience|professional history|career).*?(?=\n(?:skill|project|education|qualification|award|certification|objective|summary)|$)',
            'projects': r'(projects?|portfolio|work|achievements?).*?(?=\n(?:skill|experience|education|qualification|award|certification|objective|summary)|$)',
            'education': r'(education|qualification|degree|certification|course).*?(?=\n(?:skill|experience|project|work|award|objective|summary)|$)',
            'summary': r'(summary|objective|profile|about|introduction).*?(?=\n(?:skill|experience|project|education|qualification|work|award|certification)|$)'
        }
        
        for section, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                sections[section] = match.group(0)[:1000]  # Limit to 1000 chars
        
        return sections

    def extract_skills(self, text: str) -> List[str]:
        """
        Extract technical and domain skills from text
        """
        normalized = self.normalize_text(text)
        words = normalized.split()
        
        # Filter out stopwords and short words
        skills = [w for w in words if len(w) > 2 and w not in COMMON_STOPWORDS]
        
        # Remove duplicates and return
        return list(set(skills))

    def compute_skill_match_score(self, jd_skills: List[str], cv_skills: List[str]) -> Tuple[float, List[str], List[str]]:
        """
        Compute skill match score with support for partial/synonym matches
        Returns: (score, matched_skills, missing_skills)
        """
        if not jd_skills:
            return 1.0, cv_skills, []
        
        matched = []
        missing = []
        
        cv_skills_lower = set(s.lower() for s in cv_skills)
        
        for jd_skill in jd_skills:
            jd_skill_lower = jd_skill.lower()
            
            # Exact match
            if jd_skill_lower in cv_skills_lower:
                matched.append(jd_skill)
            else:
                # Check for partial matches via synonyms
                found_match = False
                
                # Check if skill is a key in synonyms
                if jd_skill_lower in SKILL_SYNONYMS:
                    synonyms = SKILL_SYNONYMS[jd_skill_lower]
                    for synonym in synonyms:
                        if any(synonym in cv_skill for cv_skill in cv_skills_lower):
                            matched.append(f"{jd_skill} (via {synonym})")
                            found_match = True
                            break
                
                # Check if skill appears as value in another synonym mapping
                if not found_match:
                    for key, synonyms in SKILL_SYNONYMS.items():
                        if jd_skill_lower in synonyms:
                            if any(key in cv_skill or key.replace(' ', '') in cv_skill.replace(' ', '') 
                                   for cv_skill in cv_skills_lower):
                                matched.append(f"{jd_skill} (via {key})")
                                found_match = True
                                break
                        for syn in synonyms:
                            if jd_skill_lower == syn and key in ' '.join(cv_skills_lower):
                                matched.append(f"{jd_skill} (via {key})")
                                found_match = True
                                break
                
                if not found_match:
                    missing.append(jd_skill)
        
        # Calculate score
        match_ratio = len([m for m in matched if '(via' not in m]) / len(jd_skills)
        partial_ratio = len([m for m in matched if '(via' in m]) * 0.5 / len(jd_skills)
        skill_match_score = min(match_ratio + partial_ratio, 1.0)
        
        return skill_match_score, matched, missing

    def compute_keyword_similarity(self, jd_text: str, cv_text: str) -> float:
        """
        Compute TF-IDF based keyword similarity
        """
        if not jd_text or not cv_text:
            return 0.0
        
        try:
            normalized_jd = self.normalize_text(jd_text)
            normalized_cv = self.normalize_text(cv_text)
            
            tfidf_matrix = self.tfidf_vectorizer.fit_transform([normalized_jd, normalized_cv])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        except Exception as e:
            logger.error(f"Error computing TF-IDF similarity: {e}")
            return 0.0

    def compute_semantic_similarity(self, jd_text: str, cv_text: str) -> float:
        """
        Compute semantic similarity using word overlap and shared concepts
        """
        if not jd_text or not cv_text:
            return 0.0
        
        normalized_jd = self.normalize_text(jd_text)
        normalized_cv = self.normalize_text(cv_text)
        
        jd_words = set(normalized_jd.split())
        cv_words = set(normalized_cv.split())
        
        if not jd_words or not cv_words:
            return 0.0
        
        # Jaccard similarity
        intersection = len(jd_words.intersection(cv_words))
        union = len(jd_words.union(cv_words))
        
        jaccard_score = intersection / union if union > 0 else 0.0
        
        return float(jaccard_score)

    def compute_section_scores(self, jd_sections: Dict[str, str], cv_sections: Dict[str, str]) -> Dict[str, float]:
        """
        Compute similarity scores for each section
        """
        section_scores = {}
        
        for section in ['skills', 'experience', 'projects', 'education']:
            jd_section = jd_sections.get(section, '')
            cv_section = cv_sections.get(section, '')
            
            if not jd_section or not cv_section:
                section_scores[section] = 0.0
            else:
                # Combine semantic and keyword similarity for each section
                semantic = self.compute_semantic_similarity(jd_section, cv_section)
                keyword = self.compute_keyword_similarity(jd_section, cv_section)
                section_scores[section] = (semantic + keyword) / 2
        
        return section_scores

    def match_cv_to_jd(self, jd_text: str, cv_text: str) -> Dict:
        """
        Main method: Match CV to Job Description using hybrid approach
        Returns comprehensive matching report
        """
        if not jd_text or not cv_text:
            return {
                'final_score': 0.0,
                'decision': 'Not Relevant',
                'semantic_similarity': 0.0,
                'keyword_similarity': 0.0,
                'skill_match_score': 0.0,
                'matched_skills': [],
                'missing_skills': [],
                'section_scores': {},
                'reasoning': 'Missing CV or Job Description text'
            }
        
        try:
            # Extract sections
            jd_sections = self.extract_sections(jd_text)
            cv_sections = self.extract_sections(cv_text)
            
            # Extract skills
            jd_skills = self.extract_skills(jd_text + ' ' + jd_sections['skills'])
            cv_skills = self.extract_skills(cv_text + ' ' + cv_sections['skills'])
            
            # Compute similarity scores
            semantic_sim = self.compute_semantic_similarity(jd_text, cv_text)
            keyword_sim = self.compute_keyword_similarity(jd_text, cv_text)
            skill_match_score, matched_skills, missing_skills = self.compute_skill_match_score(jd_skills, cv_skills)
            
            # Compute section-based scores
            section_scores = self.compute_section_scores(jd_sections, cv_sections)
            
            # Section-based weighting adjustment
            skills_section_weight = 0.4
            experience_weight = 0.4
            projects_weight = 0.15
            education_weight = 0.05
            
            section_adjusted_score = (
                section_scores.get('skills', 0) * skills_section_weight +
                section_scores.get('experience', 0) * experience_weight +
                section_scores.get('projects', 0) * projects_weight +
                section_scores.get('education', 0) * education_weight
            )
            
            # Calculate final score (0-1)
            # Final Score = 0.5 × Semantic + 0.3 × Keyword + 0.2 × SkillMatch
            final_score_normalized = (
                0.5 * semantic_sim +
                0.3 * keyword_sim +
                0.2 * skill_match_score
            )
            
            # Apply slight adjustment based on section scores
            final_score_normalized = (final_score_normalized * 0.8) + (section_adjusted_score * 0.2)
            
            # Convert to 0-100
            final_score = round(final_score_normalized * 100, 2)
            
            # Determine decision
            if final_score >= 70:
                decision = 'Highly Relevant'
            elif final_score >= 55:
                decision = 'Relevant'
            elif final_score >= 40:
                decision = 'Moderately Relevant'
            else:
                decision = 'Not Relevant'
            
            # Generate reasoning
            matched_count = len([m for m in matched_skills if '(via' not in m])
            missing_count = len(missing_skills)
            
            reasoning = f"Candidate has {matched_count} matching skills and missing {missing_count} key skills. "
            reasoning += f"Semantic alignment: {semantic_sim*100:.0f}%, Keyword match: {keyword_sim*100:.0f}%. "
            
            if 'experience' in section_scores and section_scores['experience'] > 0.6:
                reasoning += "Strong work experience alignment. "
            
            if skill_match_score > 0.7:
                reasoning += "Excellent skill match. "
            elif skill_match_score < 0.3:
                reasoning += "Limited skill match. "
            
            return {
                'final_score': final_score,
                'decision': decision,
                'semantic_similarity': round(semantic_sim * 100, 2),
                'keyword_similarity': round(keyword_sim * 100, 2),
                'skill_match_score': round(skill_match_score * 100, 2),
                'matched_skills': matched_skills[:20],  # Top 20
                'missing_skills': missing_skills[:10],  # Top 10
                'section_scores': {k: round(v*100, 2) for k, v in section_scores.items()},
                'reasoning': reasoning
            }
        
        except Exception as e:
            logger.error(f"Error in CV matching: {e}")
            import traceback
            traceback.print_exc()
            return {
                'final_score': 0.0,
                'decision': 'Error',
                'error': str(e)
            }


# Global instance
cv_matcher = CVMatcher()
