import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, 'data.json');

console.log('Analyzing existing commit dates for streak continuity...');

const logOutput = execFileSync('git', ['log', '--format=%ad', '--date=format:%Y-%m-%d'], {
  cwd: __dirname,
  encoding: 'utf8',
});

const existingDates = new Set(logOutput.trim().split('\n').filter(Boolean));

const now = new Date();
const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

const missingDates = [];

for (let d = new Date(oneYearAgo); d <= now; d.setDate(d.getDate() + 1)) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  if (!existingDates.has(dateStr)) {
    missingDates.push(new Date(d));
  }
}

// Also ensure today has additional fresh commits
missingDates.push(new Date(now));

console.log(`Found ${missingDates.length} days to backfill for an unbroken streak.`);

// Read existing commit count
let completed = 0;
try {
  const existing = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  if (existing && existing.commitNumber) {
    completed = existing.commitNumber;
  }
} catch (e) {}

const commitsToMake = [];

for (const dateObj of missingDates) {
  // Add 2 to 4 commits per missing day
  const count = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < count; i++) {
    const commitDate = new Date(dateObj);
    const hour = Math.floor(Math.random() * 12) + 9; // 9 AM to 9 PM
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    commitDate.setHours(hour, minute, second);

    if (commitDate <= now) {
      commitsToMake.push(commitDate);
    }
  }
}

commitsToMake.sort((a, b) => a.getTime() - b.getTime());
console.log(`Creating ${commitsToMake.length} commits to seal all streak gaps...`);

for (const commitDate of commitsToMake) {
  const isoStr = commitDate.toISOString();
  const data = {
    date: isoStr,
    commitNumber: ++completed,
    streakFiller: true,
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
      `Streak continuity: ${commitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    ],
    {
      cwd: __dirname,
      env,
      stdio: 'pipe',
    }
  );
}

console.log(`Streak gap backfill complete! Total commits now: ${completed}`);
