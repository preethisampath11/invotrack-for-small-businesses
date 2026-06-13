/**
 * jest.config.js
 *
 * The server uses ESM (`"type": "module"` in package.json).
 * Jest's default runner expects CommonJS, so we need two things:
 *
 *  1. Run Jest via `node --experimental-vm-modules` (see package.json "test" script).
 *  2. Set `transform: {}` here to disable the default babel-jest transformer —
 *     without this, Jest would try (and fail) to transpile ESM imports.
 *
 * We also set `testEnvironment: 'node'` explicitly (it's the default but
 * makes it clear we're not accidentally running in jsdom).
 */
export default {
  testEnvironment: 'node',
  transform: {},                     // native ESM — no Babel transpilation
  testMatch: ['**/__tests__/**/*.test.js'],
  // Collect coverage from service files only (not models, routes, etc.)
  collectCoverageFrom: [
    'services/**/*.js',
  ],
};
