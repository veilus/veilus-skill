#!/usr/bin/env node

/**
 * check-mcp.mjs — Verify Playwright MCP availability
 * Part of vl-playwright-gen skill
 * 
 * Usage: node scripts/check-mcp.mjs
 * Exit codes: 0 = MCP available, 1 = MCP not found
 */

import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

function log(emoji, color, message) {
  console.log(`${color}${emoji} ${message}${RESET}`);
}

function checkPlaywrightMCP() {
  log('🎭', BOLD, 'vl-playwright-gen — MCP Health Check\n');

  // Check 1: Node.js version
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split('.')[0], 10);
  if (major < 18) {
    log('❌', RED, `Node.js 18+ required. Current: v${nodeVersion}`);
    process.exit(1);
  }
  log('✅', GREEN, `Node.js: v${nodeVersion}`);

  // Check 2: @playwright/mcp package
  let mcpFound = false;
  try {
    // Try to resolve the package
    const require = createRequire(import.meta.url);
    require.resolve('@playwright/mcp');
    mcpFound = true;
  } catch {
    // Not installed locally — check if npx can find it
    try {
      execSync('npx --yes @playwright/mcp@latest --help', {
        stdio: 'pipe',
        timeout: 30000,
      });
      mcpFound = true;
    } catch {
      mcpFound = false;
    }
  }

  if (mcpFound) {
    log('✅', GREEN, 'Playwright MCP: Ready');
  } else {
    log('❌', RED, 'Playwright MCP: Not found\n');
    log('💡', YELLOW, 'To install, add Playwright MCP to your AI assistant:\n');
    console.log(`  ${BOLD}For Antigravity:${RESET}`);
    console.log(`    Add to MCP settings → Server: playwright`);
    console.log(`    Command: npx @playwright/mcp@latest\n`);
    console.log(`  ${BOLD}For Claude Code:${RESET}`);
    console.log(`    Add to MCP config: npx @playwright/mcp@latest\n`);
    process.exit(1);
  }

  // Check 3: @playwright/test package
  let playwrightTestFound = false;
  try {
    const require = createRequire(import.meta.url);
    require.resolve('@playwright/test');
    playwrightTestFound = true;
  } catch {
    playwrightTestFound = false;
  }

  if (playwrightTestFound) {
    log('✅', GREEN, '@playwright/test: Installed');
  } else {
    log('ℹ️', YELLOW, '@playwright/test: Not installed (will be added during scaffold)');
  }

  // Summary
  console.log(`\n${GREEN}${BOLD}All checks passed! Ready to generate tests.${RESET}\n`);
  process.exit(0);
}

checkPlaywrightMCP();
