# veilus-skill

> Collection of AI coding skills by [Veilus](https://veilus.io) — plug-and-play modules that extend AI coding assistants with specialized automation capabilities.

## Skills

| Skill | Description | Status |
|-------|-------------|--------|
| [**vl-playwright-gen**](./vl-playwright-gen/) | AI-powered Playwright test generator with cascade selectors and external integration detection | ✅ Stable |

---

## vl-playwright-gen

### Overview

`vl-playwright-gen` is an AI coding skill that **turns any web page into production-ready Playwright tests** in minutes. Instead of manually inspecting DOM elements and writing selectors, the AI:

1. Navigates to your live web pages using Playwright MCP
2. Captures the full accessibility tree and identifies all interactive elements
3. Generates resilient Page Object Model classes with cascade `.or()` selectors
4. Creates E2E test specs with meaningful assertions
5. Runs the tests, auto-fixes failures, and delivers a ready-to-use project

### The Problem It Solves

Writing Playwright tests manually requires:
- Inspecting every element to find the best selector
- Handling selector fragility (IDs change, classes get renamed)
- Dealing with CAPTCHAs, OAuth popups, payment iframes
- Setting up project config, environment variables, CI/CD

**vl-playwright-gen automates all of this.** You give it a URL, it gives you working tests.

---

### How It Works — 5-Step Workflow

```
┌──────────┐   ┌───────────┐   ┌────────┐   ┌───────────┐   ┌───────────┐
│  Setup   │ → │ Discover  │ → │  Plan  │ → │ Generate  │ → │ Validate  │
│ scaffold │   │  inspect  │   │ review │   │   code    │   │  dry-run  │
└──────────┘   └───────────┘   └────────┘   └───────────┘   └───────────┘
```

#### Step 1: Setup
- Verifies Playwright MCP server is running
- Creates the output project directory
- Scaffolds `package.json` with all dependencies
- Installs packages and Playwright browsers

#### Step 2: Discover (Page Inspection)
- Navigates to each URL you provide
- Takes an accessibility snapshot of the entire page
- Identifies all interactive elements (buttons, inputs, links, forms)
- **Auto-detects external integration needs** — flags CAPTCHAs, OAuth buttons, payment forms, email verification flows, etc.
- Assigns confidence levels to each element's selector

```
Example output:

📋 Page: Login (https://myapp.com/login)
| # | Element       | Type   | Selector                              | Confidence |
|---|---------------|--------|---------------------------------------|------------|
| 1 | emailInput    | input  | getByLabel('Email')                   | 🟢 high    |
| 2 | passwordInput | input  | getByLabel('Password')                | 🟢 high    |
| 3 | loginButton   | button | getByRole('button', {name: 'Log in'}) | 🟢 high    |
| 4 | googleLogin   | button | getByText('Sign in with Google')      | 🟡 medium  |

⚠️ Flags:
  🔐 OAuth/Social login detected → suggest token injection
  ♿ Accessibility scan recommended → axe-core
```

#### Step 3: Plan (Review & Confirm)
- Presents all findings in a clear table
- Shows the file generation plan
- **Suggests external integrations** based on what was detected:
  - **Always recommended:** Accessibility (axe-core), Reporting (Allure), CI/CD pipeline
  - **Context-based:** API Mocking, Database Seeding, Visual Regression
- You choose what to include: `[Y] Yes, all` / `[N] No, skip` / `[S] Select specific`
- You can exclude elements, add manual selectors, or re-inspect pages

#### Step 4: Generate (Code Output)
- Generates **a single `.spec.ts` file** containing:
  - Page Object Model classes (local, not exported)
  - E2E test specs with assertions
- Also generates: `playwright.config.ts`, `.env.example`, `.gitignore`, `README.md`
- If integrations were accepted: generates CI/CD workflow, accessibility tests, API mock helpers, etc.

```typescript
// tests/login-flow.spec.ts — EVERYTHING IN ONE FILE

import { test, expect, type Page, type Locator } from '@playwright/test';

// ═══════════════════════════════════
// Page Object Models
// ═══════════════════════════════════

class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email')
      .or(page.getByRole('textbox', { name: /email/i }));
    this.passwordInput = page.getByLabel('Password')
      .or(page.getByRole('textbox', { name: /password/i }));
    this.loginButton = page.getByRole('button', { name: 'Log in' })
      .or(page.getByText('Log in'));
  }

  async goto() {
    await this.page.goto(process.env.BASE_URL + '/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

class DashboardPage {
  readonly welcomeHeading: Locator;
  // ...
}

// ═══════════════════════════════════
// Tests
// ═══════════════════════════════════

test.describe('Login Flow', () => {
  test('user can login and reach dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();

    await loginPage.login(
      process.env.TEST_EMAIL!,
      process.env.TEST_PASSWORD!,
    );

    const dashboard = new DashboardPage(page);
    await expect(dashboard.welcomeHeading).toBeVisible();
  });
});
```

#### Step 5: Validate (Dry-Run & Deliver)
- Runs the generated tests with `npx playwright test`
- If tests fail: analyzes error patterns and auto-fixes (up to 2 retries)
  - Selector timeout → try next selector in cascade
  - Multiple matches → add `.first()` disambiguation
  - CAPTCHA detected → suggest solving strategies
- **Suggests next steps based on results:**
  - Tests passed → suggest cross-browser testing, production monitoring
  - Selector failures → suggest AI self-healing
  - Always → suggest accessibility, reporting, CI/CD

---

### Cascade Selectors

The core innovation — every element gets a **priority chain** of selectors with `.or()` fallbacks:

```
Priority 1: getByRole()        — semantic, accessibility-based (most resilient)
Priority 2: getByLabel()       — form labels
Priority 3: getByText()        — visible text content
Priority 4: getByTestId()      — data-testid attributes
Priority 5: CSS selector       — last resort

Combined with .or():
page.getByRole('button', { name: 'Submit' })
  .or(page.getByText('Submit'))
  .or(page.locator('[data-testid="submit-btn"]'))
```

If the UI changes (text update, class rename), the test **still works** because the fallback kicks in.

---

### External Integration Detection

The AI automatically detects **15 common test automation scenarios** during page inspection and suggests appropriate solutions:

#### Auto-Detected (Step 2 — DOM/URL scan)

| Signal | Detection Method | Suggestion |
|--------|-----------------|------------|
| 🤖 CAPTCHA | `iframe[src*="recaptcha"]`, URL `/sorry/` | 2Captcha API, Human Checkpoint, stealth plugin |
| 📧 Email Verify | "check your email" text, `/verify` URL | Mailosaur, MailSlurp API |
| 📱 SMS/OTP | `input[maxlength="6"]`, "enter code" text | Twilio API |
| 💳 Payment | `iframe[src*="stripe"]`, card inputs | Sandbox test cards, `frameLocator()` |
| 🔐 OAuth | "Sign in with Google/FB" buttons | Token injection, mock OAuth server |
| 🛡️ Anti-bot | Cloudflare challenge, `cf-challenge` | Stealth plugin + residential proxy |
| 📄 File Download | `a[download]`, PDF/CSV links | `pdf-parse`, file verification |
| 💬 WebSocket | Live chat, real-time updates | WebSocket listener pattern |
| 📝 Complex Forms | >5 input fields | faker.js data generation |
| 🌍 Geolocation | Locale selector, geo-restricted | Proxy + built-in geolocation API |
| ♿ Accessibility | Always | axe-core WCAG scan |
| 🔒 Security | Login forms, sensitive data | OWASP ZAP proxy scanning |
| ⚡ Performance | >2 page transitions | Lighthouse, Web Vitals |
| 🔌 External APIs | Network calls to third parties | MSW, `page.route()` mocking |

#### Context-Based (Step 3 — intelligent suggestions)

| Condition | Suggestion |
|-----------|------------|
| Auth-required flow | Database seeding via API fixtures |
| Design-heavy pages | Visual regression with `toHaveScreenshot()` or Percy |
| Production app | Synthetic monitoring with Checkly |
| Any project | Allure reporting + CI/CD pipeline |

#### Result-Based (Step 5 — based on test outcomes)

| Result | Suggestion |
|--------|------------|
| Selector failures after retries | AI self-healing, Healenium |
| All tests passed | Cross-browser testing (BrowserStack), production monitoring |
| Many page transitions | Performance metrics tracking |

Each integration includes **ready-to-use code patterns**, service comparisons, and `.env` variable templates in the [external-integrations.md](./vl-playwright-gen/resources/external-integrations.md) resource.

---

### Installation

#### Gemini CLI / Antigravity

```bash
git clone https://github.com/veilus/veilus-skill.git
cp -r veilus-skill/vl-playwright-gen/ your-project/.agent/skills/vl-playwright-gen/
```

#### Claude Code

```bash
git clone https://github.com/veilus/veilus-skill.git
cp -r veilus-skill/vl-playwright-gen/ your-project/.claude/skills/vl-playwright-gen/
```

### Prerequisites

- **Node.js 18+**
- **Playwright MCP server** in your AI assistant config:
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

### Usage

Open your AI coding assistant in any project and say:

```
"generate playwright tests for https://myapp.com/login"
```

Or for multi-page flows:

```
"generate playwright tests for the login → dashboard → settings flow
starting at https://myapp.com/login"
```

Or just:

```
"vl-playwright-gen"
```

The AI will ask for the URL and guide you through the entire workflow interactively.

### Output Structure

```
your-output-dir/
├── tests/
│   └── login-flow.spec.ts          # POM + tests (single file)
├── helpers/                         # Optional: API mocks, fixtures
│   └── api-mocks.ts                # (if API mocking accepted)
├── .github/workflows/
│   └── playwright.yml              # (if CI/CD accepted)
├── playwright.config.ts
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

### Compatibility

| Platform | Skills Directory | Status |
|----------|-----------------|--------|
| Gemini CLI | `.agent/skills/` | ✅ Tested |
| Antigravity | `.agent/skills/` | ✅ Tested |
| Claude Code | `.claude/skills/` | ✅ Tested |

---

## Repository Structure

```
veilus-skill/
├── vl-playwright-gen/              # 🎯 Main skill source
│   ├── SKILL.md                    # Entry point (AI reads this first)
│   ├── workflow.md                 # 5-step orchestrator
│   ├── steps/
│   │   ├── step-01-setup.md        # MCP check & scaffold
│   │   ├── step-02-discover.md     # Inspect pages & detect integrations
│   │   ├── step-03-plan.md         # Review, suggest integrations, confirm
│   │   ├── step-04-generate.md     # Single-file code generation
│   │   └── step-05-validate.md     # Dry-run, auto-fix & delivery
│   ├── scripts/
│   │   ├── check-mcp.mjs           # MCP availability verification
│   │   ├── scaffold.mjs            # Project scaffolding
│   │   └── validate.mjs            # Test execution & validation
│   ├── resources/
│   │   ├── playwright-best-practices.md   # Selector rules & anti-patterns
│   │   └── external-integrations.md       # 15 integration categories with code
│   └── README.md                   # Skill-level documentation
├── .agent/skills/                  # Installed skills (synced from source)
├── .gitignore
└── README.md                       # This file
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/new-skill`)
3. Follow the existing skill structure: `SKILL.md` → `workflow.md` → `steps/`
4. Test with your AI assistant
5. Submit a PR

## License

MIT — [Veilus](https://veilus.io)
