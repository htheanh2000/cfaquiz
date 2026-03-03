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
  Tag,
  FileText,
  CheckSquare,
  Lightbulb,
  X,
  Save,
  Bold,
  Italic,
  List,
  Sigma,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Module {
  id: number;
  title: string;
  moduleCode: string;
}

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export default function CreateQuestionPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [difficulty, setDifficulty] = useState<'low' | 'medium' | 'high'>('low');
  const [questionText, setQuestionText] = useState('');
  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([
    { id: 'A', text: '', isCorrect: true },
    { id: 'B', text: '', isCorrect: false },
    { id: 'C', text: '', isCorrect: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadSubjects();
    }
  }, [user, authLoading, router]);

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();
      setSubjects(data.subjects || []);
      if (data.subjects && data.subjects.length > 0) {
        setSelectedSubject(data.subjects[0].id);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadModules = async (subjectId: number) => {
    try {
      // Fetch all modules and filter by subject_id
      const response = await api('/api/admin/curriculum/modules');
      if (response.ok) {
        const data = await response.json();
        const subjectModules = (data.modules || []).filter(
          (m: any) => m.subject_id === subjectId
        );
        setModules(subjectModules.map((m: any) => ({
          id: m.id,
          title: m.title,
          moduleCode: m.module_code,
        })));
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      setModules([]);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadModules(selectedSubject);
      setSelectedModule(null); // Reset module selection when topic changes
    } else {
      setModules([]);
      setSelectedModule(null);
    }
  }, [selectedSubject]);

  const handleAnswerChange = (id: string, text: string) => {
    setAnswerOptions(
      answerOptions.map(opt => 
        opt.id === id ? { ...opt, text } : opt
      )
    );
  };

  const handleCorrectAnswerChange = (id: string) => {
    setAnswerOptions(
      answerOptions.map(opt => ({
        ...opt,
        isCorrect: opt.id === id
      }))
    );
  };

  const handleAddAnswerOption = () => {
    const nextId = String.fromCharCode(65 + answerOptions.length); // A, B, C, D, ...
    setAnswerOptions([...answerOptions, { id: nextId, text: '', isCorrect: false }]);
  };

  const handleRemoveAnswerOption = (id: string) => {
    if (answerOptions.length > 2) {
      setAnswerOptions(answerOptions.filter(opt => opt.id !== id));
    }
  };

  const handleSave = async () => {
    if (!selectedSubject) {
      alert('Please select a topic');
      return;
    }

    if (!questionText.trim()) {
      alert('Please enter question text');
      return;
    }

    const correctAnswers = answerOptions.filter(opt => opt.isCorrect);
    if (correctAnswers.length === 0) {
      alert('Please select a correct answer');
      return;
    }

    const emptyAnswers = answerOptions.filter(opt => !opt.text.trim());
    if (emptyAnswers.length > 0) {
      alert('Please fill in all answer options');
      return;
    }

    try {
      setLoading(true);
      const response = await api('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: selectedSubject,
          levelId: selectedLevel,
          questionText: questionText.trim(),
          explanation: explanation.trim(),
          difficulty,
          moduleId: selectedModule || undefined, // Link to module if selected
          answers: answerOptions.map((opt, index) => ({
            answerText: opt.text.trim(),
            isCorrect: opt.isCorrect,
            orderIndex: index + 1,
          })),
        }),
      });

      if (response.ok) {
        router.push('/admin/question-management');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Create Question</div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className=" mx-auto p-6 lg:p-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <button 
              onClick={() => router.push('/admin/question-management')}
              className="hover:text-emerald-600"
            >
              Question Bank
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Add New Question</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Practice Question</h1>
            <p className="text-gray-600">
              Configure metadata, write the question stem, and provide detailed rationales for the CFA candidate portal.
            </p>
          </div>

          {/* Form Sections */}
          <div className="space-y-6">
            {/* 1. Metadata & Tags */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Metadata & Tags</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic
                    </label>
                    <select
                      value={selectedSubject || ''}
                      onChange={(e) => {
                        const subjectId = e.target.value ? parseInt(e.target.value) : null;
                        setSelectedSubject(subjectId);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a topic</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module
                    </label>
                    <select
                      value={selectedModule || ''}
                      onChange={(e) => setSelectedModule(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={!selectedSubject || modules.length === 0}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Select a module</option>
                      {modules.map(module => (
                        <option key={module.id} value={module.id}>
                          {module.title} ({module.moduleCode})
                        </option>
                      ))}
                    </select>
                    {selectedSubject && modules.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No modules available for this topic. Create modules in Curriculum Management.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={cn(
                            "flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                            difficulty === level
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
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={1}>Level I</option>
                      <option value={2}>Level II</option>
                      <option value={3}>Level III</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Question Stem */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Question Stem</h2>
                </div>

                {/* Rich Text Editor Toolbar */}
                <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-t-lg bg-gray-50">
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                    <Bold className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                    <Italic className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                    <List className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                    <Sigma className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 text-gray-600">
                    <ImageIcon className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the main question text here..."
                  className="w-full min-h-[200px] px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                />
              </CardContent>
            </Card>

            {/* 3. Answer Options */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Answer Options</h2>
                </div>

                <div className="space-y-4">
                  {answerOptions.map((option, index) => (
                    <div key={option.id} className="flex items-start gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2 min-w-[40px]">
                          <input
                            type="radio"
                            name="correct-answer"
                            checked={option.isCorrect}
                            onChange={() => handleCorrectAnswerChange(option.id)}
                            className="size-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">{option.id}.</span>
                        </div>
                        <Input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleAnswerChange(option.id, e.target.value)}
                          placeholder={`Option ${option.id} content...`}
                          className="flex-1 bg-white border-gray-300"
                        />
                        {option.isCorrect && (
                          <Badge className="bg-emerald-600 text-white px-3 py-1">
                            CORRECT
                          </Badge>
                        )}
                      </div>
                      {answerOptions.length > 2 && (
                        <button
                          onClick={() => handleRemoveAnswerOption(option.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {answerOptions.length < 6 && (
                    <button
                      onClick={handleAddAnswerOption}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 4. Rationale & Explanation */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Rationale & Explanation</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Explanation
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Explain why the correct answer is right and others are wrong..."
                    className="w-full min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/question-management')}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Question
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
