import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from './env.js';

loadEnv();

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

console.log('Clean client workspace initialized. Set SEED_DEMO=false in .env before running `npm start` for a blank customer install.');
