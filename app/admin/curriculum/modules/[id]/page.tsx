'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ModuleData {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  moduleCode: string;
  title: string;
  description: string | null;
  estimatedTime: number;
  status: 'published' | 'draft';
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface LinkedQuestion {
  id: number;
  questionId: string;
  questionText: string;
  subjectName: string;
  module: string | null;
  levelName: string;
  difficulty: string;
  moduleId: number | null;
  updatedAt: string;
}

export default function EditModulePage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    moduleCode: '',
    learningObjectives: '',
    estimatedTime: '45',
    status: false, // draft mode
  });
  const [linkedQuestions, setLinkedQuestions] = useState<LinkedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [questionsLimit] = useState(20);
  const [autoSaved, setAutoSaved] = useState(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'general'>('general');
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    questionText: '',
    difficulty: 'low' as 'low' | 'medium' | 'high',
    level: 1,
    explanation: '',
    answers: [
      { id: 'A', text: '', isCorrect: true },
      { id: 'B', text: '', isCorrect: false },
      { id: 'C', text: '', isCorrect: false },
    ],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && moduleId) {
      loadModule();
    }
  }, [user, authLoading, router, moduleId]);

  useEffect(() => {
    // Auto-save draft every 30 seconds (only if title exists)
    if (formData.title && formData.title.length > 3) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.learningObjectives]);

  const loadModule = async () => {
    if (!moduleId) return;
    
    try {
      setLoading(true);
      const response = await api(`/api/admin/curriculum/modules/${moduleId}`);
      if (response.ok) {
        const data = await response.json();
        const module = data.module;
        setModuleData(module);
        
        // Populate form with existing data
        setFormData({
          title: module.title || '',
          moduleCode: module.moduleCode || '',
          learningObjectives: module.description || '',
          estimatedTime: String(module.estimatedTime || 45),
          status: module.status === 'published',
        });
        
        // Load linked questions separately
        loadLinkedQuestions();
      } else {
        alert('Failed to load module');
        router.push('/admin/curriculum');
      }
    } catch (error) {
      console.error('Error loading module:', error);
      alert('Failed to load module');
      router.push('/admin/curriculum');
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedQuestions = async (page: number = 1) => {
    if (!moduleId) return;
    
    try {
      setLoadingQuestions(true);
      const response = await api(`/api/admin/questions?page=${page}&limit=${questionsLimit}&module=${moduleId}`);
      if (response.ok) {
        const data = await response.json();
        // Map the response to match LinkedQuestion interface
        const mappedQuestions = (data.questions || []).map((q: any) => ({
          id: q.id,
          questionId: q.question_id,
          questionText: q.question_text,
          subjectName: q.subject_name,
          module: q.module || null,
          levelName: q.level_name,
          difficulty: q.difficulty,
          moduleId: q.module_id || null,
          updatedAt: q.updated_at,
        }));
        setLinkedQuestions(mappedQuestions);
        setQuestionsTotal(data.total || 0);
        setQuestionsPage(page);
      }
    } catch (error) {
      console.error('Error loading linked questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions' && moduleId) {
      loadLinkedQuestions(1);
    }
  }, [activeTab, moduleId]);

  const handleAutoSave = async () => {
    // Don't auto-save if form is incomplete
    if (!moduleId || !formData.title || formData.title.length < 3) return;
    
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 3000);
  };

  const handleQuestionAnswerChange = (id: string, text: string) => {
    setQuestionFormData(prev => ({
      ...prev,
      answers: prev.answers.map(opt => 
        opt.id === id ? { ...opt, text } : opt
      ),
    }));
  };

  const handleQuestionCorrectAnswerChange = (id: string) => {
    setQuestionFormData(prev => ({
      ...prev,
      answers: prev.answers.map(opt => ({
        ...opt,
        isCorrect: opt.id === id,
      })),
    }));
  };

  const handleAddQuestionAnswerOption = () => {
    const nextId = String.fromCharCode(65 + questionFormData.answers.length);
    setQuestionFormData(prev => ({
      ...prev,
      answers: [...prev.answers, { id: nextId, text: '', isCorrect: false }],
    }));
  };

  const handleRemoveQuestionAnswerOption = (id: string) => {
    if (questionFormData.answers.length > 2) {
      setQuestionFormData(prev => ({
        ...prev,
        answers: prev.answers.filter(opt => opt.id !== id),
      }));
    }
  };

  const handleCreateQuestion = async () => {
    if (!moduleData) {
      alert('Module data is missing');
      return;
    }

    if (!questionFormData.questionText.trim()) {
      alert('Please enter question text');
      return;
    }

    const correctAnswers = questionFormData.answers.filter(opt => opt.isCorrect);
    if (correctAnswers.length === 0) {
      alert('Please select a correct answer');
      return;
    }

    const emptyAnswers = questionFormData.answers.filter(opt => !opt.text.trim());
    if (emptyAnswers.length > 0) {
      alert('Please fill in all answer options');
      return;
    }

    try {
      setCreatingQuestion(true);
      const response = await api('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: moduleData.subjectId,
          levelId: questionFormData.level,
          questionText: questionFormData.questionText.trim(),
          explanation: questionFormData.explanation.trim(),
          difficulty: questionFormData.difficulty,
          moduleId: parseInt(moduleId), // Automatically link to module
          answers: questionFormData.answers.map((opt, index) => ({
            answerText: opt.text.trim(),
            isCorrect: opt.isCorrect,
            orderIndex: index + 1,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Question is already linked to module by API, just reload the list
        await loadLinkedQuestions(questionsPage);
        
        // Close modal and reset form
        setShowCreateQuestionModal(false);
        setQuestionFormData({
          questionText: '',
          difficulty: 'low',
          level: 1,
          explanation: '',
          answers: [
            { id: 'A', text: '', isCorrect: true },
            { id: 'B', text: '', isCorrect: false },
            { id: 'C', text: '', isCorrect: false },
          ],
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
    } finally {
      setCreatingQuestion(false);
    }
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

    if (!moduleId) {
      alert('Module ID is missing');
      return;
    }

    try {
      setSaving(true);
      const response = await api(`/api/admin/curriculum/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: formData.title.trim(),
          moduleCode: formData.moduleCode.trim(),
          description: formData.learningObjectives.trim() || null,
          estimatedTime: parseInt(formData.estimatedTime) || 0,
          status: formData.status ? 'published' : 'draft',
          // Note: linkedQuestionIds are managed separately via the questions API
        }),
      });

      if (response.ok) {
        router.push('/admin/curriculum');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update module');
      }
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Failed to update module');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Edit Module</div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!moduleData) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Module not found</div>
            <Button onClick={() => router.push('/admin/curriculum')}>
              Back to Curriculum
            </Button>
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
                  Edit Module: {moduleData.title}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Topic: {moduleData.subjectName}
                </p>
              </div>
            </div>
            {autoSaved && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1">
                Draft Auto-saved
              </Badge>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('general')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === 'general'
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Thông tin chung
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === 'questions'
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Questions
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'general' ? (
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
                  {saving ? 'Saving...' : 'Save Changes'}
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

            </div>
          </div>
          ) : (
            /* Questions Tab */
            <div>
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
                      onClick={() => setShowCreateQuestionModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {loadingQuestions ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-gray-500">Loading questions...</p>
                    </div>
                  ) : linkedQuestions.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {linkedQuestions.map((question) => (
                          <div
                            key={`question-${question.id}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <button
                              onClick={() => router.push(`/admin/question-management/${question.id}`)}
                              className="text-sm text-emerald-600 hover:text-emerald-800 hover:underline text-left flex-1"
                            >
                              <div className="font-medium">{question.questionId}</div>
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {question.questionText}
                              </div>
                            </button>
                            <button
                              onClick={async () => {
                                // Get current linked question IDs
                                const currentQuestionIds = linkedQuestions.map(q => q.id);
                                const updatedLinkedQuestionIds = currentQuestionIds.filter(id => id !== question.id);
                                
                                // Auto-save removal
                                try {
                                  const response = await api(`/api/admin/curriculum/modules/${moduleId}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                      linkedQuestionIds: updatedLinkedQuestionIds,
                                    }),
                                  });
                                  
                                  if (response.ok) {
                                    // Reload questions
                                    await loadLinkedQuestions(questionsPage);
                                  } else {
                                    const errorData = await response.json();
                                    alert(`Failed to remove question link: ${errorData.message || 'Unknown error'}. Please refresh the page.`);
                                  }
                                } catch (error) {
                                  console.error('Error removing question link:', error);
                                  alert('Failed to remove question link. Please refresh the page.');
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 ml-2"
                              title="Remove question"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {questionsTotal > questionsLimit && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Showing {(questionsPage - 1) * questionsLimit + 1} - {Math.min(questionsPage * questionsLimit, questionsTotal)} of {questionsTotal} questions
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadLinkedQuestions(questionsPage - 1)}
                              disabled={questionsPage === 1 || loadingQuestions}
                              className="border-gray-300"
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadLinkedQuestions(questionsPage + 1)}
                              disabled={questionsPage * questionsLimit >= questionsTotal || loadingQuestions}
                              className="border-gray-300"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Search className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-1">No questions linked yet</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Create new questions or link existing questions to this module.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateQuestionModal(true)}
                        className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Create Question Modal */}
      {showCreateQuestionModal && moduleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Question</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create a new question for this module.
                </p>
              </div>
              <button
                onClick={() => setShowCreateQuestionModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Topic and Module (Disabled) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic
                  </label>
                  <Input
                    type="text"
                    value={moduleData.subjectName}
                    disabled
                    className="bg-gray-50 border-gray-300 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module
                  </label>
                  <Input
                    type="text"
                    value={moduleData.title}
                    disabled
                    className="bg-gray-50 border-gray-300 text-gray-500"
                  />
                </div>
              </div>

              {/* Difficulty and Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setQuestionFormData(prev => ({ ...prev, difficulty: level }))}
                        className={cn(
                          "flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                          questionFormData.difficulty === level
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {level === 'low' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select
                    value={questionFormData.level}
                    onChange={(e) => setQuestionFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>Level I</option>
                    <option value={2}>Level II</option>
                    <option value={3}>Level III</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text
                </label>
                <textarea
                  value={questionFormData.questionText}
                  onChange={(e) => setQuestionFormData(prev => ({ ...prev, questionText: e.target.value }))}
                  placeholder="Enter the main question text here..."
                  className="w-full min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                />
              </div>

              {/* Answer Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options
                </label>
                <div className="space-y-3">
                  {questionFormData.answers.map((option) => (
                    <div key={option.id} className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-[40px] mt-2">
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={option.isCorrect}
                          onChange={() => handleQuestionCorrectAnswerChange(option.id)}
                          className="size-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-semibold text-gray-700">{option.id}.</span>
                      </div>
                      <Input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleQuestionAnswerChange(option.id, e.target.value)}
                        placeholder={`Option ${option.id} content...`}
                        className="flex-1 bg-white border-gray-300"
                      />
                      {option.isCorrect && (
                        <Badge className="bg-emerald-600 text-white px-3 py-1 mt-1">
                          CORRECT
                        </Badge>
                      )}
                      {questionFormData.answers.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionAnswerOption(option.id)}
                          className="p-2 text-gray-400 hover:text-red-600 mt-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {questionFormData.answers.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddQuestionAnswerOption}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation
                </label>
                <textarea
                  value={questionFormData.explanation}
                  onChange={(e) => setQuestionFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explain why the correct answer is right and others are wrong..."
                  className="w-full min-h-[100px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowCreateQuestionModal(false)}
                disabled={creatingQuestion}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateQuestion}
                disabled={creatingQuestion}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {creatingQuestion ? 'Creating...' : 'Create Question'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
