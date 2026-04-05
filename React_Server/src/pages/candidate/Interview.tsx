import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Play, Loader2, Clock, Send, CheckCircle, 
  AlertCircle, Volume2, VolumeX,
  Briefcase, FileText, ArrowRight, Mic, MessageSquare,
  Award, Target, ChevronRight, Sparkles, Bot, StopCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { applicationAPI, flaskAPI, interviewResultsAPI } from "@/services/api";

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}

interface QuestionScore {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

interface AnswerScore {
  score: number;
  feedback: string;
}

type InterviewStage = 
  | 'loading' 
  | 'intro' 
  | 'ready' 
  | 'asking' 
  | 'answering' 
  | 'submitted'
  | 'completed' 
  | 'error';

const TOTAL_QUESTIONS = 5;
const ANSWER_TIME_LIMIT = 120;

const Interview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  // Application data
  const [application, setApplication] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  
  // Interview state
  const [stage, setStage] = useState<InterviewStage>('loading');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [streamedQuestion, setStreamedQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]); // Hidden from UI
  const [answerScores, setAnswerScores] = useState<AnswerScore[]>([]);
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Loading states
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs
  const answerRef = useRef<HTMLTextAreaElement>(null);
  
  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const questionStreamTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [completionMessage, setCompletionMessage] = useState('');

  const clearQuestionStreamTimer = useCallback(() => {
    if (questionStreamTimerRef.current) {
      clearInterval(questionStreamTimerRef.current);
      questionStreamTimerRef.current = null;
    }
  }, []);

  const streamQuestionText = useCallback((fullQuestion: string) => {
    clearQuestionStreamTimer();

    if (!fullQuestion) {
      setStreamedQuestion('');
      return;
    }

    setStreamedQuestion('');
    let index = 0;
    questionStreamTimerRef.current = setInterval(() => {
      index += 1;
      setStreamedQuestion(fullQuestion.slice(0, index));

      if (index >= fullQuestion.length) {
        clearQuestionStreamTimer();
      }
    }, 28);
  }, [clearQuestionStreamTimer]);

  // Voice answer + STT
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingError, setRecordingError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const transcriptionChainRef = useRef<Promise<void>>(Promise.resolve());
  const handleSubmitAnswerRef = useRef<(providedAnswer?: string) => Promise<void>>(async () => {});

  const appendTranscript = useCallback((existingText: string, incomingText: string) => {
    const existing = existingText.trim();
    const incoming = incomingText.trim();

    if (!incoming) return existingText;
    if (!existing) return incoming;

    if (existing.endsWith(incoming)) {
      return existing;
    }
    if (incoming.startsWith(existing)) {
      return incoming;
    }

    return `${existing} ${incoming}`.replace(/\s+/g, ' ').trim();
  }, []);

  const queueChunkTranscription = useCallback((audioChunk: Blob) => {
    transcriptionChainRef.current = transcriptionChainRef.current
      .then(async () => {
        if (!audioChunk.size) return;

        try {
          setIsTranscribing(true);
          const result = await flaskAPI.transcribeSpeech(audioChunk);
          if (result?.success && result?.text) {
            setLiveTranscript(prev => appendTranscript(prev, result.text));
          }
        } catch (error) {
          console.error('Chunk transcription failed:', error);
        } finally {
          setIsTranscribing(false);
        }
      })
      .catch(() => {
        // Keep queue alive if one chunk fails.
      });
  }, [appendTranscript]);

  const cleanupMicrophoneResources = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const startVoiceRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setRecordingError('Microphone is not supported in this browser.');
        return;
      }
      if (typeof MediaRecorder === 'undefined') {
        setRecordingError('Audio recording is not supported in this browser.');
        return;
      }

      setRecordingError('');
      setLiveTranscript('');
      setAnswer('');
      recordedChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const selectedMimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          queueChunkTranscription(event.data);
        }
      };

      recorder.onstop = () => {
        cleanupMicrophoneResources();
      };

      recorder.onerror = () => {
        setRecordingError('Recording failed. Please try again.');
      };

      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recorder.start(3000);
    } catch (error) {
      console.error('Microphone setup failed:', error);
      cleanupMicrophoneResources();
      setRecordingError('Unable to access microphone. Please allow microphone permission.');
      setIsRecording(false);
    }
  }, [cleanupMicrophoneResources, queueChunkTranscription]);

  const stopRecorder = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cleanupMicrophoneResources();
      return;
    }

    await new Promise<void>((resolve) => {
      const onStop = () => {
        recorder.removeEventListener('stop', onStop);
        resolve();
      };
      recorder.addEventListener('stop', onStop);
      recorder.stop();
    });
  }, [cleanupMicrophoneResources]);

  const stopVoiceAndSave = useCallback(async (submitAfterStop: boolean) => {
    if (!isRecording) return;

    setIsRecording(false);
    await stopRecorder();
    await transcriptionChainRef.current;

    const recordedBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
    let finalTranscript = liveTranscript.trim();

    if (recordedBlob.size > 0) {
      try {
        setIsTranscribing(true);
        const fullResult = await flaskAPI.transcribeSpeech(recordedBlob);
        if (fullResult?.success && fullResult?.text?.trim()) {
          finalTranscript = fullResult.text.trim();
        }
      } catch (error) {
        console.error('Final transcription failed:', error);
      } finally {
        setIsTranscribing(false);
      }
    }

    setLiveTranscript(finalTranscript);
    setAnswer(finalTranscript);

    if (!submitAfterStop) {
      toast({
        title: "Transcript ready",
        description: "You can edit your transcribed answer before submitting.",
      });
    }

    if (submitAfterStop) {
      await handleSubmitAnswerRef.current(finalTranscript);
    }
  }, [isRecording, liveTranscript, stopRecorder, toast]);

  // Play audio from base64 encoded MP3
  const playAudioFromBase64 = useCallback((audioBase64: string) => {
    if (!audioEnabled) {
      setIsPlayingAudio(false);
      return;
    }
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audioData = `data:audio/mp3;base64,${audioBase64}`;
      const audio = new Audio(audioData);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      
      audio.play().catch(() => setIsPlayingAudio(false));
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }, [audioEnabled]);

  const presentQuestionWithVoice = useCallback((questionText: string, audioBase64?: string) => {
    setCurrentQuestion(questionText);
    streamQuestionText(questionText);

    if (audioBase64) {
      playAudioFromBase64(audioBase64);
    }
  }, [playAudioFromBase64, streamQuestionText]);

  // Fetch application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const response = await applicationAPI.list();
        const applications = response.results || response;
        
        const matchingApp = applications.find((app: any) => 
          app.interview_link && app.interview_link.includes(id)
        );
        
        if (!matchingApp) {
          setStage('error');
          return;
        }

        if (matchingApp.interview_completed_at || matchingApp.interview_results) {
          setCompletionMessage('This interview is already completed. Re-attempt is not allowed.');
          setStage('error');
          return;
        }
        
        setApplication(matchingApp);
        
        const jobPost = matchingApp.job_post || {};
        const jobDesc = [
          `Job Title: ${jobPost.job_title || 'Not specified'}`,
          `Company: ${jobPost.company_name || matchingApp.organization_name || ''}`,
          `Requirements: ${jobPost.requirements || ''}`,
          `Description: ${jobPost.job_description || ''}`
        ].filter(Boolean).join('\n\n');
        setJobDescription(jobDesc);
        
        // Build resume summary
        let resumeText = '';
        if (matchingApp.parsed_resume) {
          const pr = matchingApp.parsed_resume;
          const sections = [];
          
          if (pr.name || matchingApp.candidate_name) {
            sections.push(`Candidate Name: ${pr.name || matchingApp.candidate_name}`);
          }
          if (pr.summary || pr.objective) {
            sections.push(`Professional Summary: ${pr.summary || pr.objective}`);
          }
          if (pr.skills) {
            const skillsList = Array.isArray(pr.skills) ? pr.skills : 
              (typeof pr.skills === 'string' ? pr.skills.split(',') : []);
            if (skillsList.length > 0) {
              sections.push(`Technical Skills: ${skillsList.join(', ')}`);
            }
          }
          if (pr.experience && Array.isArray(pr.experience)) {
            const expDetails = pr.experience.map((exp: any) => {
              const parts = [];
              if (exp.title || exp.position) parts.push(`Role: ${exp.title || exp.position}`);
              if (exp.company || exp.organization) parts.push(`Company: ${exp.company || exp.organization}`);
              if (exp.duration || exp.dates) parts.push(`Duration: ${exp.duration || exp.dates}`);
              if (exp.description) parts.push(`Responsibilities: ${exp.description}`);
              return parts.join('\n');
            }).join('\n\n');
            sections.push(`Work Experience:\n${expDetails}`);
          }
          if (pr.education) {
            const eduText = Array.isArray(pr.education) 
              ? pr.education.map((e: any) => `${e.degree || ''} from ${e.institution || ''}`).join('; ')
              : (typeof pr.education === 'string' ? pr.education : JSON.stringify(pr.education));
            sections.push(`Education: ${eduText}`);
          }
          
          resumeText = sections.join('\n\n');
        } else {
          resumeText = [
            `Candidate: ${matchingApp.candidate_name || ''}`,
            matchingApp.candidate_skills ? `Skills: ${matchingApp.candidate_skills.join(', ')}` : ''
          ].filter(Boolean).join('\n');
        }
        setResumeSummary(resumeText);
        setStage('intro');
        
      } catch (error: any) {
        console.error('Error fetching application:', error);
        setStage('error');
      }
    };
    
    if (id) {
      fetchApplicationData();
    }
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (stage === 'answering' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (isRecording) {
              stopVoiceAndSave(false);
            } else {
              handleSubmitAnswer();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stage, timeLeft, isRecording, stopVoiceAndSave]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      clearQuestionStreamTimer();
      cleanupMicrophoneResources();
    };
  }, [cleanupMicrophoneResources, clearQuestionStreamTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the interview - get first question
  const handleStartInterview = async () => {
    setIsLoadingQuestion(true);
    setStage('asking');
    
    try {
      const result = await flaskAPI.startInterview(jobDescription, resumeSummary);
      
      if (result.success && result.question) {
        presentQuestionWithVoice(result.question, result.audio?.audio_base64);
        setQuestionNumber(1);
        
        // Store in conversation history (hidden from UI)
        setConversationHistory([{
          role: 'interviewer',
          content: result.question,
          timestamp: new Date()
        }]);
        
        setLiveTranscript('');
        setRecordingError('');
        setTimeLeft(ANSWER_TIME_LIMIT);
        setStage('answering');
        setTimeout(() => answerRef.current?.focus(), 100);
      } else {
        throw new Error('Failed to generate question');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
      setStage('ready');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Submit answer
  const handleSubmitAnswer = useCallback(async (providedAnswer?: string) => {
    if (isSubmitting) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const currentAnswer = (providedAnswer ?? answer).trim() || "(No answer provided)";
    setIsSubmitting(true);
    
    // Add to conversation history (hidden)
    setConversationHistory(prev => [...prev, {
      role: 'candidate',
      content: currentAnswer,
      timestamp: new Date()
    }]);
    
    setAnswer('');
    setLiveTranscript('');
    recordedChunksRef.current = [];
    setStage('submitted');
    
    try {
      // Evaluate the answer
      const evalResult = await flaskAPI.evaluateAnswer(
        jobDescription,
        currentQuestion,
        currentAnswer,
        resumeSummary
      );
      
      setAnswerScores(prev => [...prev, { 
        score: evalResult.score || 5, 
        feedback: evalResult.feedback || '' 
      }]);
      
      setQuestionScores(prev => [...prev, {
        question: currentQuestion,
        answer: currentAnswer,
        score: evalResult.score || 5,
        feedback: evalResult.feedback || ''
      }]);
      
      // Check if interview is complete
      if (questionNumber >= TOTAL_QUESTIONS) {
        await completeInterview(currentAnswer);
      }
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, questionNumber, currentQuestion, jobDescription, resumeSummary, isSubmitting]);

  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

  // Get next question
  const handleNextQuestion = async () => {
    if (questionNumber >= TOTAL_QUESTIONS) {
      await completeInterview();
      return;
    }
    
    setIsLoadingQuestion(true);
    setStage('asking');
    
    try {
      const historyForAPI = conversationHistory.map(m => ({ role: m.role, content: m.content }));
      
      const nextQ = await flaskAPI.getNextQuestion(
        jobDescription,
        resumeSummary,
        historyForAPI,
        questionNumber + 1,
        TOTAL_QUESTIONS
      );
      
      if (nextQ.success && nextQ.question) {
        presentQuestionWithVoice(nextQ.question, nextQ.audio?.audio_base64);
        setQuestionNumber(prev => prev + 1);
        
        // Add to conversation history (hidden)
        setConversationHistory(prev => [...prev, {
          role: 'interviewer',
          content: nextQ.question,
          timestamp: new Date()
        }]);
        
        setLiveTranscript('');
        setRecordingError('');
        setTimeLeft(ANSWER_TIME_LIMIT);
        setStage('answering');
        setTimeout(() => answerRef.current?.focus(), 100);
      } else {
        throw new Error('Failed to get next question');
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      toast({
        title: "Error",
        description: "Failed to get next question. Please try again.",
        variant: "destructive",
      });
      setStage('submitted');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Complete the interview
  const completeInterview = async (lastAnswer?: string) => {
    try {
      const allMessages = lastAnswer 
        ? conversationHistory.concat([{ role: 'candidate', content: lastAnswer, timestamp: new Date() }])
        : conversationHistory;
      
      const finalEval = await flaskAPI.evaluateFullInterview(
        jobDescription,
        resumeSummary,
        allMessages.map(m => ({ role: m.role, content: m.content })),
        answerScores
      );
      
      // Save to Django
      try {
        await interviewResultsAPI.saveResults({
          interview_token: id || '',
          overall_score: finalEval.overall_score || Math.round(answerScores.reduce((a, b) => a + b.score, 0) / answerScores.length),
          recommendation: finalEval.recommendation || 'consider',
          summary: finalEval.summary || '',
          strengths: finalEval.strengths || [],
          areas_for_improvement: finalEval.areas_for_improvement || [],
          cv_verification: finalEval.cv_verification || '',
          job_fit: finalEval.job_fit || '',
          questions_and_answers: questionScores
        });
      } catch (saveError) {
        console.error('Failed to save interview results:', saveError);

        const statusCode = (saveError as any)?.response?.status;
        if (statusCode === 409) {
          toast({
            title: 'Interview already submitted',
            description: 'This interview was already completed earlier and cannot be re-attempted.',
            variant: 'destructive',
          });
          setStage('error');
          return;
        }
      }
      
      localStorage.setItem(`interview_result_${id}`, JSON.stringify({
        ...finalEval,
        messages: allMessages,
        application: application,
        questions_and_answers: questionScores
      }));
      
      setStage('completed');
      
      setTimeout(() => navigate(`/interview/result/${id}`), 3000);
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isSubmitting) {
      handleSubmitAnswer();
    }
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 30) return 'text-red-400';
    if (timeLeft <= 60) return 'text-yellow-400';
    return 'text-white';
  };

  // ==================== RENDER STATES ====================

  // Loading state
  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse mx-auto" />
            <Loader2 className="h-10 w-10 animate-spin text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xl text-white/80 mt-6 font-light">Preparing your interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border-white/20 text-center p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/20 mx-auto flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Interview Not Available</h2>
          <p className="text-white/60 mb-8">
            {completionMessage || 'This interview link is invalid or has expired. Please contact your recruiter.'}
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  // Introduction screen
  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Interview
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to Your Interview
            </h1>
            <p className="text-xl text-white/60">
              {application?.job_post?.job_title || 'Position'} at {application?.job_post?.company_name || application?.organization_name || 'Company'}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6 text-center hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mx-auto flex items-center justify-center mb-4">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{TOTAL_QUESTIONS} Questions</h3>
              <p className="text-white/60 text-sm">Tailored questions based on your resume and job requirements</p>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6 text-center hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{Math.floor(ANSWER_TIME_LIMIT / 60)} Min Per Answer</h3>
              <p className="text-white/60 text-sm">Take your time to provide thoughtful responses</p>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6 text-center hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mx-auto flex items-center justify-center mb-4">
                <Volume2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Audio Questions</h3>
              <p className="text-white/60 text-sm">Questions will be read aloud for a natural experience</p>
            </Card>
          </div>

          {/* Guidelines */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-400" />
              Interview Guidelines
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Target, text: "Answer based on your actual experience" },
                { icon: CheckCircle, text: "Be specific with examples and details" },
                { icon: Mic, text: "Ensure your speakers are on for audio" },
                { icon: Award, text: "Take your time to think before answering" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Start Button */}
          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => setStage('ready')}
              className="px-12 py-7 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 rounded-2xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              I'm Ready to Begin
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ready to start (confirmation)
  if (stage === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/10 backdrop-blur-xl border-white/20 p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mx-auto flex items-center justify-center mb-6 animate-pulse">
            <Briefcase className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-white/60 mb-8">
            Your interview for <span className="text-white font-medium">{application?.job_post?.job_title}</span> is about to begin.
          </p>
          
          <div className="space-y-4">
            <Button 
              size="lg"
              onClick={handleStartInterview}
              disabled={isLoadingQuestion}
              className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-0 rounded-xl"
            >
              {isLoadingQuestion ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Question...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Interview
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => setStage('intro')}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Completed state
  if (stage === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/10 backdrop-blur-xl border-white/20 p-8 text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-green-500/30 animate-ping" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Interview Complete!</h2>
          <p className="text-white/60 mb-6">
            Thank you for completing your interview. Your responses have been recorded.
          </p>
          <div className="flex items-center justify-center gap-2 text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting to results...</span>
          </div>
        </Card>
      </div>
    );
  }

  // ==================== MAIN INTERVIEW UI - SINGLE QUESTION VIEW ====================
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Minimal Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Interview for</p>
              <p className="text-white font-medium">{application?.job_post?.job_title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setAudioEnabled(prev => !prev);
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current = null;
                  setIsPlayingAudio(false);
                }
              }}
              className={`p-2.5 rounded-xl transition-all ${
                audioEnabled 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {isPlayingAudio ? (
                <Volume2 className="h-5 w-5 animate-pulse" />
              ) : audioEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 bg-black/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Question {questionNumber} of {TOTAL_QUESTIONS}</span>
            <span>{Math.round((questionNumber / TOTAL_QUESTIONS) * 100)}% Complete</span>
          </div>
          <Progress 
            value={(questionNumber / TOTAL_QUESTIONS) * 100} 
            className="h-2 bg-white/10"
          />
        </div>
      </div>

      {/* Main Content - Single Question Focus */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          
          {/* Loading Question */}
          {stage === 'asking' && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl text-white mb-2">Preparing your next question...</h3>
              <p className="text-white/50">Please wait a moment</p>
            </Card>
          )}

          {/* Question Display & Answer */}
          {stage === 'answering' && (
            <div className="space-y-6">
              {/* Timer */}
              <div className="flex justify-center">
                <div className={`px-6 py-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center gap-3 ${timeLeft <= 30 ? 'animate-pulse' : ''}`}>
                  <Clock className={`h-5 w-5 ${getTimerColor()}`} />
                  <span className={`font-mono text-2xl font-bold ${getTimerColor()}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/50 text-sm uppercase tracking-wider mb-2">Question {questionNumber}</p>
                    <p className="text-white text-xl leading-relaxed">{streamedQuestion || currentQuestion}</p>
                  </div>
                </div>
                {isPlayingAudio && (
                  <p className="text-xs text-purple-300/90 mt-2">Reading question aloud...</p>
                )}
              </Card>

              {/* Answer Input */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                <p className="text-white/50 text-sm uppercase tracking-wider mb-3">Your Answer</p>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {!isRecording ? (
                    <Button
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={isSubmitting || isTranscribing}
                      className="bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Voice Answer
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => stopVoiceAndSave(false)}
                      disabled={isSubmitting || isTranscribing}
                      className="bg-rose-600 hover:bg-rose-500 rounded-xl"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop and Review Transcript
                    </Button>
                  )}

                  {(isRecording || isTranscribing) && (
                    <span className="text-sm text-white/70 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isRecording ? 'Listening and transcribing...' : 'Finalizing transcript...'}
                    </span>
                  )}
                </div>

                {recordingError && (
                  <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {recordingError}
                  </div>
                )}

                <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Live Transcript</p>
                  <p className="text-white/90 min-h-[48px]">
                    {liveTranscript || (isRecording ? 'Transcription will appear here as you speak...' : 'No transcript yet.')}
                  </p>
                </div>

                <Textarea
                  ref={answerRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="You can type, or record your answer and edit transcript here..."
                  className="min-h-[150px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30 text-lg focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl mb-4"
                  disabled={isSubmitting || isRecording}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">
                    <kbd className="px-2 py-1 rounded bg-white/10 text-white/60 text-xs mr-1">Ctrl+Enter</kbd>
                    to submit
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-white/40 text-sm">{answer.length} chars</span>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={isSubmitting || isRecording || !answer.trim()}
                      size="lg"
                      className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 rounded-xl disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Answer Submitted - Next Question */}
          {stage === 'submitted' && !isSubmitting && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mx-auto flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Answer Recorded!</h3>
              <p className="text-white/60 mb-8">
                {questionNumber >= TOTAL_QUESTIONS 
                  ? "You've completed all questions. Click below to finish." 
                  : "Your response has been saved. Ready for the next question?"}
              </p>
              <Button
                onClick={handleNextQuestion}
                disabled={isLoadingQuestion}
                size="lg"
                className="px-10 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 rounded-xl"
              >
                {isLoadingQuestion ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : questionNumber >= TOTAL_QUESTIONS ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Complete Interview
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              {questionNumber < TOTAL_QUESTIONS && (
                <p className="text-white/40 text-sm mt-4">
                  {TOTAL_QUESTIONS - questionNumber} questions remaining
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interview;
