import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛡️  Launching AegisFlow Enterprise Full-Stack Orchestration...');

// 1. Start Backend Server
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const server = spawn(npxCmd, ['tsx', 'watch', 'src/index.ts'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
});

server.on('error', (err) => {
  console.error('[Server Spawn Error]:', err);
});

// 2. Start Vite Client
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
});

client.on('error', (err) => {
  console.error('[Client Spawn Error]:', err);
});

process.on('SIGINT', () => {
  console.log('\nShutting down AegisFlow...');
  server.kill();
  client.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill();
  client.kill();
  process.exit(0);
});
