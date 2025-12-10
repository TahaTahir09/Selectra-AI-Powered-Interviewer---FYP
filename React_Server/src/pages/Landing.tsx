import { Link } from "react-router-dom";
import { Building2, UserCircle, Sparkles, CheckCircle, Zap, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import selectraLogo from "@/assets/selectra-logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50/30">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={selectraLogo} alt="Selectra" className="h-28" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors font-medium">How it works?</Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors font-medium">Pricing</Link>
              <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors font-medium">Features</Link>
              <Link to="/candidate" className="text-muted-foreground hover:text-primary transition-colors font-medium">For Candidates</Link>
            </div>
            <Link to="/org/register">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 gap-2">
                Company Sign Up <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Trust Badge */}
        <div className="flex justify-center mb-12 animate-fade-in">
          <div className="bg-card rounded-full shadow-md px-6 py-3 flex items-center gap-4 border border-border">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Selectra has joined the AI Revolution</span>
            <Shield className="h-5 w-5 text-accent" />
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-16 max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <img src={selectraLogo} alt="Selectra" className="h-32 md:h-36 lg:h-40" />
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Interviewer
            </h2>
            <div className="inline-block bg-gradient-to-r from-primary/10 to-accent/10 px-8 py-3 rounded-full mb-6">
              <span className="text-2xl md:text-3xl font-light italic text-foreground">& CV Screener</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-semibold mb-8 text-foreground">
              for Recruiters
            </h3>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FREE - FOREVER
            </div>
          </div>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
            Selectra saves recruiters time and helps them discover hidden talents faster – all for FREE
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center items-center mb-16">
            <Link to="/org/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
                Start Hiring Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <Card className="border-2 hover:border-primary transition-all hover:shadow-2xl bg-card group">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered interviews that screen candidates in minutes, not days
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-all hover:shadow-2xl bg-card group">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Smart Screening</h3>
              <p className="text-muted-foreground leading-relaxed">
                Advanced CV parsing and intelligent matching with job requirements
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent transition-all hover:shadow-2xl bg-card group">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-accent to-accent/80 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">100% Free</h3>
              <p className="text-muted-foreground leading-relaxed">
                No hidden costs, no credit card required. Free forever for all users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary transition-all hover:shadow-2xl bg-card overflow-hidden group">
            <CardContent className="p-10">
              <div className="mb-6 flex justify-center">
                <div className="p-5 bg-gradient-to-br from-primary to-primary/80 rounded-3xl shadow-xl group-hover:scale-110 transition-transform">
                  <Building2 className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
                For Organizations
              </h2>
              <p className="text-muted-foreground text-center mb-8 text-lg leading-relaxed">
                Post jobs, conduct AI interviews, and hire the best talent efficiently
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground">Unlimited job postings</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground">AI-powered candidate screening</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground">Automated interview scheduling</span>
                </div>
              </div>
              <div className="space-y-3">
                <Link to="/org/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-primary to-accent py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                    Register Organization
                  </Button>
                </Link>
                <Link to="/org/login" className="block">
                  <Button variant="outline" className="w-full border-2 py-6 text-lg rounded-xl transition-all">
                    Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent transition-all hover:shadow-2xl bg-card overflow-hidden group">
            <CardContent className="p-10">
              <div className="mb-6 flex justify-center">
                <div className="p-5 bg-gradient-to-br from-accent to-accent/80 rounded-3xl shadow-xl group-hover:scale-110 transition-transform">
                  <UserCircle className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
                For Candidates
              </h2>
              <p className="text-muted-foreground text-center mb-8 text-lg leading-relaxed">
                Practice interviews, showcase your skills, and land your dream job
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground">Unlimited practice sessions</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground">Real-time AI feedback</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground">Apply to multiple positions</span>
                </div>
              </div>
              <div className="space-y-3">
                <Link to="/candidate/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-primary to-accent py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                    Register as Candidate
                  </Button>
                </Link>
                <Link to="/candidate/login" className="block">
                  <Button variant="outline" className="w-full border-2 py-6 text-lg rounded-xl transition-all">
                    Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">Selectra</span> - Transforming recruitment with AI
            </p>
            <p className="text-sm mt-2">© 2025 Selectra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
