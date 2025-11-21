import openai
import os
import json
import re


job= ""
resume= ""

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