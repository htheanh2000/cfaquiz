'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Question {
  id: number;
  question_id: string;
  question_text: string;
  subject_name: string;
  subject_code: string;
  difficulty: 'low' | 'medium' | 'high';
  updated_at: string;
}

export default function QuestionManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadSubjects();
      loadQuestions();
    }
  }, [user, authLoading, router, currentPage, searchQuery, selectedLevel, selectedTopic]);

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedLevel !== 'all' && { level: selectedLevel }),
        ...(selectedTopic !== 'all' && { topic: selectedTopic }),
      });

      const response = await api(`/api/admin/questions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        setTotalQuestions(data.total || 0);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
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

  const getTopicColor = (code: string) => {
    const colors: Record<string, string> = {
      'ETHICS': 'bg-blue-100 text-blue-700 border-blue-200',
      'QUANT': 'bg-purple-100 text-purple-700 border-purple-200',
      'ECON': 'bg-green-100 text-green-700 border-green-200',
      'FSA': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'CORP': 'bg-pink-100 text-pink-700 border-pink-200',
      'EQUITY': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'FIXED': 'bg-teal-100 text-teal-700 border-teal-200',
      'DERIV': 'bg-red-100 text-red-700 border-red-200',
      'ALT': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'PM': 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[code] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const totalPages = Math.ceil(totalQuestions / itemsPerPage);

  const handleSelectQuestion = (questionId: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedQuestions.size === 0) {
      alert('Please select at least one question to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedQuestions.size} question(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await api('/api/admin/questions', {
        method: 'DELETE',
        body: JSON.stringify({
          questionIds: Array.from(selectedQuestions),
        }),
      });

      if (response.ok) {
        setSelectedQuestions(new Set());
        await loadQuestions();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete questions');
      }
    } catch (error) {
      console.error('Error deleting questions:', error);
      alert('Failed to delete questions');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Question Management</div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Question Management</h1>
              <p className="text-gray-600">
                Manage and audit the CFA Level I-III question database.
              </p>
            </div>
            <div className="flex gap-3">
              {selectedQuestions.size > 0 && (
                <Button 
                  variant="outline" 
                  className="border-red-600 text-red-600 hover:bg-red-50"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : `Delete (${selectedQuestions.size})`}
                </Button>
              )}
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => router.push('/admin/question-management/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card className="border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by ID or content..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 bg-white border-gray-300"
                  />
                </div>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level I</option>
                  <option value="2">Level II</option>
                  <option value="3">Level III</option>
                </select>
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Topic</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.code}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Questions Table */}
          <Card className="border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={questions.length > 0 && selectedQuestions.size === questions.length}
                          onChange={handleSelectAll}
                          className="size-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        CONTENT SNIPPET
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        TOPIC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        DIFFICULTY
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        LAST MODIFIED
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questions.length > 0 ? (
                      questions.map((question) => (
                        <tr 
                          key={question.id} 
                          onClick={(e) => {
                            // Don't navigate if clicking checkbox
                            if ((e.target as HTMLElement).tagName !== 'INPUT') {
                              router.push(`/admin/question-management/${question.id}`);
                            }
                          }}
                          className={cn(
                            "hover:bg-gray-50 transition-colors cursor-pointer",
                            selectedQuestions.has(question.id) && "bg-emerald-50"
                          )}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.has(question.id)}
                              onChange={() => handleSelectQuestion(question.id)}
                              className="size-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => router.push(`/admin/question-management/${question.id}`)}
                              className="text-sm font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                            >
                              CFA-{question.subject_code}-{question.id}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => router.push(`/admin/question-management/${question.id}`)}
                              className="text-sm text-gray-700 hover:text-emerald-600 hover:underline text-left"
                            >
                              {truncateText(question.question_text)}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-medium", getTopicColor(question.subject_code))}
                            >
                              {question.subject_name}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn("text-xs font-semibold px-2 py-1 rounded border", getDifficultyColor(question.difficulty))}>
                              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(question.updated_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No questions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
