"""
Text-to-Speech Service using ElevenLabs API
Converts interview questions to speech audio
"""
import os
import base64
from typing import Optional, Dict, Any
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class TTSService:
    """Service for converting text to speech using ElevenLabs API"""
    
    def __init__(self):
        self.api_key = os.getenv('ELEVENLABS_API_KEY', '')
        self.voice_id = os.getenv('ELEVENLABS_VOICE_ID', 'JBFqnCBsd6RMkjVDRZzb')  # George voice
        self.model_id = os.getenv('ELEVENLABS_MODEL_ID', 'eleven_multilingual_v2')
        self.output_format = 'mp3_44100_128'
        self.timeout = 45
    
    def text_to_speech(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Convert text to speech and return base64 encoded audio
        
        Args:
            text: The text to convert to speech
            
        Returns:
            Dict with 'audio_base64' (base64 encoded MP3) and 'format' on success,
            None on failure
        """
        if not self.api_key:
            print("WARN: ELEVENLABS_API_KEY not set - TTS disabled")
            return None
        
        if not text or not text.strip():
            print("WARN: Empty text provided for TTS")
            return None
        
        try:
            print(f"Converting text to speech ({len(text)} chars)...")

            url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"
            headers = {
                'xi-api-key': self.api_key,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
            }
            payload = {
                'text': text,
                'model_id': self.model_id,
                'output_format': self.output_format,
            }

            response = requests.post(url, headers=headers, json=payload, timeout=self.timeout)
            if response.status_code >= 400:
                print(f"ERROR: TTS API error {response.status_code}: {response.text}")
                return None

            audio_bytes = response.content
            if not audio_bytes:
                print("ERROR: TTS API returned empty audio")
                return None
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            print(f" TTS conversion successful ({len(audio_bytes)} bytes)")
            
            return {
                'audio_base64': audio_base64,
                'format': 'mp3',
                'voice_id': self.voice_id,
                'model_id': self.model_id
            }
            
        except Exception as e:
            print(f"ERROR: TTS conversion failed: {e}")
            return None
    
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        return bool(self.api_key)


# Global TTS service instance
tts_service = TTSService()
