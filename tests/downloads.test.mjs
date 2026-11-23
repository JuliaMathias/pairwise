import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadAll } from '../dist/downloads.mjs';

test('batch downloads preserve every output, name, offset and order, with spacing only between requests', async () => {
  const outputs = [41, 42, 43].map(index => ({ name: `Holiday-0${index}.png`, blob: new Blob([`PNG ${index}`]) }));
  const calls = [];
  const count = await downloadAll(outputs, {
    download(blob, name) { calls.push([name, blob]); },
    pause: async milliseconds => { calls.push(['pause', milliseconds]); },
    progress(done, total) { calls.push(['progress', done, total]); },
  });
  assert.equal(count, 3);
  assert.deepEqual(calls, [
    [outputs[0].name, outputs[0].blob], ['progress', 1, 3], ['pause', 300],
    [outputs[1].name, outputs[1].blob], ['progress', 2, 3], ['pause', 300],
    [outputs[2].name, outputs[2].blob], ['progress', 3, 3],
  ]);
  assert.equal(await downloadAll([], { download() { assert.fail('No empty downloads'); } }), 0);
});

test('batch reports only successful requests before an adapter error and keeps remaining outputs intact', async () => {
  const outputs = [{ name:'one.png' }, { name:'two.png' }, { name:'three.png' }];
  const requested = [];
  await assert.rejects(downloadAll(outputs, {
    download(_blob, name) { if (name === 'two.png') throw new Error('Synthetic download failure'); requested.push(name); },
    pause: async () => {},
    progress(count) { assert.equal(count, 1); },
  }), /Synthetic download failure/);
  assert.deepEqual(requested, ['one.png']);
  assert.equal(outputs.length, 3);
});
