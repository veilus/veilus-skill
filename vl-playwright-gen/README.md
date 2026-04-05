# vl-playwright-gen

> AI-powered Playwright test generator — inspects live web pages and generates production-ready Page Object Model scripts with resilient cascade selectors.

## What It Does

`vl-playwright-gen` is an AI coding skill that automates Playwright test creation through a 5-step guided workflow:

```
Setup → Discover → Plan → Generate → Validate
```

1. **🛠️ Setup** — Checks Playwright MCP, scaffolds project with `package.json` and config
2. **🔍 Discover** — Navigates to your pages, captures accessibility tree, identifies elements & external integration needs
3. **📋 Plan** — Presents findings, suggests integrations (a11y, reporting, CI/CD), gets your confirmation
4. **⚡ Generate** — Creates a single `.spec.ts` file with POM classes + tests, plus config and docs
5. **✅ Validate** — Runs tests, attempts auto-fixes, suggests next steps based on results

## Installation

### Gemini CLI / Antigravity

```bash
cp -r vl-playwright-gen/ your-project/.agent/skills/vl-playwright-gen/
```

### Claude Code

```bash
cp -r vl-playwright-gen/ your-project/.claude/skills/vl-playwright-gen/
```

### From GitHub

```bash
git clone https://github.com/veilus/veilus-skill.git
cp -r veilus-skill/vl-playwright-gen/ your-project/.agent/skills/vl-playwright-gen/
```

## Prerequisites

- **Node.js 18+**
- **Playwright MCP** — Add to your AI assistant's MCP configuration:
  ```json
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
  ```

## Usage

In your AI coding assistant, say any of:

```
"generate playwright tests for https://myapp.com/login"
"inspect this page and create tests"
"vl-playwright-gen"
```

The AI guides you through the full workflow interactively.

## Output

The skill generates a complete, runnable test project — **all Playwright code in a single file**:

```
your-output-dir/
├── tests/
│   └── login-flow.spec.ts     # POM classes + E2E tests (single file)
├── playwright.config.ts       # Browser config (VeilusBrowser-ready)
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md                  # Setup & run instructions
```

### Single-File Architecture

```typescript
// tests/login-flow.spec.ts

import { test, expect, type Page, type Locator } from '@playwright/test';

// ═══ Page Object Models ═══
class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.emailInput = page.getByLabel('Email')
      .or(page.getByRole('textbox', { name: /email/i }));
    // ... cascade selectors with .or() fallbacks
  }

  async login(email: string, password: string) { /* ... */ }
}

class DashboardPage { /* ... */ }

// ═══ Tests ═══
test.describe('Login Flow', () => {
  test('user can login and reach dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.TEST_EMAIL!, process.env.TEST_PASSWORD!);

    const dashboard = new DashboardPage(page);
    await expect(dashboard.welcomeHeading).toBeVisible();
  });
});
```

## Key Features

### 🎯 Cascade Selectors
Every element gets a priority chain with `.or()` fallbacks:
```
getByRole → getByLabel → getByText → getByTestId → CSS
```

### 🔌 External Integration Detection
AI auto-detects 15 common test automation scenarios and suggests appropriate solutions:

| Category | Detection | Suggestion |
|----------|-----------|------------|
| 🤖 CAPTCHA | `iframe[src*="recaptcha"]` | Solving APIs, Human Checkpoint |
| 📧 Email Verification | "check your email" text | Mailosaur, MailSlurp |
| 📱 SMS/OTP | `input[maxlength="6"]` | Twilio API |
| 💳 Payment | `iframe[src*="stripe"]` | Sandbox test cards |
| 🔐 OAuth | "Sign in with Google" | Token injection, mock OAuth |
| ♿ Accessibility | Always | axe-core WCAG scan |
| 📊 Reporting | Always | Allure rich reports |
| 🔄 CI/CD | Always | GitHub Actions template |
| 🔌 API Mocking | External API calls | MSW, page.route() |
| 🗄️ DB Seeding | Auth-required flows | Playwright fixtures |

### 🧠 3-Tier Integration Suggestion System

| Trigger | When | Examples |
|---------|------|---------|
| **Auto-Detect** | Step 2 — DOM/URL/Network scan | CAPTCHA, OAuth, Payment |
| **Context-Based** | Step 3 — Analyze findings | API Mocking, DB Seeding, Visual Regression |
| **Result-Based** | Step 5 — Test pass/fail results | AI Self-Healing, Cloud Testing, Monitoring |

### 🛡️ Other Features
- **Human Checkpoints** — Auto-detects CAPTCHA/MFA, inserts `page.pause()`
- **Credential Safety** — All secrets via `process.env.*`, never hardcoded
- **VeilusBrowser Support** — Config toggle for custom browser paths
- **Anti-Bot Resilience** — Stealth plugin + proxy patterns

## Skill Structure

```
vl-playwright-gen/
├── SKILL.md                              # Entry point (AI reads this first)
├── workflow.md                           # 5-step orchestrator
├── steps/
│   ├── step-01-setup.md                  # MCP check & scaffold
│   ├── step-02-discover.md               # Navigate, inspect & detect integrations
│   ├── step-03-plan.md                   # Review findings, suggest integrations
│   ├── step-04-generate.md               # Single-file code generation
│   └── step-05-validate.md               # Dry-run, auto-fix & delivery
├── scripts/
│   ├── check-mcp.mjs                     # MCP availability check
│   ├── scaffold.mjs                      # Project scaffolding
│   └── validate.mjs                      # Test runner
├── resources/
│   ├── playwright-best-practices.md      # Selector rules & anti-patterns
│   └── external-integrations.md          # 15 integration categories with code
└── README.md                             # This file
```

## License

MIT — [Veilus](https://veilus.io)
