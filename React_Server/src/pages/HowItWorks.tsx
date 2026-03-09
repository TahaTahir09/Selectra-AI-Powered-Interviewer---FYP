import { Link } from "react-router-dom";
import { Upload, Sparkles, Video, BarChart, CheckCircle, ArrowRight, ArrowDown, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload className="h-12 w-12 text-white" />,
      title: "1. Post Your Job",
      description: "Organizations create detailed job postings with required skills, experience, and qualifications. Our system generates a unique application link instantly.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Sparkles className="h-12 w-12 text-white" />,
      title: "2. AI-Powered Screening",
      description: "Candidates submit applications with their CV. Our advanced AI parser extracts key information and matches candidates to job requirements using intelligent algorithms.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Video className="h-12 w-12 text-white" />,
      title: "3. Automated Interviews",
      description: "Qualified candidates receive interview invitations. Our AI conducts real-time voice interviews, asking relevant questions based on the job description and CV.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <BarChart className="h-12 w-12 text-white" />,
      title: "4. Instant Evaluation",
      description: "AI analyzes responses in real-time, evaluating communication skills, technical knowledge, and job fit. Organizations receive comprehensive evaluation reports immediately.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const benefits = [
    "Save 80% of time spent on initial screening",
    "Eliminate scheduling conflicts with 24/7 availability",
    "Reduce hiring bias with standardized AI evaluation",
    "Scale interviews effortlessly - handle hundreds simultaneously",
    "Get instant insights with detailed candidate reports",
    "Focus on top talent while AI handles the first round"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
            <Bot className="h-4 w-4 text-purple-400" />
            Step-by-step Guide
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            How Selectra Works
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-8">
            Transform your hiring process with AI-powered automation. From job posting to final evaluation, 
            Selectra handles the entire initial screening process seamlessly.
          </p>
        </section>

        {/* Process Steps */}
        <section className="container mx-auto px-4 py-12">
          <div className="space-y-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-bold mb-3 text-white">
                          {step.title}
                        </h3>
                        <p className="text-lg text-white/60 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-4">
                    <ArrowDown className="h-8 w-8 text-purple-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-white/5 backdrop-blur-sm py-16 mt-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">
              Why Choose Selectra?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-6 flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                    <p className="text-white/80 font-medium">{benefit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 border-0">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold mb-4 text-white">
                Ready to Transform Your Hiring?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join hundreds of companies using AI to find the best talent faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg bg-white text-purple-600 hover:bg-white/90 border-0">
                  <Link to="/org/register">
                    Start Free Trial
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg bg-white/10 hover:bg-white/20 text-white border-white/30">
                  <Link to="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
