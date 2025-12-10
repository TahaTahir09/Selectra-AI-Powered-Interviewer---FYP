import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI, JobPost } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const AllJobs = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = jobs.filter(job => 
        job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchTerm, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.list();
      const jobsList = response.results || response;
      setJobs(Array.isArray(jobsList) ? jobsList : []);
      setFilteredJobs(Array.isArray(jobsList) ? jobsList : []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/org/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'closed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-orange-50 to-white">
      <Sidebar 
        userType="organization" 
        userName={user?.username} 
        userEmail={user?.email}
        onLogout={handleLogout} 
      />
      
      <div className="flex-1 ml-64 flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                All Job Postings
              </span>
            </h1>
            <p className="text-muted-foreground">Manage and view all your job listings</p>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by job title or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button 
                  onClick={() => navigate("/org/post-job")}
                  className="bg-gradient-to-r from-primary to-accent gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Post New Job
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''} Found
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "No jobs found matching your search" : "No job postings yet"}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => navigate("/org/post-job")} 
                      className="bg-gradient-to-r from-primary to-accent"
                    >
                      Post Your First Job
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-start justify-between p-6 border-2 border-border rounded-xl hover:shadow-md hover:border-primary/50 transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-foreground mb-2">{job.job_title}</h3>
                        <div className="flex flex-wrap gap-4 mb-3">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            📍 {job.location || "Not specified"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            💼 {job.employment_type || "Full-time"}
                          </span>
                          {job.salary_range && (
                            <span className="text-sm text-muted-foreground">
                              💰 {job.salary_range}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{job.application_count || 0} applicants</span>
                          <span>•</span>
                          <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge className={`${getStatusColor(job.status)} border`}>
                          {job.status}
                        </Badge>
                        <Button 
                          className="bg-gradient-to-r from-primary to-accent" 
                          size="sm"
                          onClick={() => navigate(`/org/job/${job.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AllJobs;
