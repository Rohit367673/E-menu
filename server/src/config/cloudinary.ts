import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

let isCloudinaryConfigured = false;

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
  console.log('Cloudinary configured successfully');
} else {
  console.log('Cloudinary not configured - image uploads will return placeholder URLs');
}

export { cloudinary, isCloudinaryConfigured };
