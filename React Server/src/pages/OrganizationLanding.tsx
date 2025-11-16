import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, FileText, Link as LinkIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import selectraLogo from "@/assets/selectra-logo.png";
import selectraBg from "@/assets/selectra-bg.jpg";

interface OrganizationFormData {
  organizationName: string;
  legalDocument: string;
  websiteLink: string;
  companyDescription: string;
  address: string;
  contactNumber: string;
  contactPerson: string;
  jobTitle: string;
  jobDescription: string;
  skills: string;
  experience: string;
  qualification: string;
  responsibilities: string;
  employmentType: string;
  location: string;
}

const OrganizationLanding = () => {
  const [step, setStep] = useState(1);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [preAssessmentQuestions, setPreAssessmentQuestions] = useState<string[]>([""]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<OrganizationFormData>({
    defaultValues: {
      organizationName: "",
      legalDocument: "",
      websiteLink: "",
      companyDescription: "",
      address: "",
      contactNumber: "",
      contactPerson: "",
      jobTitle: "",
      jobDescription: "",
      skills: "",
      experience: "",
      qualification: "",
      responsibilities: "",
      employmentType: "",
      location: ""
    }
  });

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  const checkAuth = async () => {
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

    setUserId(session.user.id);

    // Check if organization details exist
    const { data: orgDetails } = await supabase
      .from('organization_details')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (orgDetails) {
      // Already registered, skip to step 2
      form.setValue('organizationName', orgDetails.organization_name);
      form.setValue('legalDocument', orgDetails.legal_document_url || "");
      form.setValue('websiteLink', orgDetails.website_link || "");
      form.setValue('companyDescription', orgDetails.company_description || "");
      form.setValue('address', orgDetails.address);
      form.setValue('contactNumber', orgDetails.contact_number);
      form.setValue('contactPerson', orgDetails.contact_person);
      setStep(2);
    }
  };

  const onSubmitOrgInfo = async (data: OrganizationFormData) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organization_details')
        .upsert({
          user_id: userId,
          organization_name: data.organizationName,
          legal_document_url: data.legalDocument,
          website_link: data.websiteLink,
          company_description: data.companyDescription,
          address: data.address,
          contact_number: data.contactNumber,
          contact_person: data.contactPerson
        });

      if (error) throw error;

      setStep(2);
      toast({
        title: "Organization information saved",
        description: "Now please provide the job details"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextToQuestions = () => {
    setStep(3);
  };

  const addQuestion = () => {
    if (preAssessmentQuestions.length < 5) {
      setPreAssessmentQuestions([...preAssessmentQuestions, ""]);
    }
  };

  const removeQuestion = (index: number) => {
    setPreAssessmentQuestions(preAssessmentQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, value: string) => {
    const updated = [...preAssessmentQuestions];
    updated[index] = value;
    setPreAssessmentQuestions(updated);
  };

  const onSubmitPreAssessment = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const data = form.getValues();
      const skillsArray = data.skills.split(',').map(s => s.trim()).filter(Boolean);
      const validQuestions = preAssessmentQuestions.filter(q => q.trim() !== "");
      
      const { data: jobPost, error } = await supabase
        .from('job_posts')
        .insert({
          organization_id: userId,
          job_title: data.jobTitle,
          job_description: data.jobDescription,
          required_skills: skillsArray,
          experience_required: data.experience,
          qualification: data.qualification,
          responsibilities: data.responsibilities,
          employment_type: data.employmentType,
          location: data.location,
          pre_assessment_questions: validQuestions,
          application_link: `${window.location.origin}/cv-upload?job=pending`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/cv-upload?job=${jobPost.id}`;
      setGeneratedLink(link);
      
      // Update the application link
      await supabase
        .from('job_posts')
        .update({ application_link: link })
        .eq('id', jobPost.id);

      setStep(4);
      toast({
        title: "Job posted successfully!",
        description: "Your recruitment link is ready to share"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                Back to Home
              </Button>
              <div className="h-6 w-px bg-border mx-2" />
              <img src={selectraLogo} alt="SELECTRA" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SELECTRA - Organization
              </h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Step 1: Organization Information */}
            {step === 1 && (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Organization Registration</CardTitle>
                  <CardDescription>
                    Please provide your organization details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitOrgInfo)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="organizationName"
                        rules={{ required: "Organization name is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your organization name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="legalDocument"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Document URL</FormLabel>
                            <FormControl>
                              <Input placeholder="Link to your company's legal document" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="websiteLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.yourcompany.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="companyDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description about your company, what you do, your mission, etc."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        rules={{ required: "Address is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Address *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter your complete business address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactNumber"
                        rules={{ required: "Contact number is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactPerson"
                        rules={{ required: "Contact person is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person *</FormLabel>
                            <FormControl>
                              <Input placeholder="Name of the person representing the organization" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue to Job Details
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Job Description */}
            {step === 2 && (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Job Posting Details</CardTitle>
                  <CardDescription>
                    Provide detailed information about the position
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        rules={{ required: "Job title is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Senior Software Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="jobDescription"
                        rules={{ required: "Job description is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed job description"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="skills"
                        rules={{ required: "Required skills are required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Skills * (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., React, TypeScript, Node.js" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience Required</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 3-5 years" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="qualification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualification</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Bachelor's in Computer Science" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="responsibilities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Responsibilities</FormLabel>
                            <FormControl>
                              <Textarea placeholder="List key job responsibilities" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="employmentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employment Type</FormLabel>
                              <FormControl>
                                <Input placeholder="Full-time, Part-time, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="City, State" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          className="flex-1"
                          onClick={() => {
                            const data = form.getValues();
                            if (!data.jobTitle || !data.jobDescription || !data.skills) {
                              toast({
                                title: "Required fields missing",
                                description: "Please fill in all required fields",
                                variant: "destructive"
                              });
                              return;
                            }
                            handleNextToQuestions();
                          }}
                        >
                          Continue to Pre-Assessment Questions (Optional)
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Pre-Assessment Questions */}
            {step === 3 && (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Pre-Assessment Questions</CardTitle>
                  <CardDescription>
                    Add up to 5 questions for candidates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preAssessmentQuestions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Question ${index + 1}`}
                          value={question}
                          onChange={(e) => updateQuestion(index, e.target.value)}
                        />
                      </div>
                      {preAssessmentQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}

                  {preAssessmentQuestions.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addQuestion}
                      className="w-full"
                    >
                      + Add Question
                    </Button>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={onSubmitPreAssessment} 
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Job & Generate Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Link Generated */}
            {step === 4 && (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <LinkIcon className="h-12 w-12 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl">Job Posted Successfully!</CardTitle>
                  <CardDescription>
                    Your recruitment link is ready to share
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Your Recruitment Link:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input value={generatedLink} readOnly className="bg-background" />
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          toast({ title: "Link copied!" });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Share this link with potential candidates to apply and complete the AI interview.
                    </p>
                    
                    <Button 
                      onClick={() => navigate("/organization-dashboard")}
                      className="w-full"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationLanding;
