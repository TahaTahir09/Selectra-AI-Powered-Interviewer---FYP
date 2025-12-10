import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, FileText, Loader2 } from "lucide-react";
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
    certifications: "",
    languages: "",
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
        fileType: file.type
      });

      const formData = new FormData();
      formData.append('cv_file', file);

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
        skills: [],
        total_experience: "",
        current_position: "",
        current_company: "",
        education: "",
        certifications: "",
        languages: "",
        portfolio_url: "",
        linkedin: "",
        github: "",
        references: "",
      };

      // Check if parsing was successful
      if (response.data.success && response.data.data) {
        const parsed = response.data.data;
        setParsedData(parsed);

        // Auto-fill form with parsed data (merge with basic data)
        setFormData({
          full_name: parsed.full_name || basicData.full_name,
          email: parsed.email || basicData.email,
          phone: parsed.phone || basicData.phone,
          location: parsed.location || basicData.location,
          date_of_birth: parsed.date_of_birth || basicData.date_of_birth,
          nationality: parsed.nationality || basicData.nationality,
          summary: parsed.summary || basicData.summary,
          skills: parsed.skills || basicData.skills,
          total_experience: parsed.total_experience || basicData.total_experience,
          current_position: parsed.current_position || basicData.current_position,
          current_company: parsed.current_company || basicData.current_company,
          education: Array.isArray(parsed.education) 
            ? parsed.education.map((edu: any) => 
                `${edu.degree || ''} in ${edu.field || ''} from ${edu.institution || ''} (${edu.year || ''})`
              ).filter(e => e.trim()).join('\n')
            : basicData.education,
          certifications: Array.isArray(parsed.certifications)
            ? parsed.certifications.join(', ')
            : basicData.certifications,
          languages: Array.isArray(parsed.languages)
            ? parsed.languages.join(', ')
            : basicData.languages,
          portfolio_url: parsed.portfolio_url || basicData.portfolio_url,
          linkedin: parsed.linkedin || basicData.linkedin,
          github: parsed.github || basicData.github,
          references: parsed.references || basicData.references,
        });

        const method = response.data.parsing_method || 'unknown';
        const methodName = method.includes('deepseek') ? 'AI-powered' : 
                          method.includes('ner') ? 'NLP-based' : 'basic';

        toast({
          title: "CV Parsed Successfully!",
          description: `Used ${methodName} parsing. Review and edit the information below.`,
        });
      } else {
        // Parsing failed but we have the structure - use basic data
        setFormData(basicData);
        
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* CV Upload Section */}
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
                  {parsedData && (
                    <Alert>
                      <AlertDescription>
                        ✓ CV parsed successfully! Review and edit the information below.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Candidate Information Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Full Name *"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      label="Phone *"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    <FormInput
                      label="Location"
                      name="location"
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Nationality"
                      name="nationality"
                      placeholder="e.g., Pakistani, American"
                      value={formData.nationality}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Professional Summary
                  </label>
                  <Textarea
                    name="summary"
                    placeholder="Brief professional summary..."
                    value={formData.summary}
                    onChange={handleChange}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Skills
                  </label>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.skills.length > 0 
                      ? `${formData.skills.length} skills detected from your CV`
                      : 'Skills will be automatically extracted from your CV'}
                  </p>
                </div>

                {/* Experience & Education */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Professional Background</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Total Experience"
                      name="total_experience"
                      placeholder="e.g., 5 years"
                      value={formData.total_experience}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Current Position"
                      name="current_position"
                      placeholder="e.g., Senior Developer"
                      value={formData.current_position}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Current Company"
                      name="current_company"
                      placeholder="e.g., Tech Corp"
                      value={formData.current_company}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Education
                    </label>
                    <Textarea
                      name="education"
                      placeholder="Degree, Field of Study, Institution, Year"
                      value={formData.education}
                      onChange={handleChange}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Certifications
                      </label>
                      <Textarea
                        name="certifications"
                        placeholder="List your certifications (comma separated)"
                        value={formData.certifications}
                        onChange={handleChange}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Languages
                      </label>
                      <Textarea
                        name="languages"
                        placeholder="e.g., English (Fluent), Urdu (Native)"
                        value={formData.languages}
                        onChange={handleChange}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Online Presence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="LinkedIn Profile"
                      name="linkedin"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedin}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="GitHub Profile"
                      name="github"
                      placeholder="https://github.com/yourusername"
                      value={formData.github}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Portfolio/Website"
                      name="portfolio_url"
                      placeholder="https://yourportfolio.com"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* References */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    References (Optional)
                  </label>
                  <Textarea
                    name="references"
                    placeholder="Name, Position, Company, Contact (one per line)"
                    value={formData.references}
                    onChange={handleChange}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-accent to-accent/80"
                  disabled={loading || parsing}
                >
                  {loading ? 'Submitting...' : parsing ? 'Parsing CV...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Apply;
