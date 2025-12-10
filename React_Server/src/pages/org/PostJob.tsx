import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI } from "@/services/api";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";
import Modal from "@/components/Modal";

const PostJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [applicationLink, setApplicationLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_title: "",
    job_description: "",
    required_skills: "",
    experience_required: "",
    qualification: "",
    responsibilities: "",
    employment_type: "",
    location: "",
    salary_range: "",
    benefits: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create job post in backend
      const jobData = {
        job_title: formData.job_title,
        job_description: formData.job_description,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s),
        experience_required: formData.experience_required,
        qualification: formData.qualification,
        responsibilities: formData.responsibilities,
        benefits: formData.benefits,
        employment_type: formData.employment_type,
        location: formData.location,
        salary_range: formData.salary_range,
        status: 'active'
      };

      const createdJob = await jobAPI.create(jobData);
      
      // Backend auto-generates the application link
      setApplicationLink(createdJob.application_link);
      setShowModal(true);
      
      toast({
        title: "Job Posted Successfully!",
        description: "Your job has been posted and is now active.",
      });

      // Reset form
      setFormData({
        job_title: "",
        job_description: "",
        required_skills: "",
        experience_required: "",
        qualification: "",
        responsibilities: "",
        employment_type: "",
        location: "",
        salary_range: "",
        benefits: "",
      });

    } catch (error: any) {
      console.error('Failed to create job:', error);
      toast({
        title: "Failed to Post Job",
        description: error.response?.data?.detail || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(applicationLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Application link has been copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
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
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Post a New Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput 
                label="Job Title" 
                name="job_title"
                placeholder="e.g., Senior Full Stack Developer" 
                value={formData.job_title}
                onChange={handleChange}
                required 
              />
              <FormInput
                label="Job Description"
                name="job_description"
                placeholder="Describe the role and responsibilities"
                value={formData.job_description}
                onChange={handleChange}
                multiline
                required
              />
              <FormInput 
                label="Required Skills (comma-separated)" 
                name="required_skills"
                placeholder="e.g., React, Node.js, TypeScript" 
                value={formData.required_skills}
                onChange={handleChange}
                required 
              />
              <FormInput 
                label="Experience Required" 
                name="experience_required"
                placeholder="e.g., 3-5 years" 
                value={formData.experience_required}
                onChange={handleChange}
                required 
              />
              <FormInput 
                label="Qualifications" 
                name="qualification"
                placeholder="e.g., Bachelor's in Computer Science" 
                value={formData.qualification}
                onChange={handleChange}
                required 
              />
              <FormInput
                label="Key Responsibilities"
                name="responsibilities"
                placeholder="List main responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                multiline
                required
              />
              <FormInput 
                label="Employment Type" 
                name="employment_type"
                placeholder="e.g., Full-time, Remote" 
                value={formData.employment_type}
                onChange={handleChange}
                required 
              />
              <FormInput 
                label="Location" 
                name="location"
                placeholder="e.g., San Francisco, CA or Remote" 
                value={formData.location}
                onChange={handleChange}
                required 
              />
              <FormInput 
                label="Salary Range" 
                name="salary_range"
                placeholder="e.g., $80,000 - $120,000" 
                value={formData.salary_range}
                onChange={handleChange}
              />
              <FormInput
                label="Benefits"
                name="benefits"
                placeholder="Health insurance, 401k, etc."
                value={formData.benefits}
                onChange={handleChange}
                multiline
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent"
                disabled={loading}
              >
                {loading ? 'Posting Job...' : 'Post Job & Generate Application Link'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Job Posted Successfully!">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with candidates so they can apply for this position:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={applicationLink}
                readOnly
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Candidates will use this link to submit their resume and apply for the job. You'll be able to review applications in your dashboard.
            </p>
            <Button onClick={() => setShowModal(false)} className="w-full bg-gradient-to-r from-primary to-accent">
              Done
            </Button>
          </div>
        </Modal>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default PostJob;
