import test from 'node:test';
import assert from 'node:assert/strict';
import { readPhotos, encodePng } from '../dist/photos.mjs';

test('photo import accepts browser-supported raster files and excludes failures without leaking rejected URLs', async t => {
  const previousImage = globalThis.Image;
  const sources = new Map();
  const revoked = [];
  t.after(() => {
    if (previousImage === undefined) delete globalThis.Image;
    else globalThis.Image = previousImage;
  });
  t.mock.method(URL, 'createObjectURL', file => {
    const url = `blob:synthetic-${sources.size}`;
    sources.set(url, file);
    return url;
  });
  t.mock.method(URL, 'revokeObjectURL', url => revoked.push(url));
  globalThis.Image = class {
    async decode() {
      const source = sources.get(this.src);
      if (source.name === 'corrupt.png') throw new Error('Synthetic decode failure');
      this.naturalWidth = source.width ?? 300;
      this.naturalHeight = source.height ?? 200;
    }
  };
  const file = (name, type = 'image/png', overrides = {}) => ({ name, type, size: 10, ...overrides });
  const result = await readPhotos([
    file('regular.png'),
    file('no-mime.JPG', ''),
    file('binary.webp', 'application/octet-stream'),
    file('bitmap.bmp', 'image/x-ms-bmp'),
    file('limit.png', 'image/png', { width:8000, height:5000 }),
    file('corrupt.png'),
    file('too-many-pixels.png', 'image/png', { width:8001, height:5000 }),
    file('too-many-bytes.png', 'image/png', { size:100*1024*1024 + 1 }),
    file('unsafe.svg', 'image/svg+xml'),
    file('wrong-mime.png', 'text/plain'),
  ]);
  assert.deepEqual(result.photos.map(photo => photo.name), ['regular.png','no-mime.JPG','binary.webp','bitmap.bmp','limit.png']);
  assert.equal(result.errors.length, 5);
  assert.ok(result.errors.some(error => error.startsWith('corrupt.png:')));
  assert.ok(result.errors.some(error => error.startsWith('too-many-pixels.png:')));
  assert.equal(sources.size, 7, 'oversized bytes and unsupported types never allocate a URL');
  assert.deepEqual(revoked, ['blob:synthetic-5','blob:synthetic-6']);
  assert.equal(result.photos[0].width, 300);
  assert.equal(result.photos[0].height, 200);
});

test('PNG encoding returns the browser blob', async () => {
  const expected = new Blob(['synthetic PNG'], {type:'image/png'});
  const canvas = {toBlob(callback, type) { assert.equal(type,'image/png');callback(expected); }};
  assert.equal(await encodePng(canvas), expected);
});

test('PNG encoding reports browser encoding failure', async () => {
  await assert.rejects(encodePng({toBlob(callback) { callback(null); }}), /Could not encode/);
});
