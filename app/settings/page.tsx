'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Calendar, 
  Shield, 
  User, 
  Bell,
  Pencil,
  Save,
  Trash2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  examDate: string | null;
  dailyGoal: number;
  emailNotifications: boolean;
  weeklyReports: boolean;
  levelPreference: string;
  avatarUrl: string | null;
  daysToExam: number | null;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyGoal, setDailyGoal] = useState(50);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [levelPreference, setLevelPreference] = useState('Level I');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      const userData = data.user;
      setProfile(userData);
      
      // Set form values
      setName(userData.name || '');
      setPhone(userData.phone || '');
      setExamDate(userData.examDate ? new Date(userData.examDate).toISOString().split('T')[0] : '');
      setDailyGoal(userData.dailyGoal || 50);
      setEmailNotifications(userData.emailNotifications !== false);
      setWeeklyReports(userData.weeklyReports !== false);
      setLevelPreference(userData.levelPreference || 'Level I');
      setAvatarUrl(userData.avatarUrl || null);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          phone,
          examDate: examDate || null,
          dailyGoal,
          emailNotifications,
          weeklyReports,
          levelPreference,
          avatarUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const data = await response.json();
      setProfile(data.user);
      setSuccess('Profile updated successfully!');
      
      // Update auth context if name changed
      if (data.user.name !== user?.name) {
        // Reload page to update auth context
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api('/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const formatDateForInput = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Use fetch directly for FormData (don't use useApi as it sets Content-Type to JSON)
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type - browser will set it with boundary for FormData

      const response = await fetch('/api/user/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setAvatarUrl(data.url);
      setSuccess('Image uploaded successfully!');

      // Auto-save avatar URL to profile
      const profileResponse = await api('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          avatarUrl: data.url,
        }),
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.user);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = async () => {
    setAvatarUrl(null);
    setError('');
    setSuccess('');

    try {
      const response = await api('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          avatarUrl: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setSuccess('Avatar removed successfully!');
      }
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      setError(error.message || 'Failed to remove avatar');
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-primary">CFA Quiz</h1>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          {/* Breadcrumbs */}
          <div className="mb-6 text-sm text-muted-foreground">
            Settings &gt; Profile &amp; Preferences
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
              {success}
            </div>
          )}

          {/* Profile Summary Card */}
          <Card className="border-border mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {avatarUrl ? (
                      <div className="relative size-24 rounded-full overflow-hidden border-2 border-primary/30">
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-0 right-0 size-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="size-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/30">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-white hover:bg-primary/90 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </label>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {name || user?.name || user?.email || 'User'}
                    </h2>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {levelPreference} CANDIDATE
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Exam Settings */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">Exam Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    NEXT EXAM DATE
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    DAILY GOAL
                  </label>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-primary">
                      {dailyGoal} Questions
                    </div>
                    <Slider
                      value={dailyGoal}
                      onValueChange={setDailyGoal}
                      min={10}
                      max={150}
                      step={5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">Account Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    NEW PASSWORD
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    CONFIRM PASSWORD
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    CURRENT PASSWORD
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    FULL NAME
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    EMAIL ADDRESS
                  </label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-muted"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    PHONE NUMBER
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">NOTIFICATION PREFERENCES</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-foreground block mb-1">
                      Email Notifications
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Important updates regarding your account and exam.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="size-5 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-foreground block mb-1">
                      Weekly Progress Reports
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Get a summary of your performance every Monday.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyReports}
                    onChange={(e) => setWeeklyReports(e.target.checked)}
                    className="size-5 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delete Account Section */}
          <Card className="border-border border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-destructive mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, all study progress will be lost.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="text-white"
                  onClick={() => {
                    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
                      // TODO: Implement account deletion
                      alert('Account deletion feature coming soon');
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
