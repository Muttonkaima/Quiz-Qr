import { 
  Quiz, InsertQuiz, Question, InsertQuestion, 
  Participant, InsertParticipant, Answer, InsertAnswer,
  QuizWithQuestions, ParticipantWithAnswers, LeaderboardEntry
} from "@shared/schema";

export interface IStorage {
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  updateQuiz(id: number, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  getAllQuizzes(): Promise<Quiz[]>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuizQuestions(quizId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Participant operations
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipantByEmail(quizId: number, email: string): Promise<Participant | undefined>;
  getQuizParticipants(quizId: number): Promise<Participant[]>;
  updateParticipant(id: number, updates: Partial<Participant>): Promise<Participant | undefined>;
  
  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getParticipantAnswers(participantId: number): Promise<Answer[]>;
  getQuestionAnswers(questionId: number): Promise<Answer[]>;
  
  // Complex queries
  getQuizWithQuestions(id: number): Promise<QuizWithQuestions | undefined>;
  getLeaderboard(quizId: number): Promise<LeaderboardEntry[]>;
  getParticipantWithAnswers(id: number): Promise<ParticipantWithAnswers | undefined>;
}

export class MemStorage implements IStorage {
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private participants: Map<number, Participant>;
  private answers: Map<number, Answer>;
  private currentQuizId: number;
  private currentQuestionId: number;
  private currentParticipantId: number;
  private currentAnswerId: number;

  constructor() {
    this.quizzes = new Map();
    this.questions = new Map();
    this.participants = new Map();
    this.answers = new Map();
    this.currentQuizId = 1;
    this.currentQuestionId = 1;
    this.currentParticipantId = 1;
    this.currentAnswerId = 1;
  }

  // Quiz operations
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentQuizId++;
    const quiz: Quiz = {
      ...insertQuiz,
      id,
      createdAt: new Date(),
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async updateQuiz(id: number, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;
    
    const updatedQuiz = { ...quiz, ...updates };
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }

  // Question operations
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = {
      ...insertQuestion,
      id,
    };
    this.questions.set(id, question);
    return question;
  }

  async getQuizQuestions(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...updates };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  // Participant operations
  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = this.currentParticipantId++;
    const participant: Participant = {
      ...insertParticipant,
      id,
      score: 0,
      accuracy: 0,
      averageResponseTime: 0,
      currentQuestion: 0,
      registeredAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async getParticipantByEmail(quizId: number, email: string): Promise<Participant | undefined> {
    return Array.from(this.participants.values())
      .find(p => p.quizId === quizId && p.email === email);
  }

  async getQuizParticipants(quizId: number): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .filter(p => p.quizId === quizId);
  }

  async updateParticipant(id: number, updates: Partial<Participant>): Promise<Participant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, ...updates };
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  // Answer operations
  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const id = this.currentAnswerId++;
    const answer: Answer = {
      ...insertAnswer,
      id,
      submittedAt: new Date(),
    };
    this.answers.set(id, answer);
    return answer;
  }

  async getParticipantAnswers(participantId: number): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(a => a.participantId === participantId);
  }

  async getQuestionAnswers(questionId: number): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(a => a.questionId === questionId);
  }

  // Complex queries
  async getQuizWithQuestions(id: number): Promise<QuizWithQuestions | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;

    const questions = await this.getQuizQuestions(id);
    const participants = await this.getQuizParticipants(id);
    
    return {
      ...quiz,
      questions,
      participantCount: participants.length,
    };
  }

  async getLeaderboard(quizId: number): Promise<LeaderboardEntry[]> {
    const participants = await this.getQuizParticipants(quizId);
    
    const leaderboard = participants
      .map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        score: p.score || 0,
        accuracy: p.accuracy || 0,
        averageResponseTime: p.averageResponseTime || 0,
        rank: 0,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return a.averageResponseTime - b.averageResponseTime;
      });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard;
  }

  async getParticipantWithAnswers(id: number): Promise<ParticipantWithAnswers | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;

    const answers = await this.getParticipantAnswers(id);
    const leaderboard = await this.getLeaderboard(participant.quizId);
    const rank = leaderboard.find(entry => entry.id === id)?.rank || 0;

    return {
      ...participant,
      answers,
      rank,
    };
  }
}

export const storage = new MemStorage();
