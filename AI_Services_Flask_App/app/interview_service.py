"""
Interview Service - Multi-model LLM approach for interview questions
Uses the same fallback approach as CV parsing for reliability
"""
import os
import json
import re
import requests
from typing import Dict, Any, List, Optional


class InterviewService:
    """Service for generating interview questions and evaluating answers using multiple LLM models"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY', '')
        self.models_to_try = [
            "google/gemini-flash-1.5",
            "meta-llama/llama-3.1-8b-instruct:free",
            "openrouter/quasar-alpha",
            "anthropic/claude-3-haiku"
        ]
    
    def _call_llm(self, system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> Optional[str]:
        """Call LLM with multi-model fallback approach"""
        if not self.api_key:
            print("OPENROUTER_API_KEY not set")
            return None
        
        last_error = None
        
        for model in self.models_to_try:
            try:
                print(f"Trying model: {model}")
                
                response = requests.post(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://selectra-ai.com",
                        "X-Title": "Selectra AI Interviews",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": max_tokens
                    },
                    timeout=30
                )
                
                result_data = response.json()
                
                # Check for errors
                if 'error' in result_data:
                    error_msg = result_data['error'].get('message', 'Unknown error')
                    print(f"Model {model} failed: {error_msg}")
                    last_error = error_msg
                    continue
                
                if response.status_code != 200:
                    print(f"Model {model} failed - HTTP {response.status_code}")
                    last_error = f"HTTP {response.status_code}"
                    continue
                
                if 'choices' not in result_data or not result_data['choices']:
                    print(f"Model {model} failed - No choices in response")
                    last_error = "No choices in response"
                    continue
                
                result = result_data['choices'][0]['message']['content'].strip()
                print(f"SUCCESS! Using model: {model}")
                return result
                
            except requests.exceptions.RequestException as e:
                print(f"Model {model} failed - Request error: {str(e)[:100]}")
                last_error = str(e)[:100]
                continue
            except Exception as e:
                print(f"Model {model} failed - Error: {str(e)[:100]}")
                last_error = str(e)[:100]
                continue
        
        print(f"All models failed. Last error: {last_error}")
        return None
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON from LLM response with fallback handling"""
        if not text:
            return {}
        
        # Clean up response
        cleaned = text.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        elif cleaned.startswith('```'):
            cleaned = cleaned[3:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        
        try:
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            # Try to extract JSON object
            match = re.search(r'\{.*\}', cleaned, re.S)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
        
        return {}
    
    def generate_initial_question(self, job_description: str, resume_summary: str) -> Dict[str, Any]:
        """Generate the first interview question based on job description and resume"""
        
        system_prompt = """You are an expert technical interviewer conducting a highly personalized job interview.

CRITICAL RULES:
1. NEVER ask generic questions like "Tell me about yourself" or "Why do you want this job?"
2. EVERY question MUST reference SPECIFIC details from the candidate's CV (technologies, projects, companies, skills)
3. Questions MUST be relevant to the job requirements
4. Ask TECHNICAL questions about technologies/frameworks the candidate has listed
5. Reference SPECIFIC projects, roles, or achievements from their CV

You are testing if the candidate actually has the skills they claim on their CV."""
        
        user_prompt = f"""STRICT INSTRUCTION: Generate a highly specific opening question based on the candidate's ACTUAL CV content.

Job Description:
{job_description[:2000]}

Candidate's Resume/CV Details:
{resume_summary[:2000]}

ANALYZE the CV above and generate ONE opening question that:
1. Mentions a SPECIFIC skill, technology, project, or experience FROM THEIR CV
2. Relates to a requirement in the job description
3. Tests their technical knowledge of something they claim to know
4. Is NOT generic - must reference actual CV content

EXAMPLES of GOOD questions:
- "I see you worked with React and Redux at [Company]. Can you explain how you handled state management in a complex component?"
- "Your CV mentions experience with AWS Lambda. How did you handle cold starts in your serverless architecture?"
- "You listed Python and Django - tell me about the most challenging API you built with Django REST framework."

EXAMPLES of BAD (prohibited) questions:
- "Tell me about yourself" (too generic)
- "Why are you interested in this role?" (not technical)
- "What are your strengths?" (generic)

Return your response as JSON:
{{"question": "Your SPECIFIC question referencing their CV", "type": "technical_cv_based", "focus_area": "the specific skill/technology from CV", "cv_reference": "what from CV this question addresses"}}

Return ONLY the JSON, no other text."""

        print("\n=== Generating Initial Interview Question ===")
        response = self._call_llm(system_prompt, user_prompt)
        
        if response:
            data = self._parse_json_response(response)
            if data.get('question'):
                return {
                    'success': True,
                    'question': data['question'],
                    'type': data.get('type', 'technical_cv_based'),
                    'focus_area': data.get('focus_area', 'technical'),
                    'cv_reference': data.get('cv_reference', '')
                }
        
        # Fallback: Try to extract a skill from resume and ask about it
        fallback_question = self._generate_fallback_question(resume_summary, job_description)
        return {
            'success': True,
            'question': fallback_question,
            'type': 'technical_cv_based',
            'focus_area': 'technical',
            'fallback': True
        }
    
    def _generate_fallback_question(self, resume_summary: str, job_description: str) -> str:
        """Generate a fallback question by extracting skills from resume"""
        import re
        
        # Common technical skills to look for
        tech_patterns = [
            r'\b(Python|Java|JavaScript|TypeScript|React|Angular|Vue|Node\.?js|Django|Flask|Spring|AWS|Azure|GCP|Docker|Kubernetes|SQL|PostgreSQL|MongoDB|Redis|GraphQL|REST API|microservices)\b'
        ]
        
        found_skills = []
        for pattern in tech_patterns:
            matches = re.findall(pattern, resume_summary, re.IGNORECASE)
            found_skills.extend(matches)
        
        if found_skills:
            skill = found_skills[0]
            return f"I see you have experience with {skill}. Can you describe a challenging project where you used {skill} and explain the technical decisions you made?"
        
        return "Looking at your experience, can you walk me through the most technically challenging project you've worked on and explain your approach?"
    
    def generate_followup_question(
        self, 
        job_description: str, 
        resume_summary: str, 
        conversation_history: List[Dict[str, str]],
        question_number: int,
        total_questions: int = 10
    ) -> Dict[str, Any]:
        """Generate a follow-up question based on conversation history"""
        
        system_prompt = """You are an expert technical interviewer conducting a HIGHLY SPECIFIC interview.

CRITICAL RULES - FOLLOW EXACTLY:
1. NEVER ask generic questions. Every question MUST reference the candidate's CV or their previous answers.
2. Ask DEEP TECHNICAL questions about technologies, frameworks, and tools mentioned in their CV.
3. If they mention a project, ask about implementation details, challenges, architecture decisions.
4. If they mention a technology (React, Python, AWS, etc.), ask specific technical questions about it.
5. Verify their claimed expertise with scenario-based technical questions.
6. Reference SPECIFIC skills from their CV that match the job requirements.

You are verifying if the candidate ACTUALLY knows what they claim on their CV."""
        
        # Format conversation history
        conversation_text = "\n".join([
            f"{'Interviewer' if msg.get('role') == 'interviewer' else 'Candidate'}: {msg.get('content', '')}"
            for msg in conversation_history[-6:]  # Last 6 messages for context
        ])
        
        # Determine question focus based on progress - but always CV/job specific
        if question_number <= 2:
            focus_hint = "Ask about a SPECIFIC project or role from their CV. Dig into technical details."
        elif question_number <= 4:
            focus_hint = "Ask a DEEP TECHNICAL question about a technology/framework they listed in their CV that's relevant to the job."
        elif question_number <= 5:
            focus_hint = "Ask a problem-solving question related to their stated experience. Use a scenario from the job domain."
        else:
            focus_hint = "Ask about a skill gap or how they would apply their specific experience to this role's challenges."
        
        user_prompt = f"""STRICT INSTRUCTION: Generate a SPECIFIC technical question based on their CV and previous answers.

Job Requirements:
{job_description[:1500]}

Candidate's CV/Resume Details:
{resume_summary[:1500]}

Interview Conversation:
{conversation_text}

Question {question_number} of {total_questions}.
FOCUS: {focus_hint}

GENERATE the next question following these rules:
1. MUST reference something SPECIFIC from their CV (a technology, project, company, skill)
2. MUST be technically challenging - test their real knowledge
3. Can follow up on something they said in previous answers
4. MUST be relevant to the job requirements
5. Ask "how" and "why" questions, not "what" questions

GOOD question examples:
- "You mentioned using Docker in your previous role. How did you handle container orchestration and what was your deployment strategy?"
- "Your CV shows experience with PostgreSQL. Explain how you'd optimize a query that's running slow on a table with millions of rows."
- "You worked on [specific project]. What was the most challenging technical decision you made and why?"

BAD (prohibited) questions:
- "What is your greatest weakness?" (generic)
- "Where do you see yourself in 5 years?" (not technical)
- "Tell me about a time you showed leadership" (generic behavioral)

Return your response as JSON:
{{"question": "Your SPECIFIC technical question", "type": "technical|deep_dive|scenario|architecture", "focus_area": "specific CV skill being tested", "cv_reference": "what from CV or previous answer this addresses"}}

Return ONLY the JSON, no other text."""

        print(f"\n=== Generating Follow-up Question {question_number}/{total_questions} ===")
        response = self._call_llm(system_prompt, user_prompt)
        
        if response:
            data = self._parse_json_response(response)
            if data.get('question'):
                return {
                    'success': True,
                    'question': data['question'],
                    'type': data.get('type', 'technical'),
                    'focus_area': data.get('focus_area', 'technical'),
                    'cv_reference': data.get('cv_reference', ''),
                    'question_number': question_number
                }
        
        # Fallback: Generate CV-based question
        fallback_question = self._generate_followup_fallback(resume_summary, conversation_history, question_number)
        return {
            'success': True,
            'question': fallback_question,
            'type': 'technical',
            'focus_area': 'cv_based',
            'question_number': question_number,
            'fallback': True
        }
    
    def _generate_followup_fallback(self, resume_summary: str, conversation_history: List[Dict[str, str]], question_number: int) -> str:
        """Generate a CV-specific fallback question"""
        import re
        
        # Extract technologies from resume
        tech_patterns = r'\b(Python|Java|JavaScript|TypeScript|React|Angular|Vue|Node\.?js|Django|Flask|FastAPI|Spring|Boot|AWS|Azure|GCP|Docker|Kubernetes|SQL|PostgreSQL|MySQL|MongoDB|Redis|GraphQL|REST|API|microservices|CI/CD|Git|Linux|TensorFlow|PyTorch|Machine Learning|ML|AI|Agile|Scrum)\b'
        
        found_skills = list(set(re.findall(tech_patterns, resume_summary, re.IGNORECASE)))
        
        # Different question templates based on question number
        if question_number <= 2 and found_skills:
            skill = found_skills[0]
            return f"Can you explain a specific technical challenge you faced while working with {skill} and how you solved it?"
        elif question_number <= 3 and len(found_skills) > 1:
            skill = found_skills[1] if len(found_skills) > 1 else found_skills[0]
            return f"Your resume mentions {skill}. What's the most complex feature or system you've built using it?"
        elif question_number <= 4 and found_skills:
            skill = found_skills[min(2, len(found_skills)-1)]
            return f"How would you approach debugging a critical performance issue in a {skill} application?"
        elif question_number <= 5 and found_skills:
            return f"Given your experience with {', '.join(found_skills[:3])}, how do you ensure code quality and maintainability in your projects?"
        else:
            return "Based on your technical background, what architectural decisions would you make for a new project and why?"
    
    def evaluate_answer(
        self,
        job_description: str,
        question: str,
        answer: str,
        resume_summary: str
    ) -> Dict[str, Any]:
        """Evaluate a single answer considering CV claims"""
        
        system_prompt = """You are an expert technical interviewer evaluating a candidate's response.
Critically assess if the answer demonstrates the technical knowledge and skills claimed in their CV.
Be fair but verify their expertise matches what they claimed."""
        
        user_prompt = f"""Job Requirements:
{job_description[:800]}

Candidate's CV/Resume (skills they claim):
{resume_summary[:800]}

Interview Question:
{question}

Candidate's Answer:
{answer}

Evaluate this answer on a scale of 1-10 considering:
1. TECHNICAL ACCURACY - Does the answer show real knowledge of the technologies mentioned?
2. DEPTH - Does it go beyond surface-level understanding?
3. CV VERIFICATION - Does the answer support their claimed skills?
4. JOB RELEVANCE - Is it relevant to the role requirements?
5. CLARITY - Is the communication clear and professional?

SCORING GUIDE:
- 8-10: Excellent - demonstrates deep knowledge matching CV claims
- 6-7: Good - shows solid understanding, some depth
- 4-5: Average - basic knowledge, lacks technical depth
- 1-3: Poor - doesn't demonstrate claimed skills, vague answers

Return JSON:
{{"score": 7, "feedback": "Brief assessment", "strengths": ["specific strength"], "improvements": ["specific area to improve"], "cv_verified": true}}

Return ONLY the JSON."""

        response = self._call_llm(system_prompt, user_prompt, max_tokens=500)
        
        if response:
            data = self._parse_json_response(response)
            score = data.get('score')
            if score is not None:
                try:
                    score = max(1, min(10, int(score)))
                except (ValueError, TypeError):
                    score = 5
                return {
                    'success': True,
                    'score': score,
                    'feedback': data.get('feedback', ''),
                    'strengths': data.get('strengths', []),
                    'improvements': data.get('improvements', [])
                }
        
        return {
            'success': True,
            'score': 5,
            'feedback': 'Answer recorded.',
            'strengths': [],
            'improvements': [],
            'fallback': True
        }
    
    def evaluate_full_interview(
        self,
        job_description: str,
        resume_summary: str,
        conversation_history: List[Dict[str, str]],
        answer_scores: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Evaluate the complete interview and provide overall assessment"""
        
        system_prompt = """You are an expert technical interviewer providing a final assessment.
Your evaluation should focus on whether the candidate actually demonstrated the skills they claim on their CV.
Compare what they said in the interview with what's on their resume."""
        
        # Format conversation
        conversation_text = "\n".join([
            f"{'Q' if msg.get('role') == 'interviewer' else 'A'}: {msg.get('content', '')[:300]}"
            for msg in conversation_history
        ])
        
        # Calculate average score from individual answers
        if answer_scores:
            avg_score = sum(s.get('score', 5) for s in answer_scores) / len(answer_scores)
        else:
            avg_score = 5
        
        user_prompt = f"""Job Requirements:
{job_description[:1000]}

Candidate's CV/Resume Claims:
{resume_summary[:1000]}

Complete Interview Transcript:
{conversation_text[:3500]}

Average Answer Score: {avg_score:.1f}/10

Provide a comprehensive final evaluation considering:
1. Did the candidate demonstrate the technical skills claimed on their CV?
2. How well do their qualifications match the job requirements?
3. Did they show depth of knowledge or just surface-level understanding?
4. Would they be a good fit for this role?

SCORING:
- 8-10: Excellent - clearly demonstrated expertise matching CV and job needs
- 6-7: Good - showed solid skills, minor gaps
- 4-5: Average - some skills verified, some concerns
- 1-3: Poor - did not demonstrate claimed skills

Return JSON:
{{
    "overall_score": 7,
    "strengths": ["specific technical strength demonstrated"],
    "areas_for_improvement": ["specific area needing work"],
    "cv_verification": "Did answers support CV claims? (verified/partial/unverified)",
    "job_fit": "How well they match job requirements (excellent/good/fair/poor)",
    "recommendation": "recommend|consider|not_recommend",
    "summary": "2-3 sentence assessment focusing on technical capability and CV accuracy"
}}

Return ONLY the JSON."""

        print("\n=== Generating Final Interview Evaluation ===")
        response = self._call_llm(system_prompt, user_prompt, max_tokens=1000)
        
        if response:
            data = self._parse_json_response(response)
            score = data.get('overall_score')
            if score is not None:
                try:
                    score = max(1, min(10, int(score)))
                except (ValueError, TypeError):
                    score = round(avg_score)
                return {
                    'success': True,
                    'overall_score': score,
                    'strengths': data.get('strengths', []),
                    'areas_for_improvement': data.get('areas_for_improvement', data.get('improvements', [])),
                    'cv_verification': data.get('cv_verification', 'unknown'),
                    'job_fit': data.get('job_fit', 'unknown'),
                    'recommendation': data.get('recommendation', 'consider'),
                    'summary': data.get('summary', ''),
                    'answer_scores': answer_scores
                }
        
        # Fallback evaluation
        recommendation = 'recommend' if avg_score >= 7 else ('consider' if avg_score >= 5 else 'not_recommend')
        return {
            'success': True,
            'overall_score': round(avg_score),
            'strengths': ['Completed the interview'],
            'areas_for_improvement': ['Review technical depth in answers'],
            'cv_verification': 'partial',
            'job_fit': 'fair',
            'recommendation': recommendation,
            'summary': f'Interview completed with average score of {avg_score:.1f}/10. Review individual responses for detailed assessment.',
            'answer_scores': answer_scores,
            'fallback': True
        }


# Create singleton instance
interview_service = InterviewService()
