const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { stubModule, loadFresh, fakeRes } = require('./helpers');

// Fake HotNode model: find({ enabled: true }).sort(...) resolves to `dbNodes`.
let dbNodes = [];
let findQuery = null;
stubModule('models/Director.model', {
  find(query) {
    findQuery = query;
    return { sort: async () => dbNodes };
  }
});

let healthyByName = {};
stubModule('utils/healthCheck', {
  filterHealthyNodes: async (nodes) => nodes.filter(n => healthyByName[n.name])
});

const activity = [];
stubModule('utils/activityLogger', {
  logHotNodeRequest: (...args) => activity.push(['request', ...args]),
  logError: (...args) => activity.push(['error', ...args])
});

function makeNode(name) {
  return {
    name,
    owner: `${name}-owner`,
    uploadEndpoint: `https://${name}/api/v0/add`,
    healthEndpoint: `https://${name}/health`,
    lastUsed: new Date(0),
    saved: 0,
    async save() { this.saved++; }
  };
}

let controller;

beforeEach(() => {
  // Fresh module per test so the in-memory round-robin index starts at 0.
  controller = loadFresh('controllers/director.controller');
  dbNodes = [];
  findQuery = null;
  healthyByName = {};
  activity.length = 0;
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
});
afterEach(() => mock.restoreAll());

describe('getHotNode', () => {
  test('only queries enabled nodes', async () => {
    await controller.getHotNode({ ip: '1.2.3.4' }, fakeRes());
    assert.deepEqual(findQuery, { enabled: true });
  });

  test('503 when no nodes are enabled', async () => {
    const res = fakeRes();
    await controller.getHotNode({ ip: '1.2.3.4' }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.success, false);
  });

  test('503 when every enabled node fails its health check', async () => {
    dbNodes = [makeNode('a'), makeNode('b')];
    const res = fakeRes();
    await controller.getHotNode({ ip: '1.2.3.4' }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.message, /unavailable/);
  });

  test('returns a healthy node, bumps lastUsed and logs the request', async () => {
    const a = makeNode('a');
    dbNodes = [a];
    healthyByName = { a: true };

    const res = fakeRes();
    await controller.getHotNode({ ip: '1.2.3.4' }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      data: {
        name: 'a',
        uploadEndpoint: a.uploadEndpoint,
        healthEndpoint: a.healthEndpoint,
        owner: 'a-owner'
      }
    });
    assert.equal(a.saved, 1);
    assert.ok(a.lastUsed > new Date(0));
    assert.deepEqual(activity, [['request', '1.2.3.4', 'a', 'a-owner']]);
  });

  test('skips unhealthy nodes and round-robins across healthy ones', async () => {
    dbNodes = [makeNode('a'), makeNode('b'), makeNode('c')];
    healthyByName = { a: true, c: true };

    const picks = [];
    for (let i = 0; i < 4; i++) {
      const res = fakeRes();
      await controller.getHotNode({ ip: '1.2.3.4' }, res);
      picks.push(res.body.data.name);
    }
    assert.deepEqual(picks, ['a', 'c', 'a', 'c']);
  });

  test('500 and error log when the database throws', async () => {
    const err = new Error('mongo down');
    mock.method(require.cache[require.resolve('../../models/Director.model')].exports, 'find', () => {
      throw err;
    });
    const res = fakeRes();
    await controller.getHotNode({ ip: '1.2.3.4' }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'mongo down');
    assert.equal(activity[0][0], 'error');
  });
});
