'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  BarChart3, 
  BookOpen, 
  Gauge,
  TrendingUp,
  Calculator,
  Lightbulb,
  Book,
  Clock,
  Download,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Analytics {
  streak: { current: number; longest: number; todayChange: number };
  accuracy: { value: number; change: number };
  totalQuestions: { answered: number; available: number };
  studyVelocity: { value: number; change: number };
}

interface Pitfall {
  subjectId: number;
  subjectName: string;
  subCategory: string;
  errorType: string;
  errorIcon: string;
  frequency: number;
  impact: number;
}

interface TimeEfficiency {
  levelId: number;
  levelName: string;
  difficulty: string;
  yourTime: number;
  target: number;
  percentage: number;
  overTarget: number;
}

interface HeatmapData {
  date: string;
  intensity: number;
  sessions: number;
  questions: number;
}

export default function PerformancePage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pitfalls, setPitfalls] = useState<Pitfall[]>([]);
  const [timeEfficiency, setTimeEfficiency] = useState<TimeEfficiency[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [timeFilter, setTimeFilter] = useState<'30' | 'all'>('30');
  const [heatmapFilter, setHeatmapFilter] = useState<'90' | 'all'>('90');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router, timeFilter, heatmapFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, pitfallsRes, timeRes, heatmapRes] = await Promise.all([
        api(`/api/analytics?days=${timeFilter === 'all' ? '365' : timeFilter}&allTime=${timeFilter === 'all'}`),
        api(`/api/analytics/pitfalls?days=${timeFilter === 'all' ? '365' : timeFilter}`),
        api('/api/analytics/time-efficiency'),
        api(`/api/analytics/heatmap?days=${heatmapFilter === 'all' ? '365' : heatmapFilter}`),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (pitfallsRes.ok) {
        const data = await pitfallsRes.json();
        setPitfalls(data.pitfalls || []);
      }

      if (timeRes.ok) {
        const data = await timeRes.json();
        setTimeEfficiency(data.timeEfficiency || []);
      }

      if (heatmapRes.ok) {
        const data = await heatmapRes.json();
        setHeatmap(data.heatmap || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}S`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}M ${secs}S`;
  };

  const getErrorIcon = (iconName: string) => {
    switch (iconName) {
      case 'calculator': return <Calculator className="h-4 w-4" />;
      case 'lightbulb': return <Lightbulb className="h-4 w-4" />;
      case 'book': return <Book className="h-4 w-4" />;
      case 'clock': return <Clock className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getIntensityColor = (intensity: number) => {
    const colors = [
      'bg-emerald-50',      // 0 - Less activity
      'bg-emerald-200',     // 1
      'bg-emerald-400',     // 2
      'bg-emerald-600',     // 3
      'bg-emerald-800',     // 4 - Intense practice
    ];
    return colors[Math.min(intensity, 4)] || colors[0];
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-primary">CFA Quiz</h1>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Performance Analytics</h1>
              <p className="text-muted-foreground">
                Deep-dive into your study patterns and error trends.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={timeFilter === '30' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('30')}
                  className={cn(
                    timeFilter === '30' && "bg-primary text-primary-foreground"
                  )}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant={timeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('all')}
                  className={cn(
                    timeFilter === 'all' && "bg-primary text-primary-foreground"
                  )}
                >
                  All Time
                </Button>
              </div>
              <button className="size-9 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Current Streak */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Flame className="h-8 w-8 text-primary" />
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    +{analytics?.streak.todayChange || 0} Today
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.streak.current || 0} Days
                </p>
              </CardContent>
            </Card>

            {/* Avg. Accuracy */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  {analytics && analytics.accuracy.change !== 0 && (
                    <div className={cn(
                      "flex items-center gap-1",
                      analytics.accuracy.change >= 0 ? "text-emerald-600" : "text-red-500"
                    )}>
                      <TrendingUp className={cn(
                        "h-4 w-4",
                        analytics.accuracy.change < 0 && "rotate-180"
                      )} />
                      <span className="text-xs font-semibold">
                        {analytics.accuracy.change >= 0 ? '+' : ''}{analytics.accuracy.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Accuracy</p>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.accuracy.value.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>

            {/* Total Questions */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.totalQuestions.answered.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  of {analytics?.totalQuestions.available.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            {/* Study Velocity */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Gauge className="h-8 w-8 text-primary" />
                  {analytics && analytics.studyVelocity.change !== 0 && (
                    <div className={cn(
                      "flex items-center gap-1",
                      analytics.studyVelocity.change >= 0 ? "text-emerald-600" : "text-red-500"
                    )}>
                      <TrendingUp className={cn(
                        "h-4 w-4",
                        analytics.studyVelocity.change < 0 && "rotate-180"
                      )} />
                      <span className="text-xs font-semibold">
                        {analytics.studyVelocity.change >= 0 ? '+' : ''}{analytics.studyVelocity.change.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">Study Velocity</p>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.studyVelocity.value || 0} Q/hr
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Common Pitfalls */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Common Pitfalls by Topic</CardTitle>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    CRITICAL FOCUS AREAS
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">TOPIC AREA</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">MOST FREQUENT ERROR</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">FREQUENCY</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">IMPACT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pitfalls.length > 0 ? (
                        pitfalls.map((pitfall) => (
                          <tr key={pitfall.subjectId} className="border-b border-border">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-semibold text-foreground">{pitfall.subjectName}</p>
                                <p className="text-xs text-muted-foreground">{pitfall.subCategory}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {getErrorIcon(pitfall.errorIcon)}
                                <span className="text-sm text-foreground">{pitfall.errorType}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-bold text-foreground">{pitfall.frequency}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2 max-w-24">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${pitfall.impact}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{pitfall.impact}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            No pitfalls data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Time Efficiency */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Time Efficiency</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-primary"></div>
                    <span className="text-xs text-muted-foreground">YOUR TIME</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-muted"></div>
                    <span className="text-xs text-muted-foreground">TARGET</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {timeEfficiency.length > 0 ? (
                  <>
                    {timeEfficiency.map((eff) => (
                      <div key={eff.levelId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{eff.difficulty}</span>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-primary font-semibold">{formatTime(eff.yourTime)}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{formatTime(eff.target)}</span>
                          </div>
                        </div>
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "absolute left-0 top-0 h-full rounded-full transition-all",
                              eff.percentage > 100 ? "bg-destructive" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(eff.percentage, 100)}%` }}
                          />
                          {eff.percentage > 100 && (
                            <div
                              className="absolute left-0 top-0 h-full bg-primary/50 rounded-full"
                              style={{ width: '100%' }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No time efficiency data available yet. Start practicing to see your timing stats!
                  </div>
                )}
                {timeEfficiency.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground mb-1">Time Sensitivity Insight</p>
                        <p className="text-sm text-muted-foreground">
                          {timeEfficiency.find(e => e.levelId === 3 && e.overTarget > 0)
                            ? `You are exceeding recommended limits on 'Difficult' questions by ${timeEfficiency.find(e => e.levelId === 3)?.overTarget.toFixed(1)}%. Practice pacing with mock sessions.`
                            : 'Your time management is within recommended limits. Keep up the good work!'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Practice Activity Heatmap */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Practice Activity Heatmap</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={heatmapFilter === '90' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHeatmapFilter('90')}
                    className={cn(
                      heatmapFilter === '90' && "bg-primary text-primary-foreground"
                    )}
                  >
                    Last 90 Days
                  </Button>
                  <Button
                    variant={heatmapFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHeatmapFilter('all')}
                    className={cn(
                      heatmapFilter === 'all' && "bg-primary text-primary-foreground"
                    )}
                  >
                    All Time
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Heatmap Grid */}
                {heatmap.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {/* Week labels */}
                    <div className="flex gap-1 mb-2">
                      <div className="w-12"></div>
                      {Array.from({ length: Math.ceil(heatmap.length / 7) }, (_, i) => (
                        <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                          W{i + 1}
                        </div>
                      ))}
                    </div>
                    
                    {/* Day rows - Monday to Sunday */}
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dayIdx) => {
                      // Map day index: M=0, T=1, W=2, T=3, F=4, S=5, S=6
                      // But we want: M=1, T=2, W=3, T=4, F=5, S=6, S=0 (Sunday)
                      const actualDayIdx = dayIdx === 6 ? 0 : dayIdx + 1; // Sunday is 0
                      
                      // Find start date's day of week (0=Sunday, 1=Monday, etc.)
                      const startDate = new Date(heatmap[0].date);
                      const startDayOfWeek = startDate.getDay();
                      
                      return (
                        <div key={dayIdx} className="flex items-center gap-1">
                          <div className="w-12 text-xs text-muted-foreground font-medium">{day}</div>
                          {Array.from({ length: Math.ceil(heatmap.length / 7) }, (_, weekIdx) => {
                            let dataIdx = weekIdx * 7;
                            
                            if (weekIdx === 0) {
                              // First week: align with start day
                              if (actualDayIdx >= startDayOfWeek) {
                                dataIdx = actualDayIdx - startDayOfWeek;
                              } else {
                                // Day is before start day, skip
                                return <div key={`${weekIdx}-${dayIdx}`} className="flex-1 aspect-square" />;
                              }
                            } else {
                              // Subsequent weeks
                              const daysFromStart = (weekIdx - 1) * 7 + (7 - startDayOfWeek) + actualDayIdx;
                              dataIdx = daysFromStart;
                            }
                            
                            if (dataIdx >= heatmap.length) {
                              return <div key={`${weekIdx}-${dayIdx}`} className="flex-1 aspect-square" />;
                            }
                            
                            const dayData = heatmap[dataIdx];
                            return (
                              <div
                                key={`${weekIdx}-${dayIdx}`}
                                className={cn(
                                  "flex-1 aspect-square rounded border border-border min-w-[12px]",
                                  dayData && dayData.intensity > 0 
                                    ? getIntensityColor(dayData.intensity) 
                                    : "bg-white"
                                )}
                                title={dayData && dayData.questions > 0 
                                  ? `${dayData.questions} questions on ${new Date(dayData.date).toLocaleDateString()}` 
                                  : 'No activity'}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No activity data available
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">LESS ACTIVITY</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((intensity) => (
                      <div
                        key={intensity}
                        className={cn("size-4 rounded border border-border", getIntensityColor(intensity))}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">INTENSE PRACTICE</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
