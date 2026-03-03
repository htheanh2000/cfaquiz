export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: Date;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface Level {
  id: number;
  name: string;
  order_index: number;
  description: string | null;
}

export interface Question {
  id: number;
  subject_id: number;
  level_id: number;
  question_text: string;
  question_type: string;
  explanation: string | null;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  question_id: number;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizSession {
  id: number;
  user_id: number;
  subject_id: number | null;
  level_id: number | null;
  quiz_type: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  time_taken: number;
  completed_at: Date | null;
  created_at: Date;
}

export interface WrongAnswer {
  id: number;
  user_id: number;
  question_id: number;
  times_wrong: number;
  last_wrong_at: Date;
  reviewed_at: Date | null;
  question?: Question;
}

export interface Streak {
  id: number;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface Reminder {
  id: number;
  user_id: number;
  question_id: number;
  remind_at: Date;
  is_sent: boolean;
  question?: Question;
}

export interface Performance {
  id: number;
  user_id: number;
  subject_id: number | null;
  level_id: number | null;
  date: string;
  total_quizzes: number;
  total_questions: number;
  correct_answers: number;
  average_score: number;
  time_spent: number;
}
