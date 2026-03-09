import { Link } from "react-router-dom";
import { Building2, UserCircle, Sparkles, CheckCircle, Zap, Shield, ArrowRight, Bot, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import selectraLogo from "@/assets/selectra-logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={selectraLogo} alt="Selectra" className="h-20 brightness-0 invert" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/how-it-works" className="text-white/60 hover:text-white transition-colors font-medium">How it works?</Link>
              <Link to="/pricing" className="text-white/60 hover:text-white transition-colors font-medium">Pricing</Link>
              <Link to="/features" className="text-white/60 hover:text-white transition-colors font-medium">Features</Link>
              <Link to="/candidate" className="text-white/60 hover:text-white transition-colors font-medium">For Candidates</Link>
            </div>
            <Link to="/org/register">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full px-6 gap-2 border-0 shadow-lg shadow-purple-500/30">
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
          <div className="bg-white/10 backdrop-blur-xl rounded-full shadow-lg px-6 py-3 flex items-center gap-4 border border-white/20">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-white/80">Selectra has joined the AI Revolution</span>
            <Bot className="h-5 w-5 text-pink-400" />
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-16 max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <img src={selectraLogo} alt="Selectra" className="h-32 md:h-36 lg:h-40 brightness-0 invert" />
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              AI Interviewer
            </h2>
            <div className="inline-block bg-white/10 backdrop-blur-sm px-8 py-3 rounded-full mb-6 border border-white/20">
              <span className="text-2xl md:text-3xl font-light italic text-white/80">& CV Screener</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-semibold mb-8 text-white">
              for Recruiters
            </h3>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              FREE - FOREVER
            </div>
          </div>

          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-12">
            Selectra saves recruiters time and helps them discover hidden talents faster – all for FREE
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center items-center mb-16">
            <Link to="/org/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-10 py-7 text-lg rounded-full shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 border-0">
                Start Hiring Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Lightning Fast</h3>
              <p className="text-white/60 leading-relaxed">
                AI-powered interviews that screen candidates in minutes, not days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Smart Screening</h3>
              <p className="text-white/60 leading-relaxed">
                Advanced CV parsing and intelligent matching with job requirements
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">100% Free</h3>
              <p className="text-white/60 leading-relaxed">
                No hidden costs, no credit card required. Free forever for all users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden group">
            <CardContent className="p-10">
              <div className="mb-6 flex justify-center">
                <div className="p-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-xl group-hover:scale-110 transition-transform">
                  <Building2 className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center mb-4 text-white">
                For Organizations
              </h2>
              <p className="text-white/60 text-center mb-8 text-lg leading-relaxed">
                Post jobs, conduct AI interviews, and hire the best talent efficiently
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-white/80">Unlimited job postings</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-white/80">AI-powered candidate screening</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-white/80">Automated interview scheduling</span>
                </div>
              </div>
              <div className="space-y-3">
                <Link to="/org/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all border-0">
                    Register Organization
                  </Button>
                </Link>
                <Link to="/org/login" className="block">
                  <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white py-6 text-lg rounded-xl transition-all">
                    Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden group">
            <CardContent className="p-10">
              <div className="mb-6 flex justify-center">
                <div className="p-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl shadow-xl group-hover:scale-110 transition-transform">
                  <UserCircle className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center mb-4 text-white">
                For Candidates
              </h2>
              <p className="text-white/60 text-center mb-8 text-lg leading-relaxed">
                Practice interviews, showcase your skills, and land your dream job
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-white/80">Unlimited practice sessions</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-white/80">Real-time AI feedback</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-white/80">Apply to multiple positions</span>
                </div>
              </div>
              <div className="space-y-3">
                <Link to="/candidate/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all border-0">
                    Register as Candidate
                  </Button>
                </Link>
                <Link to="/candidate/login" className="block">
                  <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white py-6 text-lg rounded-xl transition-all">
                    Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg font-medium text-white/80">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">Selectra</span> - Transforming recruitment with AI
            </p>
            <p className="text-sm mt-2 text-white/40">© 2025 Selectra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
