import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestionBuilderProps {
  quizId: number;
  onComplete: () => void;
}

interface QuestionData {
  type: "MCQ" | "Fill" | "TrueFalse";
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  timeLimit?: number;
}

export default function QuestionBuilder({ quizId, onComplete }: QuestionBuilderProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
    type: "MCQ",
    question: "",
    options: ["", ""],
    correctAnswer: "",
    marks: 10,
  });

  const { data: quiz } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/questions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Added!",
        description: "Question has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add question",
        variant: "destructive",
      });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const promises = questions.map((q, index) =>
        createQuestionMutation.mutateAsync({
          quizId,
          questionNumber: index + 1,
          type: q.type,
          question: q.question,
          options: q.type === "MCQ" ? q.options : null,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          timeLimit: quiz?.timerType === "different" ? q.timeLimit : null,
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Questions Saved!",
        description: "All questions have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save questions",
        variant: "destructive",
      });
    },
  });

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) {
      toast({
        title: "Incomplete Question",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestion.type === "MCQ" && currentQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Incomplete Options",
        description: "Please fill in all answer options.",
        variant: "destructive",
      });
      return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      type: "MCQ",
      question: "",
      options: ["", ""],
      correctAnswer: "",
      marks: 10,
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ""],
    });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      setCurrentQuestion({
        ...currentQuestion,
        options: newOptions,
        correctAnswer: newOptions.includes(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : "",
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Question Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Question Type</Label>
              <Select
                value={currentQuestion.type}
                onValueChange={(value: "MCQ" | "Fill" | "TrueFalse") =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    type: value,
                    options: value === "MCQ" ? ["", ""] : [],
                    correctAnswer: "",
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">Multiple Choice</SelectItem>
                  <SelectItem value="Fill">Fill in the Blanks</SelectItem>
                  <SelectItem value="TrueFalse">True/False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Marks</Label>
              <Input
                type="number"
                min="1"
                value={currentQuestion.marks}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  marks: parseInt(e.target.value) || 10,
                })}
                className="mt-2"
              />
            </div>
          </div>

          {quiz?.timerType === "different" && (
            <div>
              <Label>Time Limit (seconds)</Label>
              <Input
                type="number"
                min="10"
                placeholder={quiz.defaultTimePerQuestion?.toString() || "30"}
                value={currentQuestion.timeLimit || ""}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  timeLimit: parseInt(e.target.value) || undefined,
                })}
                className="mt-2 w-48"
              />
            </div>
          )}
          
          <div>
            <Label>Question</Label>
            <Textarea
              placeholder="Enter your question..."
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({
                ...currentQuestion,
                question: e.target.value,
              })}
              className="mt-2"
              rows={3}
            />
          </div>
          
          {/* Answer Options Based on Type */}
          {currentQuestion.type === "MCQ" && (
            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2 mt-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={currentQuestion.correctAnswer === option}
                      onChange={() => setCurrentQuestion({
                        ...currentQuestion,
                        correctAnswer: option,
                      })}
                      className="text-primary"
                    />
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1"
                    />
                    {currentQuestion.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                  className="text-primary"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {currentQuestion.type === "TrueFalse" && (
            <div>
              <Label>Correct Answer</Label>
              <RadioGroup
                value={currentQuestion.correctAnswer}
                onValueChange={(value) => setCurrentQuestion({
                  ...currentQuestion,
                  correctAnswer: value,
                })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false">False</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {currentQuestion.type === "Fill" && (
            <div>
              <Label>Correct Answer</Label>
              <Input
                placeholder="Enter the correct answer..."
                value={currentQuestion.correctAnswer}
                onChange={(e) => setCurrentQuestion({
                  ...currentQuestion,
                  correctAnswer: e.target.value,
                })}
                className="mt-2"
              />
            </div>
          )}
          
          <Button
            type="button"
            onClick={addQuestion}
            className="bg-secondary text-white hover:bg-green-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Added Questions ({questions.length})</h3>
          {questions.map((question, index) => (
            <Card key={index} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Question {index + 1}</span>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">{question.type}</span>
                      <span className="text-sm text-gray-600">{question.marks} marks</span>
                    </div>
                    <p className="text-gray-700 mb-2">{question.question}</p>
                    {question.type === "MCQ" && (
                      <div className="text-sm text-gray-600">
                        Options: {question.options.join(", ")}
                        <br />
                        Correct: {question.correctAnswer}
                      </div>
                    )}
                    {question.type !== "MCQ" && (
                      <div className="text-sm text-gray-600">
                        Correct Answer: {question.correctAnswer}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Button */}
      {questions.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => finalizeMutation.mutate()}
            disabled={finalizeMutation.isPending}
            className="bg-primary text-white hover:bg-blue-600"
          >
            {finalizeMutation.isPending ? "Saving..." : "Complete Quiz Setup →"}
          </Button>
        </div>
      )}
    </div>
  );
}
