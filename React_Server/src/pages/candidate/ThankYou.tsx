import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ThankYou = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Optional: Clear interview data from memory/localStorage on completion
    if (id) {
      localStorage.removeItem(`interview_result_${id}`);
    }
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            {/* Success Icon */}
            <div className="relative mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-green-500/30 animate-pulse" />
            </div>

            {/* Main Message */}
            <h1 className="text-4xl font-bold text-white mb-4">
              Interview Complete!
            </h1>

            <p className="text-lg text-white/80 mb-8">
              Thank you for taking the time to participate in our interview process.
            </p>

            {/* What Happens Next */}
            <div className="bg-white/5 backdrop-blur rounded-lg border border-white/10 p-6 mb-8 text-left">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-400" />
                What Happens Next
              </h2>
              <ul className="space-y-3 text-white/70">
                <li className="flex gap-3">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>Your interview responses are being reviewed by our team</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>We will evaluate your qualifications and experience</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>You will receive an email with the hiring decision shortly</span>
                </li>
              </ul>
            </div>

            {/* Key Information */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6 mb-8">
              <p className="text-white/80 text-sm">
                <strong className="text-white">Interview Reference ID:</strong>
              </p>
              <p className="text-white font-mono text-xs mt-2 break-all bg-black/30 rounded p-3">
                {id}
              </p>
            </div>

            {/* Closing Message */}
            <p className="text-white/60 mb-8 text-sm">
              Your interview video has been recorded and will be reviewed by our recruitment team.
              You'll be notified via email as soon as we have an update on your application.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/candidate/dashboard")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 rounded-lg py-6 text-lg"
              >
                Return to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="w-full text-white/60 hover:text-white hover:bg-white/10"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;
