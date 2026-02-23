import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, Calendar, MapPin, DollarSign, Search, Loader2, ArrowLeft,
  FileText, User, Mail, Phone, Linkedin, Github, GraduationCap, Clock,
  CheckCircle, XCircle, Eye, Download, Building, Award, Link, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { applicationAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Application {
  id: number;
  job_post: {
    id: number;
    job_title: string;
    location: string;
    employment_type: string;
    salary_range: string;
    job_description: string;
    organization_name: string;
    required_skills: string[];
  };
  status: string;
  created_at: string;
  updated_at: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  candidate_location: string;
  candidate_linkedin: string;
  candidate_github: string;
  candidate_skills: string[];
  candidate_education: any[];
  candidate_experience: any[];
  years_of_experience: string;
  cv_url: string;
  parsed_resume: any;
  similarity_score: number;
  interview_link?: string;
}

const MyApplications = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.list();
      const apps = response.results || response;
      setApplications(Array.isArray(apps) ? apps : []);
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

  const handleLogout = () => {
    logout();
    navigate("/candidate/login");
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'reviewed':
        return <Eye className="h-5 w-5 text-blue-600" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredApplications = applications.filter(app =>
    app.job_post?.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job_post?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/candidate/dashboard")}
                className="hover:bg-orange-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Applications
              </span>
            </h1>
            <p className="text-muted-foreground">
              Track all your job applications and their status
            </p>
          </div>

          {/* Search and Stats */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
                <input
                  placeholder="Search by job title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-base px-4 py-2">
                Total: {applications.length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-700 text-base px-4 py-2">
                Pending: {applications.filter(a => a.status === 'pending').length}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 text-base px-4 py-2">
                Reviewed: {applications.filter(a => a.status === 'reviewed').length}
              </Badge>
              <Badge className="bg-green-100 text-green-700 text-base px-4 py-2">
                Accepted: {applications.filter(a => a.status === 'accepted').length}
              </Badge>
            </div>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-12">
                <div className="text-center">
                  <Briefcase className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">
                    {applications.length === 0 ? "No Applications Yet" : "No Results Found"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {applications.length === 0 
                      ? "You haven't applied to any jobs yet. Start exploring opportunities and apply to jobs that match your skills."
                      : "Try adjusting your search criteria"}
                  </p>
                  {applications.length === 0 && (
                    <Button onClick={() => navigate("/")}>
                      Browse Jobs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="shadow-md hover:shadow-xl transition-shadow border-2 hover:border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-1">
                              {application.job_post?.job_title || "Job Title Not Available"}
                            </h3>
                            <p className="text-muted-foreground font-medium flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {application.job_post?.organization_name || "Company"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(application.status)}
                            <Badge className={`${getStatusColor(application.status)} border font-semibold`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span>{application.job_post?.location || "Location not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            <span>{application.job_post?.employment_type || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span>{application.job_post?.salary_range || "Not disclosed"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Applied: {formatDate(application.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewDetails(application)}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Application Details
                          </Button>
                          {application.cv_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(application.cv_url, '_blank')}
                              className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download CV
                            </Button>
                          )}
                          {/* Interview Link Button - shown when interview link is available */}
                          {application.interview_link && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                const interviewId = application.interview_link.split('/').pop();
                                navigate(`/interview/${interviewId}`);
                              }}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Interview
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Application Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <FileText className="h-6 w-6 text-orange-500" />
              Application Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-6 pb-4">
                {/* Application Status Banner */}
                <div className={`p-4 rounded-lg flex items-center justify-between ${
                  selectedApplication.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                  selectedApplication.status === 'reviewed' ? 'bg-blue-50 border border-blue-200' :
                  selectedApplication.status === 'accepted' ? 'bg-green-50 border border-green-200' :
                  selectedApplication.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(selectedApplication.status)}
                    <div>
                      <p className="font-semibold text-lg">
                        Application Status: {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {formatDate(selectedApplication.updated_at)}
                      </p>
                    </div>
                  </div>

                </div>

                <Tabs defaultValue="job" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="job">Job Details</TabsTrigger>
                    <TabsTrigger value="profile">Submitted Profile</TabsTrigger>
                    <TabsTrigger value="resume">Resume Data</TabsTrigger>
                  </TabsList>

                  {/* Job Details Tab */}
                  <TabsContent value="job" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedApplication.job_post?.job_title}</CardTitle>
                        <p className="text-muted-foreground">
                          {selectedApplication.job_post?.organization_name}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span>{selectedApplication.job_post?.location || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            <span>{selectedApplication.job_post?.employment_type || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span>{selectedApplication.job_post?.salary_range || "Not disclosed"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Applied: {formatDate(selectedApplication.created_at)}</span>
                          </div>
                        </div>
                        
                        {selectedApplication.job_post?.job_description && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2">Job Description</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {selectedApplication.job_post.job_description}
                              </p>
                            </div>
                          </>
                        )}

                        {selectedApplication.job_post?.required_skills && selectedApplication.job_post.required_skills.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2">Required Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedApplication.job_post.required_skills.map((skill, idx) => (
                                  <Badge key={idx} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Submitted Profile Tab */}
                  <TabsContent value="profile" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Candidate Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Full Name</p>
                            <p className="font-medium">{selectedApplication.candidate_name}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {selectedApplication.candidate_email}
                            </p>
                          </div>
                          {selectedApplication.candidate_phone && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {selectedApplication.candidate_phone}
                              </p>
                            </div>
                          )}
                          {selectedApplication.candidate_location && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p className="font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {selectedApplication.candidate_location}
                              </p>
                            </div>
                          )}
                          {selectedApplication.candidate_linkedin && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">LinkedIn</p>
                              <a 
                                href={selectedApplication.candidate_linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                              >
                                <Linkedin className="h-4 w-4" />
                                View Profile
                              </a>
                            </div>
                          )}
                          {selectedApplication.candidate_github && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">GitHub</p>
                              <a 
                                href={selectedApplication.candidate_github} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium text-gray-800 hover:underline flex items-center gap-2"
                              >
                                <Github className="h-4 w-4" />
                                View Profile
                              </a>
                            </div>
                          )}
                          {selectedApplication.years_of_experience && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Experience</p>
                              <p className="font-medium">{selectedApplication.years_of_experience}</p>
                            </div>
                          )}
                        </div>

                        {selectedApplication.candidate_skills && selectedApplication.candidate_skills.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2">Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedApplication.candidate_skills.map((skill, idx) => (
                                  <Badge key={idx} className="bg-orange-100 text-orange-700">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* CV Download */}
                        {selectedApplication.cv_url && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-2">Uploaded CV</h4>
                              <Button
                                variant="outline"
                                onClick={() => window.open(selectedApplication.cv_url, '_blank')}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download CV
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Resume Data Tab */}
                  <TabsContent value="resume" className="space-y-4">
                    {selectedApplication.parsed_resume ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Parsed Resume Data
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Information extracted from your uploaded CV
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Summary */}
                          {selectedApplication.parsed_resume.summary && (
                            <div>
                              <h4 className="font-semibold mb-2">Professional Summary</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {selectedApplication.parsed_resume.summary}
                              </p>
                            </div>
                          )}

                          {/* Skills */}
                          {selectedApplication.parsed_resume.skills && selectedApplication.parsed_resume.skills.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold mb-2">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(selectedApplication.parsed_resume.skills) 
                                    ? selectedApplication.parsed_resume.skills 
                                    : [selectedApplication.parsed_resume.skills]
                                  ).map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="secondary">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Experience */}
                          {selectedApplication.parsed_resume.experience && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  Work Experience
                                </h4>
                                {Array.isArray(selectedApplication.parsed_resume.experience) ? (
                                  <div className="space-y-3">
                                    {selectedApplication.parsed_resume.experience.map((exp: any, idx: number) => (
                                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="font-medium">{exp.title || exp.position || 'Position'}</p>
                                        <p className="text-sm text-muted-foreground">{exp.company || 'Company'}</p>
                                        {exp.duration && <p className="text-xs text-muted-foreground">{exp.duration}</p>}
                                        {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {selectedApplication.parsed_resume.experience}
                                  </p>
                                )}
                              </div>
                            </>
                          )}

                          {/* Education */}
                          {selectedApplication.parsed_resume.education && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4" />
                                  Education
                                </h4>
                                {Array.isArray(selectedApplication.parsed_resume.education) ? (
                                  <div className="space-y-3">
                                    {selectedApplication.parsed_resume.education.map((edu: any, idx: number) => (
                                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="font-medium">{edu.degree || 'Degree'}</p>
                                        <p className="text-sm text-muted-foreground">{edu.institution || edu.school || 'Institution'}</p>
                                        {edu.year && <p className="text-xs text-muted-foreground">{edu.year}</p>}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {selectedApplication.parsed_resume.education}
                                  </p>
                                )}
                              </div>
                            </>
                          )}

                          {/* Certifications */}
                          {selectedApplication.parsed_resume.certifications && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Award className="h-4 w-4" />
                                  Certifications
                                </h4>
                                {Array.isArray(selectedApplication.parsed_resume.certifications) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedApplication.parsed_resume.certifications.map((cert: string, idx: number) => (
                                      <Badge key={idx} className="bg-purple-100 text-purple-700">{cert}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {selectedApplication.parsed_resume.certifications}
                                  </p>
                                )}
                              </div>
                            </>
                          )}

                          {/* Languages */}
                          {selectedApplication.parsed_resume.languages && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold mb-2">Languages</h4>
                                {Array.isArray(selectedApplication.parsed_resume.languages) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedApplication.parsed_resume.languages.map((lang: string, idx: number) => (
                                      <Badge key={idx} variant="outline">{lang}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {selectedApplication.parsed_resume.languages}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No parsed resume data available for this application.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyApplications;
