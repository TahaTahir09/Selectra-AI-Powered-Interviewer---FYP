import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CandidateSignup from "./pages/CandidateSignup";
import CandidateLogin from "./pages/CandidateLogin";
import CVUpload from "./pages/CVUpload";
import AIInterview from "./pages/AIInterview";
import InterviewComplete from "./pages/InterviewComplete";
import OrganizationLanding from "./pages/OrganizationLanding";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import OrganizationSignup from "./pages/OrganizationSignup";
import OrganizationLogin from "./pages/OrganizationLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/candidate-signup" element={<CandidateSignup />} />
          <Route path="/candidate-login" element={<CandidateLogin />} />
          <Route path="/cv-upload" element={<CVUpload />} />
          <Route path="/interview" element={<AIInterview />} />
          <Route path="/interview-complete" element={<InterviewComplete />} />
          <Route path="/organization-signup" element={<OrganizationSignup />} />
          <Route path="/organization-login" element={<OrganizationLogin />} />
          <Route path="/organization-landing" element={<OrganizationLanding />} />
          <Route path="/organization-dashboard" element={<OrganizationDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
