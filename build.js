import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Build frontend
  console.log('Building frontend...');
  execSync('cd frontend && npm install && npm run build', { stdio: 'inherit' });

  // Create backend/frontend directory if it doesn't exist
  const backendFrontendDir = path.join(__dirname, 'backend', 'frontend');
  if (!fs.existsSync(backendFrontendDir)) {
    fs.mkdirSync(backendFrontendDir, { recursive: true });
  }

  // Copy frontend build to backend using platform-specific commands
  console.log('Copying frontend build to backend...');
  const sourceDir = path.join(__dirname, 'frontend', 'dist');
  const targetDir = path.join(__dirname, 'backend', 'frontend');

  // Use platform-specific copy command
  if (process.platform === 'win32') {
    execSync(`xcopy "${sourceDir}" "${targetDir}" /E /I /Y`, { stdio: 'inherit' });
  } else {
    execSync(`cp -r "${sourceDir}/"* "${targetDir}/"`, { stdio: 'inherit' });
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 