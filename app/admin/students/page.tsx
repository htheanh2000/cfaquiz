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
  Mail,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Flame,
  Users,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Student {
  id: number;
  name: string;
  email: string;
  level: string;
  streak: number;
  lastActive: string;
  lastQuizAt: string | null;
  avgScore: number;
  totalQuizzes: number;
  todayQuizCount: number;
  createdAt: string;
}

interface StudentStats {
  totalStudents: number;
  totalStudentsChange: string;
  activeToday: number;
  activeTodayChange: string;
  avgStreak: number;
  avgStreakChange: string;
  newSignups: number;
  newSignupsChange: string;
}

export default function StudentManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    totalStudentsChange: '0',
    activeToday: 0,
    activeTodayChange: '0',
    avgStreak: 0,
    avgStreakChange: '0',
    newSignups: 0,
    newSignupsChange: '0',
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadStats();
      loadStudents();
    }
  }, [user, authLoading, router, currentPage, searchQuery, selectedLevel, selectedStatus, selectedTier]);

  const loadStats = async () => {
    try {
      const response = await api('/api/admin/students/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedLevel !== 'all' && { level: selectedLevel }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedTier !== 'all' && { tier: selectedTier }),
      });

      const response = await api(`/api/admin/students?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setTotalStudents(data.total || 0);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Level I':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Level II':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Level III':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPerformanceLabel = (avgScore: number, totalQuizzes: number) => {
    if (totalQuizzes === 0) return { label: 'No Data', color: 'bg-gray-200', percentage: 0 };
    if (avgScore >= 90) return { label: 'Top 5%', color: 'bg-emerald-500', percentage: 95 };
    if (avgScore >= 80) return { label: 'Top 20%', color: 'bg-emerald-400', percentage: 80 };
    if (avgScore >= 70) return { label: 'Avg.', color: 'bg-emerald-300', percentage: 70 };
    if (avgScore >= 60) return { label: 'Below Avg.', color: 'bg-orange-300', percentage: 60 };
    return { label: 'At Risk', color: 'bg-red-500', percentage: 40 };
  };

  const formatLastActive = (lastActive: string, lastQuizAt: string | null) => {
    if (!lastQuizAt && !lastActive) return { text: 'Never', isActive: false };
    
    const date = lastQuizAt ? new Date(lastQuizAt) : new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return { text: 'Just now', isActive: true };
    if (diffMins < 60) return { text: `${diffMins} minutes ago`, isActive: diffMins < 5 };
    if (diffHours < 1) return { text: `${diffMins} minutes ago`, isActive: false };
    if (diffHours < 24) return { text: `${diffHours} hours ago`, isActive: diffHours < 1 };
    if (diffDays === 1) return { text: '1 day ago', isActive: false };
    if (diffDays < 7) return { text: `${diffDays} days ago`, isActive: false };
    return { text: `${diffDays} days ago`, isActive: false };
  };

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const totalPages = Math.ceil(totalStudents / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalStudents);

  const handleSelectStudent = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStudents.size} student(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await api('/api/admin/students', {
        method: 'DELETE',
        body: JSON.stringify({
          userIds: Array.from(selectedStudents),
        }),
      });

      if (response.ok) {
        setSelectedStudents(new Set());
        await loadStudents();
        await loadStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete students');
      }
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Failed to delete students');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Student Management</div>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Student Management</h1>
              <p className="text-gray-600">
                Manage {stats.totalStudents.toLocaleString()} active candidates preparing for CFA exams.
              </p>
            </div>
            <div className="flex gap-3">
              {selectedStudents.size > 0 && (
                <Button 
                  variant="outline" 
                  className="border-red-600 text-red-600 hover:bg-red-50"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : `Delete (${selectedStudents.size})`}
                </Button>
              )}
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600">TOTAL STUDENTS</p>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.totalStudents.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ArrowUp className="h-4 w-4" />
                  <span>{stats.totalStudentsChange}%</span>
                </div>
                <div className="mt-2 h-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600">ACTIVE TODAY</p>
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.activeToday.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ArrowUp className="h-4 w-4" />
                  <span>{stats.activeTodayChange}%</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <div className="size-2 rounded-full bg-green-500"></div>
                  <span>Real-time engagement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600">AVERAGE STREAK</p>
                  <Flame className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {Math.round(stats.avgStreak)} Days
                </p>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{stats.avgStreakChange}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">CONSISTENCY METRIC</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600">NEW SIGNUPS (7D)</p>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.newSignups.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ArrowUp className="h-4 w-4" />
                  <span>{stats.newSignupsChange}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <Card className="border-gray-200 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, or student ID..."
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
                  <option value="all">LEVEL: All</option>
                  <option value="Level I">LEVEL: Level I</option>
                  <option value="Level II">LEVEL: Level II</option>
                  <option value="Level III">LEVEL: Level III</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">STATUS: All</option>
                  <option value="Active Today">STATUS: Active Today</option>
                </select>
                <select
                  value={selectedTier}
                  onChange={(e) => {
                    setSelectedTier(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">TIER: All</option>
                  <option value="Top 10%">TIER: Top 10%</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card className="border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={students.length > 0 && selectedStudents.size === students.length}
                          onChange={handleSelectAll}
                          className="size-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        STUDENT NAME
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        CFA LEVEL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        PERFORMANCE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        STREAK
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        LAST ACTIVE
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.length > 0 ? (
                      students.map((student) => {
                        const performance = getPerformanceLabel(student.avgScore, student.totalQuizzes);
                        const lastActive = formatLastActive(student.lastActive, student.lastQuizAt);
                        return (
                          <tr 
                            key={student.id} 
                            className={cn(
                              "hover:bg-gray-50 transition-colors",
                              selectedStudents.has(student.id) && "bg-emerald-50"
                            )}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => handleSelectStudent(student.id)}
                                className="size-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-emerald-100 border-2 border-gray-200 flex items-center justify-center text-sm font-medium text-emerald-600">
                                  {getInitials(student.name, student.email)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                                  <p className="text-xs text-gray-500">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={cn("text-xs font-medium", getLevelColor(student.level))}
                              >
                                {student.level.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full", performance.color)}
                                      style={{ width: `${performance.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                    {performance.label}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-gray-900">{student.streak}</span>
                                {student.streak > 0 ? (
                                  <Flame className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <div className="size-4 rounded-full bg-gray-300"></div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={cn("size-2 rounded-full", lastActive.isActive ? "bg-green-500" : "bg-gray-400")}></div>
                                <span className="text-sm text-gray-600">{lastActive.text}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No students found
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
                    Showing {startItem}-{endItem} of {totalStudents.toLocaleString()} students.
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={currentPage === pageNum ? "bg-emerald-600 text-white" : "border-gray-300"}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    {totalPages > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="border-gray-300"
                      >
                        {totalPages}
                      </Button>
                    )}
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
