import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Link as LinkIcon, 
  Users, 
  Calendar, 
  Plus, 
  Eye, 
  TrendingUp,
  LogOut,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import selectraLogo from "@/assets/selectra-logo.png";
import selectraBg from "@/assets/selectra-bg.jpg";

interface JobPost {
  id: string;
  job_title: string;
  created_at: string;
  status: string;
  application_count: number;
  interview_count: number;
}

interface Interview {
  id: string;
  scheduled_date: string;
  status: string;
  application: {
    candidate_name: string;
    job_post: {
      job_title: string;
    };
  };
}

const OrganizationDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState("");
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalApplications: 0,
    totalInterviews: 0
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue",
        variant: "destructive"
      });
      navigate("/organization-login");
      return;
    }

    await loadDashboardData(session.user.id);
  };

  const loadDashboardData = async (userId: string) => {
    try {
      // Get organization details
      const { data: orgData } = await supabase
        .from('organization_details')
        .select('organization_name')
        .eq('user_id', userId)
        .single();

      if (orgData) {
        setOrganizationName(orgData.organization_name);
      }

      // Get job posts with application counts
      const { data: posts } = await supabase
        .from('job_posts')
        .select(`
          id,
          job_title,
          created_at,
          status,
          applications (count)
        `)
        .eq('organization_id', userId)
        .order('created_at', { ascending: false });

      if (posts) {
        const jobPostsWithCounts = await Promise.all(
          posts.map(async (post) => {
            const { count: appCount } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_post_id', post.id);

            const { count: interviewCount } = await supabase
              .from('interviews')
              .select('*, applications!inner(*)', { count: 'exact', head: true })
              .eq('applications.job_post_id', post.id);

            return {
              id: post.id,
              job_title: post.job_title,
              created_at: post.created_at,
              status: post.status,
              application_count: appCount || 0,
              interview_count: interviewCount || 0
            };
          })
        );

        setJobPosts(jobPostsWithCounts);

        // Calculate stats
        const totalApps = jobPostsWithCounts.reduce((sum, post) => sum + post.application_count, 0);
        const totalInts = jobPostsWithCounts.reduce((sum, post) => sum + post.interview_count, 0);

        setStats({
          totalPosts: jobPostsWithCounts.length,
          totalApplications: totalApps,
          totalInterviews: totalInts
        });
      }

      // Get upcoming interviews
      const { data: upcoming } = await supabase
        .from('interviews')
        .select(`
          id,
          scheduled_date,
          status,
          applications (
            candidate_name,
            job_posts (job_title)
          )
        `)
        .gte('scheduled_date', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true })
        .limit(5);

      if (upcoming) {
        setUpcomingInterviews(upcoming as any);
      }

      // Get completed interviews
      const { data: completed } = await supabase
        .from('interviews')
        .select(`
          id,
          scheduled_date,
          status,
          applications (
            candidate_name,
            job_posts (job_title)
          )
        `)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(5);

      if (completed) {
        setCompletedInterviews(completed as any);
      }

    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${selectraBg})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div className="h-6 w-px bg-border mx-2" />
              <img src={selectraLogo} alt="SELECTRA" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SELECTRA Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate("/organization-landing")}
                className="bg-secondary hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Job Post
              </Button>
              <Button 
                variant="ghost"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <Card className="bg-white/95 backdrop-blur-sm mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">
                    Welcome, {organizationName || "Organization"}
                  </CardTitle>
                  <CardDescription>
                    Monitor your recruitment activities and track candidate progress
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Job Posts</p>
                    <p className="text-3xl font-bold text-primary">{stats.totalPosts}</p>
                  </div>
                  <LinkIcon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalApplications}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.totalInterviews}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Posts */}
          <Card className="bg-white/95 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Your Job Posts
              </CardTitle>
              <CardDescription>
                Track performance of your recruitment links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No job posts yet. Create your first one!</p>
                  <Button 
                    onClick={() => navigate("/organization-landing")}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job Post
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Interviews</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.job_title}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(post.status)}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-semibold">{post.application_count}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-600 font-semibold">{post.interview_count}</span>
                        </TableCell>
                        <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Interviews Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
                <CardDescription>Scheduled for future dates</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingInterviews.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No upcoming interviews</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingInterviews.map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{interview.application?.candidate_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {interview.application?.job_post?.job_title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(interview.scheduled_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Completed Interviews</CardTitle>
                <CardDescription>Recent completed assessments</CardDescription>
              </CardHeader>
              <CardContent>
                {completedInterviews.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No completed interviews</p>
                ) : (
                  <div className="space-y-4">
                    {completedInterviews.map((interview) => (
                      <div key={interview.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{interview.application?.candidate_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {interview.application?.job_post?.job_title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(interview.scheduled_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
