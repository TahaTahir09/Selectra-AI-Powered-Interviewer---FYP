import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Loader2, Copy, Check, Users, Calendar, Download, TrendingUp, Mail, FileText, X, Link, RefreshCw, MessageSquare, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI, applicationAPI, interviewResultsAPI } from "@/services/api";
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
  const [showInterviewInsights, setShowInterviewInsights] = useState(false);
  const [interviewInsights, setInterviewInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

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
        return 'bg-green-500/100/20 text-green-400';
      case 'closed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
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

  const handleViewInterviewInsights = async (app: any) => {
    if (!app.interview_link) {
      toast({
        title: "No Interview",
        description: "This candidate doesn't have an interview link",
        variant: "destructive",
      });
      return;
    }

    // Extract token from interview link
    const linkParts = app.interview_link.split('/');
    const token = linkParts[linkParts.length - 1] || linkParts[linkParts.length - 2];

    setLoadingInsights(true);
    setShowInterviewInsights(true);
    setExpandedQuestions([]);

    try {
      const results = await interviewResultsAPI.getResults(token);
      setInterviewInsights(results);
    } catch (error: any) {
      console.error('Error fetching interview insights:', error);
      // Check if we have local data in the application
      if (app.interview_results) {
        setInterviewInsights({
          success: true,
          candidate_name: app.candidate_name,
          candidate_email: app.candidate_email,
          job_title: job?.job_title || 'Unknown',
          interview_completed_at: app.interview_completed_at,
          results: app.interview_results
        });
      } else {
        toast({
          title: "No Results",
          description: "Interview results not available yet. The candidate may not have completed the interview.",
          variant: "destructive",
        });
        setShowInterviewInsights(false);
      }
    } finally {
      setLoadingInsights(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-purple-400 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Sidebar 
          userType="organization" 
          userName={user?.username}
          userEmail={user?.email}
          onLogout={handleLogout} 
        />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 mb-4">Job not found</p>
            <Button onClick={() => navigate("/org/jobs")}>Back to Jobs</Button>
          </div>
        </div>
      </div>
    );
  }

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
          <Button 
            variant="ghost" 
            onClick={() => navigate("/org/jobs")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Jobs
          </Button>

          {/* Job Header */}
          <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader className="border-b bg-gradient-to-r from-white/10 to-white/5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl">{job.job_title}</CardTitle>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-white/60">
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
                <div className="bg-blue-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-white/60">Applications</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-white/60">Status</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 capitalize">{job.status}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <span className="text-sm text-white/60">Days Active</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">
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
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-md text-sm text-white"
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
            <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/60 whitespace-pre-wrap">{job.job_description}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader>
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

            <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/60 whitespace-pre-wrap">{job.responsibilities}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Experience:</span>
                    <span className="ml-2 text-white/60">{job.experience_required || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Qualification:</span>
                    <span className="ml-2 text-white/60">{job.qualification || "Not specified"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {job.benefits && (
            <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/60 whitespace-pre-wrap">{job.benefits}</p>
              </CardContent>
            </Card>
          )}

          {/* Applications List */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader className="bg-gradient-to-r from-white/10 to-white/5 border-b">
              <CardTitle>Applications ({applications.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-white/60/30 mx-auto mb-3" />
                  <p className="text-white/60">No applications yet</p>
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
                            <p className="text-sm text-white/60">{app.candidate_email}</p>
                            <p className="text-xs text-white/60 mt-1">
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
                                  <div className="text-xs text-white/60">
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
                        {/* Interview Score Badge - shown when interview results exist */}
                        {app.has_interview_results && app.interview_overall_score && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/100/20 text-blue-400">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-semibold">{app.interview_overall_score}/10</span>
                          </div>
                        )}
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
              <div className="flex items-start justify-between p-6 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-500/30">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedApplication.candidate_name}
                  </h3>
                  <div className="space-y-2 text-sm text-white/60">
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
                  <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-xl rounded-lg border-2 border-white/20">
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
                        <span className="text-3xl font-bold text-white">
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
                      className="mt-2 text-xs text-white/60 hover:text-white"
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
                    <TrendingUp className="h-8 w-8 text-white/60 mb-2" />
                    <p className="text-sm text-white/60 mb-2">No match score yet</p>
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
              <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader className="bg-gradient-to-r from-white/10 to-white/5">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-400" />
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
                        className="bg-blue-500/100 hover:bg-blue-600"
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
                      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                        <p className="text-sm text-white/60 mb-2">CV File:</p>
                        <p className="font-mono text-sm text-blue-400 break-all">
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
                              <p className="text-sm font-medium text-white/60 mb-2">Skills:</p>
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
                              <p className="text-sm font-medium text-white/60 mb-2">Experience:</p>
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
                              <p className="text-sm font-medium text-white/60 mb-2">Education:</p>
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
                    <p className="text-white/60 text-center py-8">No CV uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Interview Link Section - shown when similarity score >= 50% */}
              {selectedApplication.similarity_score !== null && 
               selectedApplication.similarity_score !== undefined && 
               selectedApplication.similarity_score >= 50 && 
               selectedApplication.interview_link && (
                <Card className="border-2 border-green-500/30 bg-green-500/10">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Link className="h-5 w-5" />
                      Interview Link Generated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-white/60 mb-3">
                      A unique interview link has been auto-generated for this candidate because their match score is above 50%.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedApplication.interview_link}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white/10 border border-green-500/30 rounded-md text-sm font-mono"
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
                {/* View Interview Insights Button - shown when interview link exists */}
                {selectedApplication.interview_link && (
                  <Button
                    variant="outline"
                    className="border-blue-300 text-blue-400 hover:bg-blue-500/20"
                    onClick={() => handleViewInterviewInsights(selectedApplication)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Interview Insights
                  </Button>
                )}
                <Button
                  className="bg-green-500/100 hover:bg-green-600"
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

      {/* Interview Insights Dialog */}
      <Dialog open={showInterviewInsights} onOpenChange={setShowInterviewInsights}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-500" />
              Interview Insights
            </DialogTitle>
          </DialogHeader>

          {loadingInsights ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-white/60">Loading interview results...</span>
            </div>
          ) : interviewInsights ? (
            <div className="space-y-6 py-4">
              {/* Candidate Info & Overall Score */}
              <div className="flex items-start justify-between p-6 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-500/30">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {interviewInsights.candidate_name}
                  </h3>
                  <p className="text-sm text-white/60">{interviewInsights.candidate_email}</p>
                  <p className="text-sm text-white/60 mt-1">
                    Position: {interviewInsights.job_title}
                  </p>
                  {interviewInsights.interview_completed_at && (
                    <p className="text-xs text-white/60 mt-2">
                      Completed: {new Date(interviewInsights.interview_completed_at).toLocaleString()}
                    </p>
                  )}
                </div>
                
                {/* Overall Score */}
                <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-xl rounded-lg border-2 border-white/20">
                  <div className="relative w-24 h-24 mb-2">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path
                        fill="none"
                        stroke="#eee"
                        strokeWidth="3"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        fill="none"
                        stroke={
                          (interviewInsights.results?.overall_score || 0) >= 7 ? "#22c55e" :
                          (interviewInsights.results?.overall_score || 0) >= 5 ? "#f59e0b" :
                          "#ef4444"
                        }
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(interviewInsights.results?.overall_score || 0) * 10}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {interviewInsights.results?.overall_score || 0}/10
                      </span>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      interviewInsights.results?.recommendation === 'recommend' 
                        ? 'bg-green-500/100/20 text-green-400' 
                        : interviewInsights.results?.recommendation === 'not_recommend'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {interviewInsights.results?.recommendation === 'recommend' 
                      ? 'Recommended' 
                      : interviewInsights.results?.recommendation === 'not_recommend'
                      ? 'Not Recommended'
                      : 'Under Consideration'}
                  </Badge>
                </div>
              </div>

              {/* Summary */}
              {interviewInsights.results?.summary && (
                <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader>
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/60">{interviewInsights.results.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Strengths & Areas for Improvement */}
              <div className="grid grid-cols-2 gap-4">
                {interviewInsights.results?.strengths && interviewInsights.results.strengths.length > 0 && (
                  <Card className="border-green-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {interviewInsights.results.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-white/60">{s}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                {interviewInsights.results?.areas_for_improvement && interviewInsights.results.areas_for_improvement.length > 0 && (
                  <Card className="border-purple-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {interviewInsights.results.areas_for_improvement.map((a: string, i: number) => (
                          <li key={i} className="text-sm text-white/60">{a}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* CV Verification & Job Fit */}
              <div className="grid grid-cols-2 gap-4">
                {interviewInsights.results?.cv_verification && (
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-1">CV Verification</h4>
                    <p className="text-sm text-white/60">{interviewInsights.results.cv_verification}</p>
                  </div>
                )}
                {interviewInsights.results?.job_fit && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-700 mb-1">Job Fit</h4>
                    <p className="text-sm text-white/60">{interviewInsights.results.job_fit}</p>
                  </div>
                )}
              </div>

              {/* Questions & Answers with Scores */}
              {interviewInsights.results?.questions_and_answers && interviewInsights.results.questions_and_answers.length > 0 && (
                <Card className="bg-white/10 backdrop-blur-xl border-white/20"><CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      Interview Questions & Answers ({interviewInsights.results.questions_and_answers.length} questions)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {interviewInsights.results.questions_and_answers.map((qa: any, index: number) => (
                      <div 
                        key={index} 
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* Question Header - Always visible */}
                        <div 
                          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleQuestion(index)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/100/20 text-blue-400 font-semibold text-sm">
                              Q{index + 1}
                            </span>
                            <p className="font-medium text-sm text-white line-clamp-1 flex-1">
                              {qa.question}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Score Badge */}
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${getScoreColor(qa.score)}`}>
                              <Star className="h-4 w-4" />
                              <span className="font-bold">{qa.score}/10</span>
                            </div>
                            {expandedQuestions.includes(index) ? (
                              <ChevronUp className="h-5 w-5 text-white/60" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-white/60" />
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded Content */}
                        {expandedQuestions.includes(index) && (
                          <div className="p-4 space-y-4 border-t">
                            {/* Full Question */}
                            <div>
                              <h5 className="text-xs font-semibold text-blue-600 uppercase mb-1">Question</h5>
                              <p className="text-sm text-white bg-blue-500/10 p-3 rounded">{qa.question}</p>
                            </div>
                            
                            {/* Candidate's Answer */}
                            <div>
                              <h5 className="text-xs font-semibold text-green-600 uppercase mb-1">Candidate's Answer</h5>
                              <p className="text-sm text-white bg-green-500/10 p-3 rounded whitespace-pre-wrap">
                                {qa.answer || '(No answer provided)'}
                              </p>
                            </div>
                            
                            {/* Feedback */}
                            {qa.feedback && (
                              <div>
                                <h5 className="text-xs font-semibold text-purple-600 uppercase mb-1">AI Evaluation Feedback</h5>
                                <p className="text-sm text-white/60 bg-purple-50 p-3 rounded">{qa.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowInterviewInsights(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-white/60 mx-auto mb-4" />
              <p className="text-white/60">No interview results available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetails;
