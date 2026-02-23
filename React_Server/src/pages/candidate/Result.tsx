import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Loader2, MessageSquare, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { interviewAPI } from "@/services/api";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
}

const Result = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAIInterview, setIsAIInterview] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      
      // First check localStorage for AI interview results
      const storedResult = localStorage.getItem(`interview_result_${id}`);
      if (storedResult) {
        try {
          const parsedResult = JSON.parse(storedResult);
          setResult({
            evaluation_score: parsedResult.overall_score || 0,
            status: parsedResult.recommendation === 'recommend' ? 'Pass' : 
                   parsedResult.recommendation === 'not_recommend' ? 'Fail' : 'Pending Review',
            evaluation_summary: parsedResult.summary || '',
            strengths: parsedResult.strengths || [],
            areas_for_improvement: parsedResult.areas_for_improvement || [],
            cv_verification: parsedResult.cv_verification || '',
            job_fit: parsedResult.job_fit || '',
            recommendation: parsedResult.recommendation || 'consider'
          });
          setMessages(parsedResult.messages?.map((m: any) => ({
            role: m.role,
            content: m.content
          })) || []);
          setIsAIInterview(true);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse stored interview result:', e);
        }
      }
      
      // Fall back to API call for legacy interviews
      try {
        const interviewData = await interviewAPI.get(parseInt(id));
        setResult(interviewData);
      } catch (error) {
        console.error('Failed to fetch interview result:', error);
        toast({
          title: "Error",
          description: "Failed to load interview results",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, toast]);

  const getStatusIcon = () => {
    const status = result?.status || "Pending";
    switch (status) {
      case "completed":
      case "Pass":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "rejected":
      case "Fail":
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    const status = result?.status || "Pending";
    switch (status) {
      case "completed":
      case "Pass":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "Fail":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading interview results...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8 text-center">
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Results Pending</h3>
              <p className="text-muted-foreground mb-6">
                Your interview results are being processed. Please check back later.
              </p>
              <Button onClick={() => navigate("/candidate/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const score = result.evaluation_score || 0;
  const status = result.status || "Pending";
  const summary = result.evaluation_summary || "Your interview is being evaluated. Results will be available soon.";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{getStatusIcon()}</div>
            <CardTitle className="text-3xl mb-2">Interview Results</CardTitle>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor()}`}>
              {status}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">{score}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
            </div>

            {/* CV Verification and Job Fit for AI Interview */}
            {isAIInterview && (result?.cv_verification || result?.job_fit) && (
              <div className="grid grid-cols-2 gap-4">
                {result?.cv_verification && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Skills Verification</h4>
                    <p className={`text-lg font-semibold capitalize ${
                      result.cv_verification === 'verified' ? 'text-green-600' :
                      result.cv_verification === 'partial' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.cv_verification}
                    </p>
                  </div>
                )}
                {result?.job_fit && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">Job Fit</h4>
                    <p className={`text-lg font-semibold capitalize ${
                      result.job_fit === 'excellent' ? 'text-green-600' :
                      result.job_fit === 'good' ? 'text-blue-600' :
                      result.job_fit === 'fair' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.job_fit}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Strengths and Areas for Improvement for AI Interview */}
            {isAIInterview && result?.strengths && result.strengths.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {result.strengths.map((strength: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-600 dark:text-green-300">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isAIInterview && result?.areas_for_improvement && result.areas_for_improvement.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Areas for Improvement</h3>
                <ul className="space-y-2">
                  {result.areas_for_improvement.map((area: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-300">
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interview Transcript for AI Interview */}
            {isAIInterview && messages.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Interview Transcript
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                        msg.role === 'interviewer' 
                          ? 'bg-purple-500' 
                          : 'bg-green-500'
                      }`}>
                        {msg.role === 'interviewer' ? (
                          <Bot className="h-4 w-4 text-white" />
                        ) : (
                          <User className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className={`max-w-[80%] ${msg.role === 'candidate' ? 'text-right' : ''}`}>
                        <p className="text-xs text-muted-foreground mb-1">
                          {msg.role === 'interviewer' ? 'AI Interviewer' : 'You'}
                        </p>
                        <div className={`p-3 rounded-lg text-sm ${
                          msg.role === 'interviewer'
                            ? 'bg-slate-100 dark:bg-slate-800 text-left'
                            : 'bg-primary text-primary-foreground text-left'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.scheduled_time && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Interview Date:</span>{" "}
                  {new Date(result.scheduled_time).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            <Button
              onClick={() => navigate("/candidate/dashboard")}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Result;
