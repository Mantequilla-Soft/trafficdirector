const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { stubModule, loadFresh } = require('./helpers');

const loggedChecks = [];
stubModule('utils/activityLogger', {
  logHealthCheck: (total, healthy) => loggedChecks.push({ total, healthy })
});

const { checkNodeHealth, filterHealthyNodes } = loadFresh('utils/healthCheck');

const node = { name: 'hot-1', healthEndpoint: 'https://hot-1.example/health' };

function healthBody(overrides = {}) {
  return {
    enabled: true,
    timestamp: '2026-11-10T00:00:00Z',
    disk_usage_percent: 18,
    bandwidth_24h: { in_mb: 0, out_mb: 0 },
    pins: { total: 1788, pending_migration: 637, overdue: 0 },
    ...overrides
  };
}

function respondWith(body) {
  mock.method(axios, 'get', async () => ({ data: body, headers: {} }));
}

function failWith(code, message = code) {
  mock.method(axios, 'get', async () => {
    const err = new Error(message);
    err.code = code;
    throw err;
  });
}

beforeEach(() => {
  loggedChecks.length = 0;
  mock.method(console, 'log', () => {});
});
afterEach(() => mock.restoreAll());

describe('checkNodeHealth', () => {
  test('enabled node with disk headroom is healthy', async () => {
    respondWith(healthBody());
    const result = await checkNodeHealth(node);
    assert.equal(result.healthy, true);
    assert.equal(result.error, undefined);
    assert.equal(result.node, node);
  });

  test('requests the stored health endpoint with the given timeout', async () => {
    respondWith(healthBody());
    await checkNodeHealth(node, 1234);
    const [url, opts] = axios.get.mock.calls[0].arguments;
    assert.equal(url, node.healthEndpoint);
    assert.equal(opts.timeout, 1234);
    assert.equal(opts.validateStatus(200), true);
    assert.equal(opts.validateStatus(503), false);
  });

  // Regression: hotipfs-1 was dropped from rotation on 2026-11-09 at 150+
  // overdue pins with the repo at 19%, which stopped all ingestion.
  test('overdue pins alone never make a node unhealthy', async () => {
    for (const overdue of [149, 150, 213, 10000]) {
      respondWith(healthBody({ pins: { total: 1788, pending_migration: 637, overdue } }));
      const result = await checkNodeHealth(node);
      assert.equal(result.healthy, true, `overdue=${overdue}`);
      assert.equal(result.details.overdue, overdue, 'still reported for visibility');
      mock.restoreAll();
    }
  });

  test('disabled node is unhealthy', async () => {
    respondWith(healthBody({ enabled: false }));
    const result = await checkNodeHealth(node);
    assert.equal(result.healthy, false);
    assert.equal(result.errorType, 'health_criteria_failed');
    assert.match(result.error, /disabled/);
  });

  test('enabled must be strictly true', async () => {
    respondWith(healthBody({ enabled: 'true' }));
    assert.equal((await checkNodeHealth(node)).healthy, false);
  });

  test('disk usage at or above 90% is unhealthy, below is healthy', async () => {
    respondWith(healthBody({ disk_usage_percent: 89 }));
    assert.equal((await checkNodeHealth(node)).healthy, true);
    mock.restoreAll();

    respondWith(healthBody({ disk_usage_percent: 90 }));
    const result = await checkNodeHealth(node);
    assert.equal(result.healthy, false);
    assert.match(result.error, /high disk usage \(90%\)/);
  });

  test('reports every failed criterion', async () => {
    respondWith(healthBody({ enabled: false, disk_usage_percent: 95 }));
    const result = await checkNodeHealth(node);
    assert.equal(result.error, 'disabled, high disk usage (95%)');
  });

  test('missing pins block is tolerated', async () => {
    const body = healthBody();
    delete body.pins;
    respondWith(body);
    const result = await checkNodeHealth(node);
    assert.equal(result.healthy, true);
    assert.equal(result.details.overdue, 0);
  });

  test('empty body is unhealthy (not enabled)', async () => {
    respondWith(undefined);
    const result = await checkNodeHealth(node);
    assert.equal(result.healthy, false);
    assert.match(result.error, /disabled/);
  });

  for (const [code, errorType] of [
    ['ECONNABORTED', 'timeout'],
    ['ECONNREFUSED', 'connection_refused'],
    ['ENOTFOUND', 'dns_error'],
    ['ERR_BAD_RESPONSE', 'unknown']
  ]) {
    test(`request error ${code} maps to errorType ${errorType}`, async () => {
      failWith(code, `boom ${code}`);
      const result = await checkNodeHealth(node);
      assert.equal(result.healthy, false);
      assert.equal(result.errorType, errorType);
      assert.equal(result.error, `boom ${code}`);
    });
  }
});

describe('filterHealthyNodes', () => {
  test('returns [] without any requests for no nodes', async () => {
    mock.method(axios, 'get', async () => assert.fail('should not be called'));
    assert.deepEqual(await filterHealthyNodes([]), []);
    assert.equal(loggedChecks.length, 0);
  });

  test('keeps only healthy nodes, in order, and logs the tally', async () => {
    const nodes = [
      { name: 'a', healthEndpoint: 'https://a/health' },
      { name: 'b', healthEndpoint: 'https://b/health' },
      { name: 'c', healthEndpoint: 'https://c/health' },
      { name: 'd', healthEndpoint: 'https://d/health' }
    ];
    const bodies = {
      'https://a/health': healthBody({ pins: { total: 1, pending_migration: 1, overdue: 500 } }),
      'https://b/health': healthBody({ disk_usage_percent: 92 }),
      'https://d/health': healthBody()
    };
    mock.method(axios, 'get', async (url) => {
      if (!bodies[url]) {
        const err = new Error('refused');
        err.code = 'ECONNREFUSED';
        throw err;
      }
      return { data: bodies[url], headers: {} };
    });

    const healthy = await filterHealthyNodes(nodes);
    assert.deepEqual(healthy.map(n => n.name), ['a', 'd']);
    assert.deepEqual(loggedChecks, [{ total: 4, healthy: 2 }]);
  });
});
