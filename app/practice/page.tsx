'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Play, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Subject {
  id: number;
  name: string;
  code: string;
  questionCount?: number;
}

const STORAGE_KEY = 'cfaquiz_practice_settings';

interface PracticeSettings {
  selectedSubjects: number[];
  difficulty: string;
  questionCount: string;
  customQuestionCount: number | '';
  timeLimit: string;
  showHints: boolean;
}

export default function PracticePage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<string>('30');
  const [customQuestionCount, setCustomQuestionCount] = useState<number | ''>(30);
  const [timeLimit, setTimeLimit] = useState<string>('no-timer');
  const [showHints, setShowHints] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [noQuestionsError, setNoQuestionsError] = useState<string | null>(null);

  const retakeQuestionIds = useMemo(() => {
    const ids = searchParams.get('questionIds');
    const retake = searchParams.get('retakeMistakes') === 'true';
    if (!retake || !ids) return null;
    return ids.split(',').map((id) => parseInt(id, 10)).filter((n) => !isNaN(n) && n > 0);
  }, [searchParams]);

  const isRetakeMistakesMode = retakeQuestionIds !== null && retakeQuestionIds.length > 0;

  // Load settings from localStorage (skip when in retake mode so we don't override)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings: PracticeSettings = JSON.parse(saved);
        setSelectedSubjects(settings.selectedSubjects || []);
        setDifficulty(settings.difficulty || 'all');
        setQuestionCount(settings.questionCount || '30');
        setCustomQuestionCount(settings.customQuestionCount || 30);
        setTimeLimit(settings.timeLimit || 'no-timer');
        setShowHints(settings.showHints !== undefined ? settings.showHints : true);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings: PracticeSettings = {
      selectedSubjects,
      difficulty,
      questionCount,
      customQuestionCount,
      timeLimit,
      showHints,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [selectedSubjects, difficulty, questionCount, customQuestionCount, timeLimit, showHints]);

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
      const [subjectsRes, countsRes, levelsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/subjects/question-count'),
        fetch('/api/levels'),
      ]);

      const subjectsData = await subjectsRes.json();
      const countsData = await countsRes.json();
      const levelsData = await levelsRes.json();

      const subjectsWithCounts = (subjectsData.subjects || []).map((subject: Subject) => {
        const count = countsData.counts?.find((c: any) => c.id === subject.id);
        return {
          ...subject,
          questionCount: parseInt(count?.question_count || '0'),
        };
      });

      setSubjects(subjectsWithCounts);
      setLevels(levelsData.levels || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const selectAllSubjects = () => {
    setSelectedSubjects(subjects.map((s) => s.id));
  };

  const clearAllSubjects = () => {
    setSelectedSubjects([]);
  };

  const handleQuestionCountChange = (value: string) => {
    setQuestionCount(value);
    if (value !== 'custom') {
      setCustomQuestionCount('');
    }
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      setNoQuestionsError(null);
      if (isRetakeMistakesMode && retakeQuestionIds) {
        const response = await api('/api/quiz/create', {
          method: 'POST',
          body: JSON.stringify({
            questionIds: retakeQuestionIds,
            questionCount: retakeQuestionIds.length,
            quizType: 'retake_mistakes',
            timeLimit: timeLimit !== 'no-timer' ? parseInt(timeLimit) : null,
            showHints,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create retake quiz');
        }
        const data = await response.json();
        if (data.questions && data.sessionId) {
          sessionStorage.setItem(`quiz_${data.sessionId}`, JSON.stringify(data.questions));
        }
        router.push(`/quiz?sessionId=${data.sessionId}`);
        return;
      }

      let finalQuestionCount = questionCount === 'custom' ? customQuestionCount : parseInt(questionCount);
      if (finalQuestionCount === '' || isNaN(finalQuestionCount) || finalQuestionCount < 1) {
        alert('Please enter a valid question count');
        setLoading(false);
        return;
      }

      const levelMap: { [key: string]: number | null } = {
        'all': null,
        'easy': 1,
        'medium': 2,
        'hard': 3,
      };

      const response = await api('/api/quiz/create', {
        method: 'POST',
        body: JSON.stringify({
          subjectIds: selectedSubjects.length > 0 ? selectedSubjects : null,
          levelId: levelMap[difficulty],
          quizType: 'random',
          questionCount: finalQuestionCount,
          timeLimit: timeLimit !== 'no-timer' ? parseInt(timeLimit) : null,
          showHints,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setNoQuestionsError('No questions match your selection. Try different topics or difficulty.');
          setLoading(false);
          return;
        }
        throw new Error('Failed to create quiz session');
      }
      setNoQuestionsError(null);

      const data = await response.json();

      if (data.questions && data.sessionId) {
        sessionStorage.setItem(`quiz_${data.sessionId}`, JSON.stringify(data.questions));
      }

      router.push(`/quiz?sessionId=${data.sessionId}`);
    } catch (error) {
      console.error('Error starting session:', error);
      alert(error instanceof Error ? error.message : 'Failed to start practice session');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="size-16 rounded-full bg-gradient-education flex items-center justify-center mb-4 animate-pulse">
              <Play className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-education mb-2">CFA Quiz</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalAvailableQuestions = selectedSubjects.length === 0
    ? subjects.reduce((sum, s) => sum + (s.questionCount || 0), 0)
    : subjects
        .filter((s) => selectedSubjects.includes(s.id))
        .reduce((sum, s) => sum + (s.questionCount || 0), 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {isRetakeMistakesMode && retakeQuestionIds && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Retake {retakeQuestionIds.length} question{retakeQuestionIds.length !== 1 ? 's' : ''} you got wrong. Adjust options below or click Start to begin.
              </p>
            </div>
          )}
          {noQuestionsError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between">
              <p className="text-sm font-medium text-red-800">{noQuestionsError}</p>
              <button
                type="button"
                onClick={() => setNoQuestionsError(null)}
                className="text-red-600 hover:underline text-sm"
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Practice Session Setup</h1>
            <p className="text-muted-foreground text-lg">
              {isRetakeMistakesMode
                ? 'Retake your mistakes or start a new session.'
                : 'Configure your session to focus on specific knowledge areas and difficulty levels.'}
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Select Topics */}
            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">Select Topics</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={selectAllSubjects}
                        className="text-primary hover:text-primary h-auto p-0 text-sm"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={clearAllSubjects}
                        className="text-muted-foreground hover:text-foreground h-auto p-0 text-sm"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto">
                    {subjects.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject.id);
                      return (
                        <div
                          key={subject.id}
                          onClick={() => toggleSubject(subject.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 bg-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "size-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-border bg-white"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className="font-medium text-foreground">{subject.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground shrink-0">
                            {subject.questionCount || 0} Qs
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quiz Settings */}
            <div className="space-y-6">
              {/* 2. Difficulty Level */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Difficulty Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'easy', label: 'Easy' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'hard', label: 'Hard' },
                    ].map((level) => (
                      <Button
                        key={level.value}
                        variant={difficulty === level.value ? 'default' : 'outline'}
                        onClick={() => setDifficulty(level.value)}
                        className={cn(
                          "min-w-[80px]",
                          difficulty === level.value
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                            : "border-border text-foreground hover:bg-muted bg-white"
                        )}
                      >
                        {level.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 3. Question Count */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Question Count</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 flex-wrap items-center">
                    {['10', '30'].map((count) => (
                      <Button
                        key={count}
                        variant={questionCount === count ? 'default' : 'outline'}
                        onClick={() => {
                          setQuestionCount(count);
                          setCustomQuestionCount('');
                        }}
                        className={cn(
                          "min-w-[80px]",
                          questionCount === count
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                            : "border-border text-foreground hover:bg-muted bg-white"
                        )}
                      >
                        {count}
                      </Button>
                    ))}
                    <Button
                      variant={questionCount === 'custom' ? 'default' : 'outline'}
                      onClick={() => setQuestionCount('custom')}
                      className={cn(
                        "min-w-[100px]",
                        questionCount === 'custom'
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                          : "border-border text-foreground hover:bg-muted bg-white"
                      )}
                    >
                      Custom
                    </Button>
                    {questionCount === 'custom' && (
                      <Input
                        type="number"
                        min="1"
                        max={totalAvailableQuestions}
                        value={customQuestionCount}
                        onChange={(e) => setCustomQuestionCount(parseInt(e.target.value) || '')}
                        placeholder="Enter count"
                        className="w-32"
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total questions available: <span className="font-semibold text-foreground">{totalAvailableQuestions}</span>
                  </p>
                </CardContent>
              </Card>

              {/* 4. Time Limit */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Time Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { value: '15', label: '15m' },
                      { value: '30', label: '30m' },
                      { value: 'no-timer', label: 'No Timer' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={timeLimit === option.value ? 'default' : 'outline'}
                        onClick={() => setTimeLimit(option.value)}
                        className={cn(
                          "min-w-[100px]",
                          timeLimit === option.value
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                            : "border-border text-foreground hover:bg-muted bg-white"
                        )}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 5. Additional Settings */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Additional Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground mb-1">Show Hints</p>
                      <p className="text-sm text-muted-foreground">Provide tips during the session</p>
                    </div>
                    <Switch
                      checked={showHints}
                      onCheckedChange={setShowHints}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Start Button */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={handleStartSession}
                  disabled={loading || totalAvailableQuestions === 0}
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg py-6"
                >
                  <Play className="mr-2 h-6 w-6 fill-current" />
                  {loading ? 'Starting Session...' : 'Start Practice Session'}
                </Button>

                <p className="text-center text-muted-foreground text-sm flex items-center justify-center gap-2 mt-4">
                  <Info className="h-4 w-4" />
                  Progress will be saved to your performance dashboard automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
