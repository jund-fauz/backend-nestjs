import {
  Injectable,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const UPLOADS_FOLDER = 'uploads/profiles';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_ASPECT_RATIO = 1.3; // Landscape aspect ratio minimum (width:height >= 1.3)
const MAX_ASPECT_RATIO = 2.5; // Landscape aspect ratio maximum

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

export const landscapeImageStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

export const landscapeImageFileFilter = async (req, file, cb) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return cb(
      new BadRequestException('File size exceeds 5MB limit'),
      false,
    );
  }

  // Check file format
  if (!ALLOWED_FORMATS.includes(file.mimetype)) {
    return cb(
      new UnsupportedMediaTypeException(
        'Only JPEG, PNG, and WebP formats are allowed',
      ),
      false,
    );
  }

  // Validate landscape aspect ratio
  try {
    const metadata = await sharp(file.buffer).metadata();
    const aspectRatio = metadata.width / metadata.height;

    if (
      aspectRatio < MIN_ASPECT_RATIO ||
      aspectRatio > MAX_ASPECT_RATIO
    ) {
      return cb(
        new BadRequestException(
          `Image must be in landscape format. Required aspect ratio: ${MIN_ASPECT_RATIO}:1 to ${MAX_ASPECT_RATIO}:1, but got ${aspectRatio.toFixed(2)}:1`,
        ),
        false,
      );
    }
  } catch (error) {
    return cb(
      new BadRequestException('Invalid image file'),
      false,
    );
  }

  cb(null, true);
};

export function LandscapeImageUploadInterceptor() {
  return FileInterceptor('profilePicture', {
    storage: landscapeImageStorage,
    fileFilter: landscapeImageFileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });
}
