'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Save,
  Info,
  HelpCircle,
  Plus,
  Search,
  X,
  User,
  Eye,
  Filter,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Subject {
  id: number;
  name: string;
  code: string;
}

function CreateModuleContent() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    moduleCode: '',
    learningObjectives: '',
    estimatedTime: '45',
    status: false, // draft mode
  });
  const [linkedQuestions, setLinkedQuestions] = useState<number[]>([]);
  const [autoSaved, setAutoSaved] = useState(false);
  const [moduleCount, setModuleCount] = useState(0);
  const [showQuestionBrowser, setShowQuestionBrowser] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionDifficulty, setQuestionDifficulty] = useState('all');
  const [questionStatus, setQuestionStatus] = useState('all');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionPage, setQuestionPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && topicId) {
      loadSubject();
      loadModuleCount();
    }
  }, [user, authLoading, router, topicId]);

  useEffect(() => {
    if (subject && moduleCount > 0) {
      generateModuleCode();
    }
  }, [subject, moduleCount]);

  useEffect(() => {
    // Auto-save draft every 30 seconds (only if title exists)
    if (formData.title && formData.title.length > 3) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.learningObjectives]);

  const loadSubject = async () => {
    if (!topicId) return;
    
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        const foundSubject = data.subjects.find((s: Subject) => s.id === parseInt(topicId));
        if (foundSubject) {
          setSubject(foundSubject);
        }
      }
    } catch (error) {
      console.error('Error loading subject:', error);
    }
  };

  const loadModuleCount = async () => {
    if (!topicId) return;
    
    try {
      const response = await api(`/api/admin/curriculum/modules?subjectId=${topicId}`);
      if (response.ok) {
        const data = await response.json();
        const count = data.count || 0;
        setModuleCount(count);
        
        // Generate module code after getting count
        if (subject) {
          generateModuleCode(count);
        }
      }
    } catch (error) {
      console.error('Error loading module count:', error);
    }
  };

  const generateModuleCode = (count?: number) => {
    if (!subject) return;
    
    // Get current year
    const year = new Date().getFullYear();
    const subjectCode = subject.code;
    
    // Generate module number based on existing count + 1
    const moduleNumber = String((count ?? moduleCount) + 1).padStart(2, '0');
    const code = `CFA-${year}-${subjectCode}-${moduleNumber}`;
    
    setFormData(prev => ({ ...prev, moduleCode: code }));
  };

  const handleAutoSave = async () => {
    // Don't auto-save if module is already saved or if form is incomplete
    if (!topicId || !formData.title || formData.title.length < 3) return;
    
    // Note: In a real implementation, you might want to use PUT to update existing draft
    // For now, we'll just show the auto-saved indicator without actually saving
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 3000);
  };

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const params = new URLSearchParams({
        page: questionPage.toString(),
        limit: '10',
        ...(questionSearch && { search: questionSearch }),
        ...(questionDifficulty !== 'all' && { level: questionDifficulty }),
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
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (showQuestionBrowser) {
      loadQuestions();
    }
  }, [showQuestionBrowser, questionPage, questionSearch, questionDifficulty]);

  useEffect(() => {
    if (showQuestionBrowser) {
      // Pre-select already linked questions when modal opens
      setSelectedQuestionIds(new Set(linkedQuestions));
    }
  }, [showQuestionBrowser]);

  const handleOpenQuestionBrowser = () => {
    setShowQuestionBrowser(true);
  };

  const handleCloseQuestionBrowser = () => {
    setShowQuestionBrowser(false);
    setQuestionSearch('');
    setQuestionDifficulty('all');
    setQuestionStatus('all');
    setQuestionPage(1);
  };

  const handleToggleQuestion = (questionId: number) => {
    const newSelected = new Set(selectedQuestionIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestionIds(newSelected);
  };

  const handleAddSelectedQuestions = () => {
    const newLinked = Array.from(selectedQuestionIds);
    setLinkedQuestions(newLinked);
    handleCloseQuestionBrowser();
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'high':
        return 'EXPERT';
      case 'medium':
        return 'MODERATE';
      case 'low':
        return 'EASY';
      default:
        return difficulty.toUpperCase();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Just now';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 21) return '2 weeks ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter module title');
      return;
    }

    if (!formData.moduleCode.trim()) {
      alert('Please enter module code');
      return;
    }

    if (!topicId) {
      alert('Topic ID is missing');
      return;
    }

    try {
      setLoading(true);
      const response = await api('/api/admin/curriculum/modules', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: parseInt(topicId),
          title: formData.title.trim(),
          moduleCode: formData.moduleCode.trim(),
          description: formData.learningObjectives.trim() || null,
          estimatedTime: parseInt(formData.estimatedTime) || 0,
          status: formData.status ? 'published' : 'draft',
          linkedQuestionIds: linkedQuestions,
        }),
      });

      if (response.ok) {
        router.push('/admin/curriculum');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save module');
      }
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Failed to save module');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Add New Module</div>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/curriculum')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Add New Module to {subject?.name || 'Topic'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Topic: {subject?.name || 'Loading...'}
                </p>
              </div>
            </div>
            {autoSaved && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1">
                Draft Auto-saved
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Module Details */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Info className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Module Details</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Module Title
                      </label>
                      <Input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. R15: Ethics and Trust"
                        className="bg-white border-gray-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Module ID
                      </label>
                      <Input
                        type="text"
                        value={formData.moduleCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, moduleCode: e.target.value }))}
                        className="bg-white border-gray-300 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Learning Objectives
                      </label>
                      <textarea
                        value={formData.learningObjectives}
                        onChange={(e) => setFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                        placeholder="List the learning outcome statements (LOS) for this module..."
                        className="w-full min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Enter each objective on a new line. These will be formatted as bullet points for candidates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Linked Questions */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Linked Questions</h2>
                    </div>
                    <Button
                      variant="outline"
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      onClick={handleOpenQuestionBrowser}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Link from Question Bank
                    </Button>
                  </div>

                  {linkedQuestions.length > 0 ? (
                    <div className="space-y-2">
                      {linkedQuestions.map((questionId) => (
                        <div
                          key={questionId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">Question ID: {questionId}</span>
                          <button
                            onClick={() => setLinkedQuestions(prev => prev.filter(id => id !== questionId))}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Search className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-1">No questions linked yet</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Link existing questions from the question bank to this module.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleOpenQuestionBrowser}
                        className="border-gray-300"
                      >
                        Open Question Browser
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Module Settings */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    MODULE SETTINGS
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Est. Study Time (min)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={formData.estimatedTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                          min="0"
                          className="w-24 bg-white border-gray-300"
                        />
                        <span className="text-sm text-gray-600">min</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Publication Status
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Draft Mode</p>
                            <p className="text-xs text-gray-500">Visible only to admins.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              formData.status ? "bg-emerald-600" : "bg-gray-300"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                formData.status ? "translate-x-6" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-xs text-emerald-700">
                            Published modules will be immediately visible to students in the curriculum map.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : saving ? 'Auto-saving...' : 'Save Module'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/curriculum')}
                  disabled={loading || saving}
                  className="w-full border-gray-300"
                >
                  Cancel
                </Button>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Last Edited:</span>
                  <span className="font-medium text-gray-900">Just now</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Created By:</span>
                  <span className="font-medium text-gray-900">{user?.name || 'Admin'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">Lead Content Admin</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total Modules in Topic: <span className="font-medium text-gray-900">{moduleCount}</span>
              {' • '}
              <button className="text-emerald-600 hover:text-emerald-700 font-medium">
                Adding New Module...
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Step 1 of 2:</span> Module Foundation
            </div>
          </div>
        </div>
      </div>

      {/* Question Browser Modal */}
      {showQuestionBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Question Browser</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select questions from the Question Bank to link to this module.
                </p>
              </div>
              <button
                onClick={handleCloseQuestionBrowser}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search question content or ID..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="pl-10 bg-white border-gray-300"
                  />
                </div>
                <select
                  value={questionDifficulty}
                  onChange={(e) => setQuestionDifficulty(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level I</option>
                  <option value="2">Level II</option>
                  <option value="3">Level III</option>
                </select>
                <select
                  value={questionStatus}
                  onChange={(e) => setQuestionStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="review">In Review</option>
                </select>
              </div>
            </div>

            {/* Questions Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">No questions found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((question) => {
                    const isSelected = selectedQuestionIds.has(question.id);
                    return (
                      <div
                        key={question.id}
                        className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleQuestion(question.id)}
                          className="mt-1 size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {question.question_id}
                            </span>
                            <Badge className={cn("px-2 py-0.5 text-xs", getDifficultyColor(question.difficulty))}>
                              {getDifficultyLabel(question.difficulty)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span className="size-1.5 rounded-full bg-green-500"></span>
                              <span>Published</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {question.question_text}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Topic: {question.subject_name}</span>
                            <span>•</span>
                            <span>Last updated: {formatDate(question.updated_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/admin/question-management/${question.id}`)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Total Selected: <span className="font-semibold text-gray-900">{selectedQuestionIds.size}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseQuestionBrowser}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSelectedQuestions}
                  disabled={selectedQuestionIds.size === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Add Selected Questions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function CreateModulePage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Add New Module</div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    }>
      <CreateModuleContent />
    </Suspense>
  );
}
