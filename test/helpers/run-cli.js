'use strict';

const { execFile } = require('child_process');
const path = require('path');

const CLI = path.join(__dirname, '..', '..', 'meta-ads-cli.js');

/**
 * Runs the real CLI binary as a child process and returns its parsed JSON output,
 * so tests assert on the same interface an agent or a shell script consumes.
 *
 * Asynchronous on purpose: the fake Meta server lives in the test process, and a
 * synchronous spawn would block the event loop that has to answer the child's
 * request (a 10s timeout, every test).
 *
 * Pass `undefined` as an env value to remove that variable from the child.
 */
function runCli(args = [], env = {}, options = {}) {
  const childEnv = { ...process.env, ...env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete childEnv[key];
  }

  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [CLI, ...args],
      { env: childEnv, encoding: 'utf8', timeout: options.timeoutMs || 15000 },
      (error, stdout, stderr) => {
        let json = null;
        try {
          json = JSON.parse(stdout);
        } catch {
          json = null;
        }

        let status = 0;
        if (error) status = typeof error.code === 'number' ? error.code : 1;

        resolve({ status, stdout, stderr, json, killed: Boolean(error && error.killed) });
      },
    );
  });
}

module.exports = { runCli, CLI };
