import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Send, Home } from "lucide-react";
import selectraLogo from "@/assets/selectra-logo.png";

const InterviewComplete = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-selectra-blue-light/20 via-background to-selectra-yellow-light/20">
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
            Interview Completed
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="max-w-2xl mx-auto shadow-[var(--shadow-selectra)] bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 text-center">
            {/* Success Icon */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-selectra-blue to-selectra-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-selectra-yellow rounded-full flex items-center justify-center">
                <span className="text-selectra-blue font-bold text-lg">✓</span>
              </div>
            </div>

            {/* Main Message */}
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-selectra-blue to-selectra-blue-dark bg-clip-text text-transparent">
              Interview Completed Successfully!
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Thank you for completing your SELECTRA AI interview. Your responses have been recorded and will be carefully reviewed by our AI system.
            </p>

            {/* Status Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-selectra-blue-light/20 rounded-lg">
                <Clock className="h-8 w-8 text-selectra-blue mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Interview Duration</h4>
                <p className="text-selectra-blue font-bold">40:00</p>
              </div>
              <div className="p-4 bg-selectra-yellow-light/50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-selectra-yellow mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Questions Answered</h4>
                <p className="text-selectra-blue font-bold">6/6</p>
              </div>
              <div className="p-4 bg-selectra-blue-light/20 rounded-lg">
                <Send className="h-8 w-8 text-selectra-blue mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Report Status</h4>
                <p className="text-selectra-blue font-bold">Sent</p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-muted/50 p-6 rounded-lg mb-8 text-left">
              <h3 className="font-semibold mb-3 text-center">What Happens Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-selectra-blue text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                  <span>Your interview responses are being analyzed by our advanced AI system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-selectra-blue text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                  <span>A comprehensive report will be generated and sent to the organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-selectra-blue text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                  <span>You will be contacted directly by the organization regarding next steps</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button variant="selectra-outline" onClick={() => window.location.href = "/"}>
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
              <Button variant="selectra" onClick={() => window.print()}>
                Download Report
              </Button>
            </div>

            {/* Footer Message */}
            <p className="text-xs text-muted-foreground mt-8 border-t pt-4">
              Thank you for choosing SELECTRA. We appreciate your time and effort in completing this interview.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InterviewComplete;