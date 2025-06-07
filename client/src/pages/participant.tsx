import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Clock, Users } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTime, isQuizStarted, getTimeUntilStart } from "@/lib/utils";
import { usePolling } from "@/hooks/use-polling";

export default function ParticipantPage() {
  const { quizId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { data: quiz, isLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  // Enable polling for participant count updates
  usePolling([`/api/quizzes/${quizId}`], 3000, !!quizId);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/participants", data);
      return response.json();
    },
    onSuccess: (participant) => {
      setParticipantId(participant.id);
      toast({
        title: "Registration Successful!",
        description: "You have been registered for the quiz.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (quiz && !isQuizStarted(quiz)) {
      const timeUntilStart = getTimeUntilStart(quiz);
      setCountdown(timeUntilStart);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to quiz interface when countdown reaches 0
            if (participantId) {
              setLocation(`/quiz/${participantId}`);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, participantId, setLocation]);

  // Check if quiz has started manually
  useEffect(() => {
    if (quiz?.status === "active" && participantId) {
      setLocation(`/quiz/${participantId}`);
    }
  }, [quiz?.status, participantId, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quiz) return;

    if (quiz.status === "active") {
      toast({
        title: "Quiz Already Started",
        description: "You cannot join this quiz as it has already started.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      ...formData,
      quizId: parseInt(quizId!),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz details...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
            <p className="text-gray-600">The quiz you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!participantId ? (
          // Registration Form
          <Card className="animate-in fade-in-50 duration-500">
            <CardHeader className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl mb-2">Join Quiz</CardTitle>
              <p className="text-gray-600">Enter your details to participate</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Registering..." : "Register for Quiz"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          // Waiting Room
          <Card className="text-center animate-in fade-in-50 duration-500">
            <CardHeader>
              <div className="bg-secondary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 animate-pulse" />
              </div>
              <CardTitle className="text-3xl mb-2">Get Ready!</CardTitle>
              <p className="text-gray-600">Quiz starts in:</p>
            </CardHeader>
            <CardContent>
              {/* Countdown Timer */}
              <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl p-8 mb-8">
                <div className="text-6xl font-bold mb-2">
                  {formatTime(countdown)}
                </div>
                <div className="text-xl">Minutes : Seconds</div>
              </div>

              {/* Quiz Info */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">{quiz.title}</div>
                  <div className="text-sm text-gray-600">Quiz Title</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-secondary flex items-center justify-center">
                    <Users className="mr-2 h-6 w-6" />
                    {quiz.participantCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Participants Joined</div>
                </div>
              </div>

              <div className="text-sm text-gray-500 flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4" />
                You'll be automatically taken to the quiz when it starts
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
