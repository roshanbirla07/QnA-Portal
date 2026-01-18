const { spawn } = require('child_process');
const path = require('path');

const runCommand = (command, args, cwd, name) => {
    const child = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'pipe',
        env: { ...process.env, FORCE_COLOR: true },
    });

    child.stdout.on('data', (data) => {
        console.log(`[${name}] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`[${name}] ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
        console.log(`[${name}] process exited with code ${code}`);
    });

    return child;
};

const start = () => {
    console.log('Starting Backend and Frontend...');
    runCommand('npm', ['run', 'dev'], path.join(__dirname, 'backend'), 'BACKEND');
    runCommand('npm', ['start'], path.join(__dirname, 'frontend'), 'FRONTEND');
};

const lint = () => {
    console.log('Linting Backend and Frontend...');
    // We run them sequentially or parallel. Parallel is faster.
    const backendLint = runCommand('npm', ['run', 'lint'], path.join(__dirname, 'backend'), 'BACKEND-LINT');
    const frontendLint = runCommand('npm', ['run', 'lint'], path.join(__dirname, 'frontend'), 'FRONTEND-LINT');
};

const args = process.argv.slice(2);
const mode = args[0];

if (mode === 'start') {
    start();
} else if (mode === 'lint') {
    lint();
} else {
    console.log('Usage: node dev-runner.js [start|lint]');
    process.exit(1);
}
