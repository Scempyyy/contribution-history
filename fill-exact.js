import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, 'data.json');

const targetDates = [
  "2025-11-06",
  "2025-11-10",
  "2025-11-12",
  "2025-11-13",
  "2025-11-14",
  "2025-11-20",
  "2025-11-21",
  "2025-11-28",
  "2025-11-29",
  "2025-11-30",
  "2025-12-03",
  "2025-12-06",
  "2025-12-07",
  "2025-12-10",
  "2025-12-14",
  "2025-12-15",
  "2025-12-17",
  "2025-12-18",
  "2025-12-20",
  "2025-12-21",
  "2025-12-25",
  "2025-12-27",
  "2025-12-28",
  "2025-12-31"
];

console.log(`Backfilling exact ${targetDates.length} days...`);

let completed = 0;
try {
  const existing = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  if (existing && existing.commitNumber) {
    completed = existing.commitNumber;
  }
} catch (e) {}

for (const dateStr of targetDates) {
  // Make 3 commits per day to be solidly green
  for (let i = 0; i < 3; i++) {
    const hour = 10 + i * 3; // 10:00, 13:00, 16:00
    const minute = 15 + i * 10;
    const second = 20 + i * 5;
    const isoStr = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}Z`;

    const data = {
      date: isoStr,
      commitNumber: ++completed,
      targetDate: dateStr,
    };

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2) + '\n');
    execFileSync('git', ['add', 'data.json'], { cwd: __dirname });

    const env = {
      ...process.env,
      GIT_AUTHOR_DATE: isoStr,
      GIT_COMMITTER_DATE: isoStr,
    };

    execFileSync(
      'git',
      [
        'commit',
        '-m',
        `Streak lock: ${dateStr}`,
      ],
      {
        cwd: __dirname,
        env,
        stdio: 'pipe',
      }
    );
  }
}

console.log(`Successfully created ${targetDates.length * 3} commits! Pushing to GitHub...`);
