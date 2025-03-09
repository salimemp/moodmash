import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth/auth';
import { rateLimit } from '@/lib/auth/rate-limit';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable the default body parser to allow form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitPassed = await rateLimit(req, res, 'general');
  if (!rateLimitPassed) return;

  try {
    // Get the current user session
    const session = await auth(req, res);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse the form data
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads'),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Parse the form
    const formData = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });

    // Get the uploaded file
    const fileField = formData.files.file;
    if (!fileField) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    // Generate a unique filename
    const originalFilename = file.originalFilename || 'image.jpg';
    const ext = path.extname(originalFilename);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Move the file to its final location
    const uploadedFilePath = file.filepath;
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.copyFileSync(uploadedFilePath, filepath);
      fs.unlinkSync(uploadedFilePath);
    }

    // Return the URL to the uploaded file
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    return res.status(200).json({
      message: 'File uploaded successfully',
      url: fileUrl,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 