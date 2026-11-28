const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(new URL('../magaza/erp-shell.js', 'file://' + __filename), 'utf8');

function startShell(getSession) {
  const listeners = new Map();
  const frames = [];
  const timers = new Set();
  const element = () => ({
    hidden: false, style: {}, classList: { toggle() {}, remove() {} },
    setAttribute() {}, addEventListener() {}, querySelectorAll: () => [],
    append() {}, replaceChildren() { this.recovered = true; },
  });
  const stage = element();
  stage.append = frame => frames.push(frame);
  const notice = element();
  const nodes = { 'erp-shell-stage': stage, 'erp-shell-notice': notice };
  vm.runInNewContext(source, {
    window: {
      __konakErpClient: { auth: { getSession } },
      addEventListener: (event, listener) => listeners.set(event, listener),
    },
    document: {
      getElementById: id => nodes[id] || element(),
      createElement: element, querySelector: element, querySelectorAll: () => [],
      body: element(), addEventListener() {},
    },
    location: new URL('https://example.test/magaza/?view=invalid'),
    URL, URLSearchParams, console: { warn() {} },
    setTimeout() { const timer = Symbol(); timers.add(timer); return timer; },
    clearTimeout: timer => timers.delete(timer),
  });
  return { listeners, frames, notice, timers };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('a session error opens the recovery screen without loading orders', async () => {
  const shell = startShell(async () => ({ data: { session: null }, error: new Error('offline') }));
  await flush();
  assert.equal(shell.notice.recovered, true);
  assert.equal(shell.frames.length, 0);
  assert.equal(shell.timers.size, 0);
});

test('concurrent refresh events are coalesced before showing the orders login', async () => {
  const pending = [];
  const shell = startShell(() => new Promise(resolve => pending.push(resolve)));
  const refresh = () => shell.listeners.get('message')({
    origin: 'https://example.test', data: { type: 'konak-erp-members-changed' },
  });
  refresh();
  refresh();
  assert.equal(pending.length, 1);
  pending[0]({ data: { session: null } });
  await flush();
  assert.equal(pending.length, 2);
  assert.equal(shell.frames.length, 0);
  pending[1]({ data: { session: null } });
  await flush();
  assert.equal(shell.frames.length, 1);
  assert.match(shell.frames[0].src, /\/magaza\/orders\.html\?/);
  assert.equal(shell.timers.size, 1);
});
