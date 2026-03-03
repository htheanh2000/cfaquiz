'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useApi } from '@/components/providers/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Plus,
  Building2,
  PieChart,
  Briefcase,
  Globe,
  Calculator,
  Scale,
  TrendingUp,
  BarChart3,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TOPIC_ICONS = [
  { id: 'building', icon: Building2, label: 'Building' },
  { id: 'pie-chart', icon: PieChart, label: 'Pie Chart' },
  { id: 'briefcase', icon: Briefcase, label: 'Briefcase' },
  { id: 'globe', icon: Globe, label: 'Globe' },
  { id: 'calculator', icon: Calculator, label: 'Calculator' },
  { id: 'scale', icon: Scale, label: 'Scale' },
  { id: 'trending-up', icon: TrendingUp, label: 'Trending Up' },
  { id: 'bar-chart', icon: BarChart3, label: 'Bar Chart' },
];

const THEME_COLORS = [
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#3b82f6', name: 'Blue' },
];

export default function CreateTopicPage() {
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: '1',
    description: '',
    icon: 'building',
    themeColor: '#10b981',
    weightage: '15',
    status: true, // active/published
    backgroundImageUrl: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  const generateCode = (name: string) => {
    // Generate code from name (e.g., "Corporate Finance" -> "CORP")
    const words = name.toUpperCase().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 5);
    }
    return words.map(w => w[0]).join('').substring(0, 5);
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      code: prev.code || generateCode(value),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setBackgroundImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setBackgroundImage(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, backgroundImageUrl: '' }));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!backgroundImage) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', backgroundImage);
      formData.append('folder', 'topics');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fallback: convert to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(backgroundImage);
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter topic name');
      return;
    }

    if (!formData.code.trim()) {
      alert('Please enter topic code');
      return;
    }

    const weightage = parseFloat(formData.weightage);
    if (isNaN(weightage) || weightage < 0 || weightage > 100) {
      alert('Weightage must be between 0 and 100');
      return;
    }

    try {
      setLoading(true);
      
      // Upload image first if exists
      let imageUrl: string | null = formData.backgroundImageUrl || null;
      if (backgroundImage && !imageUrl) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const response = await api('/api/admin/curriculum/topics', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          levelId: parseInt(formData.level),
          description: formData.description.trim() || null,
          icon: formData.icon,
          themeColor: formData.themeColor,
          weightage: weightage,
          status: formData.status ? 'published' : 'draft',
          backgroundImageUrl: imageUrl || null,
        }),
      });

      if (response.ok) {
        router.push('/admin/curriculum');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-gray-900">Create New Topic</div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin/curriculum')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Topics
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New CFA Topic</h1>
            <p className="text-gray-600">
              Configure a new curriculum section with weightage and visual identifiers.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card className="border-gray-200">
              <CardContent className="p-6 space-y-6">
                {/* Topic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Name
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Corporate Finance"
                    className="bg-white border-gray-300"
                    required
                  />
                </div>

                {/* Topic Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Code
                  </label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., CORP"
                    className="bg-white border-gray-300"
                    required
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier code for this topic</p>
                </div>

                {/* Curriculum Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Curriculum Level
                  </label>
                  <div className="flex gap-2">
                    {(['1', '2', '3'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, level }))}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all",
                          formData.level === level
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        Level {level === '1' ? 'I' : level === '2' ? 'II' : 'III'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description / Overview
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a brief summary of what this topic covers..."
                    className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y bg-white"
                  />
                </div>

                {/* Topic Icon Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Topic Icon Selection
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {TOPIC_ICONS.map((iconItem) => {
                      const IconComponent = iconItem.icon;
                      const isSelected = formData.icon === iconItem.id;
                      return (
                        <button
                          key={iconItem.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon: iconItem.id }))}
                          className={cn(
                            "aspect-square flex items-center justify-center rounded-lg border-2 transition-all",
                            isSelected
                              ? "border-emerald-600 bg-emerald-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          <IconComponent className={cn(
                            "h-6 w-6",
                            isSelected ? "text-emerald-600" : "text-gray-600"
                          )} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Theme Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Primary Theme Color
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {THEME_COLORS.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, themeColor: color.hex }))}
                          className={cn(
                            "size-10 rounded-full border-2 transition-all",
                            formData.themeColor === color.hex
                              ? "border-gray-900 scale-110"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <Input
                      type="text"
                      value={formData.themeColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          setFormData(prev => ({ ...prev, themeColor: value }));
                        }
                      }}
                      className="w-32 bg-white border-gray-300 font-mono text-sm"
                      placeholder="#10b981"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Exam Weightage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Weightage (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.weightage}
                      onChange={(e) => setFormData(prev => ({ ...prev, weightage: e.target.value }))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-32 bg-white border-gray-300"
                      required
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Typical weightage for Level {formData.level === '1' ? 'I' : formData.level === '2' ? 'II' : 'III'} is between 10-20%.
                  </p>
                </div>

                {/* Background Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Background Image
                  </label>
                  {imagePreview ? (
                    <div className="relative">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-300">
                        <img
                          src={imagePreview}
                          alt="Background preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {backgroundImage?.name}
                      </p>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="mb-2 text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Upload a background image for this topic. Recommended size: 1920x1080px
                  </p>
                </div>

                {/* Publishing Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Publishing Status
                  </label>
                  <div className="flex items-center gap-3">
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
                    <span className="text-sm font-medium text-gray-700">
                      {formData.status ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.status 
                      ? 'Topic will be visible to students immediately.' 
                      : 'Topic will be saved as draft and not visible to students.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/curriculum')}
                className="border-gray-300"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingImage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading || uploadingImage ? (uploadingImage ? 'Uploading...' : 'Creating...') : 'Create Topic'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
