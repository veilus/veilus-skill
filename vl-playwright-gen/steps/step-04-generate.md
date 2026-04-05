# Step 4: Generate — Create POM, Tests, and Config Files

## STEP GOAL

Generate all output files from the confirmed generation plan: Page Object Model classes, test specs, configuration, and documentation.

## MANDATORY RULES

- 📖 Read this entire step before taking any action
- 📚 Read `../resources/playwright-best-practices.md` before generating code
- 🔒 NEVER write actual credentials — always use `process.env.*`
- ✅ Follow cascade selector pattern with `.or()` fallbacks for every element

---

## EXECUTION SEQUENCE

### 1. Load Best Practices

Read `../resources/playwright-best-practices.md` to inform code generation:
- Selector priority rules
- Anti-patterns to avoid
- Code patterns to follow

### 2. Generate Page Object Model Files

For each page in the confirmed plan, create `{{output_dir}}/pages/{{page-name}}.page.ts`:

**Template Pattern:**
```typescript
import { type Page, type Locator } from '@playwright/test';

export class {{PageName}}Page {
  readonly page: Page;
  
  // Element declarations
  {{#each elements}}
  readonly {{name}}: Locator;
  {{/each}}

  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators with cascade selectors
    {{#each elements}}
    this.{{name}} = page.{{primarySelector}}
      .or(page.{{fallbackSelector}});
    {{/each}}
  }

  async goto() {
    await this.page.goto(process.env.BASE_URL + '{{pagePath}}');
  }

  {{#each actionMethods}}
  async {{methodName}}({{params}}) {
    {{#each steps}}
    await this.{{elementName}}.{{action}}({{args}});
    {{/each}}
  }
  {{/each}}
}
```

**Naming Convention:**
- URL path → kebab-case → PascalCase class name
- `/login` → `LoginPage`
- `/dashboard/settings` → `DashboardSettingsPage`
- File: `login.page.ts`, `dashboard-settings.page.ts`

**Action Method Generation Rules:**
- If page has a form → generate a method that fills all inputs and submits
- Method name derived from form purpose: `login()`, `register()`, `createProject()`
- Parameters = form fields (typed as `string`)
- Credential parameters use `process.env.*` in test calls, NOT in POM

### 3. Generate Test Spec File

Create `{{output_dir}}/tests/{{flow-name}}.spec.ts`:

**Template Pattern:**
```typescript
import { test, expect } from '@playwright/test';
{{#each pages}}
import { {{PageName}}Page } from '../pages/{{fileName}}';
{{/each}}

test.describe('{{flowName}}', () => {
  test('{{testName}}', async ({ page }) => {
    {{#each flowSteps}}
    
    // {{stepDescription}}
    const {{varName}} = new {{PageName}}Page(page);
    {{#if isFirstStep}}
    await {{varName}}.goto();
    {{/if}}
    
    {{#each assertions}}
    await expect({{varName}}.{{elementName}}).{{assertion}};
    {{/each}}
    
    {{#if hasAction}}
    await {{varName}}.{{actionMethod}}({{actionArgs}});
    {{/if}}
    
    {{#if hasHumanCheckpoint}}
    // ⚠️ HUMAN CHECKPOINT: {{checkpointReason}}
    // Complete the step manually, then press Resume in Playwright Inspector.
    await page.pause();
    {{/if}}
    
    {{/each}}
  });
});
```

**Assertion Generation Rules:**
- Always assert key elements are visible: `await expect(element).toBeVisible()`
- After navigation: assert page title or heading
- After form submit: assert success indicator (redirect URL, success message, or dashboard element)

### 4. Generate playwright.config.ts

Create `{{output_dir}}/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    
    // Uncomment below to use VeilusBrowser:
    // launchOptions: {
    //   executablePath: process.env.VEILUS_BROWSER_PATH,
    // },
  },
});
```

### 5. Generate .env.example

Create `{{output_dir}}/.env.example`:

