'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WrongAnswer {
  id: number;
  questionId: number;
  timesWrong: number;
  lastWrongAt: string;
  reviewedAt: string | null;
  question: {
    id: number;
    questionText: string;
    explanation: string | null;
    answers: Array<{
      id: number;
      answer_text: string;
      is_correct: boolean;
    }>;
  };
}

export default function WrongAnswersPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reviewed' | 'unreviewed'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadWrongAnswers();
    }
  }, [user, authLoading, router, filter]);

  const loadWrongAnswers = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/wrong-answers' : `/api/wrong-answers?reviewed=${filter === 'reviewed'}`;
      const response = await api(url);
      if (!response.ok) {
        throw new Error('Failed to load wrong answers');
      }
      const data = await response.json();
      setWrongAnswers(data.wrongAnswers || []);
    } catch (error) {
      console.error('Error loading wrong answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (questionId: number) => {
    try {
      const response = await api('/api/wrong-answers', {
        method: 'POST',
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as reviewed');
      }

      loadWrongAnswers();
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">CFA Quiz</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto p-6 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-bold">Wrong Answers</CardTitle>
              </div>
              <CardDescription>
                Review questions you got wrong to improve your understanding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unreviewed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unreviewed')}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Unreviewed
                </Button>
                <Button
                  variant={filter === 'reviewed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('reviewed')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reviewed
                </Button>
              </div>

              {/* Wrong Answers List */}
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : wrongAnswers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No wrong answers to review yet.</p>
                  <p className="text-sm text-muted-foreground mb-4">Complete a practice session to build your review list.</p>
                  <Button onClick={() => router.push('/practice')} variant="default">
                    Go to Practice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {wrongAnswers.map((wrong) => (
                    <Card key={wrong.id} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                              Wrong {wrong.timesWrong} time{wrong.timesWrong > 1 ? 's' : ''}
                            </span>
                            {wrong.reviewedAt && (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Reviewed
                              </span>
                            )}
                          </div>
                          {!wrong.reviewedAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsReviewed(wrong.questionId)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Reviewed
                            </Button>
                          )}
                        </div>
                        <div 
                          className="font-semibold text-foreground prose prose-slate prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: wrong.question.questionText }}
                        />
                        {wrong.question.explanation && (
                          <div className="p-3 rounded-lg bg-muted">
                            <p className="text-sm text-muted-foreground mb-1 font-medium">Explanation:</p>
                            <div 
                              className="text-sm text-foreground prose prose-slate prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: wrong.question.explanation }}
                            />
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-sm font-medium text-primary mb-1">Correct Answer:</p>
                          <p 
                            className="text-sm text-foreground"
                            dangerouslySetInnerHTML={{ __html: wrong.question.answers.find((a) => a.is_correct)?.answer_text || '' }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
