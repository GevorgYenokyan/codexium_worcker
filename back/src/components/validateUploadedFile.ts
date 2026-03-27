import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';
import { fileTypeFromFile } from 'file-type';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export async function validateUploadedFile(
  files?: Express.Multer.File | Express.Multer.File[],
) {
  if (!files) return true;

  const fileArray = Array.isArray(files) ? files : [files];

  try {
    for (const file of fileArray) {
      const detected = await fileTypeFromFile(file.path);

      if (!detected || !ALLOWED_MIME.includes(detected.mime)) {
        throw new BadRequestException('Invalid file content');
      }
    }

    return true;
  } catch (error) {
    await Promise.all(
      fileArray.map((file) => unlinkAsync(file.path).catch(() => null)),
    );

    throw error;
  }
}
