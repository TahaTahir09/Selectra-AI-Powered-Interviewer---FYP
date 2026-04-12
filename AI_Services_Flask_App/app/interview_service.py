"""
Interview Service - Multi-model LLM approach for interview questions
Uses the same fallback approach as CV parsing for reliability
"""
import os
from dotenv import load_dotenv
import json
import re
import requests
from typing import Dict, Any, List, Optional

# Load environment variables from .env file
load_dotenv()


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
        
        system_prompt = """You are an expert interviewer. Your questions must be:
1. SHORT - Maximum 1-2 sentences (under 30 words)
2. SPECIFIC - Reference something from their CV
3. CONVERSATIONAL - Sound natural, like a real interview

NEVER ask generic questions. Always reference specific skills/projects from CV."""
        
        user_prompt = f"""Generate a SHORT opening question based on the CV.

Job: {job_description[:1500]}

CV: {resume_summary[:1500]}

RULES:
- Maximum 25-30 words
- Reference a SPECIFIC skill, technology, or project from their CV
- Sound natural and conversational
- NO multi-part questions

GOOD examples (notice they're SHORT):
- "I see you used Redis at Acme Corp. How did you handle cache invalidation?"
- "Your CV mentions Kubernetes experience. What was your deployment strategy?"
- "Tell me about the React dashboard you built at TechCo."

Return JSON:
{{"question": "Your SHORT specific question", "focus_area": "skill/tech referenced"}}"""

        print("\n=== Generating Initial Interview Question ===")
        response = self._call_llm(system_prompt, user_prompt, max_tokens=300)
        
        if response:
            data = self._parse_json_response(response)
            if data.get('question'):
                return {
                    'success': True,
                    'question': data['question'],
                    'type': 'opening',
                    'focus_area': data.get('focus_area', 'technical'),
                    'requires_followup': True
                }
        
        # Fallback: Try to extract a skill from resume and ask about it
        fallback_question = self._generate_fallback_question(resume_summary, job_description)
        return {
            'success': True,
            'question': fallback_question,
            'type': 'opening',
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
            return f"Tell me about your experience with {skill}. What's one project where you used it?"
        
        return "What's the most challenging technical problem you've solved recently?"
    
    def generate_followup_question(
        self, 
        job_description: str, 
        resume_summary: str, 
        conversation_history: List[Dict[str, str]],
        question_number: int,
        total_questions: int = 5
    ) -> Dict[str, Any]:
        """Generate next question - mix of follow-ups and new questions based on job/resume"""
        
        import random
        
        # Extract the candidate's last answer for follow-up context
        last_candidate_answer = ""
        for msg in reversed(conversation_history):
            if msg.get('role') == 'candidate':
                last_candidate_answer = msg.get('content', '')
                break
        
        # Extract topics already covered in conversation
        covered_topics = self._extract_covered_topics(conversation_history)
        
        # Decide: follow-up (35%) vs new question (65%)
        # But Q2 always follows up on Q1 for natural flow
        should_followup = question_number == 2 or random.random() < 0.35
        
        # Format conversation history
        conversation_text = "\n".join([
            f"{'Interviewer' if msg.get('role') == 'interviewer' else 'Candidate'}: {msg.get('content', '')}"
            for msg in conversation_history[-4:]  # Last 4 messages for context
        ])
        
        if should_followup and last_candidate_answer:
            # Generate follow-up question
            return self._generate_followup(
                job_description, resume_summary, conversation_text, 
                last_candidate_answer, question_number, total_questions
            )
        else:
            # Generate new question from job requirements or resume
            return self._generate_new_question(
                job_description, resume_summary, conversation_text,
                covered_topics, question_number, total_questions
            )
    
    def _extract_covered_topics(self, conversation_history: List[Dict[str, str]]) -> str:
        """Extract topics already discussed in conversation"""
        topics = []
        for msg in conversation_history:
            if msg.get('role') == 'interviewer':
                topics.append(msg.get('content', ''))
        return " | ".join(topics[-5:])  # Last 5 questions as context
    
    def _generate_followup(
        self,
        job_description: str,
        resume_summary: str,
        conversation_text: str,
        last_answer: str,
        question_number: int,
        total_questions: int
    ) -> Dict[str, Any]:
        """Generate a follow-up question based on the candidate's last answer"""
        
        system_prompt = """You are an expert interviewer. Ask a SHORT follow-up based on their answer.

RULES:
1. Maximum 25-30 words
2. Reference something SPECIFIC from their last answer
3. Sound natural and conversational
4. Dig deeper into what they said"""
        
        user_prompt = f"""Generate a SHORT follow-up question.

Their LAST ANSWER: "{last_answer[:800]}"

Conversation so far:
{conversation_text}

Job context: {job_description[:500]}

Question {question_number}/{total_questions}

GOOD follow-ups (SHORT):
- "Interesting. How did you handle the scaling challenges?"
- "What made you choose that approach?"
- "What would you do differently?"

Return JSON:
{{"question": "Your SHORT follow-up", "focus_area": "what you're probing"}}"""

        print(f"\n=== Generating Follow-up Question {question_number}/{total_questions} ===")
        response = self._call_llm(system_prompt, user_prompt, max_tokens=300)
        
        if response:
            data = self._parse_json_response(response)
            if data.get('question'):
                return {
                    'success': True,
                    'question': data['question'],
                    'type': 'follow_up',
                    'focus_area': data.get('focus_area', 'technical'),
                    'question_number': question_number,
                    'requires_followup': question_number < total_questions
                }
        
        # Fallback
        return {
            'success': True,
            'question': "Can you elaborate on that with a specific example?",
            'type': 'follow_up',
            'focus_area': 'clarification',
            'question_number': question_number,
            'fallback': True
        }
    
    def _generate_new_question(
        self,
        job_description: str,
        resume_summary: str,
        conversation_text: str,
        covered_topics: str,
        question_number: int,
        total_questions: int
    ) -> Dict[str, Any]:
        """Generate a new question based on job requirements or resume skills not yet covered"""
        
        system_prompt = """You are an expert interviewer. Ask a NEW question about a DIFFERENT topic.

RULES:
1. Maximum 25-30 words  
2. Pick a skill/requirement from job description OR resume NOT discussed yet
3. Be specific - reference a technology, project, or skill
4. Sound natural and conversational"""

        user_prompt = f"""Generate a NEW question about a different topic.

Job Requirements:
{job_description[:800]}

Candidate CV:
{resume_summary[:800]}

Topics ALREADY discussed (avoid these):
{covered_topics}

Conversation so far:
{conversation_text}

Question {question_number}/{total_questions}

Pick something from the job requirements or CV that HASN'T been covered yet.

GOOD new questions (SHORT):
- "Let's talk about AWS. What services have you used most?"
- "I noticed you know PostgreSQL. How do you handle migrations?"
- "Your CV mentions team leadership. How do you handle conflicts?"
- "What's your approach to code review?"

Return JSON:
{{"question": "Your SHORT new question", "focus_area": "skill/topic being explored"}}"""

        print(f"\n=== Generating NEW Question {question_number}/{total_questions} ===")
        response = self._call_llm(system_prompt, user_prompt, max_tokens=300)
        
        if response:
            data = self._parse_json_response(response)
            if data.get('question'):
                return {
                    'success': True,
                    'question': data['question'],
                    'type': 'new_topic',
                    'focus_area': data.get('focus_area', 'technical'),
                    'question_number': question_number,
                    'requires_followup': question_number < total_questions
                }
        
        # Fallback: Generate CV-based question
        fallback_question = self._generate_followup_fallback(resume_summary, [], question_number)
        return {
            'success': True,
            'question': fallback_question,
            'type': 'new_topic',
            'focus_area': 'cv_based',
            'question_number': question_number,
            'fallback': True
        }
    
    def evaluate_answer(
        self,
        job_description: str,
        question: str,
        answer: str,
        resume_summary: str
    ) -> Dict[str, Any]:
        """Evaluate a single answer considering CV claims"""
        
        system_prompt = """You are a fair and professional technical interviewer evaluating a candidate's response.
Assess if the answer demonstrates reasonable technical knowledge related to their CV claims.
Be constructive and give credit for relevant knowledge, effort, and learning mindset.
Focus on potential and willingness to learn, not just perfect mastery."""
        
        user_prompt = f"""Job Requirements:
{job_description[:800]}

Candidate's CV/Resume (skills they claim):
{resume_summary[:800]}

Interview Question:
{question}

Candidate's Answer:
{answer}

Evaluate this answer on a scale of 1-10 considering:
1. TECHNICAL UNDERSTANDING - Shows reasonable grasp of the topic?
2. RELEVANCE - Addresses the question appropriately?
3. COMMUNICATION - Clear and professional communication?
4. EFFORT & REASONING - Shows thinking process and effort?
5. ALIGNMENT WITH CV - Reasonably aligns with their claimed background?

SCORING GUIDE:
- 8-10: Excellent - clear knowledge, well-articulated, strong alignment
- 6-7: Good - demonstrates solid understanding, good effort
- 5-6: Satisfactory - shows reasonable understanding, adequate answer
- 3-4: Fair - basic understanding, some gaps but shows effort
- 1-2: Poor - minimal understanding or no coherent response

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
                    # Apply a slight boost for completion (be more encouraging)
                    if score < 5:
                        score = max(score, min(score + 1, 5))  # Minimum boost to 5 for attempt
                except (ValueError, TypeError):
                    score = 6
                return {
                    'success': True,
                    'score': score,
                    'feedback': data.get('feedback', ''),
                    'strengths': data.get('strengths', []),
                    'improvements': data.get('improvements', [])
                }
        
        return {
            'success': True,
            'score': 6,
            'feedback': 'Answer recorded. You demonstrated effort in responding to the question.',
            'strengths': ['Provided a response to the interview question'],
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
        
        system_prompt = """You are a fair technical interviewer providing a holistic final assessment.
Your evaluation should assess the candidate's overall fit based on demonstrated understanding and communication.
Consider their effort, growth potential, and how they compare to typical candidates.
Be encouraging while being honest about their capabilities."""
        
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
1. What technical understanding did the candidate demonstrate?
2. How well do their qualifications align with the job requirements?
3. Did they show good communication and reasoning?
4. What is their learning potential and growth trajectory?
5. Overall fit for this role considering all factors?

SCORING GUIDANCE:
- 8-10: Excellent - Strong technical understanding, excellent fit
- 7-8: Very Good - Good understanding, strong candidate
- 6-7: Good - Solid foundation, good potential
- 5-6: Satisfactory - Reasonable match, trainable
- 4-5: Fair - Some gaps but worth developing
- Below 4: Not a fit for this role

Return JSON:
{{
    "overall_score": 7,
    "strengths": ["specific technical strength demonstrated"],
    "areas_for_improvement": ["specific area needing work"],
    "cv_verification": "Did answers support CV claims? (verified/partial/unverified)",
    "job_fit": "How well they match job requirements (excellent/good/fair/poor)",
    "recommendation": "recommend|consider|not_recommend",
    "summary": "2-3 sentence assessment focusing on candidate's capabilities and fit"
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
                    # Apply a boost for completion to be more encouraging\n                    if score < 5:
                        score = max(score, min(score + 1, 5))  # Minimum boost to 5
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
        
        # Fallback evaluation - more lenient thresholds
        if avg_score >= 7:
            recommendation = 'recommend'
        elif avg_score >= 5.5:
            recommendation = 'consider'
        else:
            recommendation = 'consider' if avg_score >= 4 else 'not_recommend'
            
        return {
            'success': True,
            'overall_score': max(round(avg_score), 5),
            'strengths': ['Engaged in the interview process', 'Demonstrated communication skills'],
            'areas_for_improvement': ['Continue building technical skills', 'Review specific job requirements'],
            'cv_verification': 'partial',
            'job_fit': 'fair' if avg_score >= 5 else 'fair',
            'recommendation': recommendation,
            'summary': f'Interview completed with average score of {avg_score:.1f}/10. Candidate demonstrated effort and communication skills. Review individual responses for detailed technical assessment.',
            'answer_scores': answer_scores,
            'fallback': True
        }


# Create singleton instance
interview_service = InterviewService()
