import { Link } from "react-router-dom";
import { Check, Sparkles, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Pricing = () => {
  const plans = [
    {
      name: "Monthly Plan",
      price: "$40",
      period: "/month",
      description: "Perfect for growing teams and flexible hiring needs",
      badge: "Most Flexible",
      badgeGradient: "from-blue-500 to-cyan-500",
      features: [
        "Unlimited job postings",
        "AI-powered CV screening",
        "Automated interviews",
        "Real-time candidate evaluation",
        "Detailed analytics dashboard",
        "24/7 interview availability",
        "Multi-user access",
        "Email support",
        "Secure data storage",
        "Cancel anytime"
      ],
      cta: "Start Monthly",
      highlighted: false
    },
    {
      name: "Annual Plan",
      price: "$400",
      period: "/year",
      description: "Best value for established companies with ongoing hiring",
      badge: "Save 17%",
      badgeGradient: "from-green-500 to-emerald-500",
      features: [
        "Everything in Monthly Plan",
        "Save $80 per year",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "Early access to new features",
        "Training sessions",
        "Annual strategy review"
      ],
      cta: "Start Annual",
      highlighted: true
    }
  ];

  const allFeatures = [
    {
      category: "AI Interview Platform",
      features: [
        "Unlimited AI-conducted interviews",
        "Real-time conversational AI",
        "Context-aware follow-up questions",
        "Speech-to-text transcription",
        "Multi-language support"
      ]
    },
    {
      category: "Candidate Management",
      features: [
        "Unlimited candidate applications",
        "Advanced CV parsing (PDF, DOCX, DOC)",
        "Skill matching algorithm",
        "Candidate ranking system",
        "Application tracking"
      ]
    },
    {
      category: "Analytics & Reporting",
      features: [
        "Comprehensive evaluation reports",
        "Hiring funnel analytics",
        "Time-to-hire metrics",
        "Candidate quality insights",
        "Export data (CSV, PDF)"
      ]
    },
    {
      category: "Integration & Security",
      features: [
        "REST API access",
        "Webhook notifications",
        "JWT authentication",
        "End-to-end encryption",
        "GDPR compliant"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
            <Zap className="h-4 w-4 text-purple-400" />
            Simple Pricing
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-4">
            Choose the plan that works best for your organization. No hidden fees, no surprises.
          </p>
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/30">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">14-day free trial • No credit card required</span>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 ${
                  plan.highlighted ? 'ring-2 ring-purple-500 shadow-xl shadow-purple-500/20 scale-105' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 border-0">
                      <Star className="h-3 w-3 mr-1" />
                      BEST VALUE
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <Badge className={`bg-gradient-to-r ${plan.badgeGradient} text-white w-fit mx-auto mb-4 border-0`}>
                    {plan.badge}
                  </Badge>
                  <CardTitle className="text-3xl mb-2 text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-6 text-white/60">
                    {plan.description}
                  </CardDescription>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-xl text-white/60">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    asChild 
                    size="lg" 
                    className={`w-full text-lg border-0 ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    <Link to="/org/register">
                      {plan.cta}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* All Features Section */}
        <section className="bg-white/5 backdrop-blur-sm py-16 mt-8">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">
              Everything You Need to Hire Smarter
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {allFeatures.map((section, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-xl border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{section.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white/60">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Still Have Questions?
              </h2>
              <p className="text-lg mb-8 text-white/90">
                Our team is here to help you get started with Selectra.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg bg-white text-purple-600 hover:bg-white/90 border-0">
                  <Link to="/org/register">
                    Start Free Trial
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg bg-white/10 hover:bg-white/20 text-white border-white/30">
                  <a href="mailto:support@selectra.ai">
                    Contact Sales
                  </a>
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

export default Pricing;
