# Playwright Best Practices — AI Code Generation Guardrails

> Reference document for AI agents generating Playwright code via vl-playwright-gen.
> Read this BEFORE generating any test code.

---

## 1. Selector Priority (Cascade Order)

Always prefer semantic, accessibility-first selectors. Fall back only when higher-priority options are unavailable.

| Priority | Strategy | When to Use | Confidence |
|----------|----------|-------------|------------|
| 1 (best) | `getByRole('role', { name: 'name' })` | Element has ARIA role + accessible name | 🟢 HIGH |
| 2 | `getByLabel('label text')` | Form input with associated `<label>` | 🟢 HIGH |
| 3 | `getByPlaceholder('placeholder')` | Input with placeholder (no label) | 🟡 MEDIUM |
| 4 | `getByText('visible text')` | Unique visible text content | 🟡 MEDIUM |
| 5 | `getByTestId('test-id')` | Element has `data-testid` attribute | 🟡 MEDIUM |
| 6 (worst) | `page.locator('css-selector')` | No semantic option available | 🔴 LOW |

---

## 2. Cascade Selector Pattern (.or() Fallback)

Every element MUST have a fallback chain using `.or()`:

### ✅ CORRECT: Cascade with fallback

```typescript
// Primary: semantic (high confidence)
// Fallback: explicit (medium confidence)
this.emailInput = page.getByLabel('Email')
  .or(page.getByTestId('email-input'))
  .or(page.locator('input[type="email"]'));
```

### ❌ WRONG: Single selector, no fallback

```typescript
// Breaks when label text changes
this.emailInput = page.getByLabel('Email');
```

---

## 3. Anti-Patterns — NEVER Do These

### ❌ Dynamic IDs

```typescript
// WRONG — ID changes on every page load
page.locator('#el-abc123def');
page.locator('#:r1:');
```

### ❌ Hardcoded Waits

```typescript
// WRONG — arbitrary delay, flaky and slow
await page.waitForTimeout(5000);
```

### ❌ Hardcoded Credentials

```typescript
// WRONG — security risk, breaks across environments
await page.fill('#email', 'admin@company.com');
await page.fill('#password', 'SecretPassword123!');
```

### ❌ Deeply Nested CSS

```typescript
// WRONG — breaks when any parent element changes
page.locator('div.container > div.row > div.col > form > div:nth-child(2) > input');
```

### ❌ XPath

```typescript
// WRONG — fragile, hard to read, slow
page.locator('//div[@class="login"]/form/input[1]');
```

---

## 4. Correct Patterns

### ✅ Credential Sanitization

```typescript
// Always use environment variables
await loginPage.login(
  process.env.TEST_EMAIL!,
  process.env.TEST_PASSWORD!
);
```

### ✅ Smart Waits

```typescript
// Wait for specific condition, not arbitrary time
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
await page.waitForURL('**/dashboard');
await page.waitForLoadState('networkidle');
```

### ✅ Assertions with Auto-Wait

```typescript
// Playwright auto-waits for element to appear
await expect(element).toBeVisible();
await expect(element).toHaveText('Expected Text');
await expect(element).toBeEnabled();
```

### ✅ Navigation Detection

```typescript
// Wait for URL change after action
await loginButton.click();
await page.waitForURL('**/dashboard');

// Or wait for specific element on new page
await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
```

### ✅ Human Checkpoint (CAPTCHA/MFA)

```typescript
// Pause for manual intervention
// ⚠️ HUMAN CHECKPOINT: CAPTCHA detected. Complete manually, then press Resume.
await page.pause();
```

### ✅ Disambiguation (Multiple Matches)

```typescript
// When multiple elements match, scope to parent
this.submitButton = page.getByRole('button', { name: 'Submit' }).first();

// Or scope within a section
this.loginSubmit = page.locator('form.login')
  .getByRole('button', { name: 'Submit' });
```

---

## 5. Page Object Model Rules

### Class Structure

```typescript
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  
  // Declare ALL locators as readonly
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize with cascade selectors
    this.emailInput = page.getByLabel('Email')
      .or(page.getByTestId('email-input'));
    this.passwordInput = page.getByLabel('Password')
      .or(page.getByTestId('password-input'));
    this.loginButton = page.getByRole('button', { name: /log\s*in/i })
      .or(page.getByTestId('login-btn'));
  }

  // Page navigation
  async goto() {
    await this.page.goto(process.env.BASE_URL + '/login');
  }

  // Composite action methods
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Class name | PascalCase + `Page` | `LoginPage`, `DashboardPage` |
| File name | kebab-case + `.page.ts` | `login.page.ts`, `dashboard.page.ts` |
| Element name | camelCase + type suffix | `emailInput`, `loginButton`, `navLink` |
| Action method | camelCase verb | `login()`, `createProject()`, `search()` |

---

## 6. Test File Rules

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Assert page loaded
    await expect(loginPage.emailInput).toBeVisible();
    
    // Perform action
    await loginPage.login(
      process.env.TEST_EMAIL!,
      process.env.TEST_PASSWORD!
    );
    
    // Assert result
    await page.waitForURL('**/dashboard');
  });
});
```

### Test Rules

- Always import POM classes, never inline selectors in tests
- Use `process.env.*!` (non-null assertion) for required env vars
- Include at minimum: navigation assertion + action + result assertion
- One test per user scenario, keep tests focused

---

## 7. Configuration Rules

- Always use `dotenv` to load `.env` file
- Set `baseURL` from `process.env.BASE_URL`
- Enable `trace: 'on-first-retry'` for debugging
- Enable `screenshot: 'only-on-failure'` for CI
- Include commented VeilusBrowser option:
  ```typescript
  // launchOptions: { executablePath: process.env.VEILUS_BROWSER_PATH }
  ```
