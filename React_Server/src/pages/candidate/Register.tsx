import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";

const CandidateRegister = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    if (currentSkill && !skills.includes(currentSkill)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        ...formData,
        user_type: 'candidate'
      });
      
      // Check if user was trying to apply for a job
      const applyJobId = localStorage.getItem('applyJobId');
      if (applyJobId) {
        localStorage.removeItem('applyJobId'); // Clear after reading
        setTimeout(() => navigate(`/candidate/apply/${applyJobId}`), 2000);
      } else {
        setTimeout(() => navigate("/candidate/login"), 2000);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
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
              <FormInput 
                label="Username" 
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <FormInput 
                label="Full Name" 
                name="first_name"
                placeholder="Enter your full name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <FormInput 
                label="Email" 
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <FormInput 
                label="Password" 
                name="password"
                type="password" 
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <FormInput 
                label="Confirm Password" 
                name="password2"
                type="password" 
                placeholder="Confirm password"
                value={formData.password2}
                onChange={handleChange}
                required
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-accent to-accent/80"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
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
