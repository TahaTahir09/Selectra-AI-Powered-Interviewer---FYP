import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import aiAvatar from "@/assets/ai-avatar.jpg";

const Interview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "AI", text: "Hello! Welcome to your AI interview. Let's begin. Tell me about yourself." },
  ]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

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

  const simulateListening = () => {
    // Simulate AI listening and responding (mock voice interaction)
    setTimeout(() => {
      const responses = [
        "That's interesting! Can you tell me more about your experience with that?",
        "Great! How would you handle a challenging situation in that role?",
        "Excellent. What are your key strengths that make you suitable for this position?",
        "Can you describe a project where you demonstrated leadership?",
        "What motivates you in your professional career?",
      ];
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: responses[Math.floor(Math.random() * responses.length)] },
      ]);
    }, 3000);
  };

  const handleEndInterview = () => {
    toast({
      title: "Interview Ended",
      description: "Your responses have been submitted for evaluation.",
    });
    setTimeout(() => navigate(`/interview/result/${id}`), 1500);
  };

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
