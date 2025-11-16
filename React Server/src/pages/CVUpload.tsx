import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import selectraLogo from "@/assets/selectra-logo.png";

const CVUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    education: "",
    experience: "",
    skills: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile.type.includes('pdf') && !uploadedFile.type.includes('doc')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOC file",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    setIsProcessing(true);

    // Simulate CV parsing
    setTimeout(() => {
      setFormData({
        name: "John Doe",
        email: "john.doe@email.com",
        phone: "+1 (555) 123-4567",
        address: "123 Main St, New York, NY 10001",
        education: "Bachelor of Science in Computer Science\nNew York University (2018-2022)\nGPA: 3.8/4.0",
        experience: "Software Developer\nTech Corp (2022-Present)\n• Developed web applications using React and Node.js\n• Collaborated with cross-functional teams\n• Improved application performance by 30%",
        skills: "JavaScript, React, Node.js, Python, SQL, Git, AWS, Problem Solving, Team Collaboration",
      });
      setIsProcessing(false);
      toast({
        title: "CV Processed Successfully!",
        description: "Your information has been extracted. Please review and edit if needed.",
      });
    }, 2000);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    toast({
      title: "Application Submitted Successfully!",
      description: "You will receive an interview invitation via email",
      duration: 5000,
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-selectra-blue-light/20 via-background to-selectra-yellow-light/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-[var(--shadow-selectra)] bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-selectra-blue mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
            <p className="text-lg font-semibold text-selectra-blue mb-4">
              Interview Invitation Coming Soon
            </p>
            <p className="text-muted-foreground mb-2">
              You will receive an interview invitation link via email to your registered Gmail address.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Once you receive the link, you can login and complete your interview within 5 days. Make sure to check your inbox regularly!
            </p>
            <Button variant="selectra" onClick={() => window.location.href = "/"}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-selectra-blue-light/20 via-background to-selectra-yellow-light/20">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = "/"}
              className="text-muted-foreground hover:text-selectra-blue"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <img src={selectraLogo} alt="SELECTRA" className="h-10 w-10" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-selectra-blue to-selectra-yellow bg-clip-text text-transparent">
              SELECTRA
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Step 1: Upload Your CV
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Upload Your CV</h2>
            <p className="text-muted-foreground">
              Upload your CV and we'll automatically extract your information to speed up the process.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* CV Upload Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload CV/Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragActive
                      ? "border-selectra-blue bg-selectra-blue-light/10"
                      : "border-muted-foreground/25 hover:border-selectra-blue/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  
                  {isProcessing ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 text-selectra-blue mx-auto animate-spin" />
                      <p className="text-selectra-blue font-medium">Processing your CV...</p>
                    </div>
                  ) : file ? (
                    <div className="space-y-4">
                      <FileText className="h-12 w-12 text-selectra-blue mx-auto" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">File uploaded successfully</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium">Drop your CV here or click to browse</p>
                        <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX files only</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {file ? "Review and edit the extracted information" : "Fill in your details manually"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    placeholder="Your educational background..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Work Experience</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="Your work experience..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Your skills and expertise..."
                    rows={2}
                  />
                </div>

                <Button
                  variant="selectra"
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.email}
                >
                  CONTINUE FOR INTERVIEW
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CVUpload;