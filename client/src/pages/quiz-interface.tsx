import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/utils";
import { usePolling } from "@/hooks/use-polling";

export default function QuizInterface() {
  const { participantId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const { data: participant } = useQuery({
    queryKey: [`/api/participants/${participantId}`],
    enabled: !!participantId,
  });

  const { data: quiz } = useQuery({
    queryKey: [`/api/quizzes/${participant?.quizId}`],
    enabled: !!participant?.quizId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: [`/api/quizzes/${participant?.quizId}/questions`],
    enabled: !!participant?.quizId,
  });

  // Enable polling for quiz status updates
  usePolling([`/api/quizzes/${participant?.quizId}`], 2000, !!participant?.quizId);

  const currentQuestion = questions.find(
    (q: any) => q.questionNumber === (quiz?.currentQuestion || 1)
  );

  const submitAnswerMutation = useMutation({
    mutationFn: async (answerData: any) => {
      const response = await apiRequest("POST", "/api/answers", answerData);
      return response.json();
    },
    onSuccess: () => {
      setSelectedAnswer("");
      setQuestionStartTime(Date.now());
      queryClient.invalidateQueries({ queryKey: [`/api/participants/${participantId}`] });
      
      // Check if quiz is completed
      if (quiz && questions.length > 0 && quiz.currentQuestion >= questions.length) {
        setLocation(`/results/${participantId}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit answer",
        variant: "destructive",
      });
    },
  });

  // Question timer
  useEffect(() => {
    if (!currentQuestion) return;

    const timeLimit = currentQuestion.timeLimit || quiz?.defaultTimePerQuestion || 30;
    setTimeRemaining(timeLimit);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit with no answer
          handleSubmitAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, quiz]);

  // Check if quiz has ended
  useEffect(() => {
    if (quiz?.status === "completed") {
      setLocation(`/results/${participantId}`);
    }
  }, [quiz?.status, participantId, setLocation]);

  const handleSubmitAnswer = (autoSubmit = false) => {
    if (!currentQuestion || !participant) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const answer = autoSubmit ? "" : selectedAnswer;
    
    let isCorrect = false;
    if (currentQuestion.type === "MCQ") {
      isCorrect = answer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === "TrueFalse") {
      isCorrect = answer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === "Fill") {
      isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    }

    submitAnswerMutation.mutate({
      participantId: participant.id,
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      timeSpent,
    });
  };

  if (!participant || !quiz || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((quiz.currentQuestion - 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {quiz.currentQuestion} of {questions.length}
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Time: <span className="font-bold text-red-500 ml-1">{timeRemaining}s</span>
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6 animate-in fade-in-50 duration-500">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {currentQuestion.question}
              </h2>
              <div className="flex items-center text-sm text-gray-600">
                <Star className="text-yellow-500 mr-1 h-4 w-4" />
                <span>{currentQuestion.marks} marks</span>
              </div>
            </div>

            {/* Answer Input Based on Question Type */}
            <div className="space-y-4">
              {currentQuestion.type === "MCQ" && (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                  {(currentQuestion.options as string[])?.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "TrueFalse" && (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                  <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === "Fill" && (
                <Input
                  placeholder="Enter your answer..."
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="text-lg p-4"
                />
              )}
            </div>

            <Button
              onClick={() => handleSubmitAnswer()}
              disabled={!selectedAnswer || submitAnswerMutation.isPending}
              className="mt-6 w-full"
            >
              {submitAnswerMutation.isPending ? "Submitting..." : "Submit Answer"}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{participant.score}</div>
                <div className="text-xs text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">{participant.accuracy}%</div>
                <div className="text-xs text-gray-600">Accuracy</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">{participant.rank || "-"}</div>
                <div className="text-xs text-gray-600">Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
