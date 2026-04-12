/**
 * Hook for managing camera recording during interviews
 */

import { useCallback, useRef, useState } from 'react';

interface RecordingState {
  isCameraRecording: boolean;
  cameraError: string;
}

export const useInterviewRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isCameraRecording: false,
    cameraError: '',
  });

  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraChunksRef = useRef<Blob[]>([]);

  /**
   * Start camera recording
   */
  const startCameraRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setRecordingState(prev => ({
          ...prev,
          cameraError: 'Camera is not supported in this browser.',
        }));
        return false;
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false, // We'll handle audio separately
      });

      cameraStreamRef.current = cameraStream;
      cameraChunksRef.current = [];

      const preferredMimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
      ];

      const selectedMimeType = preferredMimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = selectedMimeType
        ? new MediaRecorder(cameraStream, { mimeType: selectedMimeType })
        : new MediaRecorder(cameraStream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          cameraChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        setRecordingState(prev => ({
          ...prev,
          cameraError: `Camera recording error: ${event.error}`,
          isCameraRecording: false,
        }));
      };

      cameraRecorderRef.current = recorder;
      recorder.start(1000);

      setRecordingState(prev => ({
        ...prev,
        isCameraRecording: true,
        cameraError: '',
      }));

      return true;
    } catch (error: any) {
      setRecordingState(prev => ({
        ...prev,
        cameraError: `Failed to start camera recording: ${error.message}`,
      }));
      return false;
    }
  }, []);

  /**
   * Stop camera recording and return the blob
   */
  const stopCameraRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = cameraRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => track.stop());
          cameraStreamRef.current = null;
        }
        setRecordingState(prev => ({
          ...prev,
          isCameraRecording: false,
        }));
        resolve(null);
        return;
      }

      const onStop = () => {
        recorder.removeEventListener('stop', onStop);
        const blob = new Blob(cameraChunksRef.current, { type: recorder.mimeType });
        cameraChunksRef.current = [];
        
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => track.stop());
          cameraStreamRef.current = null;
        }
        
        cameraRecorderRef.current = null;
        setRecordingState(prev => ({
          ...prev,
          isCameraRecording: false,
        }));
        
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.addEventListener('stop', onStop);
      recorder.stop();
    });
  }, []);

  /**
   * Cleanup all recording resources
   */
  const cleanup = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    cameraRecorderRef.current = null;
    cameraChunksRef.current = [];
  }, []);

  return {
    recordingState,
    startCameraRecording,
    stopCameraRecording,
    cleanup,
    cameraStreamRef,
  };
};
