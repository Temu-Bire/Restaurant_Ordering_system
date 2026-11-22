import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });

export const avatarUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: AVATAR_UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = MIME_TO_EXT[file.mimetype] ?? extname(file.originalname).toLowerCase();
      const unique = randomBytes(12).toString('hex');
      cb(null, `avatar-${Date.now()}-${unique}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    if (!MIME_TO_EXT[file.mimetype]) {
      return cb(
        new BadRequestException('Only PNG, JPG, JPEG, and WebP images are allowed'),
        false,
      );
    }
    cb(null, true);
  },
};
