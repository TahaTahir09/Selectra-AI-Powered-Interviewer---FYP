import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, CheckCircle, BarChart, Loader2 } from "lucide-react";
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
  job_post: any;
  status: string;
  created_at: string;
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
    <div className="min-h-screen flex bg-gradient-to-b from-orange-50 to-white">
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
            <span className="text-orange-500">Welcome</span>
            <span className="text-gray-900">, {user?.username || "Candidate"}</span>
          </h1>
          <p className="text-lg text-muted-foreground">Track your applications and interview progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Briefcase className="h-10 w-10 text-blue-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Jobs Applied</p>
                <p className="text-3xl font-bold text-blue-500">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : applications.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-10 w-10 text-orange-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-500">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : pendingApps}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Reviewed</p>
                <p className="text-3xl font-bold text-green-500">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : scheduledApps}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <BarChart className="h-10 w-10 text-purple-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Results</p>
                <p className="text-3xl font-bold text-purple-500">
                  {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : resultsApps}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Interview Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-500" />
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

        {/* Recent Applications */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
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
                <Briefcase className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No applications yet</p>
                <p className="text-sm text-muted-foreground">Start applying to jobs to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-6 border-2 border-border rounded-xl hover:shadow-md hover:border-orange-200 transition-all"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-foreground mb-1">
                        {app.job_post?.job_title || "Job Title"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
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
