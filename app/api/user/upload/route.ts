import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return apiError('No file provided', 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return apiError('File must be an image', 400);
    }

    // Validate file size (max 10MB for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      return apiError('File size must be less than 10MB', 400);
    }

    // Convert file to base64 string for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary with user-specific folder
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'cfaquiz/users',
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto', gravity: 'face' },
        ],
      });

      return apiResponse({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      });
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return apiError(error.message || 'Failed to upload image to Cloudinary', 500);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return apiError('Failed to upload file', 500);
  }
}
