import * as fs from 'fs';
import * as path from 'path';

// Ensure the deleteFile function is exported
export const deleteFile = async (filePath: string) => {
  const resolvedPath = path.resolve(filePath);
  if (fs.existsSync(resolvedPath)) {
    fs.unlink(resolvedPath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${resolvedPath}`, err);
      } else {
        console.log(`File deleted: ${resolvedPath}`);
      }
    });
  } else {
    console.warn(`File not found: ${resolvedPath}`);
  }
};
