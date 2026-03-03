'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Flame, 
  Play, 
  RotateCcw, 
  Target,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';

// Utility function to strip HTML tags from text
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

// Topic image mapping - maps topic code to frog image path
const topicImages: Record<string, string> = {
  'ETHICS': '/frog-ethics.png',
  'QUANT': '/frog-quant.png',
  'ECON': '/frog-economics.png',
  'FSA': '/frog-fsa.png',
  'CORP': '/frog-corp.png',
  'EQUITY': '/frog-equity.png',
  'FIXED': '/frog-fixed.png',
  'DERIV': '/frog-deriv.png',
  'ALT': '/frog-alt.png',
  'PM': '/frog-pm.png',
};

// Helper to get topic image by code
const getTopicImage = (topicCode: string): string | null => {
  if (!topicCode) return null;
  const normalized = topicCode.toUpperCase().trim();
  return topicImages[normalized] || null;
};

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [stats, setStats] = useState({
    accuracy: 0,
    wrongAnswersCount: 0,
    dailyGoal: 0,
    dailyGoalTotal: 50,
    totalQuestions: 0,
    totalSessions: 0,
  });
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [subjectsRes, streakRes, topicsRes, statsRes, wrongAnswersRes] = await Promise.all([
        fetch('/api/subjects'),
        api('/api/streak'),
        api('/api/topic-mastery'),
        api('/api/stats'),
        api('/api/wrong-answers?reviewed=false'),
      ]);

      const subjectsData = await subjectsRes.json();
      const streakData = await streakRes.json();
      const topicsData = await topicsRes.json();
      const statsData = await statsRes.json();
      const wrongAnswersData = await wrongAnswersRes.json();

      setSubjects(subjectsData.subjects || []);
      setStreak(streakData);
      setTopics(topicsData.topics || []);
      setStats(statsData);
      setWrongAnswers(wrongAnswersData.wrongAnswers || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const startQuiz = async (quizType: string) => {
    setLoading(true);
    try {
      const response = await api('/api/quiz/create', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSubject,
          levelId: selectedLevel,
          quizType,
          questionCount: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const data = await response.json();
      if (data.questions && data.sessionId) {
        sessionStorage.setItem(`quiz_${data.sessionId}`, JSON.stringify(data.questions));
      }
      router.push(`/quiz?sessionId=${data.sessionId}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  const dailyProgress = stats.dailyGoalTotal > 0 
    ? Math.min(100, (stats.dailyGoal / stats.dailyGoalTotal) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-slate-500 mt-1">
                Continue your preparation journey
              </p>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Streak */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{streak?.currentStreak || 0}</div>
              </div>
              <p className="text-sm text-slate-500">Day Streak</p>
            </div>

            {/* Accuracy */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.accuracy}%</div>
              </div>
              <p className="text-sm text-slate-500">Accuracy</p>
            </div>

            {/* Questions Today */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.dailyGoal}</div>
              </div>
              <p className="text-sm text-slate-500">Questions Today</p>
            </div>

            {/* Wrong Answers */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{wrongAnswers.length}</div>
              </div>
              <p className="text-sm text-slate-500">To Review</p>
            </div>
          </motion.div>

          {/* First-time empty state */}
          {(streak?.currentStreak ?? 0) === 0 && stats.dailyGoal === 0 && wrongAnswers.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 mb-6"
            >
              <p className="text-emerald-800 font-medium mb-1">Start your first practice</p>
              <p className="text-sm text-emerald-700 mb-4">Complete a short quiz to begin tracking your progress and building your streak.</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/practice')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700"
              >
                Go to Practice
              </motion.button>
            </motion.div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* CTA Card */}
              <motion.div 
                variants={itemVariants}
                className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 lg:p-8 text-white"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span className="text-sm font-medium text-emerald-100">Ready to practice?</span>
                  </div>
                  
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                    Start Your Next Session
                  </h2>
                  <p className="text-emerald-100 mb-6 max-w-md">
                    Focus on your weak areas and maintain your streak. Every question brings you closer to passing.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startQuiz('random')}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-5 h-5" />
                      Practice Now
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/practice')}
                      className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
                    >
                      Custom Quiz
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Decorative Circle */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              </motion.div>

              {/* Topic Mastery */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Topic Mastery</h3>
                    <p className="text-sm text-slate-500">
                      {topics.reduce((sum, t) => sum + (t.total || 0), 0).toLocaleString()} questions available
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push('/curriculum')}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {topics.length > 0 ? (
                  <div className="space-y-3">
                    {topics.slice(0, 6).map((topic, index) => (
                      <motion.div
                        key={topic.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                        className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all"
                        onClick={() => router.push('/practice')}
                      >
                        <div className="flex items-center gap-4">
                          {/* Topic Image */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex-shrink-0">
                            <Image
                              src={getTopicImage(topic.code) || '/frog-mascot.png'}
                              alt={topic.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                              {topic.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span>{topic.total?.toLocaleString() || 0} questions</span>
                              {topic.questionsAnswered > 0 && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-emerald-600">{topic.questionsAnswered} practiced</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {topic.questionsAnswered > 0 ? (
                              <>
                                <p className={cn(
                                  "text-lg font-bold",
                                  topic.status === 'mastered' ? "text-emerald-600" :
                                  topic.status === 'developing' ? "text-amber-600" :
                                  topic.status === 'critical' ? "text-red-600" : "text-slate-400"
                                )}>
                                  {topic.mastery}%
                                </p>
                                <p className="text-xs text-slate-400">accuracy</p>
                              </>
                            ) : (
                              <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">
                                Not started
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium mb-1">Loading topics...</p>
                    <p className="text-sm text-slate-500">Question bank is being prepared</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column - 1/3 */}
            <div className="space-y-6">
              {/* Daily Goal */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold text-slate-900">Daily Goal</h3>
                </div>

                <div className="flex flex-col items-center py-4">
                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="stroke-slate-100"
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        strokeWidth="8"
                      />
                      <circle
                        className="stroke-emerald-500 transition-all duration-500"
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${dailyProgress * 2.64} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">{stats.dailyGoal}</span>
                      <span className="text-xs text-slate-500">of {stats.dailyGoalTotal}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 text-center">
                    {stats.dailyGoal >= stats.dailyGoalTotal ? (
                      <span className="text-emerald-600 font-medium">Goal completed! Great job!</span>
                    ) : (
                      <>Complete <span className="font-semibold text-emerald-600">{stats.dailyGoalTotal - stats.dailyGoal} more</span> to reach your goal</>
                    )}
                  </p>
                </div>
              </motion.div>

              {/* Quick Review */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-slate-900">Quick Review</h3>
                  </div>
                  {wrongAnswers.length > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                      {wrongAnswers.length}
                    </span>
                  )}
                </div>

                {wrongAnswers.length > 0 ? (
                  <div className="space-y-3">
                    {wrongAnswers.slice(0, 3).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => router.push('/wrong-answers')}
                      >
                        <p className="text-sm text-slate-700 line-clamp-2 mb-1">
                          {stripHtml(item.question?.questionText || '').substring(0, 80)}...
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.lastWrongAt 
                            ? formatDistanceToNow(new Date(item.lastWrongAt), { addSuffix: true })
                            : 'Recently'}
                        </p>
                      </motion.div>
                    ))}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/wrong-answers')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Review All ({wrongAnswers.length})
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm text-slate-600">All caught up!</p>
                    <p className="text-xs text-slate-500">No questions to review</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
