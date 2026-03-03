'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Bell, 
  User, 
  CheckCircle2,
  X,
  Lightbulb,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QuestionResult {
  id: number;
  questionText: string;
  explanation: string | null;
  userAnswerId: number;
  isCorrect: boolean;
  timeTaken: number;
  answers: Array<{
    id: number;
    answerText: string;
    isCorrect: boolean;
    orderIndex: number;
  }>;
}

interface SessionResult {
  id: number;
  subjectName: string | null;
  levelName: string | null;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  completedAt: string;
}

function ResultsContent() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<SessionResult | null>(null);
  const [questions, setQuestions] = useState<QuestionResult[]>([]);
  const [percentile, setPercentile] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (sessionId && user) {
      loadResults();
      loadStreak();
    }
  }, [sessionId, user, authLoading, router]);

  const loadResults = async () => {
    if (!sessionId) {
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    try {
      const response = await api(`/api/quiz/results/${sessionId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load results');
      }

      const data = await response.json();
      
      if (!data.session || !data.questions) {
        throw new Error('Invalid response data');
      }
      
      // Debug: Log questions data
      console.log('Questions data:', data.questions);
      if (data.questions.length > 0) {
        console.log('First question answers:', data.questions[0].answers);
      }
      
      setSession(data.session);
      setQuestions(data.questions);
      setPercentile(data.percentile || 0);
      
      // Set first incorrect question as default if exists
      const firstIncorrect = data.questions.findIndex((q: QuestionResult) => !q.isCorrect);
      if (firstIncorrect >= 0) {
        setCurrentQuestionIndex(firstIncorrect);
      }
    } catch (error: any) {
      console.error('Error loading results:', error);
      alert(error.message || 'Failed to load results. Please try again.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      const res = await api('/api/streak');
      if (res.ok) {
        const data = await res.json();
        setStreak(data.currentStreak || 0);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'correct') return q.isCorrect;
    if (filter === 'incorrect') return !q.isCorrect;
    return true;
  });

  useEffect(() => {
    // Reset to first question when filter changes
    if (filteredQuestions.length > 0 && currentQuestionIndex >= filteredQuestions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [filter, filteredQuestions.length]);

  const currentQuestion = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];

  if (authLoading || loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Image
            src="/frog-mascot.png"
            alt="Frog Logo"
            width={80}
            height={80}
            className="mx-auto mb-4 animate-bounce"
          />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  const correctCount = session.correctAnswers;
  const totalCount = session.totalQuestions;
  const percentage = Math.round((correctCount / totalCount) * 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-white sticky top-0 z-50">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/frog-mascot.png"
            alt="Frog Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-bold text-lg text-foreground">Frog</span>
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-foreground">
            <Home className="h-4 w-4" />
            <span className="font-semibold">{streak} DAY STREAK</span>
          </div>
          <button className="size-9 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground">
            <Bell className="h-5 w-5" />
          </button>
          <div className="size-9 rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-medium">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-border bg-white flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              RESULTS REVIEW
            </h3>
            <p className="text-sm font-semibold text-foreground">
              {session.subjectName || 'Practice'} - {session.levelName || 'Level 1'} Session
            </p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrentQuestion = currentQuestion && currentQuestion.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      const filteredIdx = filteredQuestions.findIndex(q2 => q2.id === q.id);
                      if (filteredIdx >= 0) {
                        setCurrentQuestionIndex(filteredIdx);
                      }
                    }}
                    className={cn(
                      "size-10 rounded flex items-center justify-center text-sm font-semibold transition-all relative",
                      isCurrentQuestion && "ring-2 ring-primary ring-offset-2",
                      q.isCorrect 
                        ? "bg-emerald-500/20 text-emerald-700 border-2 border-emerald-500/30"
                        : "bg-destructive/20 text-destructive border-2 border-destructive/30"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-3">
            <Button
              variant="default"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                const incorrectQuestions = questions.filter(q => !q.isCorrect).map(q => q.id);
                if (incorrectQuestions.length > 0) {
                  // Create new quiz with wrong answers
                  router.push(`/practice?retakeMistakes=true&questionIds=${incorrectQuestions.join(',')}`);
                }
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Mistakes
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto p-8">
            {/* Performance Summary */}
            <div className="flex items-center gap-8 mb-8">
              {/* Circular Progress */}
              <div className="relative size-32 shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="stroke-muted"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                  />
                  <circle
                    className="stroke-primary transition-all duration-500"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-primary">{correctCount}/{totalCount}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">CORRECT</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex-1 grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    TOTAL TIME
                  </p>
                  <p className="text-2xl font-bold text-foreground">{formatTotalTime(session.timeTaken)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    AVG. TIME / Q
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatTime(Math.round(session.timeTaken / totalCount))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    PERCENTILE
                  </p>
                  <p className="text-2xl font-bold text-foreground">{percentile}th</p>
                </div>
              </div>
            </div>

            {/* Detailed Review */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Detailed Review</h2>
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as 'all' | 'correct' | 'incorrect');
                    setCurrentQuestionIndex(0);
                  }}
                  className="appearance-none bg-white border border-border rounded-lg px-4 py-2 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Questions</option>
                  <option value="correct">Correct Answers</option>
                  <option value="incorrect">Incorrect Answers</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Question Review */}
            {currentQuestion && (
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-foreground">
                    Question {questions.findIndex(q => q.id === currentQuestion.id) + 1}
                  </span>
                  <Badge 
                    variant={currentQuestion.isCorrect ? "default" : "destructive"}
                    className={cn(
                      currentQuestion.isCorrect 
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    )}
                  >
                    {currentQuestion.isCorrect ? 'CORRECT' : 'INCORRECT'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(currentQuestion.timeTaken)} SPENT
                  </span>
                </div>

                {/* Question Text */}
                <div 
                  className="text-lg font-medium text-foreground prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
                />

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.answers && currentQuestion.answers.length > 0 ? (
                    currentQuestion.answers
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((answer, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isUserAnswer = answer.id === currentQuestion.userAnswerId;
                      const isCorrectAnswer = answer.isCorrect;
                      const isWrongUserAnswer = isUserAnswer && !isCorrectAnswer;
                      
                      return (
                        <div
                          key={answer.id}
                          className={cn(
                            "p-5 rounded-lg border-2 transition-all relative",
                            isWrongUserAnswer && "bg-destructive/10 border-destructive",
                            isCorrectAnswer && "bg-emerald-500/10 border-emerald-500",
                            !isWrongUserAnswer && !isCorrectAnswer && "bg-white border-border"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "size-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                isWrongUserAnswer && "bg-destructive text-destructive-foreground",
                                isCorrectAnswer && "bg-emerald-500 text-white",
                                !isWrongUserAnswer && !isCorrectAnswer && "bg-muted text-muted-foreground"
                              )}
                            >
                              {letter}
                            </div>
                            <span 
                              className="flex-1 text-base text-foreground"
                              dangerouslySetInnerHTML={{ __html: answer.answerText }}
                            />
                            {isWrongUserAnswer && (
                              <X className="h-5 w-5 text-destructive shrink-0" />
                            )}
                            {isCorrectAnswer && (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-5 rounded-lg border-2 border-border bg-muted/50">
                      <p className="text-muted-foreground">No answers available for this question.</p>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-foreground text-lg">Explanation</h4>
                  </div>
                  {currentQuestion.explanation ? (
                    <div className="text-foreground leading-relaxed prose prose-slate max-w-none prose-headings:text-foreground prose-headings:font-bold prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-strong:text-foreground">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {currentQuestion.explanation}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No explanation available for this question.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} of {filteredQuestions.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === filteredQuestions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-gray-900">Quiz Results</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
