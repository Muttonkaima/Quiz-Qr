import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, SkipForward, Square, Trophy } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminControlsProps {
  quizId: number;
}

export default function AdminControls({ quizId }: AdminControlsProps) {
  const { toast } = useToast();

  const { data: quiz } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/start`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Started!",
        description: "The quiz has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start quiz",
        variant: "destructive",
      });
    },
  });

  const nextQuestionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/next`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Next Question",
        description: "Moved to the next question.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to move to next question",
        variant: "destructive",
      });
    },
  });

  const endQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/end`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Ended",
        description: "The quiz has been completed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end quiz",
        variant: "destructive",
      });
    },
  });

  if (!quiz) return null;

  return (
    <div className="space-y-6">
      {/* Control Buttons */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => startQuizMutation.mutate()}
          disabled={quiz.status === "active" || quiz.status === "completed" || startQuizMutation.isPending}
          className="bg-secondary text-white hover:bg-green-600 h-16 flex flex-col items-center justify-center"
        >
          <Play className="h-5 w-5 mb-1" />
          <span>{startQuizMutation.isPending ? "Starting..." : "Start Quiz"}</span>
        </Button>
        
        <Button
          onClick={() => nextQuestionMutation.mutate()}
          disabled={quiz.status !== "active" || nextQuestionMutation.isPending}
          className="bg-primary text-white hover:bg-blue-600 h-16 flex flex-col items-center justify-center"
        >
          <SkipForward className="h-5 w-5 mb-1" />
          <span>{nextQuestionMutation.isPending ? "Moving..." : "Next Question"}</span>
        </Button>
        
        <Button
          onClick={() => endQuizMutation.mutate()}
          disabled={quiz.status !== "active" && quiz.status !== "waiting" || endQuizMutation.isPending}
          variant="destructive"
          className="h-16 flex flex-col items-center justify-center"
        >
          <Square className="h-5 w-5 mb-1" />
          <span>{endQuizMutation.isPending ? "Ending..." : "End Quiz"}</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center"
        >
          <Trophy className="h-5 w-5 mb-1" />
          <span>Leaderboard</span>
        </Button>
      </div>

      {/* Quiz Status Display */}
      <Card>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {quiz.participantCount || 0}
              </div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">
                {quiz.currentQuestion || 0} / {quiz.questions?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Current Question</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 capitalize">
                {quiz.status}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
