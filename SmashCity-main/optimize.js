import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

async function optimizeImages() {
  const files = fs.readdirSync(publicDir);
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      const filePath = path.join(publicDir, file);
      const parsed = path.parse(file);
      const destPath = path.join(publicDir, `${parsed.name}.webp`);
      
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // Resize if wider than 1920px to save space
      if (metadata.width && metadata.width > 1920) {
        image.resize({ width: 1920 });
      }
      
      await image.webp({ quality: 80 }).toFile(destPath);
      console.log(`Optimized ${file} -> ${parsed.name}.webp`);
      
      // Delete original file
      fs.unlinkSync(filePath);
    }
  }
}

optimizeImages().catch(console.error);
