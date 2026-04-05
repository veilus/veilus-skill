#!/usr/bin/env node

/**
 * scaffold.mjs — Create Playwright test project structure
 * Part of vl-playwright-gen skill
 * 
 * Usage: node scripts/scaffold.mjs [output-dir]
 * Default output: ./playwright-gen-output/
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function writeIfNotExists(filePath, content, label) {
  if (existsSync(filePath)) {
    log('⏭️', `${DIM}Skipped (exists): ${label}${RESET}`);
    return false;
  }
  writeFileSync(filePath, content, 'utf-8');
  log('✅', `${GREEN}Created: ${label}${RESET}`);
  return true;
}

function scaffold(outputDir) {
  const root = resolve(outputDir);

  log('🎭', `${BOLD}vl-playwright-gen — Project Scaffold${RESET}\n`);
  log('📁', `Output directory: ${root}\n`);

  // Create directories
  mkdirSync(join(root, 'pages'), { recursive: true });
  mkdirSync(join(root, 'tests'), { recursive: true });
  log('📂', `${GREEN}Directories created: pages/, tests/${RESET}`);

  // package.json
  const packageJson = JSON.stringify({
    name: 'playwright-gen-output',
    version: '1.0.0',
    type: 'module',
    scripts: {
      test: 'playwright test',
      'test:headed': 'playwright test --headed',
      'test:debug': 'playwright test --debug',
      'test:report': 'playwright show-report',
    },
    devDependencies: {
      '@playwright/test': '^1.49.0',
      dotenv: '^16.4.0',
    },
  }, null, 2) + '\n';
  writeIfNotExists(join(root, 'package.json'), packageJson, 'package.json');

  // tsconfig.json
  const tsConfig = JSON.stringify({
    compilerOptions: {
      target: 'ESNext',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: false,
      outDir: './dist',
    },
    include: ['pages/**/*.ts', 'tests/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2) + '\n';
  writeIfNotExists(join(root, 'tsconfig.json'), tsConfig, 'tsconfig.json');

  // .gitignore
  const gitignore = `# Dependencies
node_modules/

# Environment
.env

# Playwright
test-results/
playwright-report/
blob-report/

# OS
.DS_Store
Thumbs.db
`;
  writeIfNotExists(join(root, '.gitignore'), gitignore, '.gitignore');

  // Install dependencies
  console.log(`\n${YELLOW}📦 Installing dependencies...${RESET}`);
  try {
    execSync('npm install', { cwd: root, stdio: 'inherit' });
    log('✅', `${GREEN}Dependencies installed${RESET}`);
  } catch (error) {
    log('⚠️', `${YELLOW}npm install failed — run manually: cd ${root} && npm install${RESET}`);
  }

  // Install Chromium
  console.log(`\n${YELLOW}🌐 Installing Chromium browser...${RESET}`);
  try {
    execSync('npx playwright install chromium', { cwd: root, stdio: 'inherit' });
    log('✅', `${GREEN}Chromium installed${RESET}`);
  } catch (error) {
    log('⚠️', `${YELLOW}Browser install failed — run manually: npx playwright install chromium${RESET}`);
  }

  // Summary
  console.log(`\n${GREEN}${BOLD}✅ Scaffold complete!${RESET}\n`);
  console.log(`${DIM}Project structure:${RESET}`);
  console.log(`  ${root}/`);
  console.log(`  ├── pages/           ${DIM}# Page Object Model files${RESET}`);
  console.log(`  ├── tests/           ${DIM}# Test spec files${RESET}`);
  console.log(`  ├── package.json     ${DIM}# Dependencies${RESET}`);
  console.log(`  ├── tsconfig.json    ${DIM}# TypeScript config${RESET}`);
  console.log(`  └── .gitignore       ${DIM}# Git exclusions${RESET}`);
  console.log('');
}

// CLI entry point
const outputDir = process.argv[2] || './playwright-gen-output';
scaffold(outputDir);
