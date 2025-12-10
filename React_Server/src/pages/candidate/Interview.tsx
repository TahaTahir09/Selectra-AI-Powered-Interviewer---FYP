import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { interviewAPI } from "@/services/api";
import aiAvatar from "@/assets/ai-avatar.jpg";

const Interview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<any>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "AI", text: "Hello! Welcome to your AI interview. Let's begin. Tell me about yourself." },
  ]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) return;
      
      try {
        const interviewData = await interviewAPI.get(parseInt(id));
        setInterview(interviewData);
        
        // If interview has existing conversation data, load it
        if (interviewData.conversation_log) {
          try {
            const parsedMessages = JSON.parse(interviewData.conversation_log);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
              setMessages(parsedMessages);
            }
          } catch (e) {
            console.error('Failed to parse conversation log:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch interview:', error);
        toast({
          title: "Error",
          description: "Failed to load interview details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, toast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndInterview = async () => {
    try {
      // Update interview status to completed
      await interviewAPI.updateStatus(parseInt(id!), 'completed');
      
      toast({
        title: "Interview Ended",
        description: "Your responses have been submitted for evaluation.",
      });
      setTimeout(() => navigate(`/interview/result/${id}`), 1500);
    } catch (error) {
      console.error('Failed to end interview:', error);
      toast({
        title: "Error",
        description: "Failed to submit interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Interview Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The interview you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/candidate/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000')",
      }}
    >
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 py-4 px-6">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-xl font-bold">AI Interview in Progress</h2>
          <div className="text-2xl font-mono">{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="mb-8">
          <img
            src={aiAvatar}
            alt="AI Avatar"
            className="w-48 h-48 rounded-full border-4 border-accent shadow-2xl object-cover"
          />
        </div>

        <Card className="w-full max-w-3xl bg-card/90 backdrop-blur-sm flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-lg ${
                    msg.sender === "You"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1">{msg.sender}</p>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="bg-accent/50 p-4 rounded-lg mb-3 text-center">
              <p className="text-sm text-muted-foreground">
                🎤 Voice Interview Mode Active - Speak your responses
              </p>
            </div>
            <Button
              onClick={handleEndInterview}
              variant="destructive"
              className="w-full"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              End Interview
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Interview;
