import { Link } from "react-router-dom";
import { Building2, UserCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import bgPattern from "@/assets/bg-pattern.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="container max-w-6xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              <span className="text-sm font-medium text-accent-foreground">AI-Powered Interview Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to SELECTRA
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your hiring process with intelligent AI interviews. Connect top talent with leading organizations seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-primary to-primary/70 rounded-xl">
                    <Building2 className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-3 text-foreground">
                  For Organizations
                </h2>
                <p className="text-muted-foreground text-center mb-6">
                  Post jobs, generate AI interview links, and find the perfect candidates efficiently.
                </p>
                <div className="space-y-3">
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    <Link to="/org/register">Register Organization</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/org/login">Login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-accent to-accent/70 rounded-xl">
                    <UserCircle className="h-12 w-12 text-accent-foreground" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-3 text-foreground">
                  For Candidates
                </h2>
                <p className="text-muted-foreground text-center mb-6">
                  Take AI-powered interviews, showcase your skills, and land your dream job.
                </p>
                <div className="space-y-3">
                  <Button asChild className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground">
                    <Link to="/candidate/register">Register as Candidate</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/candidate/login">Login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
