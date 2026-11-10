const path = require('path');

const ROOT = path.join(__dirname, '../..');

/**
 * Replace a project module in require's cache so later requires get `exports`.
 * Must be called before the module under test is required.
 */
function stubModule(relPath, exports) {
  const resolved = require.resolve(path.join(ROOT, relPath));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

/** Require a project module fresh, dropping any cached copy first. */
function loadFresh(relPath) {
  const resolved = require.resolve(path.join(ROOT, relPath));
  delete require.cache[resolved];
  return require(resolved);
}

/** Minimal Express-style response that records status and JSON body. */
function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

module.exports = { stubModule, loadFresh, fakeRes };
