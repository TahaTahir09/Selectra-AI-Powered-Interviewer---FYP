import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, CheckCircle, BarChart, Loader2, Play, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { applicationAPI, interviewAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";

interface Application {
  id: number;
  job_post: {
    id: number;
    job_title: string;
    location: string;
    employment_type: string;
    organization_name: string;
  };
  status: string;
  created_at: string;
  similarity_score?: number;
  interview_link?: string;
}

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [interviewLink, setInterviewLink] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.list();
      const apps = response.results || response;
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/candidate/login");
  };

  const handleStartInterview = () => {
    if (interviewLink) {
      const id = interviewLink.split("/").pop();
      navigate(`/interview/${id}`);
    }
  };

  const pendingApps = applications.filter(app => app.status === 'pending').length;
  const scheduledApps = applications.filter(app => app.status === 'reviewed' || app.status === 'scheduled').length;
  const completedApps = applications.filter(app => app.status === 'completed' || app.status === 'accepted').length;
  const resultsApps = applications.filter(app => app.status === 'accepted' || app.status === 'rejected').length;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar 
        userType="candidate" 
        userName={user?.username}
        userEmail={user?.email}
        onLogout={handleLogout} 
      />
      
      <div className="flex-1 ml-64 flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="text-purple-400">Welcome</span>
            <span className="text-white">, {user?.username || "Candidate"}</span>
          </h1>
          <p className="text-lg text-white/60">Track your applications and interview progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Briefcase className="h-10 w-10 text-blue-500 mb-2" />
                <p className="text-sm text-white/60 mb-1">Jobs Applied</p>
                <p className="text-3xl font-bold text-blue-500">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : applications.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-10 w-10 text-purple-400 mb-2" />
                <p className="text-sm text-white/60 mb-1">Pending</p>
                <p className="text-3xl font-bold text-purple-400">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : pendingApps}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm text-white/60 mb-1">Reviewed</p>
                <p className="text-3xl font-bold text-green-500">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : scheduledApps}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <BarChart className="h-10 w-10 text-purple-500 mb-2" />
                <p className="text-sm text-white/60 mb-1">Results</p>
                <p className="text-3xl font-bold text-purple-500">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : resultsApps}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Interview Card */}
        <Card className="mb-8 shadow-lg bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-purple-400" />
              Start New Interview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
                className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
              >
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ready for Interview - Applications with auto-generated interview links */}
        {applications.filter(app => app.interview_link).length > 0 && (
          <Card className="shadow-lg border-2 border-green-500/30 bg-white/10 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-green-500/20 to-white/5 border-b border-white/10">
          <CardTitle className="text-2xl flex items-center gap-2 text-green-400">
                <Link className="h-6 w-6" />
                Ready for Interview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-white/60 mb-4">
                You are eligible to take the interview for these applications.
              </p>
              <div className="space-y-4">
                {applications
                  .filter(app => app.interview_link)
                  .map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 border-2 border-green-500/30 rounded-xl bg-green-500/10 hover:shadow-md hover:bg-green-500/20 transition-all"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1">
                          {app.job_post?.job_title || "Job Title"}
                        </h3>
                      </div>
                      <Button
                        onClick={() => {
                          const interviewId = app.interview_link?.split('/').pop();
                          navigate(`/interview/${interviewId}`);
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Interview
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Applications */}
        <Card className="shadow-lg bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-blue-500" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-white/60/30 mx-auto mb-4" />
                <p className="text-white/60 mb-4">No applications yet</p>
                <p className="text-sm text-white/60">Start applying to jobs to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-6 border-2 border-white/10 rounded-xl hover:shadow-md hover:border-purple-500/30 transition-all"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">
                        {app.job_post?.job_title || "Job Title"}
                      </h3>
                      <p className="text-sm text-white/60">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                      app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      app.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                      app.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default CandidateDashboard;
