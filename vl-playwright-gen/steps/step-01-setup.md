# Step 1: Setup — Environment Check & Project Scaffold

## STEP GOAL

Verify Playwright MCP is available, gather user requirements (target URL, flow description, output directory), and scaffold the output project structure.

## MANDATORY RULES

- 📖 Read this entire step before taking any action
- 🛑 HALT if Playwright MCP is not available — provide installation instructions
- ⏸️ Wait for user to provide URL and flow description before proceeding
- 🚫 Do NOT proceed to Step 2 until scaffold is complete

---

## EXECUTION SEQUENCE

### 1. Welcome & MCP Health Check

Greet the developer and check prerequisites:

```
🎭 vl-playwright-gen — AI Playwright Test Generator

Checking prerequisites...
```

**Check Playwright MCP availability:**
- Try to use the `browser_navigate` or `browser_snapshot` Playwright MCP tool
- If MCP tools are available → report "✅ Playwright MCP: Ready"
- If MCP tools are NOT available → HALT with installation instructions below:

  ```
  ❌ Playwright MCP not available.
  
  Please add Playwright MCP to your AI assistant, then restart.
  ```

  **Provide the matching guide for the user's platform:**

  ---

  #### Antigravity (Google Gemini CLI)

  Edit `~/.gemini/antigravity/mcp_config.json` and add the `playwright` entry
  inside the existing `mcpServers` object:

  ```jsonc
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["-y", "@playwright/mcp@latest"]
      }
      // ... other existing servers stay as-is
    }
  }
  ```

  Then **restart Antigravity** to load the new server.

  ---

  #### Claude Code

  Edit `~/.claude.json` (create if missing) and add:

  ```jsonc
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["-y", "@playwright/mcp@latest"]
      }
    }
  }
  ```

  Then restart Claude Code.

  ---

  #### Cursor

  Open **Settings → MCP → Add Server** and configure:
  - **Name:** `playwright`
  - **Type:** `command`
  - **Command:** `npx -y @playwright/mcp@latest`

  Or add directly to `.cursor/mcp.json` in your project:

  ```jsonc
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["-y", "@playwright/mcp@latest"]
      }
    }
  }
  ```

  ---

  After configuring, restart the AI assistant and run this workflow again.

### 2. Gather User Requirements

Ask the developer:

```
Ready to generate Playwright tests! I need a few details:

1. **Target URL** — What page should I start from?
   Example: https://app.example.com/login

2. **Flow Description** — What user journey should I test?
   Example: "Login with email/password, then navigate to dashboard"

3. **Output Directory** (optional) — Where to save generated files?
   Default: {{workspace_root}}/playwright-gen-output/
   ⚠️ Output MUST be outside the skill directory.
```

**Wait for user input.** Store:
- `{{target_url}}` — the starting URL
- `{{flow_description}}` — what the flow covers
- `{{output_dir}}` — output path (default: `{{workspace_root}}/playwright-gen-output/`)

**IMPORTANT:** The output directory MUST be outside the skill directory. Use the user's active workspace root or a sibling directory. Never generate code inside `vl-playwright-gen/`.

### 3. Scaffold Project Structure

Run `node scripts/scaffold.mjs {{output_dir}}` to create:

```
{{output_dir}}/
├── pages/           # Page Object Model files
├── tests/           # Test spec files
├── package.json     # With @playwright/test dependency
├── tsconfig.json    # TypeScript configuration
└── .gitignore       # Excludes .env, node_modules, test-results
```

If `scripts/scaffold.mjs` is not available (skill used without scripts), create the structure manually:
- Create directories: `pages/`, `tests/`
- Create `package.json` with `@playwright/test` as devDependency
- Create `tsconfig.json` with ESNext target and strict mode
- Create `.gitignore` with `.env`, `node_modules/`, `test-results/`, `playwright-report/`

After scaffold completes, run:
```bash
cd {{output_dir}} && npm install && npx playwright install chromium
```

### 4. Report & Proceed

```
✅ Setup Complete!

📁 Project scaffolded at: {{output_dir}}
🎯 Target URL: {{target_url}}
📋 Flow: {{flow_description}}
🌐 Browser: Chromium (installed)

Ready to inspect your page. [C] Continue to page inspection
```

**Wait for user to confirm [C] before proceeding.**

---

## NEXT STEP

When user selects [C], read fully and follow: `./step-02-discover.md`

## FAILURE MODES

❌ Proceeding without MCP available
❌ Not waiting for user to provide URL
❌ Skipping scaffold step
❌ Not installing dependencies
