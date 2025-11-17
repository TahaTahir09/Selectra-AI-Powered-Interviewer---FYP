import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import bgPattern from "@/assets/bg-pattern.jpg";

const Result = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Mock result data
  const result = {
    score: 85,
    status: "Pass",
    summary:
      "Excellent performance! You demonstrated strong communication skills, technical knowledge, and problem-solving abilities. Your responses were clear and well-structured. The hiring team will review your interview and get back to you soon.",
  };

  const getStatusIcon = () => {
    switch (result.status) {
      case "Pass":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "Fail":
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case "Pass":
        return "bg-green-100 text-green-800";
      case "Fail":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{getStatusIcon()}</div>
            <CardTitle className="text-3xl mb-2">Interview Results</CardTitle>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor()}`}>
              {result.status}
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
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - result.score / 100)}`}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">{result.score}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            </div>

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
