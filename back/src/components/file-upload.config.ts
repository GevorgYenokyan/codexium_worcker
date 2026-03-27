import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { fileTypeFromFile } from 'file-type';

const IMAGE_DIR = 'uploads/images';
const PDF_DIR = 'uploads/pdfs';

const allowedImageExt = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

const allowedImageMime = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

const allowedPdfExt = ['.pdf'];
const allowedPdfMime = ['application/pdf'];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(IMAGE_DIR);
ensureDir(PDF_DIR);

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (allowedImageMime.includes(file.mimetype)) {
        cb(null, IMAGE_DIR);
      } else if (allowedPdfMime.includes(file.mimetype)) {
        cb(null, PDF_DIR);
      } else {
        cb(new Error('Unsupported file type'), '');
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  }),

  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB — безопасно для продакшена
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      allowedImageMime.includes(file.mimetype) &&
      allowedImageExt.includes(ext)
    ) {
      return cb(null, true);
    }

    if (allowedPdfMime.includes(file.mimetype) && allowedPdfExt.includes(ext)) {
      return cb(null, true);
    }
 
    cb(new Error('Only JPG, PNG, WEBP images or PDF files are allowed'));
  },
};

// import { diskStorage } from 'multer';
// import * as path from 'path';

// export const multerConfig = {
//   storage: diskStorage({
//     destination: (req, file, cb) => {
//       if (file.mimetype.startsWith('image/')) {
//         cb(null, 'uploads/images');
//       } else if (file.mimetype === 'application/pdf') {
//         cb(null, 'uploads/pdfs');
//       } else {
//         cb(new Error('Unsupported file type'), '');
//       }
//     },
//     filename: (req, file, cb) => {
//       const timestamp = Date.now();
//       const originalName = file.originalname.replace(/\s+/g, '_');
//       cb(null, `${timestamp}-${originalName}`);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype.startsWith('image/') ||
//       file.mimetype === 'application/pdf'
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image and PDF files are allowed!'));
//     }
//   },
//   limits: {
//     fileSize: 1024 * 1024 * 100, // 100 MB limit
//   },
// };

// import { diskStorage } from 'multer';
// import * as path from 'path';

// export const multerConfig = {
//   storage: diskStorage({
//     destination: (req, file, cb) => {
//       if (file.mimetype.startsWith('image/')) {
//         cb(null, 'uploads/images'); // First argument is null (no error), second is the destination
//       } else {
//         cb(new Error('Unsupported file type'), ''); // First argument is the error, second is an empty string (no destination)
//       }
//     },
//     filename: (req, file, cb) => {
//       const timestamp = Date.now();
//       const originalName = file.originalname.replace(/\s+/g, '_');
//       cb(null, `${timestamp}-${originalName}`);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'));
//     }
//   },
//   limits: {
//     fileSize: 1024 * 1024 * 100, // 40 MB file size limit
//   },
// };
