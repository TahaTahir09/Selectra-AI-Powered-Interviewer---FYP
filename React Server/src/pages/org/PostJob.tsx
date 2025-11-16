import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";
import Modal from "@/components/Modal";
import bgPattern from "@/assets/bg-pattern.jpg";

const PostJob = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [interviewLink, setInterviewLink] = useState("");
  const [copied, setCopied] = useState(false);
  const orgName = localStorage.getItem("orgName") || "Organization";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomId = Math.random().toString(36).substr(2, 9);
    const link = `${window.location.origin}/interview/${randomId}`;
    setInterviewLink(link);
    setShowModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(interviewLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Interview link has been copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <Header userType="organization" userName={orgName} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Post a New Job & Generate AI Interview Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput label="Job Title" placeholder="e.g., Senior Full Stack Developer" required />
              <FormInput
                label="Job Description"
                placeholder="Describe the role and responsibilities"
                multiline
                required
              />
              <FormInput label="Required Skills" placeholder="e.g., React, Node.js, TypeScript" required />
              <FormInput label="Experience Required" placeholder="e.g., 3-5 years" required />
              <FormInput label="Qualifications" placeholder="e.g., Bachelor's in Computer Science" required />
              <FormInput
                label="Key Responsibilities"
                placeholder="List main responsibilities"
                multiline
                required
              />
              <FormInput label="Employment Type" placeholder="e.g., Full-time, Remote" required />
              <FormInput label="Location" placeholder="e.g., San Francisco, CA or Remote" required />

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent">
                Generate AI Interview Link
              </Button>
            </form>
          </CardContent>
        </Card>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Interview Link Generated">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with candidates to start their AI interview:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={interviewLink}
                readOnly
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={() => setShowModal(false)} className="w-full bg-gradient-to-r from-primary to-accent">
              Done
            </Button>
          </div>
        </Modal>
      </main>

      <Footer />
    </div>
  );
};

export default PostJob;
