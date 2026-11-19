import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR } from './db.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per upload

function sanitizeFilename(name) {
  const base = path.basename(name || 'attachment.bin');
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'attachment.bin';
}

export function parseMultipart(buffer, contentType) {
  const fields = {};
  const attachments = [];

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (!boundaryMatch) {
    return { fields, attachments };
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const delimiter = Buffer.from(`--${boundary}`);
  const headerBreak = Buffer.from('\r\n\r\n');

  let pos = buffer.indexOf(delimiter);
  while (pos !== -1) {
    const start = pos + delimiter.length;
    if (buffer.slice(start, start + 2).toString('utf8') === '--') {
      break;
    }

    const nextPos = buffer.indexOf(delimiter, start);
    if (nextPos === -1) break;

    let part = buffer.slice(start, nextPos);
    if (part.slice(0, 2).toString('utf8') === '\r\n') {
      part = part.slice(2);
    }
    if (part.slice(-2).toString('utf8') === '\r\n') {
      part = part.slice(0, -2);
    }

    const headerEnd = part.indexOf(headerBreak);
    if (headerEnd === -1) {
      pos = nextPos;
      continue;
    }

    const headerText = part.slice(0, headerEnd).toString('utf8');
    const body = part.slice(headerEnd + 4);

    const dispMatch = headerText.match(/content-disposition:\s*form-data;([^\r\n]+)/i);
    if (!dispMatch) {
      pos = nextPos;
      continue;
    }

    const nameMatch = dispMatch[1].match(/name="([^"]+)"/i);
    const filenameMatch = dispMatch[1].match(/filename="([^"]*)"/i);
    const typeMatch = headerText.match(/content-type:\s*([^\r\n]+)/i);

    if (!nameMatch) {
      pos = nextPos;
      continue;
    }

    const fieldName = nameMatch[1];

    if (filenameMatch) {
      const originalName = filenameMatch[1];
      if (originalName && body.length > 0 && body.length <= MAX_FILE_SIZE) {
        const safeName = sanitizeFilename(originalName);
        const storedName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeName}`;
        const fullPath = path.join(UPLOADS_DIR, storedName);
        fs.writeFileSync(fullPath, body);

        attachments.push({
          field: fieldName,
          originalName,
          storedName,
          mimeType: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
          size: body.length,
          url: `/uploads/${storedName}`,
        });
      }
    } else {
      const value = body.toString('utf8');
      if (Object.prototype.hasOwnProperty.call(fields, fieldName)) {
        if (Array.isArray(fields[fieldName])) {
          fields[fieldName].push(value);
        } else {
          fields[fieldName] = [fields[fieldName], value];
        }
      } else {
        fields[fieldName] = value;
      }
    }

    pos = nextPos;
  }

  return { fields, attachments };
}
