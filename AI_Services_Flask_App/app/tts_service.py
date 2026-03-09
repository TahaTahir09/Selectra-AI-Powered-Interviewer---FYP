"""
Text-to-Speech Service using ElevenLabs API
Converts interview questions to speech audio
"""
import os
import base64
from typing import Optional, Dict, Any
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
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of ElevenLabs client"""
        if self._client is None and self.api_key:
            try:
                from elevenlabs.client import ElevenLabs
                self._client = ElevenLabs(api_key=self.api_key)
                print("✓ ElevenLabs client initialized")
            except ImportError:
                print("⚠ ElevenLabs package not installed")
            except Exception as e:
                print(f"⚠ Failed to initialize ElevenLabs client: {e}")
        return self._client
    
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
            print("⚠ ELEVENLABS_API_KEY not set - TTS disabled")
            return None
        
        if not text or not text.strip():
            print("⚠ Empty text provided for TTS")
            return None
        
        try:
            client = self.client
            if not client:
                return None
            
            print(f"🔊 Converting text to speech ({len(text)} chars)...")
            
            # Generate audio using ElevenLabs
            audio_generator = client.text_to_speech.convert(
                text=text,
                voice_id=self.voice_id,
                model_id=self.model_id,
                output_format=self.output_format,
            )
            
            # Collect audio bytes from generator
            audio_bytes = b''.join(chunk for chunk in audio_generator)
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            print(f"✓ TTS conversion successful ({len(audio_bytes)} bytes)")
            
            return {
                'audio_base64': audio_base64,
                'format': 'mp3',
                'voice_id': self.voice_id,
                'model_id': self.model_id
            }
            
        except Exception as e:
            print(f"✗ TTS conversion failed: {e}")
            return None
    
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        return bool(self.api_key and self.client)


# Global TTS service instance
tts_service = TTSService()
