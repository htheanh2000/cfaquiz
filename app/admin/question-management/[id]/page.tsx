'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  CheckCircle2,
  User,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Answer {
  id: number;
  answerText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuestionDetail {
  id: number;
  questionId: string;
  questionText: string;
  explanation: string | null;
  questionType: string;
  difficulty: 'low' | 'medium' | 'high';
  subject: {
    id: number;
    name: string;
    code: string;
  };
  level: {
    id: number;
    name: string;
  };
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
  status: string;
  lastModifiedBy: string;
  auditHistory: Array<{
    event: string;
    date: string;
  }>;
}

export default function QuestionDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id as string;

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  
  // Editable state
  const [editedQuestionText, setEditedQuestionText] = useState('');
  const [editedExplanation, setEditedExplanation] = useState('');
  const [editedAnswers, setEditedAnswers] = useState<Answer[]>([]);
  const [editedDifficulty, setEditedDifficulty] = useState<'low' | 'medium' | 'high'>('low');
  const [editedSubjectId, setEditedSubjectId] = useState<number | null>(null);
  const [editedLevelId, setEditedLevelId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && questionId) {
      loadQuestion();
    }
  }, [user, authLoading, router, questionId]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const response = await api(`/api/admin/questions/${questionId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestion(data);
        // Initialize editable state
        setEditedQuestionText(data.questionText);
        setEditedExplanation(data.explanation || '');
        setEditedAnswers([...data.answers]);
        setEditedDifficulty(data.difficulty);
        setEditedSubjectId(data.subject.id);
        setEditedLevelId(data.level.id);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to load question');
        router.push('/admin/question-management');
      }
    } catch (error) {
      console.error('Error loading question:', error);
      alert('Failed to load question');
      router.push('/admin/question-management');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAnswerChange = (answerId: number, text: string) => {
    setEditedAnswers(
      editedAnswers.map(a => 
        a.id === answerId ? { ...a, answerText: text } : a
      )
    );
  };

  const handleCorrectAnswerChange = (answerId: number) => {
    setEditedAnswers(
      editedAnswers.map(a => ({
        ...a,
        isCorrect: a.id === answerId
      }))
    );
  };

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!question) return;

    if (!editedQuestionText.trim()) {
      alert('Please enter question text');
      return;
    }

    const emptyAnswers = editedAnswers.filter(a => !a.answerText.trim());
    if (emptyAnswers.length > 0) {
      alert('Please fill in all answer options');
      return;
    }

    try {
      setSaving(true);
      const response = await api(`/api/admin/questions/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          questionText: editedQuestionText.trim(),
          explanation: editedExplanation.trim(),
          difficulty: editedDifficulty,
          subjectId: editedSubjectId,
          levelId: editedLevelId,
          answers: editedAnswers.map((a, index) => ({
            id: a.id,
            answerText: a.answerText.trim(),
            isCorrect: a.isCorrect,
            orderIndex: a.orderIndex || index + 1,
          })),
        }),
      });

      if (response.ok) {
        await loadQuestion();
        alert(status === 'published' ? 'Question published successfully' : 'Draft saved successfully');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!question) return;
    if (confirm('Are you sure you want to discard all changes?')) {
      setEditedQuestionText(question.questionText);
      setEditedExplanation(question.explanation || '');
      setEditedAnswers([...question.answers]);
      setEditedDifficulty(question.difficulty);
      setEditedSubjectId(question.subject.id);
      setEditedLevelId(question.level.id);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Question Detail</div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!question) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Question Not Found</div>
            <Button onClick={() => router.push('/admin/question-management')}>
              Back to Library
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const correctAnswer = editedAnswers.find(a => a.isCorrect);
  const correctAnswerIndex = editedAnswers
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .findIndex(a => a.isCorrect);
  const correctAnswerLetter = correctAnswerIndex >= 0 ? String.fromCharCode(65 + correctAnswerIndex) : 'A';

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/question-management')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Question ID: {question.questionId}
                  </h1>
                  <Badge className={cn("px-3 py-1 text-xs font-semibold", getStatusColor(question.status))}>
                    {question.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Last modified by {question.lastModifiedBy} on {formatDate(question.updatedAt)}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/question-management')}
              className="border-gray-300"
            >
              Back to Library
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'editor'
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'preview'
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Preview
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Question Body */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Question Body</h2>
                  </div>
                  
                  {activeTab === 'editor' ? (
                    <div>
                      {/* Rich Text Editor Toolbar */}
                      <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-t-lg bg-gray-50 mb-0">
                        <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                          <span className="font-bold">B</span>
                        </button>
                        <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                          <span className="italic">I</span>
                        </button>
                        <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                          <span className="text-lg">Σ</span>
                        </button>
                        <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                          <span>📷</span>
                        </button>
                      </div>
                      <textarea
                        value={editedQuestionText}
                        onChange={(e) => setEditedQuestionText(e.target.value)}
                        className="w-full min-h-[150px] px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg bg-white resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{editedQuestionText}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Answer Options */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Answer Options</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {editedAnswers
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((answer, index) => {
                        const letter = String.fromCharCode(65 + index);
                        return (
                          <div key={answer.id} className="flex items-center gap-3">
                            <button
                              onClick={() => handleCorrectAnswerChange(answer.id)}
                              className={cn(
                                "flex items-center justify-center size-8 rounded-full border-2 transition-colors",
                                answer.isCorrect
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-emerald-400"
                              )}
                            >
                              <span className="text-sm font-semibold">{letter}</span>
                            </button>
                            <Input
                              value={answer.answerText}
                              onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
                              className="flex-1 bg-white border-gray-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            {answer.isCorrect && (
                              <Badge className="bg-emerald-600 text-white px-3 py-1">
                                CORRECT
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Explanation */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Detailed Explanation</h2>
                  </div>
                  
                  {activeTab === 'editor' ? (
                    <div>
                      {/* Rich Text Editor Toolbar */}
                      <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-t-lg bg-gray-50 mb-0">
                        <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                          <span>🔗</span>
                        </button>
                      </div>
                      <textarea
                        value={editedExplanation}
                        onChange={(e) => setEditedExplanation(e.target.value)}
                        className="w-full min-h-[120px] px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg bg-white resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {editedExplanation || 'No explanation provided.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Settings */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    SETTINGS
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Topic
                      </label>
                      <select
                        value={question.subject.id}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-medium text-gray-700"
                      >
                        <option value={question.subject.id}>{question.subject.name}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setEditedDifficulty(level)}
                            className={cn(
                              "flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                              editedDifficulty === level
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {level === 'low' ? 'Low' : level === 'medium' ? 'Medium' : 'High'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer
                      </label>
                      <select
                        value={correctAnswerLetter}
                        onChange={(e) => {
                          const selectedIndex = e.target.value.charCodeAt(0) - 65;
                          const selectedAnswer = editedAnswers.sort((a, b) => a.orderIndex - b.orderIndex)[selectedIndex];
                          if (selectedAnswer) {
                            handleCorrectAnswerChange(selectedAnswer.id);
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {editedAnswers
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((answer, index) => {
                            const letter = String.fromCharCode(65 + index);
                            return (
                              <option key={answer.id} value={letter}>
                                Option {letter}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleDiscard}
              disabled={saving}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Discard Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Publishing...' : 'Publish Updates'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
