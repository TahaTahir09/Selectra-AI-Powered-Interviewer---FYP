import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Loader2, Copy, Check, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI, applicationAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const JobDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const jobData = await jobAPI.get(parseInt(id!));
      setJob(jobData);

      // Fetch applications for this job
      const appsResponse = await applicationAPI.list();
      const allApps = appsResponse.results || appsResponse;
      const jobApps = Array.isArray(allApps) 
        ? allApps.filter((app: any) => app.job_post?.id === parseInt(id!))
        : [];
      setApplications(jobApps);
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      toast({
        title: "Error",
        description: "Failed to load job details",
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

  const copyApplicationLink = () => {
    if (job?.application_link) {
      navigator.clipboard.writeText(job.application_link);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Application link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-b from-orange-50 to-white">
        <Sidebar 
          userType="organization" 
          userName={user?.username}
          userEmail={user?.email}
          onLogout={handleLogout} 
        />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex bg-gradient-to-b from-orange-50 to-white">
        <Sidebar 
          userType="organization" 
          userName={user?.username}
          userEmail={user?.email}
          onLogout={handleLogout} 
        />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Job not found</p>
            <Button onClick={() => navigate("/org/jobs")}>Back to Jobs</Button>
          </div>
        </div>
      </div>
    );
  }

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
          <Button 
            variant="ghost" 
            onClick={() => navigate("/org/jobs")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Jobs
          </Button>

          {/* Job Header */}
          <Card className="mb-6">
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl">{job.job_title}</CardTitle>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      📍 {job.location || "Not specified"}
                    </span>
                    <span>💼 {job.employment_type || "Full-time"}</span>
                    {job.salary_range && <span>💰 {job.salary_range}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Applications</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-muted-foreground">Status</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 capitalize">{job.status}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <span className="text-sm text-muted-foreground">Days Active</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              </div>

              {/* Application Link */}
              <div className="bg-primary/5 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Application Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={job.application_link || ""}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-border rounded-md text-sm"
                  />
                  <Button onClick={copyApplicationLink} variant="outline" size="sm">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Details Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.job_description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(job.required_skills) && job.required_skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.responsibilities}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Experience:</span>
                    <span className="ml-2 text-muted-foreground">{job.experience_required || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Qualification:</span>
                    <span className="ml-2 text-muted-foreground">{job.qualification || "Not specified"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {job.benefits && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.benefits}</p>
              </CardContent>
            </Card>
          )}

          {/* Applications List */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle>Applications ({applications.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <p className="font-semibold">{app.candidate_name}</p>
                        <p className="text-sm text-muted-foreground">{app.candidate_email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={app.status === 'pending' ? 'outline' : 'default'}>
                          {app.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Application
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

export default JobDetails;
