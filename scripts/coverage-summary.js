/* eslint-env node */
/**
 * Writes the Jest coverage totals into the GitHub Actions job summary.
 * Run after `npm run test:ci`. Safe to run locally: it prints to the console.
 */
const fs = require('fs');
const path = require('path');

const summaryFile = path.join(
  __dirname,
  '..',
  'coverage',
  'coverage-summary.json',
);

if (!fs.existsSync(summaryFile)) {
  console.log('No coverage summary found, skipping.');
  process.exit(0);
}

const {total} = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
const metrics = ['statements', 'branches', 'functions', 'lines'];

const lines = [
  '### Unit test coverage',
  '',
  '| Metric | Covered |',
  '| --- | --- |',
  ...metrics.map(metric => `| ${metric} | ${total[metric].pct}% |`),
  '',
];

const markdown = lines.join('\n');

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
} else {
  console.log(markdown);
}
