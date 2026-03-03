'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  History,
  Settings,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const navigationItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Curriculum', href: '/curriculum' },
  { icon: BookOpen, label: 'Practice', href: '/practice' },
  { icon: AlertCircle, label: 'To Review', href: '/wrong-answers' },
  { icon: BarChart3, label: 'Performance', href: '/performance' },
  { icon: History, label: 'History', href: '/history' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const api = useApi();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    daysToExam: number | null;
    levelPreference: string;
    examDate: string | null;
    avatarUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      loadUserProfile();
    }
  }, [user, authLoading]);

  const loadUserProfile = async () => {
    try {
      const response = await api('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile({
          daysToExam: data.user.daysToExam,
          levelPreference: data.user.levelPreference || 'Level I',
          examDate: data.user.examDate,
          avatarUrl: data.user.avatarUrl || null,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const examDaysRemaining = userProfile?.daysToExam ?? null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-100">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center px-4 h-20 border-b border-slate-100">
            <Image
              src="/logo.png"
              alt="Frog Logo"
              width={160}
              height={56}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive && "text-emerald-500")} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Exam Countdown Card */}
          {examDaysRemaining !== null && examDaysRemaining >= 0 && (
            <div className="mx-3 mb-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-emerald-100" />
                  <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Exam Countdown</span>
                </div>
                <div className="text-3xl font-bold mb-1">{examDaysRemaining}</div>
                <div className="text-sm text-emerald-100">days remaining</div>
              </div>
            </div>
          )}

          {/* User Profile & Settings */}
          <div className="p-3 border-t border-slate-100 space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            
            <div className="flex items-center gap-3 px-3 py-3">
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-slate-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-600">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {userProfile?.levelPreference || 'Level I'} Candidate
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-4 h-20 border-b border-slate-100">
                <Image
                  src="/logo.png"
                  alt="Frog Logo"
                  width={140}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-3 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Mobile Menu Button - Fixed */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow-md text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Content */}
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
