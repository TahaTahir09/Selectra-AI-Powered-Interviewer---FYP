import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";
import bgPattern from "@/assets/bg-pattern.jpg";

const CandidateRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [fileName, setFileName] = useState("");

  const addSkill = () => {
    if (currentSkill && !skills.includes(currentSkill)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Registration Successful!",
      description: "Welcome to SELECTRA. Please login to continue.",
    });
    setTimeout(() => navigate("/candidate/login"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create Candidate Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput label="Full Name" placeholder="Enter your full name" />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Gmail Login</label>
                <Button type="button" variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Skills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    placeholder="Add a skill"
                    className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <FormInput label="Years of Experience" type="number" placeholder="e.g., 3" />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Currently Working?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="working" value="yes" />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="working" value="no" />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Upload CV</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    id="cv-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {fileName || "Click to upload your CV"}
                    </p>
                  </label>
                </div>
              </div>

              <FormInput label="Password" type="password" placeholder="Create a password" />
              <FormInput label="Confirm Password" type="password" placeholder="Confirm password" />

              <Button type="submit" className="w-full bg-gradient-to-r from-accent to-accent/80">
                Register
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CandidateRegister;
