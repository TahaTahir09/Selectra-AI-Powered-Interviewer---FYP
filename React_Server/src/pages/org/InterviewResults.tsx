import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import intercviewAPI from "@/services/api";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

interface InterviewResults {
  success: boolean;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  interview_completed_at: string;
  results: {
    overall_score: number;
    recommendation: string;
    summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    cv_verification: string;
    job_fit: string;
    questions_and_answers?: any[];
  };
}

const InterviewResults = () => {
  const navigate = useNavigate();
  const { interview_token } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<InterviewResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.user_type !== 'organization') {
      toast({
        title: "Access Denied",
        description: "Only organization users can view interview results.",
        variant: "destructive",
      });
      navigate("/org/login");
      return;
    }

    fetchInterviewResults();
  }, [interview_token, user]);

  const fetchInterviewResults = async () => {
    if (!interview_token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/core/interview-results/${interview_token}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          setError('You do not have permission to view this interview result. You can only view results for your organization.');
        } else if (response.status === 404) {
          setError('Interview results not found. The interview may not have been completed yet.');
        } else {
          setError(errorData.error || 'Failed to load interview results');
        }
        return;
      }

      const data: InterviewResults = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error('Error fetching interview results:', err);
      setError('Failed to load interview results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/org/login");
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'recommend':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'consider':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'not_recommend':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'recommend':
        return 'Recommend';
      case 'consider':
        return 'Consider';
      case 'not_recommend':
        return 'Not Recommended';
      default:
        return 'Under Review';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Sidebar userType="organization" userName={user?.username} userEmail={user?.email} onLogout={handleLogout} />
        <div className="flex-1 ml-64 flex flex-col">
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-400" />
              <p className="text-white/60">Loading interview results...</p>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Sidebar userType="organization" userName={user?.username} userEmail={user?.email} onLogout={handleLogout} />
        <div className="flex-1 ml-64 flex flex-col">
          <main className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full bg-red-500/10 border-red-500/20">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Results</h3>
                <p className="text-red-200 mb-6">{error}</p>
                <Button
                  onClick={() => navigate("/org/applications")}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Sidebar userType="organization" userName={user?.username} userEmail={user?.email} onLogout={handleLogout} />
        <div className="flex-1 ml-64 flex flex-col">
          <main className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Results Available</h3>
                <p className="text-white/60 mb-6">Interview results are not yet available</p>
                <Button
                  onClick={() => navigate("/org/applications")}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  Back to Applications
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const score = results.results.overall_score || 0;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar userType="organization" userName={user?.username} userEmail={user?.email} onLogout={handleLogout} />
      
      <div className="flex-1 ml-64 flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/org/applications")}
              className="text-white/60 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-purple-400">Interview Results</span>
              </h1>
              <p className="text-lg text-white/60">
                Detailed evaluation for {results.candidate_name}
              </p>
            </div>
          </div>

          {/* Candidate Overview */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-6">
                <h3 className="text-sm text-white/60 mb-2">Candidate Name</h3>
                <p className="text-2xl font-bold text-white">{results.candidate_name}</p>
                <p className="text-sm text-white/60 mt-2">{results.candidate_email}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-6">
                <h3 className="text-sm text-white/60 mb-2">Position Applied For</h3>
                <p className="text-2xl font-bold text-white">{results.job_title}</p>
                <p className="text-sm text-white/60 mt-2">
                  {new Date(results.interview_completed_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Overall Score and Recommendation */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-purple-400" />
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="text-6xl font-bold text-purple-400">{score}</div>
                  <div className="ml-4">
                    <div className="text-sm text-white/60">/10</div>
                    <div className="text-xs text-white/40 mt-1">Performance Grade</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br border ${getRecommendationColor(results.results.recommendation)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {getRecommendationText(results.results.recommendation)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 leading-relaxed">{results.results.summary}</p>
            </CardContent>
          </Card>

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <Card className="bg-green-500/10 backdrop-blur-xl border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-400">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                {results.results.strengths && results.results.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {results.results.strengths.map((strength, idx) => (
                      <li key={idx} className="flex gap-2 text-white/80">
                        <span className="text-green-400">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/60">No specific strengths recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="bg-yellow-500/10 backdrop-blur-xl border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-yellow-400">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                {results.results.areas_for_improvement && results.results.areas_for_improvement.length > 0 ? (
                  <ul className="space-y-2">
                    {results.results.areas_for_improvement.map((area, idx) => (
                      <li key={idx} className="flex gap-2 text-white/80">
                        <span className="text-yellow-400">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/60">No areas for improvement identified</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle>CV Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 capitalize">{results.results.cv_verification}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle>Job Fit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 capitalize">{results.results.job_fit}</p>
              </CardContent>
            </Card>
          </div>

          {/* Questions and Answers */}
          {results.results.questions_and_answers && results.results.questions_and_answers.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 mb-8">
              <CardHeader>
                <CardTitle>Interview Q&A Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {results.results.questions_and_answers.map((qa, idx) => (
                    <div key={idx} className="border-l-2 border-purple-500/30 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">Q{idx + 1}: {qa.question?.substring(0, 100)}...</h4>
                        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded text-sm">
                          Score: {qa.score}/10
                        </span>
                      </div>
                      <p className="text-white/70 mb-2">
                        <strong>Answer:</strong> {qa.answer?.substring(0, 150)}...
                      </p>
                      {qa.feedback && (
                        <p className="text-white/60 text-sm">
                          <strong>Feedback:</strong> {qa.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/org/applications")}
              className="bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default InterviewResults;
