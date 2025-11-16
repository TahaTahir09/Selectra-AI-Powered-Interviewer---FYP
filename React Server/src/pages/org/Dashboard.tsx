import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import bgPattern from "@/assets/bg-pattern.jpg";

const mockJobs = [
  { id: 1, title: "Senior Frontend Developer", applicants: 24, status: "Active" },
  { id: 2, title: "Product Manager", applicants: 18, status: "Active" },
  { id: 3, title: "UI/UX Designer", applicants: 31, status: "Active" },
];

const OrgDashboard = () => {
  const navigate = useNavigate();
  const orgName = localStorage.getItem("orgName") || "Organization";

  const handleLogout = () => {
    localStorage.removeItem("orgName");
    navigate("/org/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header userType="organization" userName={orgName} onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {orgName}
          </h1>
          <p className="text-muted-foreground">Manage your job postings and interview processes</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => navigate("/org/post-job")}
            className="h-24 text-lg bg-gradient-to-r from-primary to-primary/80"
          >
            <Briefcase className="mr-2 h-6 w-6" />
            Post New Job
          </Button>
          <Button variant="outline" className="h-24 text-lg">
            <FileText className="mr-2 h-6 w-6" />
            View All Job Posts
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {job.applicants} applicants
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      {job.status}
                    </span>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default OrgDashboard;
