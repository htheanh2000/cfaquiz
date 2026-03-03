'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface Subject {
  id: number;
  name: string;
  code: string;
  readingCount: number;
  progress: number;
}

// Subject configuration với màu sắc và icon
const SUBJECT_CONFIG: Record<string, { icon: string; color: string; name: string; image?: string }> = {
  'ETHICS': { icon: '⚖️', color: '#2980B9', name: 'Ethical & Professional Standards', image: '/frog-ethics.png' },
  'QUANT': { icon: '📊', color: '#3498DB', name: 'Quantitative Methods', image: '/frog-quant.png' },
  'ECON': { icon: '🌍', color: '#5DADE2', name: 'Economics', image: '/frog-economics.png' },
  'FSA': { icon: '📋', color: '#2E86C1', name: 'Financial Statement Analysis', image: '/frog-fsa.png' },
  'CORP': { icon: '🏢', color: '#21618C', name: 'Corporate Issuers', image: '/frog-corp.png' },
  'EQUITY': { icon: '📈', color: '#85C1E9', name: 'Equity Investments', image: '/frog-equity.png' },
  'FIXED': { icon: '📑', color: '#1F618D', name: 'Fixed Income', image: '/frog-fixed.png' },
  'DERIV': { icon: '🔄', color: '#5499C7', name: 'Derivatives', image: '/frog-deriv.png' },
  'ALT': { icon: '💎', color: '#2874A6', name: 'Alternative Investments', image: '/frog-alt.png' },
  'PM': { icon: '💼', color: '#1B4F72', name: 'Portfolio Management', image: '/frog-pm.png' },
};

// Mock reading counts - có thể lấy từ API sau
const READING_COUNTS: Record<string, number> = {
  'ETHICS': 12,
  'QUANT': 8,
  'ECON': 7,
  'FSA': 11,
  'CORP': 6,
  'EQUITY': 7,
  'FIXED': 6,
  'DERIV': 2,
  'ALT': 2,
  'PM': 7,
};

export default function CurriculumPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadCurriculumData();
    }
  }, [user, authLoading, router]);

  const loadCurriculumData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, questionCountsRes, progressRes, curriculumRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/subjects/question-count'),
        api('/api/topic-mastery'),
        api('/api/admin/curriculum').catch(() => null), // Fetch modules count, but don't fail if it errors
      ]);

      const subjectsData = await subjectsRes.json();
      const countsData = await questionCountsRes.json();
      const progressData = await progressRes.json();
      const curriculumData = curriculumRes?.ok ? await curriculumRes.json() : null;

      // Map subjects with progress
      const subjectsWithProgress = subjectsData.subjects.map((subject: any) => {
        const countInfo = countsData.counts?.find((c: any) => c.id === subject.id);
        const topicData = progressData.topics?.find((t: any) => t.id === subject.id);
        
        // Get module count from curriculum API, fallback to hardcoded, then 0
        let readingCount = 0;
        if (curriculumData?.topics) {
          const topic = curriculumData.topics.find((t: any) => t.id === subject.id);
          readingCount = topic?.moduleCount || 0;
        }
        if (readingCount === 0) {
          readingCount = READING_COUNTS[subject.code] || 0;
        }
        
        // Calculate progress: questions answered / total questions
        const totalQuestions = parseInt(countInfo?.question_count || '0');
        const questionsAnswered = topicData?.questions || 0;
        const progress = totalQuestions > 0 
          ? Math.round((questionsAnswered / totalQuestions) * 100)
          : 0;

        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          readingCount,
          progress: Math.min(progress, 100), // Cap at 100%
        };
      });

      setSubjects(subjectsWithProgress);
    } catch (error) {
      console.error('Error loading curriculum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    if (filter === 'in-progress') {
      return subject.progress > 0 && subject.progress < 100;
    }
    if (filter === 'completed') {
      return subject.progress === 100;
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <Image
              src="/frog-mascot.png"
              alt="Loading"
              width={120}
              height={120}
              className="w-24 h-24 mx-auto mb-4 animate-bounce"
            />
            <p className="text-muted-foreground">Loading curriculum...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Image
              src="/frog-mascot.png"
              alt="Frog Mascot"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Curriculum</h1>
              <p className="text-muted-foreground">Master each topic to ace your exam!</p>
            </div>
          </div>

          {/* Topics Overview */}
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
                  filter === 'all'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                All Topics
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={cn(
                  "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
                  filter === 'in-progress'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={cn(
                  "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
                  filter === 'completed'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Completed
              </button>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredSubjects.map((subject) => {
                const config = SUBJECT_CONFIG[subject.code];
                // Use config if available, otherwise use defaults
                const icon = config?.icon || '📚';
                const color = config?.color || '#6B7280';
                const displayName = config?.name || subject.name;
                const subjectImage = config?.image;

                return (
                  <Card
                    key={subject.id}
                    className="border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => router.push(`/practice?subject=${subject.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        {subjectImage ? (
                          <Image
                            src={subjectImage}
                            alt={displayName}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <div
                            className="text-3xl"
                            style={{ color: color }}
                          >
                            {icon}
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold bg-muted text-muted-foreground"
                        >
                          {subject.readingCount} Readings
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                        {displayName}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Progress</span>
                          <span className="font-bold text-foreground">{subject.progress}%</span>
                        </div>
                        <Progress
                          value={subject.progress}
                          className="h-2"
                          color={color}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredSubjects.length === 0 && (
              <div className="text-center py-12">
                <Image
                  src="/frog-mascot.png"
                  alt="No topics"
                  width={120}
                  height={120}
                  className="w-24 h-24 mx-auto mb-4 opacity-50"
                />
                <p className="text-lg text-muted-foreground">No topics found for this filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
