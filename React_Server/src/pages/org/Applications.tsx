import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, Loader2, Users, TrendingUp, Mail, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI, applicationAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const Applications = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applicationsByJob, setApplicationsByJob] = useState<{ [key: string]: any[] }>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchApplicationsData();
  }, []);

  const fetchApplicationsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all jobs
      const jobsResponse = await jobAPI.list();
      const allJobs = jobsResponse.results || jobsResponse;
      setJobs(Array.isArray(allJobs) ? allJobs : []);
      
      // Fetch all applications
      const applicationsResponse = await applicationAPI.list();
      const applications = applicationsResponse.results || applicationsResponse;
      
      // Group applications by job
      if (Array.isArray(applications) && Array.isArray(allJobs)) {
        const grouped: { [key: string]: any[] } = {};
        
        allJobs.forEach((job: any) => {
          grouped[job.id] = applications.filter((app: any) => {
            // Try multiple ways to match
            return app.job_post_id === job.id || 
                   app.job_title === job.job_title || 
                   app.job_post?.id === job.id;
          });
        });
        
        setApplicationsByJob(grouped);
        
        // Auto-expand jobs with applications
        const jobsWithApps = new Set(
          allJobs.filter((job: any) => grouped[job.id]?.length > 0).map((job: any) => job.id)
        );
        setExpandedJobs(jobsWithApps);
      }
      
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleJobExpansion = (jobId: number) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const handleLogout = () => {
    logout();
    navigate("/org/login");
  };

  const getDisplaySimilarityScore = (rawScore: number | null | undefined) => {
    if (rawScore === null || rawScore === undefined) return null;
    return Math.min(Math.max(rawScore * 10, 0), 100);
  };

  const getTotalApplications = () => {
    return Object.values(applicationsByJob).reduce((sum, apps) => sum + apps.length, 0);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar 
        userType="organization" 
        userName={user?.username} 
        userEmail={user?.email}
        onLogout={handleLogout} 
      />
      
      <div className="flex-1 ml-64 flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-purple-400">All Applications</span>
            </h1>
            <p className="text-lg text-white/60">
              View and manage applications for all your job postings
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Total Applications</p>
                    <p className="text-3xl font-bold text-blue-500">
                      {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : getTotalApplications()}
                    </p>
                  </div>
                  <FileText className="h-12 w-12 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Active Jobs</p>
                    <p className="text-3xl font-bold text-purple-400">
                      {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : jobs.length}
                    </p>
                  </div>
                  <Briefcase className="h-12 w-12 text-purple-400/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Avg. Applications/Job</p>
                    <p className="text-3xl font-bold text-green-500">
                      {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : 
                        jobs.length > 0 ? Math.round(getTotalApplications() / jobs.length) : 0
                      }
                    </p>
                  </div>
                  <Users className="h-12 w-12 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications by Job */}
          {loading ? (
            <Card className="shadow-lg bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card className="shadow-lg bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-12">
                <div className="text-center">
                  <Briefcase className="h-16 w-16 text-white/60/30 mx-auto mb-4" />
                  <p className="text-white/60 mb-4">No job postings yet</p>
                  <Button onClick={() => navigate("/org/post-job")} className="bg-gradient-to-r from-primary to-accent">
                    Post Your First Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {jobs.map((job) => {
                const applications = applicationsByJob[job.id] || [];
                const isExpanded = expandedJobs.has(job.id);
                const avgScore = applications.length > 0 
                  ? Math.round(
                      applications
                        .filter(app => app.similarity_score !== null && app.similarity_score !== undefined)
                        .reduce((sum, app) => sum + (getDisplaySimilarityScore(app.similarity_score) || 0), 0) / 
                      applications.filter(app => app.similarity_score !== null && app.similarity_score !== undefined).length
                    )
                  : 0;

                return (
                  <Card key={job.id} className="shadow-lg overflow-hidden">
                    <CardHeader 
                      className="bg-gradient-to-r from-white/10 to-white/5 border-b cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={() => toggleJobExpansion(job.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                              <Briefcase className="h-6 w-6 text-purple-400" />
                              {job.job_title}
                            </CardTitle>
                            <p className="text-sm text-white/60 mt-1">
                              {job.location} • {job.employment_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
                            <p className="text-xs text-white/60">Applications</p>
                          </div>
                          {applications.length > 0 && avgScore > 0 && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{avgScore}%</p>
                              <p className="text-xs text-white/60">Avg Match</p>
                            </div>
                          )}
                          <Button size="sm" variant="ghost">
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="p-6">
                        {applications.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-white/60/30 mx-auto mb-3" />
                            <p className="text-white/60">No applications yet for this job</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {applications.map((app) => (
                              <div
                                key={app.id}
                                className="flex items-center justify-between p-4 border-2 border-white/10 rounded-lg hover:shadow-md hover:border-blue-500/30 transition-all"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-white">{app.candidate_name}</h3>
                                    {getDisplaySimilarityScore(app.similarity_score) !== null && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-sm font-semibold ${
                                          (getDisplaySimilarityScore(app.similarity_score) || 0) >= 75 ? 'bg-green-50 text-green-700 border-green-500/30' :
                                          (getDisplaySimilarityScore(app.similarity_score) || 0) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-500/30' :
                                          'bg-red-50 text-red-700 border-red-500/30'
                                        }`}
                                      >
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {Math.round(getDisplaySimilarityScore(app.similarity_score) || 0)}% Match
                                      </Badge>
                                    )}
                                    <Badge 
                                      variant={app.status === 'pending' ? 'outline' : 'default'}
                                      className="capitalize"
                                    >
                                      {app.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-white/60">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-4 w-4" />
                                      {app.candidate_email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(app.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <Button 
                                  className="bg-blue-500 hover:bg-blue-600" 
                                  size="sm"
                                  onClick={() => navigate(`/org/job/${job.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Applications;
