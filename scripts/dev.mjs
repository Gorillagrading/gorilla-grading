// Arranca la web (Vite) y la API a la vez. Uso: npm run dev:all
import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = ['dev', 'dev:api'].map((script) =>
  spawn(npm, ['run', script], { stdio: 'inherit', shell: process.platform === 'win32' }),
);

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
// Si uno de los dos se cae, se para el otro para no dejar procesos sueltos.
children.forEach((child) =>
  child.on('exit', (code) => {
    stop();
    process.exit(code ?? 0);
  }),
);
