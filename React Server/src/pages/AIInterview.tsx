import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Camera, CameraOff, Volume2 } from "lucide-react";
import aiAvatar from "@/assets/ai-avatar.png";
import selectraLogo from "@/assets/selectra-logo.png";
import selectraBg from "@/assets/selectra-bg.jpg";

const AIInterview = () => {
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes in seconds
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const { toast } = useToast();

  const questions = [
    "Hello! Welcome to your SELECTRA AI interview. Please introduce yourself and tell me about your background.",
    "Can you describe a challenging project you've worked on and how you overcame the obstacles?",
    "What motivates you in your professional career, and what are your long-term goals?",
    "How do you handle working under pressure and tight deadlines?",
    "Tell me about a time when you had to work with a difficult team member.",
    "Where do you see yourself in 5 years, and how does this role fit into your career plans?"
  ];

  // Timer logic
  useEffect(() => {
    if (interviewStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleInterviewEnd();
    }
  }, [timeLeft, interviewStarted]);

  // AI speaking simulation
  useEffect(() => {
    if (interviewStarted && currentQuestion < questions.length) {
      setIsAISpeaking(true);
      const speakingDuration = 3000 + Math.random() * 2000; // 3-5 seconds
      setTimeout(() => setIsAISpeaking(false), speakingDuration);
    }
  }, [currentQuestion, interviewStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setIsRecording(true);
    toast({
      title: "Interview Started",
      description: "Your AI interview has begun. Good luck!",
    });
  };

  const handleInterviewEnd = () => {
    setInterviewStarted(false);
    setIsRecording(false);
    toast({
      title: "Interview Completed",
      description: "Thank you for completing your interview. Results will be sent to the organization.",
    });
    // Redirect to completion page
    setTimeout(() => {
      window.location.href = "/interview-complete";
    }, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleInterviewEnd();
    }
  };

  const progressPercentage = ((40 * 60 - timeLeft) / (40 * 60)) * 100;

  if (!interviewStarted) {
    return (
      <div 
        className="min-h-screen relative flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(213, 238, 255, 0.8), rgba(255, 248, 220, 0.8)), url(${selectraBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <img src={selectraLogo} alt="SELECTRA" className="h-16 w-16" />
        </div>
        <Card className="max-w-md mx-auto shadow-[var(--shadow-selectra)] bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <img src={aiAvatar} alt="AI Interviewer" className="w-32 h-18 mx-auto mb-6 rounded-lg" />
            <h2 className="text-2xl font-bold mb-4">Ready for Your AI Interview?</h2>
            <p className="text-muted-foreground mb-6">
              Your 40-minute interview is about to begin. Make sure you're in a quiet environment with good lighting.
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span>Camera:</span>
                <span className="text-green-600">✓ Ready</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Microphone:</span>
                <span className="text-green-600">✓ Ready</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Duration:</span>
                <span>40 minutes</span>
              </div>
            </div>
            <Button variant="selectra" onClick={startInterview} size="lg" className="w-full">
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `linear-gradient(rgba(213, 238, 255, 0.8), rgba(255, 248, 220, 0.8)), url(${selectraBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={selectraLogo} alt="SELECTRA" className="h-10 w-10" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-selectra-blue to-selectra-yellow bg-clip-text text-transparent">
              SELECTRA
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-lg font-mono font-bold text-selectra-blue">
              {formatTime(timeLeft)}
            </div>
            <div className="w-24">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* AI Interviewer */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="relative mb-6">
                    <img 
                      src={aiAvatar} 
                      alt="AI Interviewer" 
                      className={`w-48 h-27 rounded-lg transition-all duration-300 ${
                        isAISpeaking ? 'scale-105 shadow-[var(--shadow-glow)]' : ''
                      }`} 
                    />
                    {isAISpeaking && (
                      <div className="absolute -top-2 -right-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-selectra-blue rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-selectra-blue rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-selectra-blue rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center max-w-lg">
                    <h3 className="text-xl font-semibold mb-4 text-selectra-blue">AI Interviewer</h3>
                    <div className="bg-muted/50 p-4 rounded-lg mb-6">
                      <p className="text-foreground">
                        {questions[currentQuestion]}
                      </p>
                    </div>
                    
                    {!isAISpeaking && (
                      <Button 
                        variant="selectra-outline" 
                        onClick={nextQuestion}
                        className="mt-4"
                      >
                        {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Interview"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls Panel */}
            <div className="space-y-6">
              {/* Camera Preview */}
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Your Camera</h4>
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                    {isCameraOn ? (
                      <div className="text-white text-sm">Camera Feed</div>
                    ) : (
                      <CameraOff className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex justify-center mt-3">
                    <Button
                      variant={isCameraOn ? "default" : "destructive"}
                      size="sm"
                      onClick={() => setIsCameraOn(!isCameraOn)}
                    >
                      {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Controls */}
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Audio Controls</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Microphone</span>
                      <Button
                        variant={isRecording ? "default" : "destructive"}
                        size="sm"
                        onClick={() => setIsRecording(!isRecording)}
                      >
                        {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Speaker</span>
                      <Button variant="outline" size="sm">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interview Progress */}
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Interview Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Question {currentQuestion + 1} of {questions.length}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={(currentQuestion / questions.length) * 100} />
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Controls */}
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleInterviewEnd}
                  >
                    End Interview
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIInterview;