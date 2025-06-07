import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuizCreatorProps {
  onQuizCreated: (quizId: number) => void;
}

export default function QuizCreator({ onQuizCreated }: QuizCreatorProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    duration: 30,
    startDate: "",
    startTime: "",
    timerType: "same" as "same" | "different",
    defaultTimePerQuestion: 30,
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quizzes", data);
      return response.json();
    },
    onSuccess: (quiz) => {
      toast({
        title: "Quiz Created!",
        description: "Your quiz has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      onQuizCreated(quiz.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuizMutation.mutate({
      ...formData,
      status: "draft",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              placeholder="Enter quiz title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="duration">Total Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              required
              className="mt-2"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Timer Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">Question Timer Settings</Label>
        <RadioGroup
          value={formData.timerType}
          onValueChange={(value: "same" | "different") => setFormData({ ...formData, timerType: value })}
          className="flex flex-wrap gap-4 mb-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="same" id="same" />
            <Label htmlFor="same" className="text-sm">Same for all questions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="different" id="different" />
            <Label htmlFor="different" className="text-sm">Different for each question</Label>
          </div>
        </RadioGroup>
        
        {formData.timerType === "same" && (
          <div>
            <Input
              type="number"
              placeholder="Time per question (seconds)"
              min="10"
              value={formData.defaultTimePerQuestion}
              onChange={(e) => setFormData({ ...formData, defaultTimePerQuestion: parseInt(e.target.value) || 30 })}
              className="w-64"
            />
          </div>
        )}
      </div>
      
      <Button
        type="submit"
        disabled={createQuizMutation.isPending}
        className="bg-primary text-white hover:bg-blue-600"
      >
        {createQuizMutation.isPending ? "Creating..." : "Continue to Questions →"}
      </Button>
    </form>
  );
}
