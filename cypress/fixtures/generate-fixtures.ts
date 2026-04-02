/**
 * generate-fixtures.ts
 * Run once before tests: npx ts-node cypress/fixtures/generate-fixtures.ts
 *
 * Creates:
 *   - photo_valid.jpg     (~100KB — well under 8MB limit)
 *   - photo_too_large.jpg (~9MB — over the 8MB limit)
 */

import * as fs from 'fs';
import * as path from 'path';

const FIXTURES_DIR = path.join(__dirname);

function createJpegBuffer(sizeBytes: number): Buffer {
  // Minimal valid JPEG header + padded body to reach target size
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xdb, 0x00, 0x43, 0x00,
  ]);
  const jpegFooter = Buffer.from([0xff, 0xd9]);
  const padding = Buffer.alloc(sizeBytes - jpegHeader.length - jpegFooter.length, 0x00);
  return Buffer.concat([jpegHeader, padding, jpegFooter]);
}

const validPhoto = createJpegBuffer(100 * 1024); // 100 KB
fs.writeFileSync(path.join(FIXTURES_DIR, 'photo_valid.jpg'), validPhoto);
console.log('Created photo_valid.jpg (~100KB)');

const tooLargePhoto = createJpegBuffer(9 * 1024 * 1024); // 9 MB
fs.writeFileSync(path.join(FIXTURES_DIR, 'photo_too_large.jpg'), tooLargePhoto);
console.log('Created photo_too_large.jpg (~9MB)');
