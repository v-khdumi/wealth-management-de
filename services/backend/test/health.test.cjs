const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');
const net = require('node:net');
const { setTimeout: delay } = require('node:timers/promises');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { resolve } = require('node:path');

test('compiled backend preserves the liveness response and no-store contract', { timeout: 15000 }, async () => {
  const reservation = http.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [resolve(__dirname, '../dist/main.js')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const exited = once(child, 'exit');
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Backend did not become ready: ${output}`)), 10000);
      const capture = data => {
        output += data.toString();
        if (output.includes('Nest application successfully started')) { clearTimeout(timer); resolve(); }
      };
      child.stdout.on('data', capture); child.stderr.on('data', capture);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Backend exited ${code}: ${output}`)); });
    });
    const deadline = Date.now() + 5000;
    while (true) {
      try {
        await new Promise((resolve, reject) => {
          const socket = net.connect(port, '127.0.0.1');
          socket.once('connect', () => { socket.destroy(); resolve(); });
          socket.once('error', reject);
        });
        break;
      } catch (error) {
        if (error.code !== 'ECONNREFUSED' || Date.now() >= deadline || child.exitCode !== null) throw error;
        await delay(25);
      }
    }
    const result = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/health/live`, response => {
        let body = '';
        response.on('data', data => { body += data; });
        response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
      }).on('error', reject);
    });
    assert.equal(result.status, 200);
    assert.equal(result.headers['cache-control'], 'no-store');
    assert.deepEqual(JSON.parse(result.body), { status: 'ok' });
  } finally {
    child.kill('SIGTERM');
    await exited;
  }
});

test('compiled backend rejects invalid ports', { timeout: 10000 }, async () => {
  const child = spawn(process.execPath, [resolve(__dirname, '../dist/main.js')], {
    env: { ...process.env, PORT: 'not-a-port' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const [code] = await once(child, 'exit');
  assert.equal(code, 1);
  assert.match(output, /PORT must be an integer/);
});