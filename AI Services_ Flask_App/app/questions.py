import openai
import os
import json
import re
from typing import Dict, Any, List, Union


openai.api_base = os.getenv("OLLAMA_API_BASE", "http://localhost:11434")
openai.api_key = os.getenv("OPENAI_API_KEY", "")
model = os.getenv("OLLAMA_MODEL", "llama2")




def initial_question(job, resume):
    """
    Use a locally running Ollama model (via OpenAI-compatible API) to generate a single JSON
    response with a top-level "question" string. Parse the JSON, store the question in a
    str variable and return it.
    """
    
    prompt = f"""
You are an expert career coach. Based on the following job description and resume, generate a concise, insightful question that will help tailor the resume to better fit the job description.

Return only valid JSON with a single top-level key "question" whose value is a string.
Example:
{{"question": "What specific skills from my resume should I highlight to align with the job requirements?"}}

Job Description:
{job}

Resume:
{resume}
"""

    resp = openai.ChatCompletion.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=10000,
    )

    text = resp["choices"][0]["message"]["content"].strip()

    # Parse JSON robustly and extract "question"
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                data = {}
        else:
            data = {}

    # Fallbacks: check "question" key or try to use the whole text
    question = data.get("question")
    if not question:
        # If the model returned a single-string JSON with different top-level key,
        # or plain text, fall back to using the entire cleaned text.
        # Prefer extracting a string value from any first-string value found.
        if isinstance(data, dict):
            for v in data.values():
                if isinstance(v, str) and v.strip():
                    question = v.strip()
                    break
        if not question:
            question = text

    # store in variable and return
    question_str = question.strip()
    return question_str


def follow_up(job, resume, previous_chat):
    """
    Ask a follow-up question based on previous chat, job description and resume.
    previous_chat must be a list of {"role","content"} dicts with roles:
      - "system"      : system-level messages (will be merged with job/resume system context)
      - "user"        : instructions to the system (kept as user)
      - "interviewee" : the candidate's replies (mapped to assistant in the chat history)

    Returns the follow-up question string.
    """
    # Build the job/resume system content
    base_system = (
        "You are an expert career coach. Given the Job Description and Resume below, when asked "
        "produce a single concise follow-up question in JSON with the top-level key \"follow_up\". "
        "Return only valid JSON. Example: {\"follow_up\": \"...\"}\n\n"
        f"Job Description:\n{job}\n\nResume:\n{resume}"
    )

    # Normalize previous_chat into a list of message dicts
    if isinstance(previous_chat, str):
        try:
            parsed = json.loads(previous_chat)
            prev_msgs = parsed if isinstance(parsed, list) else [{"role": "user", "content": previous_chat}]
        except json.JSONDecodeError:
            prev_msgs = [{"role": "user", "content": previous_chat}]
    elif isinstance(previous_chat, list):
        prev_msgs = previous_chat
    else:
        prev_msgs = []

    messages = []

    # If the first previous message is a system message, merge its content with base_system
    if prev_msgs and isinstance(prev_msgs[0], dict) and prev_msgs[0].get("role") == "system":
        merged_system = prev_msgs[0].get("content", "") + "\n\n" + base_system
        messages.append({"role": "system", "content": merged_system})
        msgs_to_append = prev_msgs[1:]
    else:
        messages.append({"role": "system", "content": base_system})
        msgs_to_append = prev_msgs

    # Append previous conversation messages unchanged except map "interviewee" -> "assistant"
    for m in msgs_to_append:
        if isinstance(m, dict):
            role = m.get("role", "user")
            content = m.get("content", "")
        else:
            role, content = "user", str(m)

        # Map custom role "interviewee" to "assistant" so it's treated as the candidate's reply
        if role == "interviewee":
            role = "assistant"

        # Ensure role is one of allowed roles for ChatCompletion
        if role not in ("system", "user", "assistant"):
            role = "user"

        messages.append({"role": role, "content": content})

    # Final user instruction to generate follow-up
    messages.append(
        {
            "role": "user",
            "content": (
                "Based on the conversation above, generate a single concise follow-up question "
                "that helps clarify or elicit information useful to tailor the resume to the job. "
                "Return only valid JSON with a top-level key \"follow_up\" whose value is the question string."
            ),
        }
    )

    resp = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=0.2,
        max_tokens=512,
    )

    text = resp["choices"][0]["message"]["content"].strip()

    # Robust JSON extraction
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                data = {}
        else:
            data = {}

    # Extract follow_up or fallback to question or plain text
    follow_up_q = None
    if isinstance(data, dict):
        follow_up_q = data.get("follow_up") or data.get("question")
        if not follow_up_q:
            for v in data.values():
                if isinstance(v, str) and v.strip():
                    follow_up_q = v.strip()
                    break

    if not follow_up_q:
        follow_up_q = text

    return follow_up_q.strip()



