import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";
import bgPattern from "@/assets/bg-pattern.jpg";

const CandidateLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("candidateName", "John Doe");
    navigate("/candidate/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Candidate Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput label="Email" type="email" placeholder="your@email.com" />
              <FormInput label="Password" type="password" placeholder="Enter password" />

              <Button type="submit" className="w-full bg-gradient-to-r from-accent to-accent/80">
                Login
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a href="/candidate/register" className="text-primary hover:underline">
                  Register here
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CandidateLogin;
