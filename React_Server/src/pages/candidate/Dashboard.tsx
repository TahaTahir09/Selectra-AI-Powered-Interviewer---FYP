import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, CheckCircle, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatsCard from "@/components/StatsCard";
import FormInput from "@/components/FormInput";
import bgPattern from "@/assets/bg-pattern.jpg";

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [interviewLink, setInterviewLink] = useState("");
  const candidateName = localStorage.getItem("candidateName") || "Candidate";

  const handleLogout = () => {
    localStorage.removeItem("candidateName");
    navigate("/candidate/login");
  };

  const handleStartInterview = () => {
    if (interviewLink) {
      const id = interviewLink.split("/").pop();
      navigate(`/interview/${id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header userType="candidate" userName={candidateName} onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {candidateName}
          </h1>
          <p className="text-muted-foreground">Track your applications and interview progress</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Jobs Applied" value="12" icon={Briefcase} />
          <StatsCard title="Scheduled Interviews" value="3" icon={Clock} gradient />
          <StatsCard title="Completed" value="8" icon={CheckCircle} />
          <StatsCard title="Results Received" value="5" icon={BarChart} gradient />
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Start New Interview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormInput
                label="Interview Link"
                placeholder="Paste the interview link provided by the organization"
                value={interviewLink}
                onChange={(e) => setInterviewLink(e.target.value)}
              />
              <Button
                onClick={handleStartInterview}
                disabled={!interviewLink}
                className="w-full bg-gradient-to-r from-accent to-accent/80"
              >
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Frontend Developer", company: "Tech Corp", status: "Pending" },
                { title: "Full Stack Engineer", company: "StartupXYZ", status: "Interview Scheduled" },
                { title: "UI Designer", company: "Design Studio", status: "Completed" },
              ].map((app, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{app.title}</h3>
                    <p className="text-sm text-muted-foreground">{app.company}</p>
                  </div>
                  <span className="px-3 py-1 bg-accent/20 text-accent-foreground text-sm font-medium rounded-full">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CandidateDashboard;
