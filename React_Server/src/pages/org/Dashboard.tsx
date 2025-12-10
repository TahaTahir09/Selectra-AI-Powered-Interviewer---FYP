import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI, applicationAPI, JobPost } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const OrgDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalInterviews, setTotalInterviews] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch jobs
      const jobsResponse = await jobAPI.list();
      const activeJobs = jobsResponse.results || jobsResponse;
      setJobs(Array.isArray(activeJobs) ? activeJobs : []);
      
      // Fetch applications count
      const applicationsResponse = await applicationAPI.list();
      const applications = applicationsResponse.results || applicationsResponse;
      setTotalApplications(Array.isArray(applications) ? applications.length : 0);
      
      // Calculate interviews (applications with status not 'pending')
      const interviewsCount = Array.isArray(applications) 
        ? applications.filter((app: any) => app.status !== 'pending').length 
        : 0;
      setTotalInterviews(interviewsCount);
      
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
    navigate("/org/login");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-orange-50 to-white">
      <Sidebar 
        userType="organization" 
        userName={user?.username} 
        userEmail={user?.email}
        onLogout={handleLogout} 
      />
      
      <div className="flex-1 ml-64 flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="text-orange-500">Welcome back</span>
            <span className="text-gray-900">, {user?.username || "Organization"}</span>
          </h1>
          <p className="text-lg text-muted-foreground">Manage your job postings and interview processes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : jobs.length}
                  </p>
                </div>
                <Briefcase className="h-12 w-12 text-orange-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Applicants</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalApplications}
                  </p>
                </div>
                <FileText className="h-12 w-12 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Interviews</p>
                  <p className="text-3xl font-bold text-green-500">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalInterviews}
                  </p>
                </div>
                <Users className="h-12 w-12 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => navigate("/org/post-job")}
            className="h-24 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
          >
            <Briefcase className="mr-2 h-6 w-6" />
            Post New Job
          </Button>
          <Button 
            onClick={() => navigate("/org/jobs")}
            variant="outline" 
            className="h-24 text-lg border-2 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all"
          >
            <FileText className="mr-2 h-6 w-6" />
            View All Job Posts
          </Button>
        </div>

        {/* Active Jobs Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-orange-500" />
              Active Job Postings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No job postings yet</p>
                <Button onClick={() => navigate("/org/post-job")} className="bg-gradient-to-r from-primary to-accent">
                  Post Your First Job
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-6 border-2 border-border rounded-xl hover:shadow-md hover:border-orange-200 transition-all"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-foreground mb-1">{job.job_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job.application_count || 0} applicants • {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                        job.status === 'active' ? 'bg-green-100 text-green-700' :
                        job.status === 'closed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {job.status}
                      </span>
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600" 
                        size="sm"
                        onClick={() => navigate(`/org/job/${job.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
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

export default OrgDashboard;
