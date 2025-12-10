import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Briefcase, Loader2, Camera, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";

const CandidateProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: "",
    location: "",
    date_of_birth: "",
    current_position: "",
    current_company: "",
    total_experience: "",
    bio: "",
    skills: "",
    linkedin: "",
    github: "",
    portfolio_url: "",
  });

  const handleLogout = () => {
    logout();
    navigate("/candidate/login");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      setEditing(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Profile
              </span>
            </h1>
            <p className="text-muted-foreground">Manage your personal information and career details</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Picture Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      <AvatarImage src={profileImage} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white text-3xl">
                        {user?.username?.substring(0, 2).toUpperCase() || "CD"}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-8 w-8 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Click to upload new picture
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum size: 5MB
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="font-semibold">{user?.username || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold">{user?.email || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Account Type</p>
                      <p className="font-semibold capitalize">{user?.user_type || "Candidate"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-semibold">
                        {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Profile Form */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Details</CardTitle>
              {!editing && (
                <Button onClick={() => setEditing(true)} variant="outline">
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Last Name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Professional Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput
                      label="Current Position"
                      name="current_position"
                      value={formData.current_position}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Current Company"
                      name="current_company"
                      value={formData.current_company}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Total Experience"
                      name="total_experience"
                      placeholder="e.g., 3 years"
                      value={formData.total_experience}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="Skills (comma-separated)"
                      name="skills"
                      placeholder="e.g., React, Node.js, Python"
                      value={formData.skills}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Bio / Summary"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        multiline
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Social & Portfolio Links
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormInput
                      label="LinkedIn Profile"
                      name="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedin}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <FormInput
                      label="GitHub Profile"
                      name="github"
                      type="url"
                      placeholder="https://github.com/username"
                      value={formData.github}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Portfolio Website"
                        name="portfolio_url"
                        type="url"
                        placeholder="https://yourportfolio.com"
                        value={formData.portfolio_url}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-primary to-accent"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default CandidateProfile;
