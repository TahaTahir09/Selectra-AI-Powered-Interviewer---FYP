import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";
import bgPattern from "@/assets/bg-pattern.jpg";

const OrgRegister = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    first_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        ...formData,
        user_type: 'organization'
      });
      setTimeout(() => navigate("/org/login"), 2000);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Register Your Organization
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
                label="Email" 
                name="email"
                type="email" 
                placeholder="company@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <FormInput 
                label="Company Name" 
                name="first_name"
                placeholder="Enter company name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <FormInput 
                label="Password" 
                name="password"
                type="password" 
                placeholder="Enter password"
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
                className="w-full bg-gradient-to-r from-primary to-primary/80"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register Organization'}
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

export default OrgRegister;
