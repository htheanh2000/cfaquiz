'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Database,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Admin Dashboard</div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome to the CFA Admin Management Portal</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push('/admin/question-management')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-emerald-600" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Library</h3>
                <p className="text-sm text-gray-600">
                  Manage and audit the CFA Level I-III question database
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push('/admin/students')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Management</h3>
                <p className="text-sm text-gray-600">
                  View and manage student accounts and progress
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push('/admin/analytics')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-sm text-gray-600">
                  View system-wide analytics and performance metrics
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Info */}
          <div className="mt-8">
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Database className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                    <p className="text-sm text-gray-600">Database Version: 4.8.2-stable</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
