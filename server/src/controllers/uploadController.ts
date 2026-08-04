import { Response } from 'express';
import streamifier from 'streamifier';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
      return;
    }

    if (!isCloudinaryConfigured) {
      // Local storage fallback
      const uploadsDir = path.join(__dirname, '../../uploads');
      await fs.promises.mkdir(uploadsDir, { recursive: true });

      const fileExt = req.file.originalname.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
      const filepath = path.join(uploadsDir, filename);

      await fs.promises.writeFile(filepath, req.file.buffer);

      const localUrl = `/uploads/${filename}`;

      res.json({
        success: true,
        data: {
          url: localUrl,
          publicId: `local_${filename}`,
        },
        message: 'Image uploaded locally',
      });
      return;
    }

    const uploadPromise = new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'e-menu',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            } else {
              reject(new Error('Upload failed with no result'));
            }
          }
        );

        streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
      }
    );

    const result = await uploadPromise;

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('UploadImage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
};

export const deleteImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      res.status(400).json({
        success: false,
        message: 'publicId is required',
      });
      return;
    }

    if (!isCloudinaryConfigured) {
      res.json({
        success: true,
        message: 'Image deleted (placeholder - Cloudinary not configured)',
      });
      return;
    }

    await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('DeleteImage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
    });
  }
};
