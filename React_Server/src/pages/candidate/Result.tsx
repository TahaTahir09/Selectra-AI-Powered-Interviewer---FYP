import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { interviewAPI } from "@/services/api";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Result = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      
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
