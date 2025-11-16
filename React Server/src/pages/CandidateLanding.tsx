import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import selectraLogo from "@/assets/selectra-logo.png";
import selectraBg from "@/assets/selectra-bg.jpg";
import { Users, Brain, Clock, CheckCircle, Building2, UserCheck } from "lucide-react";

const CandidateLanding = () => {
  const [userType, setUserType] = useState<"organization" | "candidate" | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Success!",
      description: isLogin ? `Welcome back to SELECTRA!` : "Account created successfully!",
    });
    
    if (userType === "candidate") {
      window.location.href = "/cv-upload";
    } else {
      // For organizations, redirect to dashboard (to be created)
      toast({
        title: "Organization Dashboard",
        description: "Redirecting to organization dashboard...",
      });
    }
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `linear-gradient(rgba(213, 238, 255, 0.8), rgba(255, 248, 220, 0.8)), url(${selectraBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={selectraLogo} alt="SELECTRA" className="h-10 w-10" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-selectra-blue to-selectra-yellow bg-clip-text text-transparent">
              SELECTRA
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            AI-Powered Interview Platform
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-selectra-blue via-selectra-blue-dark to-selectra-yellow bg-clip-text text-transparent">
              Welcome to Your Future
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the next generation of interviews with AI-powered assessments. 
              Get ready to showcase your skills in an innovative, fair, and efficient way.
            </p>
            
            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="flex flex-col items-center p-6 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                <Brain className="h-12 w-12 text-selectra-blue mb-4" />
                <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">Advanced AI conducts fair and unbiased interviews</p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                <Clock className="h-12 w-12 text-selectra-yellow mb-4" />
                <h3 className="font-semibold text-lg mb-2">Time Efficient</h3>
                <p className="text-sm text-muted-foreground">40-minute focused sessions that respect your time</p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                <CheckCircle className="h-12 w-12 text-selectra-blue mb-4" />
                <h3 className="font-semibold text-lg mb-2">Instant Results</h3>
                <p className="text-sm text-muted-foreground">Get immediate feedback and status updates</p>
              </div>
            </div>
          </div>

          {/* User Type Selection or Auth Section */}
          <div className="max-w-md mx-auto">
            {!userType ? (
              <Card className="shadow-[var(--shadow-selectra)] bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                  <p className="text-muted-foreground">Choose your role to continue</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => window.location.href = "/organization-landing"}
                    variant="selectra" 
                    className="w-full h-16" 
                    size="lg"
                  >
                    <Building2 className="mr-3 h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">I'm an Organization</div>
                      <div className="text-sm opacity-90">Create interviews and manage candidates</div>
                    </div>
                  </Button>
                  <Button 
                    onClick={() => setUserType("candidate")}
                    variant="outline" 
                    className="w-full h-16 border-selectra-blue text-selectra-blue hover:bg-selectra-blue hover:text-white" 
                    size="lg"
                  >
                    <UserCheck className="mr-3 h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">I'm a Candidate</div>
                      <div className="text-sm opacity-75">Take interviews and apply for positions</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-[var(--shadow-selectra)] bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setUserType(null)}
                    className="absolute left-4 top-4 text-muted-foreground"
                  >
                    ← Back
                  </Button>
                  <CardTitle className="text-2xl">
                    {userType === "organization" ? "Organization Portal" : "Candidate Portal"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {userType === "organization" 
                      ? "Access your interview management dashboard" 
                      : "Access your interview portal"
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <Tabs value={isLogin ? "login" : "register"} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
                        Login
                      </TabsTrigger>
                      <TabsTrigger value="register" onClick={() => setIsLogin(false)}>
                        Register
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="space-y-4 mt-6">
                      <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="your@email.com" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" placeholder="••••••••" required />
                        </div>
                        <Button type="submit" variant="selectra" className="w-full" size="lg">
                          {userType === "organization" ? "Access Dashboard" : "Continue to Interview"}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="register" className="space-y-4 mt-6">
                      <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            {userType === "organization" ? "Organization Name" : "Full Name"}
                          </Label>
                          <Input 
                            id="name" 
                            placeholder={userType === "organization" ? "Your Company" : "John Doe"} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="your@email.com" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" placeholder="••••••••" required />
                        </div>
                        <Button type="submit" variant="selectra" className="w-full" size="lg">
                          {userType === "organization" ? "Create Organization Account" : "Create Account & Continue"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateLanding;