#!/usr/bin/env node

/**
 * validate.mjs — Run generated Playwright tests and report results
 * Part of vl-playwright-gen skill
 * 
 * Usage: node scripts/validate.mjs [output-dir]
 * Default: ./playwright-gen-output/
 */

import { execSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function validate(outputDir) {
  const root = resolve(outputDir);

  log('🎭', `${BOLD}vl-playwright-gen — Test Validation${RESET}\n`);
  log('📁', `Project: ${root}\n`);

  // Check project exists
  if (!existsSync(join(root, 'package.json'))) {
    log('❌', `${RED}No package.json found in ${root}${RESET}`);
    log('💡', `${YELLOW}Run scaffold first: node scripts/scaffold.mjs ${outputDir}${RESET}`);
    process.exit(1);
  }

  // Check test files exist
  if (!existsSync(join(root, 'tests'))) {
    log('❌', `${RED}No tests/ directory found${RESET}`);
    process.exit(1);
  }

  // Check .env exists
  if (!existsSync(join(root, '.env'))) {
    if (existsSync(join(root, '.env.example'))) {
      log('⚠️', `${YELLOW}.env not found. Copy from .env.example:${RESET}`);
      log('💡', `  cp ${join(root, '.env.example')} ${join(root, '.env')}`);
      log('', `  Then fill in your test credentials.\n`);
    }
  }

  // Run tests
  log('🧪', `${BOLD}Running Playwright tests...${RESET}\n`);

  try {
    const output = execSync('npx playwright test --reporter=list', {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 120000,
    });

    console.log(output);
    log('✅', `${GREEN}${BOLD}All tests passed!${RESET}\n`);
    process.exit(0);
  } catch (error) {
    // Tests failed — output stderr/stdout
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);

    log('❌', `${RED}${BOLD}Some tests failed.${RESET}\n`);
    log('💡', `${YELLOW}Common fixes:${RESET}`);
    console.log(`  • Selector not found → check element still exists on page`);
    console.log(`  • Timeout → increase timeout or add explicit waits`);
    console.log(`  • Auth required → fill in .env with valid test credentials`);
    console.log(`  • CAPTCHA → tests will pause at page.pause() for manual intervention\n`);

    process.exit(1);
  }
}

// CLI entry point
const outputDir = process.argv[2] || './playwright-gen-output';
validate(outputDir);
