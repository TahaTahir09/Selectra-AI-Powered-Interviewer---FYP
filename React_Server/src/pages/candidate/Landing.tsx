import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CandidateLanding = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Candidate Portal
              </h1>
              <p className="text-muted-foreground">
                Start your journey to landing your dream job with AI-powered interviews
              </p>
            </div>

            <div className="space-y-4">
              <Button asChild className="w-full h-14 text-lg bg-gradient-to-r from-accent to-accent/80">
                <Link to="/candidate/register">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create Account
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-14 text-lg">
                <Link to="/candidate/login">
                  <LogIn className="mr-2 h-5 w-5" />
                  Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CandidateLanding;
