import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, FileText, Loader2, CheckCircle, Edit3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI, applicationAPI } from "@/services/api";
import api from "@/services/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";

const Apply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isCandidate } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [jobLoading, setJobLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [showReviewSection, setShowReviewSection] = useState(false);
  const [extractedFieldsCount, setExtractedFieldsCount] = useState(0);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.first_name || user?.username || "",
    email: user?.email || "",
    phone: "",
    location: "",
    date_of_birth: "",
    nationality: "",
    summary: "",
    skills: [] as string[],
    total_experience: "",
    current_position: "",
    current_company: "",
    education: "",
    projects: "",
    certifications: "",
    languages: "",
    interests: "",
    portfolio_url: "",
    linkedin: "",
    github: "",
    references: "",
  });

  useEffect(() => {
    // Check if user is authenticated and is a candidate
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login or register as a candidate to apply for jobs.",
        variant: "destructive",
      });
      // Store the job ID to redirect back after login
      localStorage.setItem('applyJobId', id || '');
      setTimeout(() => navigate('/candidate/login'), 1500);
      return;
    }

    if (isAuthenticated && !isCandidate) {
      toast({
        title: "Access Denied",
        description: "Only candidates can apply for jobs.",
        variant: "destructive",
      });
      setTimeout(() => navigate('/'), 1500);
      return;
    }
  }, [isAuthenticated, isCandidate, navigate, id]);

  useEffect(() => {
    // Fetch job details
    const fetchJob = async () => {
      if (!id) return;
      try {
        const jobData = await jobAPI.get(parseInt(id));
        setJob(jobData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive",
        });
      } finally {
        setJobLoading(false);
      }
    };
    
    if (isAuthenticated && isCandidate) {
      fetchJob();
    }
  }, [id, isAuthenticated, isCandidate]);

  // Debug state changes
  useEffect(() => {
    console.log('State update:', {
      showReviewPage,
      showEditForm,
      hasParsedData: !!parsedData,
      extractedFieldsCount
    });
  }, [showReviewPage, showEditForm, parsedData, extractedFieldsCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "CV file must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    setCvFile(file);
    setFileName(file.name);

    // Auto-parse CV
    await parseCV(file);
  };

  const parseCV = async (file: File) => {
    setParsing(true);
    
    try {
      console.log('Starting CV parse...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        jobId: id
      });

      const formData = new FormData();
      formData.append('cv_file', file);
      
      // Include job_id so it's sent to Flask server
      if (id) {
        formData.append('job_id', id);
      }

      const response = await api.post('/parse-cv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Parse response:', response.data);

      // Always set basic form data first
      const basicData = {
        full_name: user?.first_name || user?.username || "",
        email: user?.email || "",
        phone: "",
        location: "",
        date_of_birth: "",
        nationality: "",
        summary: "",
        skills: [] as string[],
        total_experience: "",
        current_position: "",
        current_company: "",
        education: "",
        projects: "",
        certifications: "",
        languages: "",
        interests: "",
        portfolio_url: "",
        linkedin: "",
        github: "",
        references: "",
      };

      // Check if parsing was successful
      if (response.data.success && response.data.data) {
        const parsed = response.data.data;
        setParsedData(parsed);

        // Count non-empty extracted fields safely
        try {
          const extractedFields = Object.keys(parsed).filter(key => {
            const value = parsed[key];
            return value && value !== '' && 
                   !(Array.isArray(value) && value.length === 0) &&
                   key !== 'raw_text' && key !== 'parsed_at' && key !== 'parsing_method';
          });
          console.log('Extracted fields count:', extractedFields.length);
          console.log('Setting showReviewPage to true');
          setExtractedFieldsCount(extractedFields.length);
          setShowReviewSection(true);
          setShowReviewPage(true); // Show review page first
          setShowEditForm(false); // Make sure edit form is hidden
        } catch (countError) {
          console.error('Error counting fields:', countError);
          setExtractedFieldsCount(0);
          setShowReviewSection(false);
          setShowReviewPage(false);
        }

        // Auto-fill form with parsed data (merge with basic data)
        setFormData({
          full_name: parsed.full_name || basicData.full_name,
          email: parsed.email || basicData.email,
          phone: parsed.phone || basicData.phone,
          location: parsed.location || basicData.location,
          date_of_birth: parsed.date_of_birth || basicData.date_of_birth,
          nationality: parsed.nationality || basicData.nationality,
          summary: parsed.summary || basicData.summary,
          skills: Array.isArray(parsed.skills) 
            ? parsed.skills 
            : typeof parsed.skills === 'string' && parsed.skills
              ? parsed.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              : basicData.skills,
          total_experience: parsed.total_experience || basicData.total_experience,
          current_position: parsed.current_position || basicData.current_position,
          current_company: parsed.current_company || basicData.current_company,
          education: Array.isArray(parsed.education) 
            ? parsed.education.map((edu: any) => 
                `${edu.degree || ''} in ${edu.field || ''} from ${edu.institution || ''} (${edu.year || ''})`
              ).filter(e => e.trim()).join('\n')
            : typeof parsed.education === 'string' ? parsed.education : basicData.education,
          projects: Array.isArray(parsed.projects)
            ? parsed.projects.map((proj: any) => 
                `${proj.name || ''}\n${proj.description || ''}\nTechnologies: ${proj.technologies || ''}\nDuration: ${proj.duration || ''}`
              ).filter(p => p.trim()).join('\n\n')
            : typeof parsed.projects === 'string' ? parsed.projects : "",
          certifications: Array.isArray(parsed.certifications)
            ? parsed.certifications.join('\n')
            : typeof parsed.certifications === 'string' ? parsed.certifications : basicData.certifications,
          languages: Array.isArray(parsed.languages)
            ? parsed.languages.join(', ')
            : typeof parsed.languages === 'string' ? parsed.languages : basicData.languages,
          interests: Array.isArray(parsed.interests)
            ? parsed.interests.join(', ')
            : typeof parsed.interests === 'string' ? parsed.interests : "",
          portfolio_url: parsed.portfolio_url || basicData.portfolio_url,
          linkedin: parsed.linkedin || basicData.linkedin,
          github: parsed.github || basicData.github,
          references: parsed.references || basicData.references,
        });

        const method = response.data.parsing_method || 'unknown';
        const methodName = method.includes('gemini') ? 'AI-powered (Gemini)' :
                          method.includes('aurora') ? 'AI-powered (Aurora)' :
                          method.includes('deepseek') ? 'AI-powered' : 
                          method.includes('ner') ? 'NLP-based' : 'basic';

        // Build toast message
        let toastDescription = `Used ${methodName} parsing. ${extractedFieldsCount} fields extracted.`;
        toastDescription += ' Review and edit below.';

        toast({
          title: "CV Parsed Successfully!",
          description: toastDescription,
        });
      } else {
        // Parsing failed but we have the structure - use basic data
        setFormData(basicData);
        setShowReviewSection(false);
        
        const errorMsg = response.data.error || response.data.message || 'Unknown error';
        console.warn('CV parsing failed:', errorMsg);
        
        toast({
          title: "Parsing Failed",
          description: "Could not parse CV automatically. Please fill the form manually.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('CV parsing error:', error);
      
      // Still allow manual entry with basic info
      setFormData({
        full_name: user?.first_name || user?.username || "",
        email: user?.email || "",
        phone: "",
        location: "",
        summary: "",
        skills: [],
        total_experience: "",
        education: "",
        certifications: "",
        linkedin: "",
        github: "",
      });

      toast({
        title: "Parsing Failed",
        description: "Could not parse CV automatically. Please fill the form manually.",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cvFile) {
      toast({
        title: "CV Required",
        description: "Please upload your CV/Resume",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const applicationData = new FormData();
      applicationData.append('job_post', id!);
      applicationData.append('candidate_name', formData.full_name);
      applicationData.append('candidate_email', formData.email);
      applicationData.append('cv_url', cvFile);
      
      // Add parsed data as JSON
      if (parsedData) {
        applicationData.append('parsed_resume', JSON.stringify({
          ...parsedData,
          form_data: formData
        }));
      }

      await applicationAPI.create(applicationData);

      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. Track it in your dashboard.",
      });

      // Clear the stored job ID
      localStorage.removeItem('applyJobId');

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/candidate/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error('Failed to submit application:', error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.detail || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (!isAuthenticated || !isCandidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Job not found</p>
            <Button onClick={() => navigate("/candidate")} className="w-full mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <Header userType="candidate" userName={user?.username} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Job Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{job.job_title}</CardTitle>
              <CardDescription>
                {job.location} • {job.employment_type}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.job_description}</p>
              </div>
              
              {job.required_skills && job.required_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.experience_required && (
                <div>
                  <h3 className="font-semibold mb-2">Experience Required</h3>
                  <p className="text-sm text-muted-foreground">{job.experience_required}</p>
                </div>
              )}

              {job.responsibilities && (
                <div>
                  <h3 className="font-semibold mb-2">Responsibilities</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.responsibilities}</p>
                </div>
              )}

              {job.salary_range && (
                <div>
                  <h3 className="font-semibold mb-2">Salary Range</h3>
                  <p className="text-sm text-muted-foreground">{job.salary_range}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Application</CardTitle>
              <CardDescription>
                Upload your CV and we'll automatically extract your information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                try {
                  console.log('Render check:', { 
                    showReviewPage, 
                    showEditForm, 
                    hasParsedData: !!parsedData,
                    hasFormData: !!formData
                  });
                } catch (e) {
                  console.error('Log error:', e);
                }
                
                // Show Review Page after successful parsing
                if (showReviewPage && !showEditForm) {
                  return (
                    <div className="space-y-6">
                      {/* Success Alert */}
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="ml-2">
                          <p className="font-semibold text-green-900">CV parsed successfully!</p>
                          <p className="text-sm text-green-700 mt-1">
                            Extracted {extractedFieldsCount} fields from your CV. Review the information below.
                          </p>
                        </AlertDescription>
                      </Alert>

                      {/* Extracted Information Summary */}
                      <Card className="bg-blue-50/50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Extracted Information Summary
                      </CardTitle>
                      <CardDescription>
                        Review the information extracted from your CV
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(parsedData?.full_name || formData.full_name) && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Full Name</p>
                              <p className="text-sm font-semibold">{String(parsedData?.full_name || formData.full_name)}</p>
                            </div>
                          )}
                          {(parsedData?.email || formData.email) && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Email</p>
                              <p className="text-sm font-semibold">{String(parsedData?.email || formData.email)}</p>
                            </div>
                          )}
                          {(parsedData?.phone || formData.phone) && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Phone</p>
                              <p className="text-sm font-semibold">{String(parsedData?.phone || formData.phone)}</p>
                            </div>
                          )}
                          {(parsedData?.location || formData.location) && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Location</p>
                              <p className="text-sm font-semibold">{String(parsedData?.location || formData.location)}</p>
                            </div>
                          )}
                          {(parsedData?.linkedin || formData.linkedin) && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">LinkedIn</p>
                              <p className="text-sm break-all">{String(parsedData?.linkedin || formData.linkedin)}</p>
                            </div>
                          )}
                          {(parsedData?.github || formData.github) && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">GitHub</p>
                              <p className="text-sm break-all">{String(parsedData?.github || formData.github)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Education */}
                      {(parsedData?.education || formData.education) && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-semibold text-primary">Education</h3>
                          <div className="space-y-3">
                            {(() => {
                              const edu = parsedData?.education || formData.education;
                              if (typeof edu === 'string') {
                                return <p className="text-sm whitespace-pre-line">{edu}</p>;
                              }
                              if (Array.isArray(edu)) {
                                return edu.map((e: any, idx: number) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg border">
                                    {typeof e === 'string' ? (
                                      <p className="text-sm">{e}</p>
                                    ) : (
                                      <>
                                        <p className="font-semibold text-sm">{e.degree}</p>
                                        <p className="text-sm text-muted-foreground">{e.institution}</p>
                                        {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                                        {e.duration && <p className="text-xs text-muted-foreground">{e.duration}</p>}
                                        {e.details && <p className="text-xs text-muted-foreground mt-1">{e.details}</p>}
                                      </>
                                    )}
                                  </div>
                                ));
                              }
                              return <p className="text-sm">{String(edu)}</p>;
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Work Experience */}
                      {(parsedData?.experience || parsedData?.current_position) && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-semibold text-primary">Work Experience</h3>
                          <div className="space-y-3">
                            {(() => {
                              const exp = parsedData?.experience;
                              if (Array.isArray(exp)) {
                                return exp.map((e: any, idx: number) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg border">
                                    <p className="font-semibold text-sm">{e.title || e.position}</p>
                                    <p className="text-sm text-muted-foreground">{e.company}</p>
                                    {e.duration && <p className="text-xs text-muted-foreground">{e.duration}</p>}
                                    {e.description && <p className="text-xs mt-2">{e.description}</p>}
                                  </div>
                                ));
                              }
                              // Fallback to current position if no experience array
                              if (parsedData?.current_position) {
                                return (
                                  <div className="bg-white p-3 rounded-lg border">
                                    <p className="font-semibold text-sm">{parsedData.current_position}</p>
                                    {parsedData.current_company && (
                                      <p className="text-sm text-muted-foreground">{parsedData.current_company}</p>
                                    )}
                                    {parsedData.total_experience && (
                                      <p className="text-xs text-muted-foreground">{parsedData.total_experience}</p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {parsedData?.projects && Array.isArray(parsedData.projects) && parsedData.projects.length > 0 && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-semibold text-primary">Projects</h3>
                          <div className="space-y-3">
                            {parsedData.projects.map((project: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border">
                                <p className="font-semibold text-sm">{project.name}</p>
                                {project.description && (
                                  <p className="text-xs mt-1">{project.description}</p>
                                )}
                                {project.technologies && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-medium">Technologies:</span> {project.technologies}
                                  </p>
                                )}
                                {project.duration && (
                                  <p className="text-xs text-muted-foreground">{project.duration}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      {(parsedData?.certifications || formData.certifications) && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-semibold text-primary">Certifications</h3>
                          <p className="text-sm whitespace-pre-line">
                            {(() => {
                              const certs = parsedData?.certifications || formData.certifications;
                              if (typeof certs === 'string') return certs;
                              if (Array.isArray(certs)) return certs.join('\n');
                              return String(certs);
                            })()}
                          </p>
                        </div>
                      )}

                      {/* Skills */}
                      {(parsedData?.skills || formData.skills) && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-semibold text-primary">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const skills = parsedData?.skills || formData.skills;
                              // Handle string (comma-separated)
                              if (typeof skills === 'string') {
                                return skills.split(',').map((skill: string, index: number) => (
                                  <Badge key={index} variant="secondary">
                                    {skill.trim()}
                                  </Badge>
                                ));
                              }
                              // Handle array
                              if (Array.isArray(skills)) {
                                return skills.map((skill: string, index: number) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ));
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Interests */}
                      {parsedData?.interests && (
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="text-sm font-semibold text-primary">Interests</h3>
                          <p className="text-sm">
                            {typeof parsedData.interests === 'string' 
                              ? parsedData.interests 
                              : Array.isArray(parsedData.interests) 
                                ? parsedData.interests.join(', ')
                                : String(parsedData.interests)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={() => setShowEditForm(true)}
                      className="flex-1 bg-gradient-to-r from-accent to-accent/80"
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Proceed to Edit & Submit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCvFile(null);
                        setFileName("");
                        setParsedData(null);
                        setShowReviewPage(false);
                        setShowEditForm(false);
                      }}
                    >
                      Upload Different CV
                    </Button>
                  </div>
                </div>
                  );
                }
                
                // Otherwise show upload or edit form
                return (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* CV Upload Section - Only show if no CV uploaded yet */}
                {!parsedData && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Upload CV/Resume *
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      id="cv-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      required
                      disabled={parsing}
                    />
                    <label htmlFor="cv-upload" className="cursor-pointer">
                      {parsing ? (
                        <><Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                        <p className="text-sm font-medium text-primary">Parsing CV with AI...</p></>
                      ) : (
                        <><Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {fileName || "Click to upload (PDF, DOC, DOCX - Max 5MB)"}
                        </p>
                        {fileName && <p className="text-xs text-green-600 mt-1">✓ File uploaded</p>}</>
                      )}
                    </label>
                  </div>
                  {parsedData && !showReviewSection && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="ml-2">
                        <p className="text-sm text-amber-800">
                          CV uploaded but automatic parsing had limited results. Please fill in your details manually.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                )}

                {/* Show editable form after clicking "Proceed to Edit" */}
                {(showEditForm || (!showReviewPage && parsedData)) && (
                <>
                {/* Editable Information Summary - Same style as review */}
                <Card className="bg-blue-50/50 border-blue-200 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit3 className="h-5 w-5" />
                      Edit Your Information
                    </CardTitle>
                    <CardDescription>
                      Review and edit your information before submitting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-primary">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Full Name *</label>
                          <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Phone *</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Location</label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">LinkedIn</label>
                          <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/yourprofile"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">GitHub</label>
                          <input
                            type="url"
                            name="github"
                            value={formData.github}
                            onChange={handleChange}
                            placeholder="https://github.com/yourusername"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-primary">Education</h3>
                      <Textarea
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        placeholder="e.g., Bachelor of Computer Science from FAST NUCES (2022-Present)"
                        rows={4}
                        className="w-full text-sm resize-none"
                      />
                    </div>

                    {/* Work Experience */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-primary">Work Experience</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Total Experience</label>
                          <input
                            type="text"
                            name="total_experience"
                            value={formData.total_experience}
                            onChange={handleChange}
                            placeholder="e.g., 2 months, 3 years"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Current Position</label>
                          <input
                            type="text"
                            name="current_position"
                            value={formData.current_position}
                            onChange={handleChange}
                            placeholder="e.g., Data Science Intern"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Current Company</label>
                          <input
                            type="text"
                            name="current_company"
                            value={formData.current_company}
                            onChange={handleChange}
                            placeholder="e.g., 10Pearls"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-primary">Projects</h3>
                      <Textarea
                        name="projects"
                        value={formData.projects}
                        onChange={handleChange}
                        placeholder="List your projects with name, description, and technologies used (one per line)"
                        rows={4}
                        className="w-full text-sm resize-none"
                      />
                    </div>

                    {/* Certifications */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-primary">Certifications</h3>
                      <Textarea
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleChange}
                        placeholder="List your certifications (one per line)"
                        rows={3}
                        className="w-full text-sm resize-none"
                      />
                    </div>

                    {/* Skills */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-primary">Skills</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        Enter skills separated by commas
                      </p>
                      <Textarea
                        name="skills"
                        value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            skills: value.split(',').map((s: string) => s.trim()).filter((s: string) => s)
                          }));
                        }}
                        placeholder="Python, SQL, React.JS, Django, Machine Learning, etc."
                        rows={3}
                        className="w-full text-sm resize-none"
                      />
                      {Array.isArray(formData.skills) && formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interests */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-primary">Interests (Optional)</h3>
                      <Textarea
                        name="interests"
                        value={formData.interests}
                        onChange={handleChange}
                        placeholder="e.g., Machine Learning, Open Source, Data Visualization"
                        rows={2}
                        className="w-full text-sm resize-none"
                      />
                    </div>

                    {/* Portfolio URL (Optional) */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-primary">Additional Information (Optional)</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Portfolio/Website</label>
                          <input
                            type="url"
                            name="portfolio_url"
                            value={formData.portfolio_url}
                            onChange={handleChange}
                            placeholder="https://yourportfolio.com"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Languages</label>
                          <input
                            type="text"
                            name="languages"
                            value={formData.languages}
                            onChange={handleChange}
                            placeholder="e.g., English (Fluent), Urdu (Native)"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">References</label>
                          <Textarea
                            name="references"
                            value={formData.references}
                            onChange={handleChange}
                            placeholder="Name, Position, Company, Contact (one per line)"
                            rows={2}
                            className="w-full text-sm resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-accent to-accent/80"
                  disabled={loading || parsing}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you confirm that the information above is accurate and complete.
                </p>
              </>
            )}
          </form>
        );
      })()}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Apply;
