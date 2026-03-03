'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  ChevronRight,
  ChevronDown,
  Bell,
  Moon,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Module {
  id: number;
  moduleCode?: string;
  title: string;
  questionCount: number;
  estimatedTime: number;
  status: 'published' | 'draft';
  subjectCode: string;
}

interface Topic {
  id: number;
  name: string;
  code: string;
  description: string | null;
  moduleCount: number;
  questionCount: number;
  status: 'published' | 'draft';
  modules: Module[];
}

interface CurriculumData {
  topics: Topic[];
  summary: {
    totalTopics: number;
    totalModules: number;
    totalQuestions: number;
    lastSync: string;
  };
}

export default function CurriculumManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadCurriculum();
    }
  }, [user, authLoading, router]);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      const response = await api('/api/admin/curriculum');
      if (response.ok) {
        const data = await response.json();
        setCurriculumData(data);
        // Expand first topic by default
        if (data.topics && data.topics.length > 0) {
          setExpandedTopics(new Set([data.topics[0].id]));
        }
      }
    } catch (error) {
      console.error('Error loading curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const expandAll = () => {
    if (!curriculumData) return;
    setExpandedTopics(new Set(curriculumData.topics.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedTopics(new Set());
  };

  const getStatusColor = (status: string) => {
    return status === 'published'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  const filteredTopics = curriculumData?.topics.filter(topic => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      topic.name.toLowerCase().includes(query) ||
      topic.code.toLowerCase().includes(query) ||
      topic.modules.some(m => 
        m.title.toLowerCase().includes(query) ||
        String(m.id).toLowerCase().includes(query) ||
        (m.moduleCode && m.moduleCode.toLowerCase().includes(query))
      )
    );
  }) || [];

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Curriculum Management</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Curriculum Management</h1>
            <div className="flex items-center gap-4">
             
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => router.push('/admin/curriculum/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Topic
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
                    placeholder="Search for specific modules, IDs, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300"
                  />
                </div>
                <Button variant="outline" className="border-gray-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="border-gray-300">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Topics List */}
          <div className="space-y-4 mb-8">
            {filteredTopics.map((topic) => {
              const isExpanded = expandedTopics.has(topic.id);
              return (
                <Card key={topic.id} className="">
                  <CardContent className="p-0">
                    {/* Topic Header */}
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div className="flex-1 text-left">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {topic.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{topic.moduleCount} Modules</span>
                            <span>•</span>
                            <span>{topic.questionCount} Questions</span>
                          </div>
                        </div>
                        <Badge className={cn("px-3 py-1 text-xs font-semibold", getStatusColor(topic.status))}>
                          {topic.status.toUpperCase()}
                        </Badge>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-200">
                        <div className="pt-4 space-y-3">
                          {topic.modules.length > 0 ? (
                            topic.modules.map((module) => (
                              <div
                                key={module.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => router.push(`/admin/curriculum/modules/${module.id}`)}
                              >
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {module.title}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>ID: {module.moduleCode || module.id}</span>
                                    <span>•</span>
                                    <span>{module.questionCount} Questions</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{module.estimatedTime} min est.</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge className={cn("px-2 py-1 text-xs", getStatusColor(module.status))}>
                                  {module.status}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              No modules available
                            </div>
                          )}
                          
                          {/* Add Module Button */}
                          <button
                            onClick={() => router.push(`/admin/curriculum/modules/create?topicId=${topic.id}`)}
                            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Module to {topic.name}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Summary */}
          {curriculumData && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <div className="flex flex-wrap gap-6">
                <span>Total Topics: <strong className="text-gray-900">{curriculumData.summary.totalTopics}</strong></span>
                <span>Total Modules: <strong className="text-gray-900">{curriculumData.summary.totalModules}</strong></span>
                <span>Total Questions: <strong className="text-gray-900">{curriculumData.summary.totalQuestions.toLocaleString()}</strong></span>
              </div>
              <span>Last sync: {curriculumData.summary.lastSync}</span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
