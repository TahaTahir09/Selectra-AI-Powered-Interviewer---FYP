import { Link } from "react-router-dom";
import { Upload, Sparkles, Video, BarChart, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload className="h-12 w-12 text-primary" />,
      title: "1. Post Your Job",
      description: "Organizations create detailed job postings with required skills, experience, and qualifications. Our system generates a unique application link instantly.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <Sparkles className="h-12 w-12 text-accent" />,
      title: "2. AI-Powered Screening",
      description: "Candidates submit applications with their CV. Our advanced AI parser extracts key information and matches candidates to job requirements using intelligent algorithms.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Video className="h-12 w-12 text-green-500" />,
      title: "3. Automated Interviews",
      description: "Qualified candidates receive interview invitations. Our AI conducts real-time voice interviews, asking relevant questions based on the job description and CV.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <BarChart className="h-12 w-12 text-purple-500" />,
      title: "4. Instant Evaluation",
      description: "AI analyzes responses in real-time, evaluating communication skills, technical knowledge, and job fit. Organizations receive comprehensive evaluation reports immediately.",
      color: "from-purple-500 to-purple-600"
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            How Selectra Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform your hiring process with AI-powered automation. From job posting to final evaluation, 
            Selectra handles the entire initial screening process seamlessly.
          </p>
        </section>

        {/* Process Steps */}
        <section className="container mx-auto px-4 py-12">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-bold mb-3 text-foreground">
                          {step.title}
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-4">
                    <ArrowRight className="h-8 w-8 text-primary rotate-90 md:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-16 mt-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
              Why Choose Selectra?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-start gap-4">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                    <p className="text-foreground font-medium">{benefit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-primary to-accent text-white">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Transform Your Hiring?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join hundreds of companies using AI to find the best talent faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="text-lg">
                  <Link to="/org/register">
                    Start Free Trial
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg bg-white/10 hover:bg-white/20 text-white border-white">
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
