import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import OrgRegister from "./pages/org/Register";
import OrgLogin from "./pages/org/Login";
import OrgDashboard from "./pages/org/Dashboard";
import PostJob from "./pages/org/PostJob";
import AllJobs from "./pages/org/AllJobs";
import JobDetails from "./pages/org/JobDetails";
import OrgProfile from "./pages/org/Profile";
import Applications from "./pages/org/Applications";
import CandidateLanding from "./pages/candidate/Landing";
import CandidateRegister from "./pages/candidate/Register";
import CandidateLogin from "./pages/candidate/Login";
import CandidateDashboard from "./pages/candidate/Dashboard";
import CandidateProfile from "./pages/candidate/Profile";
import MyApplications from "./pages/candidate/MyApplications";
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
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            
            {/* Organization Auth Routes (public) */}
            <Route path="/org/register" element={<OrgRegister />} />
            <Route path="/org/login" element={<OrgLogin />} />
            
            {/* Organization Protected Routes */}
            <Route path="/org/dashboard" element={
              <ProtectedRoute allowedUserType="organization">
                <OrgDashboard />
              </ProtectedRoute>
            } />
            <Route path="/org/post-job" element={
              <ProtectedRoute allowedUserType="organization">
                <PostJob />
              </ProtectedRoute>
            } />
            <Route path="/org/jobs" element={
              <ProtectedRoute allowedUserType="organization">
                <AllJobs />
              </ProtectedRoute>
            } />
            <Route path="/org/job/:id" element={
              <ProtectedRoute allowedUserType="organization">
                <JobDetails />
              </ProtectedRoute>
            } />
            <Route path="/org/applications" element={
              <ProtectedRoute allowedUserType="organization">
                <Applications />
              </ProtectedRoute>
            } />
            <Route path="/org/profile" element={
              <ProtectedRoute allowedUserType="organization">
                <OrgProfile />
              </ProtectedRoute>
            } />
            
            {/* Candidate Auth Routes (public) */}
            <Route path="/candidate" element={<CandidateLanding />} />
            <Route path="/candidate/register" element={<CandidateRegister />} />
            <Route path="/candidate/login" element={<CandidateLogin />} />
            
            {/* Candidate Protected Routes */}
            <Route path="/candidate/dashboard" element={
              <ProtectedRoute allowedUserType="candidate">
                <CandidateDashboard />
              </ProtectedRoute>
            } />
            <Route path="/candidate/profile" element={
              <ProtectedRoute allowedUserType="candidate">
                <CandidateProfile />
              </ProtectedRoute>
            } />
            <Route path="/candidate/applications" element={
              <ProtectedRoute allowedUserType="candidate">
                <MyApplications />
              </ProtectedRoute>
            } />
            <Route path="/candidate/apply/:id" element={
              <ProtectedRoute allowedUserType="candidate">
                <Apply />
              </ProtectedRoute>
            } />
            
            {/* Interview Routes (protected, candidate only) */}
            <Route path="/interview/:id" element={
              <ProtectedRoute allowedUserType="candidate">
                <Interview />
              </ProtectedRoute>
            } />
            <Route path="/interview/result/:id" element={
              <ProtectedRoute allowedUserType="candidate">
                <Result />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
