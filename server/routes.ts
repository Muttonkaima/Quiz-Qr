import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizSchema, insertQuestionSchema, insertParticipantSchema, insertAnswerSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Quiz routes
  app.post("/api/quizzes", async (req, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      res.status(400).json({ message: "Invalid quiz data", error });
    }
  });

  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes", error });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuizWithQuestions(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz", error });
    }
  });

  app.patch("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const quiz = await storage.updateQuiz(id, updates);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz", error });
    }
  });

  // Question routes
  app.post("/api/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data", error });
    }
  });

  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const questions = await storage.getQuizQuestions(quizId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions", error });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question", error });
    }
  });

  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const question = await storage.updateQuestion(id, updates);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question", error });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteQuestion(id);
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question", error });
    }
  });

  // Participant routes
  app.post("/api/participants", async (req, res) => {
    try {
      const participantData = insertParticipantSchema.parse(req.body);
      
      // Check if email already exists for this quiz
      const existingParticipant = await storage.getParticipantByEmail(
        participantData.quizId, 
        participantData.email
      );
      
      if (existingParticipant) {
        return res.status(409).json({ message: "Participant already registered" });
      }

      const participant = await storage.createParticipant(participantData);
      
      // Update quiz status to "waiting" if it's still in draft
      const quiz = await storage.getQuiz(participantData.quizId);
      if (quiz && quiz.status === "draft") {
        await storage.updateQuiz(participantData.quizId, { status: "waiting" });
      }
      
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Invalid participant data", error });
    }
  });

  app.get("/api/quizzes/:quizId/participants", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const participants = await storage.getQuizParticipants(quizId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch participants", error });
    }
  });

  app.get("/api/participants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const participant = await storage.getParticipantWithAnswers(id);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch participant", error });
    }
  });

  app.patch("/api/participants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const participant = await storage.updateParticipant(id, updates);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ message: "Failed to update participant", error });
    }
  });

  // Answer routes
  app.post("/api/answers", async (req, res) => {
    try {
      const answerData = insertAnswerSchema.parse(req.body);
      const answer = await storage.createAnswer(answerData);
      
      // Update participant stats
      const participant = await storage.getParticipant(answerData.participantId);
      if (participant) {
        const answers = await storage.getParticipantAnswers(answerData.participantId);
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const totalAnswers = answers.length;
        const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
        const avgResponseTime = totalAnswers > 0 ? 
          Math.round(answers.reduce((sum, a) => sum + a.timeSpent, 0) / totalAnswers) : 0;
        
        // Calculate score based on time taken and correctness
        const questions = await storage.getQuizQuestions(participant.quizId);
        const currentQuiz = await storage.getQuiz(participant.quizId);
        const score = answers.reduce((sum, ans) => {
          if (ans.isCorrect) {
            const question = questions.find(q => q.id === ans.questionId);
            if (question) {
              const maxTime = question.timeLimit || currentQuiz?.defaultTimePerQuestion || 30;
              const timeBonus = Math.max(0, 1 - (ans.timeSpent / maxTime));
              const scoreForQuestion = Math.round(question.marks * timeBonus);
              return sum + scoreForQuestion;
            }
          }
          return sum;
        }, 0);

        await storage.updateParticipant(answerData.participantId, {
          score,
          accuracy,
          averageResponseTime: avgResponseTime,
          currentQuestion: (participant.currentQuestion || 0) + 1
        });
      }
      
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Invalid answer data", error });
    }
  });

  app.get("/api/participants/:participantId/answers", async (req, res) => {
    try {
      const participantId = parseInt(req.params.participantId);
      const answers = await storage.getParticipantAnswers(participantId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch answers", error });
    }
  });

  // Leaderboard route
  app.get("/api/quizzes/:quizId/leaderboard", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const leaderboard = await storage.getLeaderboard(quizId);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard", error });
    }
  });

  // Quiz control routes
  app.post("/api/quizzes/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.updateQuiz(id, { 
        status: "active",
        currentQuestion: 1 
      });
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to start quiz", error });
    }
  });

  app.post("/api/quizzes/:id/next", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuiz(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const questions = await storage.getQuizQuestions(id);
      const nextQuestion = Math.min((quiz.currentQuestion || 0) + 1, questions.length);
      
      const updatedQuiz = await storage.updateQuiz(id, { 
        currentQuestion: nextQuestion 
      });
      res.json(updatedQuiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to move to next question", error });
    }
  });

  app.post("/api/quizzes/:id/end", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.updateQuiz(id, { status: "completed" });
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to end quiz", error });
    }
  });

  // QR Code generation route
  app.get("/api/quizzes/:id/qr", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuiz(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
      const participantUrl = `https://${baseUrl}/participant/${id}`;
      
      // Generate actual QR code
      const qrCodeDataURL = await QRCode.toDataURL(participantUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      res.json({ 
        url: participantUrl,
        qrData: participantUrl,
        qrCodeDataURL
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