```env
# Base URL of the application under test
BASE_URL={{detected_base_url}}

# Test credentials (fill with your test account)
{{#if hasLoginForm}}
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password
{{/if}}

# Optional: CAPTCHA solving API
# CAPTCHA_SERVICE=2captcha|capsolver|anticaptcha
# CAPTCHA_API_KEY=your-api-key-here

# Optional: Residential proxy
# PROXY_URL=http://user:pass@proxy-host:port

# Optional: VeilusBrowser path
# VEILUS_BROWSER_PATH=/path/to/veilus-browser
```

### 6. Generate Integration Files (if accepted in Step 3)

#### 6a. Accessibility — axe-core helper (Always Recommended)

If developer accepted accessibility integration, add to test spec:
```typescript
import AxeBuilder from '@axe-core/playwright';

// Add a11y check at end of each test or as separate test
test('accessibility scan', async ({ page }) => {
  await page.goto(process.env.BASE_URL!);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```
Add to package.json: `@axe-core/playwright`

#### 6b. Reporting — Allure (Always Recommended)

If developer accepted reporting, update `playwright.config.ts`:
```typescript
reporter: [
  ['html'],
  ['allure-playwright'],  // Rich reports with history & trends
],
```
Add to package.json: `allure-playwright`
Add `allure-results/` to `.gitignore`

#### 6c. CI/CD Pipeline (Always Recommended)

If developer accepted CI/CD, generate `.github/workflows/playwright.yml`:
```yaml
name: Playwright Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

#### 6d. API Mocking (Context-Based)

If external API calls were detected in network logs, generate mock helpers:
```typescript
// helpers/api-mocks.ts
import { Page } from '@playwright/test';

export async function mockExternalAPIs(page: Page) {
  await page.route('**/api/external/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}
```

#### 6e. Database Seeding (Context-Based)

If auth/data requirements detected, generate seed fixture:
```typescript
// fixtures/db-seed.ts
import { test as base } from '@playwright/test';

// Extend with API-based data seeding
export const test = base.extend({
  seedUser: async ({ request }, use) => {
    // Create test user via API before test
    const response = await request.post('/api/test/seed', {
      data: { email: 'test@example.com', password: 'Test123!' },
    });
    const user = await response.json();
    await use(user);
    // Cleanup after test
    await request.delete(`/api/test/users/${user.id}`);
  },
});
```

### 6. Generate README.md

Create `{{output_dir}}/README.md`:

```markdown
# {{flowName}} — Playwright Tests

Generated by [vl-playwright-gen](https://github.com/veilus/vl-playwright-gen)

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your test credentials
   ```

3. Install browsers (if not already):
   ```bash
   npx playwright install chromium
   ```

## Run Tests

```bash
npx playwright test
```

## Pages Covered

{{#each pages}}
- **{{PageName}}** ({{url}}) — {{elementCount}} elements
{{/each}}

## Human Intervention Required

{{#if hasCheckpoints}}
{{#each checkpoints}}
- **{{pageName}}**: {{reason}} — test will pause at this step
{{/each}}
{{else}}
No manual steps required. All tests run fully automated.
{{/if}}

## VeilusBrowser Configuration

To use VeilusBrowser instead of Chromium, uncomment the `launchOptions` section in `playwright.config.ts` and set `VEILUS_BROWSER_PATH` in your `.env` file.
```

### 7. Report Generation Complete

```
✅ Code Generation Complete!

Generated {{file_count}} files:
{{#each files}}
├── {{filePath}} ({{details}})
{{/each}}

[C] Continue to validation (dry-run tests)
```

---

## NEXT STEP

When user selects [C], read fully and follow: `./step-05-validate.md`

## FAILURE MODES

❌ Writing hardcoded credentials
❌ Missing .or() fallback selectors
❌ Not reading best practices before generating
❌ Using CSS selectors without trying semantic selectors first
❌ Not generating README
❌ Not suggesting accessibility / reporting / CI/CD integrations
❌ Not generating integration files when developer accepted them
