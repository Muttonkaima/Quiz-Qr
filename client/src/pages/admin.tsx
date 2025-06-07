import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Gamepad2, Trophy } from "lucide-react";
import QuizCreator from "@/components/quiz-creator";
import QuestionBuilder from "@/components/question-builder";
import AdminControls from "@/components/admin-controls";
import Leaderboard from "@/components/leaderboard";
import QRModal from "@/components/qr-modal";
import { useQuery } from "@tanstack/react-query";
import { usePolling } from "@/hooks/use-polling";

export default function AdminPage() {
  const [currentStep, setCurrentStep] = useState<"create" | "questions" | "controls">("create");
  const [currentQuizId, setCurrentQuizId] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const { data: quizzes = [] } = useQuery({
    queryKey: ["/api/quizzes"],
  });

  const { data: currentQuiz } = useQuery({
    queryKey: [`/api/quizzes/${currentQuizId}`],
    enabled: !!currentQuizId,
  });

  // Enable polling for real-time updates when quiz is active
  usePolling(
    [`/api/quizzes/${currentQuizId}`, `/api/quizzes/${currentQuizId}/leaderboard`],
    2000,
    currentQuiz?.status === "active" || currentQuiz?.status === "waiting"
  );

  const handleQuizCreated = (quizId: number) => {
    setCurrentQuizId(quizId);
    setCurrentStep("questions");
  };

  const handleQuestionsComplete = () => {
    setCurrentStep("controls");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">QuizMaster Pro</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep("create")}
                className="text-gray-600 hover:text-primary"
              >
                Admin
              </Button>
              <Button
                onClick={() => setShowQRModal(true)}
                disabled={!currentQuizId}
                className="bg-primary text-white hover:bg-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                QR Code
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Creation Section */}
        {currentStep === "create" && (
          <Card className="mb-8 animate-in fade-in-50 duration-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-2xl">
                  <Plus className="text-primary mr-3" />
                  Create New Quiz
                </CardTitle>
                <Badge variant="secondary">Step 1 of 3</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <QuizCreator onQuizCreated={handleQuizCreated} />
            </CardContent>
          </Card>
        )}

        {/* Question Builder Section */}
        {currentStep === "questions" && currentQuizId && (
          <Card className="mb-8 animate-in fade-in-50 duration-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-2xl">
                  <Plus className="text-secondary mr-3" />
                  Question Builder
                </CardTitle>
                <Badge variant="secondary">Step 2 of 3</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <QuestionBuilder 
                quizId={currentQuizId}
                onComplete={handleQuestionsComplete}
              />
            </CardContent>
          </Card>
        )}

        {/* Admin Control Panel */}
        {currentStep === "controls" && currentQuizId && (
          <>
            <Card className="mb-8 animate-in fade-in-50 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Gamepad2 className="text-accent mr-3" />
                  Quiz Control Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminControls quizId={currentQuizId} />
              </CardContent>
            </Card>

            {/* Real-time Leaderboard */}
            <Card className="animate-in fade-in-50 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Trophy className="text-accent mr-3" />
                  Live Leaderboard
                  <Badge variant="outline" className="ml-auto animate-pulse">
                    LIVE
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard quizId={currentQuizId} />
              </CardContent>
            </Card>
          </>
        )}

        {/* Quiz List for existing quizzes */}
        {currentStep === "create" && quizzes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Existing Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizzes.map((quiz: any) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setCurrentQuizId(quiz.id);
                      setCurrentStep("controls");
                    }}
                  >
                    <div>
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-gray-600">
                        {quiz.startDate} at {quiz.startTime}
                      </p>
                    </div>
                    <Badge variant={quiz.status === "active" ? "default" : "secondary"}>
                      {quiz.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && currentQuizId && (
        <QRModal
          quizId={currentQuizId}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
