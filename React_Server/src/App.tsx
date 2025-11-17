import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import OrgRegister from "./pages/org/Register";
import OrgLogin from "./pages/org/Login";
import OrgDashboard from "./pages/org/Dashboard";
import PostJob from "./pages/org/PostJob";
import CandidateLanding from "./pages/candidate/Landing";
import CandidateRegister from "./pages/candidate/Register";
import CandidateLogin from "./pages/candidate/Login";
import CandidateDashboard from "./pages/candidate/Dashboard";
import Apply from "./pages/candidate/Apply";
import Interview from "./pages/candidate/Interview";
import Result from "./pages/candidate/Result";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/org/register" element={<OrgRegister />} />
            <Route path="/org/login" element={<OrgLogin />} />
            <Route path="/org/dashboard" element={<OrgDashboard />} />
            <Route path="/org/post-job" element={<PostJob />} />
            <Route path="/candidate" element={<CandidateLanding />} />
            <Route path="/candidate/register" element={<CandidateRegister />} />
            <Route path="/candidate/login" element={<CandidateLogin />} />
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate/apply/:id" element={<Apply />} />
            <Route path="/interview/:id" element={<Interview />} />
            <Route path="/interview/result/:id" element={<Result />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
