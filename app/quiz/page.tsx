'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Bell, 
  User, 
  Clock, 
  Flag, 
  CheckCircle2,
  ArrowLeft,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import AIChat from '@/components/quiz/AIChat';

interface Question {
  id: number;
  question_text: string;
  explanation: string | null;
  subject_id?: number;
  level_id?: number;
  answers: Array<{
    id: number;
    answer_text: string;
    is_correct: boolean;
    order_index: number;
  }>;
}

interface SessionInfo {
  subjectName?: string;
  levelName?: string;
  timeLimit?: number;
}

function QuizContent() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [questionStates, setQuestionStates] = useState<Map<number, 'unvisited' | 'visited' | 'answered' | 'current'>>(new Map());
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitConfirmCount, setSubmitConfirmCount] = useState(0);
  const submittedRef = useRef(false);
  const pendingAnswersRef = useRef<Map<number, number> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (sessionId && user) {
      loadQuiz();
      loadStreak();
    }
  }, [sessionId, user, authLoading, router]);

  useEffect(() => {
    // Update question states
    const newStates = new Map<number, 'unvisited' | 'visited' | 'answered' | 'current'>();
    questions.forEach((q, idx) => {
      if (idx === currentIndex) {
        newStates.set(q.id, 'current');
      } else if (answers.has(q.id)) {
        newStates.set(q.id, 'answered');
      } else if (idx < currentIndex) {
        newStates.set(q.id, 'visited');
      } else {
        newStates.set(q.id, 'unvisited');
      }
    });
    setQuestionStates(newStates);
  }, [currentIndex, answers, questions]);

  useEffect(() => {
    // Session timer
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      setSessionTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    // Countdown timer if time limit exists — auto-submit when time runs out
    if (sessionInfo.timeLimit) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
        const remaining = sessionInfo.timeLimit! * 60 - elapsed;
        setTimeRemaining(remaining > 0 ? remaining : 0);

        if (remaining <= 0 && !submittedRef.current) {
          handleSubmit();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionInfo.timeLimit, sessionStartTime]);

  const loadQuiz = async () => {
    if (!sessionId) {
      router.push('/dashboard');
      return;
    }

    setLoading(true);
    
    try {
      // First, try to get session info from API
      const sessionRes = await api(`/api/quiz/session/${sessionId}`);
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSessionInfo({
          subjectName: sessionData.subjectName,
          levelName: sessionData.levelName,
          timeLimit: sessionData.timeLimit,
        });
        if (sessionData.timeLimit) {
          setTimeRemaining(sessionData.timeLimit * 60);
        }
      }

      // Get questions from sessionStorage
      const storedQuestions = sessionStorage.getItem(`quiz_${sessionId}`);
      if (storedQuestions) {
        try {
          const questionsData = JSON.parse(storedQuestions);
          if (Array.isArray(questionsData) && questionsData.length > 0) {
            setQuestions(questionsData);
            setSessionStartTime(new Date());
          } else {
            throw new Error('Invalid questions data');
          }
        } catch (error) {
          console.error('Error parsing stored questions:', error);
          // If sessionStorage fails, try to fetch from API
          await fetchQuestionsFromAPI();
        }
      } else {
        // If no stored questions, try to fetch from API
        await fetchQuestionsFromAPI();
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsFromAPI = async () => {
    try {
      // Fallback: try to get questions from API (e.g. after refresh if backend supports it)
      const response = await api(`/api/quiz/questions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          sessionStorage.setItem(`quiz_${sessionId}`, JSON.stringify(data.questions));
          setSessionStartTime(new Date());
        } else {
          throw new Error('No questions found');
        }
      } else {
        throw new Error('Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions from API:', error);
      // Redirect to dashboard with a clear reason (questions not available, e.g. session opened in new tab or after refresh)
      router.push('/dashboard');
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

  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswer(answerId);
    const question = questions[currentIndex];
    setAnswers(new Map(answers.set(question.id, answerId)));
  };

  const handleQuestionClick = (index: number) => {
    setCurrentIndex(index);
    const question = questions[index];
    setSelectedAnswer(answers.get(question.id) || null);
  };

  const handleMarkForReview = () => {
    const question = questions[currentIndex];
    const newMarked = new Set(markedForReview);
    if (newMarked.has(question.id)) {
      newMarked.delete(question.id);
    } else {
      newMarked.add(question.id);
    }
    setMarkedForReview(newMarked);
  };

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextQuestion = questions[currentIndex + 1];
      setSelectedAnswer(answers.get(nextQuestion.id) || null);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const question = questions[currentIndex];
    const newAnswers = new Map(answers).set(question.id, selectedAnswer);
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextQuestion = questions[currentIndex + 1];
      setSelectedAnswer(answers.get(nextQuestion.id) || null);
    } else {
      // Last question — show confirm before submit (count includes current answer)
      pendingAnswersRef.current = newAnswers;
      setSubmitConfirmCount(newAnswers.size);
      setShowSubmitConfirm(true);
    }
  };

  const handleSubmit = async (fromConfirm = false) => {
    if (submittedRef.current) return;
    if (fromConfirm) setShowSubmitConfirm(false);
    submittedRef.current = true;
    setLoading(true);
    try {
      const answersToSubmit = fromConfirm && pendingAnswersRef.current ? pendingAnswersRef.current : answers;
      pendingAnswersRef.current = null;
      const answersArray = Array.from(answersToSubmit.entries()).map(([questionId, answerId]) => {
        const question = questions.find(q => q.id === questionId);
        const startTime = sessionStartTime.getTime();
        const timeTaken = Math.floor((new Date().getTime() - startTime) / 1000 / questions.length); // Average time per question
        return { questionId, answerId, timeTaken };
      });

      const response = await api('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          answers: answersArray,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await response.json();
      router.push(`/results?sessionId=${sessionId}&score=${data.score}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      submittedRef.current = false;
      alert('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSessionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || !questions.length) {
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isMarked = markedForReview.has(question.id);
  const difficulty = question.level_id === 1 ? 'Easy' : question.level_id === 2 ? 'Medium' : 'Difficult';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Image
            src="/frog-mascot.png"
            alt="Frog Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-bold text-lg text-foreground">Frog</span>
        </div>
        
        <div className="flex items-center gap-6">
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{formatTime(timeRemaining)} LEFT</span>
            </div>
          )}
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

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-border bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              PRACTICE SESSION
            </h3>
            <p className="text-sm font-semibold text-foreground">
              {sessionInfo.subjectName || 'Practice'} - {sessionInfo.levelName || 'Level 1'}
            </p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const state = questionStates.get(q.id) || 'unvisited';
                const isMarkedQ = markedForReview.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(idx)}
                    className={cn(
                      "size-10 rounded flex items-center justify-center text-sm font-semibold transition-all relative",
                      state === 'current' && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                      state === 'answered' && "bg-emerald-500/20 text-emerald-700 border-2 border-emerald-500/30",
                      state === 'visited' && "bg-primary/20 text-primary border-2 border-primary/30",
                      state === 'unvisited' && "bg-muted text-muted-foreground border-2 border-border"
                    )}
                  >
                    {idx + 1}
                    {isMarkedQ && (
                      <Flag className="absolute -top-1 -right-1 h-3 w-3 text-primary fill-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                SESSION TIME
              </p>
              <p className="text-lg font-bold text-foreground">{formatSessionTime(sessionTime)}</p>
            </div>
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => {
                if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                  router.push('/dashboard');
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Session
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto p-8">
            {/* Breadcrumbs */}
            <div className="mb-6 text-sm text-muted-foreground">
              Practice Sessions &gt; {sessionInfo.subjectName || 'Practice'}
            </div>

            {/* Question Header */}
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {difficulty.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Topic: {sessionInfo.subjectName || 'General'}
              </span>
            </div>

            {/* Question Text */}
            <div 
              className="text-xl font-medium text-foreground mb-8 prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />

            {/* Answer Options */}
            <div className="space-y-4 mb-8">
              {question.answers
                .sort((a, b) => a.order_index - b.order_index)
                .map((answer, idx) => {
                  const isSelected = selectedAnswer === answer.id;
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  return (
                    <button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(answer.id)}
                      className={cn(
                        "w-full text-left p-5 rounded-lg border-2 transition-all relative",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/50 hover:bg-accent text-foreground"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "size-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {letter}
                        </div>
                        <span 
                          className="flex-1 text-base"
                          dangerouslySetInnerHTML={{ __html: answer.answer_text }}
                        />
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleMarkForReview}
                  className={cn(
                    isMarked && "bg-primary/10 border-primary text-primary"
                  )}
                >
                  <Flag className={cn("mr-2 h-4 w-4", isMarked && "fill-primary")} />
                  Mark for Review
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={currentIndex === questions.length - 1}
                >
                  Skip
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={cn(
                    "border-emerald-300 text-emerald-600 hover:bg-emerald-50",
                    isChatOpen && "bg-emerald-50"
                  )}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Tutor
                </Button>
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null || loading}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {currentIndex < questions.length - 1 ? 'Submit Answer' : 'Finish Session'}
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* AI Chat Sidebar */}
        <AIChat
          questionContext={{
            questionText: question.question_text,
            topic: sessionInfo.subjectName,
            difficulty: difficulty,
            answers: question.answers
              .sort((a, b) => a.order_index - b.order_index)
              .map(a => a.answer_text),
          }}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />

        {/* Submit confirmation modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50" aria-modal="true" role="dialog" aria-labelledby="submit-confirm-title">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h2 id="submit-confirm-title" className="text-lg font-semibold text-foreground mb-2">Submit quiz?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                You answered {submitConfirmCount} of {questions.length} question{questions.length !== 1 ? 's' : ''}.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
                <Button onClick={() => handleSubmit(true)} disabled={loading}>Submit</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-gray-900">Quiz Session</div>
          <p className="text-gray-500">Loading questions...</p>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
