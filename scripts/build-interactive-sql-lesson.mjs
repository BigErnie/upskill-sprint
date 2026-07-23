import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const payloadFiles = [1, 2, 3, 4].map((part) =>
  path.join(root, '.tmp', `sql-lesson.part${part}`)
);

for (const payloadFile of payloadFiles) {
  if (!fs.existsSync(payloadFile)) {
    throw new Error(`Missing SQL lesson payload: ${path.relative(root, payloadFile)}`);
  }
}

const encoded = payloadFiles
  .map((payloadFile) => fs.readFileSync(payloadFile, 'utf8').trim())
  .join('');

const archivePath = path.join(os.tmpdir(), 'upskillsprint-sql-lesson.tar.gz');
fs.writeFileSync(archivePath, Buffer.from(encoded, 'base64'));

const lessonsDir = path.join(root, 'lessons');
fs.mkdirSync(lessonsDir, { recursive: true });

const extraction = spawnSync('tar', ['-xzf', archivePath, '-C', lessonsDir], {
  cwd: root,
  encoding: 'utf8'
});

if (extraction.status !== 0) {
  throw new Error(`Unable to extract SQL lesson assets: ${extraction.stderr || extraction.stdout}`);
}

const catalogPath = path.join(root, 'lessons.html');
const catalog = fs.readFileSync(catalogPath, 'utf8');

const placeholder = `            <a class="lesson-row" href="lesson-template.html" data-lesson-item data-topic="power-bi-excel-sql" data-level="beginner" data-interactive="false" data-search="first sql query select where join database">
              <div>
                <div class="lesson-meta"><span>Beginner</span><span>10 min read</span><span>SQL</span></div>
                <h3>Writing Your First SQL Query</h3>
                <p>Learn SELECT, WHERE, and JOIN—enough SQL to start pulling your own data.</p>
              </div>
              <span class="lesson-action">Start lesson <span class="lesson-arrow" aria-hidden="true">&rarr;</span></span>
            </a>`;

const replacement = `            <a class="lesson-row" href="/lessons/writing-your-first-sql-query" data-lesson-item data-topic="power-bi-excel-sql" data-level="beginner" data-interactive="true" data-search="first sql query select from where order by group by having join limit sqlite sql server database live editor practice quiz interactive">
              <div>
                <div class="lesson-meta"><span>Beginner</span><span>Interactive</span><span>35 min read</span><span>SQL</span></div>
                <h3>Writing Your First SQL Query</h3>
                <p>Write and run SQL in a live browser lab while learning SELECT, FROM, WHERE, ORDER BY, GROUP BY, HAVING, JOIN, and LIMIT.</p>
              </div>
              <span class="lesson-action">Start lesson <span class="lesson-arrow" aria-hidden="true">&rarr;</span></span>
            </a>`;

if (!catalog.includes(placeholder)) {
  throw new Error('The Writing Your First SQL Query placeholder card was not found in lessons.html.');
}

fs.writeFileSync(catalogPath, catalog.replace(placeholder, replacement), 'utf8');

for (const payloadFile of payloadFiles) {
  fs.rmSync(payloadFile, { force: true });
}

try {
  fs.rmdirSync(path.join(root, '.tmp'));
} catch {
  // Leave the directory in place when another temporary build asset uses it.
}

fs.rmSync(archivePath, { force: true });

console.log('Interactive SQL lesson installed and lesson catalog updated.');
