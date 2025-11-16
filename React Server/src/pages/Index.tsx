import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to SELECTRA
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-Powered Recruitment Platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Organization Portal */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl">For Organizations</CardTitle>
              <CardDescription>
                Post jobs, manage applications, and conduct AI-powered interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate("/organization-signup")}
              >
                Sign Up
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => navigate("/organization-login")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>

          {/* Candidate Portal */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-secondary" />
              </div>
              <CardTitle className="text-2xl">For Candidates</CardTitle>
              <CardDescription>
                Apply for jobs and complete AI-powered interview assessments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                variant="secondary"
                onClick={() => navigate("/candidate-signup")}
              >
                Sign Up
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => navigate("/candidate-login")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
