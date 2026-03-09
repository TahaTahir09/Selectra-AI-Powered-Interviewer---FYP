import { Link } from "react-router-dom";
import { Sparkles, Zap, Brain, Users, Clock, Shield, BarChart, FileText, Bot, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Features = () => {
  const mainFeatures = [
    {
      icon: <Brain className="h-10 w-10" />,
      title: "AI-Powered Interviews",
      description: "Advanced AI conducts natural, conversational interviews with candidates in real-time, asking relevant follow-up questions based on responses.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: "Intelligent CV Parsing",
      description: "Automatically extract and analyze key information from resumes using DeepSeek LLM. Supports PDF, DOCX, and DOC formats with 95%+ accuracy.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Smart Candidate Matching",
      description: "AI-powered matching algorithm compares candidate skills, experience, and qualifications against job requirements using advanced vector similarity.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <BarChart className="h-10 w-10" />,
      title: "Real-Time Evaluation",
      description: "Instant comprehensive evaluation reports with scores for technical skills, communication, problem-solving, and cultural fit.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Clock className="h-10 w-10" />,
      title: "24/7 Availability",
      description: "Candidates can complete interviews anytime, anywhere. No scheduling conflicts, no time zone issues, no waiting.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Bias-Free Assessment",
      description: "Standardized evaluation criteria ensure fair, objective assessment of all candidates, reducing unconscious bias in hiring.",
      gradient: "from-red-500 to-pink-500"
    }
  ];

  const additionalFeatures = [
    {
      icon: <FileText className="h-6 w-6 text-purple-400" />,
      title: "Automated Job Posting",
      description: "Create and share job postings with unique application links instantly."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-purple-400" />,
      title: "ChromaDB Integration",
      description: "Vector database for intelligent job description and candidate profile matching."
    },
    {
      icon: <Users className="h-6 w-6 text-purple-400" />,
      title: "Multi-Role Support",
      description: "Separate portals for organizations and candidates with role-based access."
    },
    {
      icon: <BarChart className="h-6 w-6 text-purple-400" />,
      title: "Detailed Analytics",
      description: "Track application metrics, interview completion rates, and candidate quality."
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-400" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with JWT authentication and data encryption."
    },
    {
      icon: <Clock className="h-6 w-6 text-purple-400" />,
      title: "Instant Notifications",
      description: "Real-time updates for new applications, interview completions, and evaluations."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Full Feature List
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Powerful Features
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Everything you need to revolutionize your hiring process with AI-powered automation.
          </p>
        </section>

        {/* Main Features Grid */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <CardTitle className="text-xl mb-2 text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-white/60">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Additional Features */}
        <section className="bg-white/5 backdrop-blur-sm py-16 mt-8">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">
              And Much More...
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {additionalFeatures.map((feature, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/10 rounded-lg flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2 text-white">
                          {feature.title}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="container mx-auto px-4 py-16">
          <Card className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                  <Code className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-4 text-white">Built with Cutting-Edge Technology</CardTitle>
              <CardDescription className="text-base text-white/60">
                Selectra leverages the latest in AI and web technologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-purple-400">AI & Machine Learning</h3>
                  <ul className="space-y-2 text-white/60">
                    <li>• DeepSeek LLM for CV parsing</li>
                    <li>• ChromaDB vector database</li>
                    <li>• TF-IDF vectorization</li>
                    <li>• Natural Language Processing (spaCy)</li>
                    <li>• Real-time AI conversation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-pink-400">Backend & Frontend</h3>
                  <ul className="space-y-2 text-white/60">
                    <li>• Django REST Framework</li>
                    <li>• React with TypeScript</li>
                    <li>• WebSocket (Django Channels)</li>
                    <li>• JWT Authentication</li>
                    <li>• PostgreSQL Database</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Experience the Future of Hiring
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Join leading companies that trust Selectra to streamline their recruitment process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/30">
              <Link to="/org/register">
                Get Started Free
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg border-white/20 hover:bg-white/10 text-white">
              <Link to="/how-it-works">
                Learn How It Works
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
