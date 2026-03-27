import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';
import { fileTypeFromFile } from 'file-type';

async function validateUploadedFile(file: Express.Multer.File) {
  const detected = await fileTypeFromFile(file.path);

  if (!detected) {
    fs.unlinkSync(file.path);
    throw new BadRequestException('Unknown file type');
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (!allowed.includes(detected.mime)) {
    fs.unlinkSync(file.path);
    throw new BadRequestException('Invalid file content');
  }

  return true;
}
