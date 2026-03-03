'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  TrendingUp,
  Clock,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

interface QuizSession {
  id: number;
  date: string;
  completedAt: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number;
  quizType: string;
  subjectName: string | null;
  levelName: string | null;
  levelOrder: number | null;
  subjects: Array<{ id?: number; name: string; code?: string }>;
}

interface HistoryStats {
  avgScore: number;
  avgScoreChange: number;
  totalSessions: number;
  sessionsChange: number;
  totalTime: number;
  timeChange: number;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();

  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadLevels();
      loadData();
    }
  }, [user, authLoading, router, page, searchQuery, dateFrom, dateTo, levelFilter]);

  const loadLevels = async () => {
    try {
      const res = await fetch('/api/levels');
      const data = await res.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error loading levels:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (levelFilter !== 'all') params.append('levelId', levelFilter);

      const [historyRes, statsRes] = await Promise.all([
        api(`/api/quiz/history?${params.toString()}`),
        api('/api/quiz/history/stats'),
      ]);

      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      setSessions(historyData.sessions || []);
      setStats(statsData);
      setTotalPages(historyData.pagination?.totalPages || 1);
      setTotal(historyData.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-destructive';
  };

  const getScoreDotColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-destructive';
  };

  const getDifficultyBadgeColor = (levelOrder: number | null) => {
    if (!levelOrder) return 'bg-muted text-muted-foreground';
    if (levelOrder === 1) return 'bg-emerald-100 text-emerald-700';
    if (levelOrder === 2) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getDifficultyLabel = (levelOrder: number | null, levelName: string | null) => {
    if (!levelOrder) return 'Mixed';
    if (levelOrder === 1) return 'Easy';
    if (levelOrder === 2) return 'Medium';
    return 'Hard';
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-primary">CFA Quiz</h1>
            <p className="text-muted-foreground">Loading exam history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Exam History</h1>
              <p className="text-muted-foreground">Review your past performance and analyze knowledge gaps.</p>
            </div>
            <Button
              onClick={() => router.push('/practice')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>

          {/* Summary Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      AVG. SCORE
                    </p>
                    {stats.avgScoreChange > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        +{stats.avgScoreChange.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.avgScore.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      TOTAL SESSIONS
                    </p>
                    {stats.sessionsChange > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        +{stats.sessionsChange} this week
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalSessions}</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      TOTAL STUDY TIME
                    </p>
                    {stats.timeChange > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        +{stats.timeChange}h this month
                      </div>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalTime}h</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by topic or session name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                placeholder="Date Range"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="pr-10"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-white border border-border rounded-md px-4 py-2 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Exams</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Sessions Table */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        DATE & TIME
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        SESSION / TOPICS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        SCORE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        DURATION
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        DIFFICULTY
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.length > 0 ? (
                      sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {format(new Date(session.completedAt), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(session.completedAt), 'hh:mm a')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-foreground">
                              {session.quizType === 'random' 
                                ? session.subjects.length > 0
                                  ? `${session.subjects.map(s => s.name).join(', ')} Practice`
                                  : 'Random Quiz'
                                : session.quizType === 'wrong_answers'
                                ? 'Wrong Answers Review'
                                : 'Custom Quiz'}
                            </div>
                            {session.subjects.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Topics: {session.subjects.map(s => s.name).join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={cn("size-2 rounded-full", getScoreDotColor(session.score))} />
                              <span className={cn("text-sm font-semibold", getScoreColor(session.score))}>
                                {session.score.toFixed(0)}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({session.correctAnswers}/{session.totalQuestions})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatTime(session.timeTaken)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant="secondary"
                              className={cn("text-xs font-medium", getDifficultyBadgeColor(session.levelOrder))}
                            >
                              {getDifficultyLabel(session.levelOrder, session.levelName)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/results?sessionId=${session.id}`)}
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No quiz history yet</p>
                          <p className="text-sm mt-2 mb-4">Start from Practice to see your sessions here.</p>
                          <Button onClick={() => router.push('/practice')} variant="default">
                            Go to Practice
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            page === pageNum && "bg-primary text-primary-foreground"
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
