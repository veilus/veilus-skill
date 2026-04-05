# vl-playwright-gen

> AI-powered Playwright test generator — inspects live web pages and generates production-ready Page Object Model scripts with resilient cascade selectors.

## What It Does

`vl-playwright-gen` is an AI coding skill that automates Playwright test creation:

1. **🔍 Inspect** — AI navigates to your page via Playwright MCP, captures the accessibility tree, and identifies all interactive elements
2. **📋 Plan** — AI presents findings in a clear table, you review and confirm
3. **⚡ Generate** — AI creates POM classes with cascade `.or()` selectors, test specs, config, and README
4. **✅ Validate** — AI runs the generated tests, attempts auto-fixes on failures

## Installation

### Antigravity

```bash
# Copy into your project's skills directory
cp -r vl-playwright-gen/ your-project/.agent/skills/vl-playwright-gen/
```

### Claude Code

```bash
# Copy into your project's skills directory  
cp -r vl-playwright-gen/ your-project/.claude/skills/vl-playwright-gen/
```

### From GitHub

```bash
# Clone directly into your skills directory
git clone https://github.com/veilus/vl-playwright-gen.git .agent/skills/vl-playwright-gen
```

## Prerequisites

- **Node.js 18+**
- **Playwright MCP** — Add to your AI assistant's MCP configuration:
  ```
  Server: playwright
  Command: npx @playwright/mcp@latest
  ```

## Usage

In your AI coding assistant, say any of:

- `"generate playwright tests for https://myapp.com/login"`
- `"inspect this page and create tests"`
- `"vl-playwright-gen"`

The AI will guide you through a 5-step workflow:

```
Setup → Discover → Plan → Generate → Validate
```

## Output

The skill generates a complete, runnable Playwright test project:

```
playwright-gen-output/
├── pages/
│   ├── login.page.ts          # POM with cascade selectors
│   └── dashboard.page.ts
├── tests/
│   └── login-flow.spec.ts     # E2E test with assertions
├── playwright.config.ts       # Browser config (VeilusBrowser-ready)
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md                  # Setup & run instructions
```

## Key Features

- **Cascade Selectors** — Every element gets a priority chain: `getByRole` → `getByLabel` → `getByText` → `getByTestId` → CSS, with `.or()` fallbacks
- **Page Object Model** — Clean, maintainable POM architecture
- **Guided Autopilot** — AI walks through multi-page flows, pausing at each page for your confirmation
- **Human Checkpoints** — Auto-detects CAPTCHA/MFA and inserts `page.pause()` markers
- **Credential Safety** — All secrets use `process.env.*`, never hardcoded
- **VeilusBrowser Support** — Config includes toggle for custom browser paths

## Skill Structure

```
vl-playwright-gen/
├── SKILL.md                    # Entry point
├── workflow.md                 # 5-step orchestrator
├── steps/                      # Workflow phases
│   ├── step-01-setup.md        # MCP check & scaffold
│   ├── step-02-discover.md     # Navigate & inspect
│   ├── step-03-plan.md         # User review
│   ├── step-04-generate.md     # Code generation
│   └── step-05-validate.md     # Dry-run & delivery
├── scripts/                    # Node.js helper scripts
│   ├── check-mcp.mjs           # MCP availability check
│   ├── scaffold.mjs            # Project scaffolding
│   └── validate.mjs            # Test runner
├── templates/                  # Code templates
│   └── (coming in v1.1)
├── resources/                  # AI reference materials
│   └── playwright-best-practices.md
└── README.md                   # This file
```

## License

MIT
