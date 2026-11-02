import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, 'data.json');

// Ensure git branch is main
try {
  execFileSync('git', ['branch', '-M', 'main'], { cwd: __dirname });
} catch (e) {
  // Ignore if already main
}

console.log('Generating high-density contribution activity for the past year...');

const now = new Date();
const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

// Generate list of dates with commit counts for dense activity
const commitsToMake = [];

for (let d = new Date(oneYearAgo); d <= now; d.setDate(d.getDate() + 1)) {
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 92% chance on weekdays, 65% chance on weekends
  const commitChance = isWeekend ? 0.65 : 0.92;
  if (Math.random() > commitChance) {
    continue;
  }

  // Distribution for rich, vibrant green activity
  // ~35% get 2 commits, ~35% get 3-4 commits, ~20% get 5-6 commits, ~10% get 7-10 commits
  const roll = Math.random();
  let numCommits = 2;
  if (roll > 0.90) {
    numCommits = Math.floor(Math.random() * 4) + 7; // 7-10
  } else if (roll > 0.70) {
    numCommits = Math.floor(Math.random() * 2) + 5; // 5-6
  } else if (roll > 0.35) {
    numCommits = Math.floor(Math.random() * 2) + 3; // 3-4
  }

  for (let i = 0; i < numCommits; i++) {
    const commitDate = new Date(d);
    const hour = Math.floor(Math.random() * 15) + 8; // Between 08:00 and 23:00
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    commitDate.setHours(hour, minute, second);

    if (commitDate <= now) {
      commitsToMake.push(commitDate);
    }
  }
}

// Sort chronologically
commitsToMake.sort((a, b) => a.getTime() - b.getTime());

console.log(`Total new commits planned: ${commitsToMake.length}`);

// Get existing commit count
let completed = 0;
try {
  const existing = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  if (existing && existing.commitNumber) {
    completed = existing.commitNumber;
  }
} catch (e) {
  // start from 0
}

const startNum = completed;
const totalTarget = startNum + commitsToMake.length;

// Execute commits in chronological order
for (const commitDate of commitsToMake) {
  const isoStr = commitDate.toISOString();
  const data = {
    date: isoStr,
    commitNumber: ++completed,
    totalPlanned: totalTarget,
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
      `Activity update: ${commitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    ],
    {
      cwd: __dirname,
      env,
      stdio: 'pipe',
    }
  );
}

console.log(`Successfully created ${commitsToMake.length} new commits! Total commits in repo: ${completed}`);
