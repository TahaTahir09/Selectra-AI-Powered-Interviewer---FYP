"""
Speech-to-Text Service using ElevenLabs API.
Transcribes recorded candidate interview answers.
"""
import io
import os
from typing import Optional, Dict, Any

import requests
from dotenv import load_dotenv


load_dotenv()


class STTService:
    """Service for converting spoken audio to text using ElevenLabs STT API."""

    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_STT_API_KEY") or os.getenv("ELEVENLABS_API_KEY", "")
        self.model_id = os.getenv("ELEVENLABS_STT_MODEL_ID", "scribe_v1")
        self.language_code = os.getenv("ELEVENLABS_STT_LANGUAGE", "en")
        self.base_url = "https://api.elevenlabs.io/v1/speech-to-text"
        self.timeout = 45

    def is_available(self) -> bool:
        """Check whether STT can be called."""
        return bool(self.api_key)

    def transcribe_audio(self, audio_bytes: bytes, filename: str = "candidate-answer.webm") -> Optional[Dict[str, Any]]:
        """
        Send audio bytes to ElevenLabs STT and return transcribed text.

        Returns:
            Dict with `text` and metadata on success, None on failure.
        """
        if not self.api_key:
            print("WARN: ELEVENLABS_STT_API_KEY/ELEVENLABS_API_KEY not set - STT disabled")
            return None

        if not audio_bytes:
            print("WARN: No audio bytes provided for STT")
            return None

        try:
            files = {
                "file": (filename, io.BytesIO(audio_bytes), "audio/webm")
            }
            data = {
                "model_id": self.model_id,
                "language_code": self.language_code,
            }
            headers = {
                "xi-api-key": self.api_key,
            }

            response = requests.post(
                self.base_url,
                headers=headers,
                data=data,
                files=files,
                timeout=self.timeout,
            )

            if response.status_code >= 400:
                print(f"ERROR: STT API error {response.status_code}: {response.text}")
                return None

            payload = response.json()
            text = (payload.get("text") or "").strip()

            if not text:
                return {
                    "text": "",
                    "language_code": payload.get("language_code", self.language_code),
                    "model_id": self.model_id,
                }

            return {
                "text": text,
                "language_code": payload.get("language_code", self.language_code),
                "model_id": self.model_id,
            }
        except Exception as exc:
            print(f"ERROR: STT conversion failed: {exc}")
            return None


stt_service = STTService()
