import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, MapPin, DollarSign, Search, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { applicationAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";

interface Application {
  id: number;
  job_post: {
    id: number;
    job_title: string;
    location: string;
    employment_type: string;
    salary_range: string;
    job_description: string;
    organization: {
      organization_name: string;
    };
  };
  status: string;
  created_at: string;
  updated_at: string;
}

const MyApplications = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.list();
      const apps = response.results || response;
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/candidate/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredApplications = applications.filter(app =>
    app.job_post?.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job_post?.organization?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-orange-50 to-white">
      <Sidebar 
        userType="candidate" 
        userName={user?.username}
        userEmail={user?.email}
        onLogout={handleLogout} 
      />
      
      <div className="flex-1 ml-64 flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/candidate/dashboard")}
                className="hover:bg-orange-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Applications
              </span>
            </h1>
            <p className="text-muted-foreground">
              Track all your job applications and their status
            </p>
          </div>

          {/* Search and Stats */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <FormInput
                  placeholder="Search by job title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-base px-4 py-2">
                Total: {applications.length}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-700 text-base px-4 py-2">
                Pending: {applications.filter(a => a.status === 'pending').length}
              </Badge>
              <Badge className="bg-green-100 text-green-700 text-base px-4 py-2">
                Accepted: {applications.filter(a => a.status === 'accepted').length}
              </Badge>
            </div>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-12">
                <div className="text-center">
                  <Briefcase className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">
                    {applications.length === 0 ? "No Applications Yet" : "No Results Found"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {applications.length === 0 
                      ? "You haven't applied to any jobs yet. Start exploring opportunities and apply to jobs that match your skills."
                      : "Try adjusting your search criteria"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="shadow-md hover:shadow-xl transition-shadow border-2">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-1">
                              {application.job_post?.job_title || "Job Title"}
                            </h3>
                            <p className="text-muted-foreground font-medium">
                              {application.job_post?.organization?.organization_name || "Company Name"}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(application.status)} border font-semibold`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{application.job_post?.location || "Location not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span>{application.job_post?.employment_type || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>{application.job_post?.salary_range || "Not disclosed"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {application.job_post?.job_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {application.job_post.job_description}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/job/${application.job_post?.id}`)}
                            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          >
                            View Job Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MyApplications;
