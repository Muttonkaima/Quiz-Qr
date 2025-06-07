import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  duration: integer("duration").notNull(), // in minutes
  startDate: text("start_date").notNull(),
  startTime: text("start_time").notNull(),
  status: text("status").notNull().default("draft"), // draft, waiting, active, completed
  currentQuestion: integer("current_question").default(0),
  defaultTimePerQuestion: integer("default_time_per_question").default(30), // in seconds
  timerType: text("timer_type").notNull().default("same"), // same, different
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  type: text("type").notNull(), // MCQ, Fill, TrueFalse
  question: text("question").notNull(),
  options: jsonb("options"), // array of strings for MCQ
  correctAnswer: text("correct_answer").notNull(),
  marks: integer("marks").notNull().default(10),
  timeLimit: integer("time_limit"), // in seconds, null means use default
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  score: integer("score").default(0),
  accuracy: integer("accuracy").default(0), // percentage
  averageResponseTime: integer("average_response_time").default(0), // in seconds
  currentQuestion: integer("current_question").default(0),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Insert schemas
export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  score: true,
  accuracy: true,
  averageResponseTime: true,
  currentQuestion: true,
  registeredAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  submittedAt: true,
});

// Types
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

// Extended types for API responses
export type QuizWithQuestions = Quiz & {
  questions: Question[];
  participantCount: number;
};

export type ParticipantWithAnswers = Participant & {
  answers: Answer[];
  rank: number;
};

export type LeaderboardEntry = {
  id: number;
  name: string;
  email: string;
  score: number;
  accuracy: number;
  averageResponseTime: number;
  rank: number;
};
