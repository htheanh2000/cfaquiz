import { v2 as cloudinary } from 'cloudinary';

// Cloudinary SDK automatically reads CLOUDINARY_URL from environment variables
// Format: cloudinary://api_key:api_secret@cloud_name
// If CLOUDINARY_URL is not set, it will try individual env variables:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('Cloudinary configuration not found. Please set CLOUDINARY_URL environment variable.');
}

export { cloudinary };
