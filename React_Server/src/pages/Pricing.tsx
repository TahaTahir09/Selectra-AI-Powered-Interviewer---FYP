import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
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
      badgeColor: "bg-blue-500",
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
      badgeColor: "bg-green-500",
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Choose the plan that works best for your organization. No hidden fees, no surprises.
          </p>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
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
                className={`relative hover:shadow-2xl transition-all duration-300 ${
                  plan.highlighted ? 'ring-2 ring-primary shadow-xl scale-105' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1">
                      BEST VALUE
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <Badge className={`${plan.badgeColor} text-white w-fit mx-auto mb-4`}>
                    {plan.badge}
                  </Badge>
                  <CardTitle className="text-3xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-6">
                    {plan.description}
                  </CardDescription>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xl text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    asChild 
                    size="lg" 
                    className={`w-full text-lg ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-primary to-accent' 
                        : 'bg-primary'
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
        <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-16 mt-8">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
              Everything You Need to Hire Smarter
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {allFeatures.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer a 14-day free trial with full access to all features. No credit card required to start.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Can I switch between plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. You can upgrade to annual or downgrade to monthly at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards (Visa, MasterCard, American Express) and support international payments.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Is there a limit on interviews or candidates?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No limits! Conduct unlimited interviews and process unlimited candidate applications on any plan.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-primary to-accent text-white">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join hundreds of companies transforming their hiring process with AI.
              </p>
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link to="/org/register">
                  Start Your Free Trial
                </Link>
              </Button>
              <p className="text-sm mt-4 text-white/70">
                No credit card required • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
