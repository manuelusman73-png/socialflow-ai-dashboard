import fs from 'fs/promises';
import path from 'path';

/**
 * Initialize required directories for the application
 */
export async function initDirectories(): Promise<void> {
  const directories = [
    path.join(process.cwd(), 'uploads', 'videos'),
    path.join(process.cwd(), 'uploads', 'transcoded'),
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Directory ensured: ${dir}`);
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
}
