import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Play, Loader2, Clock, Send, CheckCircle, 
  AlertCircle, User, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { applicationAPI, flaskAPI } from "@/services/api";

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}

interface AnswerScore {
  score: number;
  feedback: string;
}

type InterviewStage = 'loading' | 'ready' | 'in_progress' | 'answering' | 'completed' | 'error';

const TOTAL_QUESTIONS = 5; // Configurable number of questions
const ANSWER_TIME_LIMIT = 60; // 60 seconds per answer

const Interview = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This is the interview token from the interview_link
  const { toast } = useToast();
  
  // Application data
  const [application, setApplication] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  
  // Interview state
  const [stage, setStage] = useState<InterviewStage>('loading');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [answerScores, setAnswerScores] = useState<AnswerScore[]>([]);
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Loading states
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Text area ref for auto focus
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch application data using the interview token
  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        // The ID in the URL is the interview token (UUID from interview_link)
        // We need to find the application with this interview link
        const response = await applicationAPI.list();
        const applications = response.results || response;
        
        // Find application with matching interview link token
        const matchingApp = applications.find((app: any) => 
          app.interview_link && app.interview_link.includes(id)
        );
        
        if (!matchingApp) {
          toast({
            title: "Interview Not Found",
            description: "Could not find the interview. Please check the link.",
            variant: "destructive",
          });
          setStage('error');
          return;
        }
        
        setApplication(matchingApp);
        
        // Set job description from job_post - include title and requirements
        const jobPost = matchingApp.job_post || {};
        const jobDesc = [
          `Job Title: ${jobPost.job_title || 'Not specified'}`,
          `Company: ${jobPost.company_name || matchingApp.organization_name || ''}`,
          `Requirements: ${jobPost.requirements || ''}`,
          `Description: ${jobPost.job_description || ''}`
        ].filter(Boolean).join('\n\n');
        setJobDescription(jobDesc);
        
        // Build comprehensive resume summary from parsed_resume for CV-specific questions
        let resumeText = '';
        if (matchingApp.parsed_resume) {
          const pr = matchingApp.parsed_resume;
          
          // Build detailed resume text for LLM context
          const sections = [];
          
          // Candidate info
          if (pr.name || matchingApp.candidate_name) {
            sections.push(`Candidate Name: ${pr.name || matchingApp.candidate_name}`);
          }
          
          // Summary/Objective
          if (pr.summary || pr.objective) {
            sections.push(`Professional Summary: ${pr.summary || pr.objective}`);
          }
          
          // Skills - very important for technical questions
          if (pr.skills) {
            const skillsList = Array.isArray(pr.skills) ? pr.skills : 
              (typeof pr.skills === 'string' ? pr.skills.split(',') : []);
            if (skillsList.length > 0) {
              sections.push(`Technical Skills: ${skillsList.join(', ')}`);
            }
          }
          
          // Work Experience - detailed for project/role questions
          if (pr.experience && Array.isArray(pr.experience)) {
            const expDetails = pr.experience.map((exp: any, i: number) => {
              const parts = [];
              if (exp.title || exp.position) parts.push(`Role: ${exp.title || exp.position}`);
              if (exp.company || exp.organization) parts.push(`Company: ${exp.company || exp.organization}`);
              if (exp.duration || exp.dates) parts.push(`Duration: ${exp.duration || exp.dates}`);
              if (exp.description) parts.push(`Responsibilities: ${exp.description}`);
              if (exp.achievements) parts.push(`Achievements: ${Array.isArray(exp.achievements) ? exp.achievements.join('; ') : exp.achievements}`);
              if (exp.technologies) parts.push(`Technologies Used: ${Array.isArray(exp.technologies) ? exp.technologies.join(', ') : exp.technologies}`);
              return parts.join('\n');
            }).join('\n\n');
            sections.push(`Work Experience:\n${expDetails}`);
          } else if (pr.experience && typeof pr.experience === 'string') {
            sections.push(`Work Experience: ${pr.experience}`);
          }
          
          // Projects - for specific project questions
          if (pr.projects && Array.isArray(pr.projects)) {
            const projDetails = pr.projects.map((proj: any) => {
              const parts = [];
              if (proj.name || proj.title) parts.push(`Project: ${proj.name || proj.title}`);
              if (proj.description) parts.push(`Description: ${proj.description}`);
              if (proj.technologies) parts.push(`Technologies: ${Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}`);
              return parts.join('\n');
            }).join('\n\n');
            sections.push(`Projects:\n${projDetails}`);
          }
          
          // Education
          if (pr.education) {
            const eduText = Array.isArray(pr.education) 
              ? pr.education.map((e: any) => `${e.degree || ''} from ${e.institution || ''} (${e.year || ''})`).join('; ')
              : (typeof pr.education === 'string' ? pr.education : JSON.stringify(pr.education));
            sections.push(`Education: ${eduText}`);
          }
          
          // Certifications
          if (pr.certifications && Array.isArray(pr.certifications)) {
            sections.push(`Certifications: ${pr.certifications.join(', ')}`);
          }
          
          resumeText = sections.join('\n\n');
        } else {
          // Fallback to basic candidate fields
          resumeText = [
            `Candidate: ${matchingApp.candidate_name || ''}`,
            matchingApp.candidate_skills ? `Skills: ${matchingApp.candidate_skills.join(', ')}` : '',
            matchingApp.years_of_experience ? `Years of Experience: ${matchingApp.years_of_experience}` : '',
            matchingApp.candidate_education ? `Education: ${matchingApp.candidate_education}` : ''
          ].filter(Boolean).join('\n');
        }
        setResumeSummary(resumeText);
        
        setStage('ready');
        
      } catch (error: any) {
        console.error('Error fetching application:', error);
        toast({
          title: "Error",
          description: "Failed to load interview data",
          variant: "destructive",
        });
        setStage('error');
      }
    };
    
    if (id) {
      fetchApplicationData();
    }
  }, [id, toast]);

  // Timer effect
  useEffect(() => {
    if (stage === 'answering' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleSubmitAnswer();
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
  }, [stage]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the interview
  const handleStartInterview = async () => {
    setIsLoadingQuestion(true);
    setStage('in_progress');
    
    try {
      const result = await flaskAPI.startInterview(jobDescription, resumeSummary);
      
      if (result.success && result.question) {
        const question = result.question;
        setCurrentQuestion(question);
        setQuestionNumber(1);
        
        // Add interviewer message
        setMessages([{
          role: 'interviewer',
          content: question,
          timestamp: new Date()
        }]);
        
        setTimeLeft(ANSWER_TIME_LIMIT);
        setStage('answering');
        
        // Focus the answer textarea
        setTimeout(() => answerRef.current?.focus(), 100);
      } else {
        throw new Error('Failed to generate question');
      }
    } catch (error: any) {
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

  // Submit answer and get next question
  const handleSubmitAnswer = useCallback(async () => {
    if (isSubmitting) return;
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const currentAnswer = answer.trim() || "(No answer provided)";
    setIsSubmitting(true);
    setStage('in_progress');
    
    try {
      // Add candidate's answer to messages
      setMessages(prev => [...prev, {
        role: 'candidate',
        content: currentAnswer,
        timestamp: new Date()
      }]);
      
      // Evaluate the answer (in background)
      const evalPromise = flaskAPI.evaluateAnswer(
        jobDescription,
        currentQuestion,
        currentAnswer,
        resumeSummary
      );
      
      // Clear the answer input
      setAnswer('');
      
      // Check if interview is complete
      if (questionNumber >= TOTAL_QUESTIONS) {
        // Wait for evaluation
        const evalResult = await evalPromise;
        const newScores = [...answerScores, { 
          score: evalResult.score || 5, 
          feedback: evalResult.feedback || '' 
        }];
        setAnswerScores(newScores);
        
        // Get final evaluation
        const finalEval = await flaskAPI.evaluateFullInterview(
          jobDescription,
          resumeSummary,
          messages.concat([{ role: 'candidate', content: currentAnswer, timestamp: new Date() }])
            .map(m => ({ role: m.role, content: m.content })),
          newScores
        );
        
        // Store results and navigate to result page
        localStorage.setItem(`interview_result_${id}`, JSON.stringify({
          ...finalEval,
          messages: messages.concat([{ role: 'candidate', content: currentAnswer, timestamp: new Date() }]),
          application: application
        }));
        
        setStage('completed');
        
        toast({
          title: "Interview Complete!",
          description: "Your responses have been submitted for evaluation.",
        });
        
        setTimeout(() => navigate(`/interview/result/${id}`), 2000);
        return;
      }
      
      // Store evaluation score
      evalPromise.then(evalResult => {
        setAnswerScores(prev => [...prev, { 
          score: evalResult.score || 5, 
          feedback: evalResult.feedback || '' 
        }]);
      }).catch(console.error);
      
      // Get next question
      const conversationHistory = messages
        .concat([{ role: 'candidate', content: currentAnswer, timestamp: new Date() }])
        .map(m => ({ role: m.role, content: m.content }));
      
      const nextQ = await flaskAPI.getNextQuestion(
        jobDescription,
        resumeSummary,
        conversationHistory,
        questionNumber + 1,
        TOTAL_QUESTIONS
      );
      
      if (nextQ.success && nextQ.question) {
        setCurrentQuestion(nextQ.question);
        setQuestionNumber(prev => prev + 1);
        
        // Add interviewer message
        setMessages(prev => [...prev, {
          role: 'interviewer',
          content: nextQ.question,
          timestamp: new Date()
        }]);
        
        setTimeLeft(ANSWER_TIME_LIMIT);
        setStage('answering');
        
        // Focus the answer textarea
        setTimeout(() => answerRef.current?.focus(), 100);
      } else {
        throw new Error('Failed to get next question');
      }
      
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to process your answer. Please try again.",
        variant: "destructive",
      });
      setStage('answering');
    } finally {
      setIsSubmitting(false);
    }
  }, [answer, questionNumber, messages, answerScores, currentQuestion, jobDescription, resumeSummary, isSubmitting, id, application, navigate, toast]);

  // Handle Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isSubmitting) {
      handleSubmitAnswer();
    }
  };

  // Loading state
  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center text-white">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-xl">Loading Interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Interview Not Available</h2>
          <p className="text-muted-foreground mb-6">
            This interview link is invalid or has expired.
          </p>
          <Button onClick={() => navigate('/candidate/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Ready to start state
  if (stage === 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">AI Interview</CardTitle>
            <p className="text-muted-foreground mt-2">
              {application?.job_post?.job_title || 'Position'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-500" />
                Interview Guidelines
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You will be asked <strong>{TOTAL_QUESTIONS} questions</strong> by our AI interviewer</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>You have <strong>{ANSWER_TIME_LIMIT} seconds</strong> to type your answer for each question</span>
                </li>
                <li className="flex items-start gap-2">
                  <Send className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Press <strong>Ctrl+Enter</strong> or click Submit to send your answer</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Your answers will be automatically submitted when time runs out</span>
                </li>
              </ul>
            </div>
            
            <div className="text-center pt-4">
              <Button 
                size="lg" 
                onClick={handleStartInterview}
                disabled={isLoadingQuestion}
                className="px-12 py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoadingQuestion ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (stage === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="max-w-md p-8 text-center">
          <CheckCircle className="h-20 w-20 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
          <p className="text-muted-foreground mb-4">
            Thank you for completing the interview. Your responses have been recorded.
          </p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500" />
          <p className="text-sm text-muted-foreground mt-2">Redirecting to results...</p>
        </Card>
      </div>
    );
  }

  // Main interview UI
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">AI Interview</h2>
              <p className="text-white/60 text-sm">
                {application?.job_post?.job_title || 'Interview'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Progress */}
            <div className="text-right">
              <p className="text-white/60 text-xs">Progress</p>
              <p className="text-white font-mono">
                {questionNumber} / {TOTAL_QUESTIONS}
              </p>
            </div>
            
            {/* Timer - only show when answering */}
            {stage === 'answering' && (
              <div className={`text-right ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                <p className="text-white/60 text-xs">Time Left</p>
                <p className={`font-mono text-xl ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="px-6 py-2 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <Progress value={(questionNumber / TOTAL_QUESTIONS) * 100} className="h-2" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
        {/* Messages */}
        <Card className="flex-1 mb-4 bg-white/95 dark:bg-slate-800/95 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'interviewer' 
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
                    : 'bg-gradient-to-br from-green-500 to-teal-500'
                }`}>
                  {msg.role === 'interviewer' ? (
                    <Bot className="h-5 w-5 text-white" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'candidate' ? 'text-right' : ''}`}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {msg.role === 'interviewer' ? 'AI Interviewer' : 'You'}
                  </p>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'interviewer'
                      ? 'bg-slate-100 dark:bg-slate-700 text-left rounded-tl-none'
                      : 'bg-purple-500 text-white text-left rounded-tr-none'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator for next question */}
            {(isLoadingQuestion || isSubmitting) && stage === 'in_progress' && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Answer input - only show when answering */}
        {stage === 'answering' && (
          <Card className="bg-white/95 dark:bg-slate-800/95">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Textarea
                  ref={answerRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer here... (Press Ctrl+Enter to submit)"
                  className="min-h-[100px] resize-none flex-1"
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting}
                    className="h-full px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Press Ctrl+Enter to submit</span>
                <span>{answer.length} characters</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Interview;