def answer_evaluation(question: str, answer: str, job: str, resume: str) -> Dict[str, Any]:
    """
    Evaluate the interviewee's answer (in context of the question, job description and resume)
    by calling the local Ollama model (OpenAI-compatible API). The model is asked to return
    valid JSON with at least: {"score": <1-10 integer>, "feedback": "<text>", "improvements": ["..."]}.

    Returns a dict with parsed result. If parsing fails, returns {"score": None, "feedback": "<raw text>", "improvements": []}.
    """
    system_content = (
        "You are an expert interviewer and career coach. You will evaluate a candidate's answer "
        "to a single interview question given the Job Description and the candidate's Resume. "
        "Provide a numeric score from 1 to 10 (10 being excellent, 1 being the worst) and concise, actionable feedback. "
        "Return only valid JSON with keys: score (integer 1-10), feedback (string), improvements (list of strings). "
        f"Job Description:\n{job}\n\nResume:\n{resume}"
    )

    user_content = (
        f"Question:\n{question}\n\n"
        f"Candidate's answer:\n{answer}\n\n"
        "Evaluate the answer for relevance, completeness, and alignment with the job requirements. "
        "Return only valid JSON as described above."
    )

    try:
        resp = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_content},
            ],
            temperature=0.0,
            max_tokens=800,
        )
    except Exception as e:
        return {"score": None, "feedback": f"LLM call failed: {e}", "improvements": []}

    text = resp["choices"][0]["message"]["content"].strip()

    # Parse JSON robustly
    data: Dict[str, Any] = {}
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                data = {}
        else:
            data = {}

    # Normalize result and enforce score in 1-10
    if isinstance(data, dict):
        score = data.get("score")
        try:
            if score is not None:
                score = int(float(score))
                # enforce 1-10 range
                if score < 1:
                    score = 1
                if score > 10:
                    score = 10
        except Exception:
            score = None

        feedback = data.get("feedback") or data.get("comment") or ""
        improvements = data.get("improvements") or data.get("suggestions") or []
        if isinstance(improvements, str):
            improvements = [improvements]

        return {"score": score, "feedback": feedback.strip() if isinstance(feedback, str) else "", "improvements": improvements}
    else:
        # fallback: return raw text as feedback
        return {"score": None, "feedback": text, "improvements": []}


def evaluate_interview(resume: str, job_description: str, full_chat: Union[str, List[Dict[str, str]]]) -> Dict[str, Any]:
    """
    Evaluate the complete interview conversation in the context of the resume and job description.
    Returns the same items as answer_evaluation:
      {"score": <1-10 integer>, "feedback": "<text>", "improvements": ["..."]}

    full_chat may be a list of {"role": "...", "content": "..."} dicts (roles: system, user, interviewee)
    or a JSON string representing that list.
    """
    system_content = (
        "You are an expert interviewer and career coach. You will evaluate a full interview conversation "
        "between the system (asking questions) and the interviewee (candidate) given the Job Description and the candidate's Resume. "
        "Provide a single numeric score from 1 to 10 (10 being excellent, 1 being the worst), concise actionable feedback, "
        "and a short list of specific improvements. Return only valid JSON with keys: score (integer 1-10), feedback (string), improvements (list of strings). "
        f"Job Description:\n{job_description}\n\nResume:\n{resume}"
    )

    # Normalize full_chat into list of message dicts
    prev_msgs: List[Dict[str, str]] = []
    if isinstance(full_chat, str):
        try:
            parsed = json.loads(full_chat)
            prev_msgs = parsed if isinstance(parsed, list) else [{"role": "user", "content": full_chat}]
        except json.JSONDecodeError:
            prev_msgs = [{"role": "user", "content": full_chat}]
    elif isinstance(full_chat, list):
        prev_msgs = full_chat
    else:
        prev_msgs = []

    # Build messages for LLM: single system message, then conversation mapping interviewee -> assistant
    messages: List[Dict[str, str]] = [{"role": "system", "content": system_content}]

    for m in prev_msgs:
        if not isinstance(m, dict):
            role, content = "user", str(m)
        else:
            role = m.get("role", "user")
            content = m.get("content", "")

        # Map interviewee -> assistant (candidate replies)
        if role == "interviewee":
            role = "assistant"

        # Ensure allowed roles
        if role not in ("system", "user", "assistant"):
            role = "user"

        messages.append({"role": role, "content": content})

    # Final user instruction to produce the evaluation JSON
    messages.append(
        {
            "role": "user",
            "content": (
                "Based on the full conversation above, produce a single evaluation JSON object with keys: "
                "score (integer 1-10), feedback (string), improvements (list of strings). "
                "Do not include any extra text outside the JSON."
            ),
        }
    )

    try:
        resp = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            temperature=0.0,
            max_tokens=1200,
        )
    except Exception as e:
        return {"score": None, "feedback": f"LLM call failed: {e}", "improvements": []}

    text = resp["choices"][0]["message"]["content"].strip()

    # Robust JSON extraction
    data: Dict[str, Any] = {}
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                data = {}
        else:
            data = {}

    # Normalize and enforce score 1-10
    if isinstance(data, dict):
        score = data.get("score")
        try:
            if score is not None:
                score = int(float(score))
                if score < 1:
                    score = 1
                if score > 10:
                    score = 10
        except Exception:
            score = None

        feedback = data.get("feedback") or data.get("comment") or ""
        improvements = data.get("improvements") or data.get("suggestions") or []
        if isinstance(improvements, str):
            improvements = [improvements]

        return {"score": score, "feedback": feedback.strip() if isinstance(feedback, str) else "", "improvements": improvements}
    else:
        return {"score": None, "feedback": text, "improvements": []}







# def dummy_interview(job_id, resume_id):
#     job = fetch_job(job_id)
#     resume = fetch_resume(resume_id)
#     chat = []
#     answer_score = []
#     initial_q = initial_question(job, resume)
#     i=0
#     chat.append({"question": initial_q})
#     user_response = TAKE_RESPONSE_FROM_USER()
#     chat.append({"answer": user_response})

#     answer_score.append(answer_evaluation(initial_q, user_response, job, resume))

#     while i<10:
#         next_q = follow_up(job, resume, chat)
#         chat.append({"question": next_q})   
        
#         user_response = TAKE_RESPONSE_FROM_USER()


#         answer_score.append(answer_evaluation(next_q, user_response, job, resume))


#         chat.append({"answer": user_response})

#         i+=1
        
        
#     interview_score = evaluate_interview(resume, job, chat)
    
#     save_chat_in_db(job_id, resume_id, interview_id,chat)
    
#     save_results(job_id, resume_id, interview_id, interview_score)
    
    
#     return 1