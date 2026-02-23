import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Loader2, Copy, Check, Users, Calendar, Download, TrendingUp, Mail, FileText, X, Link, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

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
      console.log('All applications:', allApps);
      console.log('Current job ID:', id);
      
      const jobApps = Array.isArray(allApps) 
        ? allApps.filter((app: any) => {
            // Try multiple ways to match the job
            const matchById = app.job_post_id === parseInt(id!);
            const matchByTitle = app.job_title === jobData.job_title;
            const matchByNestedId = app.job_post?.id === parseInt(id!);
            console.log('App:', app.id, 'job_post_id:', app.job_post_id, 'matches:', matchById || matchByTitle || matchByNestedId);
            return matchById || matchByTitle || matchByNestedId;
          })
        : [];
      
      console.log('Filtered applications for this job:', jobApps);
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

  const handleRecalculateSimilarity = async (applicationId: number) => {
    try {
      setRecalculating(true);
      const result = await applicationAPI.recalculateSimilarity(applicationId);
      
      // Update the application in the local state
      setApplications(apps => 
        apps.map(app => 
          app.id === applicationId 
            ? { ...app, similarity_score: result.similarity_score, interview_link: result.interview_link }
            : app
        )
      );
      
      // Update selected application if it's the one being recalculated
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => ({
          ...prev,
          similarity_score: result.similarity_score,
          interview_link: result.interview_link
        }));
      }
      
      toast({
        title: "Score Updated",
        description: `Similarity score: ${result.similarity_score}%`,
      });
    } catch (error: any) {
      console.error('Error recalculating similarity:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to recalculate similarity score",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
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
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold">{app.candidate_name}</p>
                            <p className="text-sm text-muted-foreground">{app.candidate_email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Applied {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {app.similarity_score !== null && app.similarity_score !== undefined && (
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {Math.round(app.similarity_score)}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Match Score
                                  </div>
                                </div>
                                <div className="w-16 h-16">
                                  <svg viewBox="0 0 36 36" className="circular-chart">
                                    <path
                                      className="circle-bg"
                                      fill="none"
                                      stroke="#eee"
                                      strokeWidth="3"
                                      d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                      className="circle"
                                      fill="none"
                                      stroke={
                                        app.similarity_score >= 75 ? "#22c55e" :
                                        app.similarity_score >= 50 ? "#f59e0b" :
                                        "#ef4444"
                                      }
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeDasharray={`${app.similarity_score}, 100`}
                                      d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={app.status === 'pending' ? 'outline' : 'default'}>
                          {app.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowApplicationDialog(true);
                          }}
                        >
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

      {/* Application Details Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              Application Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Candidate Info & Match Score */}
              <div className="flex items-start justify-between p-6 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-100">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {selectedApplication.candidate_name}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedApplication.candidate_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={selectedApplication.status === 'pending' ? 'outline' : 'default'}
                        className="capitalize"
                      >
                        {selectedApplication.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Match Score Display */}
                {selectedApplication.similarity_score !== null && selectedApplication.similarity_score !== undefined ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border-2 shadow-sm">
                    <div className="relative w-32 h-32 mb-2">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path
                          className="circle-bg"
                          fill="none"
                          stroke="#eee"
                          strokeWidth="3"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="circle"
                          fill="none"
                          stroke={
                            selectedApplication.similarity_score >= 75 ? "#22c55e" :
                            selectedApplication.similarity_score >= 50 ? "#f59e0b" :
                            "#ef4444"
                          }
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${selectedApplication.similarity_score}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-foreground">
                          {Math.round(selectedApplication.similarity_score)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className={`h-4 w-4 ${
                        selectedApplication.similarity_score >= 75 ? 'text-green-500' :
                        selectedApplication.similarity_score >= 50 ? 'text-yellow-500' :
                        'text-red-500'
                      }`} />
                      <span className={
                        selectedApplication.similarity_score >= 75 ? 'text-green-700' :
                        selectedApplication.similarity_score >= 50 ? 'text-yellow-700' :
                        'text-red-700'
                      }>
                        {selectedApplication.similarity_score >= 75 ? 'Excellent Match' :
                         selectedApplication.similarity_score >= 50 ? 'Good Match' :
                         'Fair Match'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleRecalculateSimilarity(selectedApplication.id)}
                      disabled={recalculating}
                    >
                      {recalculating ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Recalculate
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed">
                    <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No match score yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecalculateSimilarity(selectedApplication.id)}
                      disabled={recalculating}
                    >
                      {recalculating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Calculate Score
                    </Button>
                  </div>
                )}
              </div>

              {/* CV/Resume Section */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-500" />
                      Resume/CV
                    </span>
                    {selectedApplication.cv_url && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          // Download CV
                          const cvUrl = selectedApplication.cv_url.startsWith('http') 
                            ? selectedApplication.cv_url 
                            : `http://localhost:8000${selectedApplication.cv_url}`;
                          window.open(cvUrl, '_blank');
                        }}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download CV
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedApplication.cv_url ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-muted-foreground mb-2">CV File:</p>
                        <p className="font-mono text-sm text-blue-700 break-all">
                          {selectedApplication.cv_url.split('/').pop()}
                        </p>
                      </div>
                      
                      {/* Parsed Resume Data */}
                      {selectedApplication.parsed_resume && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">Extracted Information:</h4>
                          
                          {/* Skills */}
                          {selectedApplication.parsed_resume.skills && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {(Array.isArray(selectedApplication.parsed_resume.skills) 
                                  ? selectedApplication.parsed_resume.skills 
                                  : selectedApplication.parsed_resume.skills.split(',')
                                ).map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">{skill.trim()}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Experience */}
                          {selectedApplication.parsed_resume.experience && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Experience:</p>
                              <div className="text-sm">
                                {typeof selectedApplication.parsed_resume.experience === 'string' 
                                  ? selectedApplication.parsed_resume.experience
                                  : JSON.stringify(selectedApplication.parsed_resume.experience, null, 2)
                                }
                              </div>
                            </div>
                          )}
                          
                          {/* Education */}
                          {selectedApplication.parsed_resume.education && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Education:</p>
                              <div className="text-sm">
                                {typeof selectedApplication.parsed_resume.education === 'string' 
                                  ? selectedApplication.parsed_resume.education
                                  : JSON.stringify(selectedApplication.parsed_resume.education, null, 2)
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No CV uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Interview Link Section - shown when similarity score >= 50% */}
              {selectedApplication.similarity_score !== null && 
               selectedApplication.similarity_score !== undefined && 
               selectedApplication.similarity_score >= 50 && 
               selectedApplication.interview_link && (
                <Card className="border-2 border-green-200 bg-green-50/50">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Link className="h-5 w-5" />
                      Interview Link Generated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-3">
                      A unique interview link has been auto-generated for this candidate because their match score is above 50%.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedApplication.interview_link}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-md text-sm font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-100"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedApplication.interview_link);
                          toast({
                            title: "Link Copied!",
                            description: "Interview link copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      This link is also visible to the candidate on their portal.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationDialog(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    toast({
                      title: "Status Updated",
                      description: "Application marked for interview",
                    });
                    setShowApplicationDialog(false);
                  }}
                >
                  Schedule Interview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetails;
