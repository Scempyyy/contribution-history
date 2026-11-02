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

console.log('Generating realistic commit history for the past year...');

const now = new Date();
const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

// Generate list of dates with commit counts
const commitsToMake = [];

for (let d = new Date(oneYearAgo); d <= now; d.setDate(d.getDate() + 1)) {
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Weekdays: 65% chance of commits; Weekends: 30% chance
  const commitChance = isWeekend ? 0.30 : 0.65;
  if (Math.random() > commitChance) {
    continue;
  }

  // Distribution of commits per active day
  // 1 commit (60%), 2 commits (25%), 3 commits (10%), 4-5 commits (5%)
  const roll = Math.random();
  let numCommits = 1;
  if (roll > 0.95) {
    numCommits = Math.floor(Math.random() * 2) + 4; // 4 or 5
  } else if (roll > 0.85) {
    numCommits = 3;
  } else if (roll > 0.60) {
    numCommits = 2;
  }

  for (let i = 0; i < numCommits; i++) {
    // Pick realistic hours between 09:00 and 22:59
    const commitDate = new Date(d);
    const hour = Math.floor(Math.random() * 14) + 9;
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

console.log(`Total commits planned: ${commitsToMake.length}`);

// Initial README if not present
const readmePath = path.join(__dirname, 'README.md');
if (!fs.existsSync(readmePath)) {
  fs.writeFileSync(
    readmePath,
    '# Contribution History\n\nAutomated activity and contribution tracker.\n'
  );
  execFileSync('git', ['add', 'README.md'], { cwd: __dirname });
}

// Execute commits in chronological order
let completed = 0;
for (const commitDate of commitsToMake) {
  const isoStr = commitDate.toISOString();
  const data = {
    date: isoStr,
    commitNumber: ++completed,
    totalPlanned: commitsToMake.length,
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

console.log(`Successfully created ${completed} commits!`);
