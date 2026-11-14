import { spawn } from 'child_process';

const SUBDOMAIN = process.env.TUNNEL_SUBDOMAIN || 'aegisflow-corp';
const PORT = process.env.PORT || '5000';

function runTunnel() {
  console.log(`[TunnelSupervisor] Launching persistent HTTPS tunnel for port ${PORT} with subdomain "${SUBDOMAIN}"...`);
  
  const child = spawn('npx.cmd', ['--yes', 'localtunnel', '--port', PORT, '--subdomain', SUBDOMAIN], {
    shell: true,
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    console.warn(`[TunnelSupervisor] Tunnel process disconnected (exit code ${code}). Reconnecting in 3 seconds...`);
    setTimeout(runTunnel, 3000);
  });

  child.on('error', (err) => {
    console.error('[TunnelSupervisor] Spawn error:', err);
    setTimeout(runTunnel, 4000);
  });
}

runTunnel();
