import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";
import bgPattern from "@/assets/bg-pattern.jpg";

const OrgRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fileName, setFileName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Registration Successful!",
      description: "Your organization has been registered. Please login to continue.",
    });
    setTimeout(() => navigate("/org/login"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Register Your Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput label="Company Name" placeholder="Enter company name" />
              <FormInput label="Email" type="email" placeholder="company@example.com" />
              <FormInput label="Business Address" placeholder="Enter business address" />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Legal Document Upload
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    id="legal-doc"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  />
                  <label htmlFor="legal-doc" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {fileName || "Click to upload legal documents"}
                    </p>
                  </label>
                </div>
              </div>

              <FormInput label="Website URL" placeholder="https://company.com" />
              <FormInput label="Representative Name" placeholder="Full name" />
              <FormInput label="Contact Number" type="tel" placeholder="+1 234 567 8900" />
              <FormInput label="Password" type="password" placeholder="Enter password" />
              <FormInput label="Confirm Password" type="password" placeholder="Confirm password" />

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80">
                Register Organization
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default OrgRegister;
