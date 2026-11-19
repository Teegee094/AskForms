import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.env.DATA_DIR || './data');
const dbPath = path.join(dataDir, 'formflow.db');
const uploadsDir = path.join(dataDir, 'uploads');

for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
  }
}

if (fs.existsSync(uploadsDir)) {
  fs.rmSync(uploadsDir, { recursive: true, force: true });
}

console.log('FormFlow database cleared. Run `npm start` to re-seed.');
