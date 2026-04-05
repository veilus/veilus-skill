# External Integrations — API Services for Test Automation

> Reference document for AI agents handling scenarios that require external APIs.
> When a page inspection detects these patterns, suggest the appropriate integration.

---

## Detection Patterns

Use these DOM/URL patterns during inspection (Step 2) to identify pages that may need external integrations:

| Pattern | Detection Signal | Integration Needed |
|---------|-----------------|-------------------|
| **CAPTCHA** | `iframe[src*="recaptcha"]`, `iframe[src*="hcaptcha"]`, `.g-recaptcha`, `.h-captcha`, `iframe[src*="turnstile"]`, URL `/sorry/`, `/captcha`, `/challenge` | CAPTCHA Solving API |
| **Email verification** | Form with `input[type="email"]` + submit → "check your email" text, URL `/verify`, `/confirm` | Email Testing API |
| **SMS/OTP** | `input[autocomplete="one-time-code"]`, `input[inputmode="numeric"][maxlength="6"]`, text "enter code", "verification code" | SMS API |
| **Payment** | `iframe[src*="stripe"]`, `iframe[src*="paypal"]`, `[data-braintree]`, form with `input[name*="card"]`, URL `/checkout`, `/payment` | Payment Sandbox |
| **OAuth/Social** | `a[href*="accounts.google.com/o/oauth2"]`, `a[href*="facebook.com/dialog/oauth"]`, `a[href*="github.com/login/oauth"]`, buttons "Sign in with Google/Facebook/GitHub" | OAuth Handling |
| **Anti-bot** | Cloudflare challenge page, `cf-challenge`, DataDome script, Akamai Bot Manager, PerimeterX | Anti-bot Bypass |
| **File download** | `a[download]`, `button` triggering PDF/CSV download, `Content-Disposition: attachment` | File Verification |
| **Geolocation** | `navigator.geolocation`, content varies by IP, geo-restricted pages | Geo/Proxy Service |
| **Real-time** | `WebSocket` connections, `EventSource`, live chat widgets, notification badges | WebSocket/Push Testing |
| **Visual diff** | Complex UI layouts, design-heavy pages, responsive breakpoints | Visual Regression API |

---

## 1. Email Verification

### When Needed
- Registration flows ("Check your email to verify")
- Password reset ("We sent you a reset link")
- Magic link login
- Email change confirmation

### Services

| Service | Package | Free Tier | Best For |
|---------|---------|-----------|----------|
| [Mailosaur](https://mailosaur.com) | `mailosaur` | Trial | Production CI/CD, most reliable |
| [MailSlurp](https://mailslurp.com) | `mailslurp-client` | 100 emails/month | Quick prototyping |
| [Mailtrap](https://mailtrap.io) | REST API | 100 emails/month | Staging environments |
| [Guerrilla Mail](https://grr.la) | REST API | Unlimited (public) | Ad-hoc testing only |

### Code Pattern

```typescript
import MailSlurp from 'mailslurp-client';

// Create a test inbox
const mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY! });
const inbox = await mailslurp.createInbox();

// Fill registration form with generated email
await registrationPage.register(inbox.emailAddress, 'TestPassword123!');

// Wait for verification email (timeout 60s)
const email = await mailslurp.waitForLatestEmail(inbox.id!, 60_000);

// Extract verification link
const verifyLink = email.body!.match(/https?:\/\/[^\s"]+verify[^\s"]*/)?.[0];
if (verifyLink) {
  await page.goto(verifyLink);
}
```

### .env Variables
```env
MAILSLURP_API_KEY=your-api-key
# or
MAILOSAUR_API_KEY=your-api-key
MAILOSAUR_SERVER_ID=your-server-id
```

---

## 2. SMS / OTP Verification

### When Needed
- Two-factor authentication (2FA)
- Phone number verification
- Login via SMS code

### Services

| Service | Package | Cost | Best For |
|---------|---------|------|----------|
| [Twilio](https://twilio.com) | `twilio` | $1/month + $0.0075/SMS | Reliable, programmable |
| [MessageBird](https://messagebird.com) | `messagebird` | Pay-per-SMS | EU/Asia focused |
| [SMS-Activate](https://sms-activate.org) | REST API | ~$0.10-0.50/number | Disposable numbers |
| [TextNow](https://textnow.com) | Manual | Free | Ad-hoc only |

### Code Pattern

```typescript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);

// Use test phone number in form
const testPhone = process.env.TEST_PHONE_NUMBER!;
await loginPage.enterPhone(testPhone);
await loginPage.requestOTP();

// Wait for SMS and extract OTP
await page.waitForTimeout(5000); // Wait for SMS delivery

const messages = await client.messages.list({
  to: testPhone,
  limit: 1,
});
const otpCode = messages[0].body.match(/\d{4,6}/)?.[0];

await loginPage.enterOTP(otpCode!);
```

### .env Variables
```env
TWILIO_SID=your-account-sid
TWILIO_TOKEN=your-auth-token
TEST_PHONE_NUMBER=+1234567890
```

---

## 3. Payment Gateway Testing

### When Needed
- Checkout/purchase flows
- Subscription management
- Billing/invoice tests

### Sandbox Configurations

| Gateway | Test Mode | Test Card |
|---------|-----------|-----------|
| **Stripe** | `STRIPE_TEST_KEY=sk_test_...` | `4242424242424242` (success), `4000000000000002` (decline) |
| **PayPal** | Sandbox environment | Sandbox buyer/seller accounts |
| **VNPay** | Test environment URL | Provided by VNPay |
| **MoMo** | Test environment | Provided by MoMo |
| **Braintree** | Sandbox | `4111111111111111` |

### Code Pattern

```typescript
// Stripe Elements are inside iframes — use frameLocator
const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]');

await stripeFrame.getByRole('textbox', { name: /card number/i })
  .fill('4242424242424242');
await stripeFrame.getByRole('textbox', { name: /expir/i })
  .fill('12/30');
await stripeFrame.getByRole('textbox', { name: /cvc/i })
  .fill('123');
await stripeFrame.getByRole('textbox', { name: /zip|postal/i })
  .fill('12345');

// Submit payment
await checkoutPage.submitPayment();

// Verify success
await expect(page.getByText(/payment successful|thank you/i)).toBeVisible();
```

### .env Variables
```env
STRIPE_TEST_KEY=sk_test_xxx
PAYPAL_SANDBOX_EMAIL=sb-buyer@personal.example.com
PAYPAL_SANDBOX_PASSWORD=test-password
```

---

## 4. OAuth / Social Login

### When Needed
- "Sign in with Google/Facebook/GitHub/Apple"
- Third-party OAuth2 flows
- SSO (Single Sign-On)

### Strategies (ordered by preference)

#### Strategy 1: Token Injection (Best — skip OAuth entirely)
```typescript
// Inject auth token directly, bypass OAuth popup
await page.evaluate((token) => {
  localStorage.setItem('auth_token', token);
}, process.env.TEST_AUTH_TOKEN!);

await page.goto('/dashboard'); // Already authenticated
```

#### Strategy 2: Dedicated Test Accounts
```typescript
// Use pre-created Google/GitHub account with 2FA disabled
// Store credentials in .env
await page.getByRole('button', { name: /sign in with google/i }).click();

// Handle Google login popup
const popup = await page.waitForEvent('popup');
await popup.getByRole('textbox', { name: /email/i }).fill(process.env.GOOGLE_TEST_EMAIL!);
await popup.getByRole('button', { name: /next/i }).click();
await popup.getByRole('textbox', { name: /password/i }).fill(process.env.GOOGLE_TEST_PASSWORD!);
await popup.getByRole('button', { name: /next/i }).click();

// Wait for redirect back to app
await page.waitForURL('**/dashboard');
```

#### Strategy 3: Mock OAuth Server
```typescript
// Use a mock OAuth server for CI/CD
// Replace OAuth URL with mock in test config
await page.route('**/accounts.google.com/**', async (route) => {
  // Redirect back with mock token
  await route.fulfill({
    status: 302,
    headers: { Location: `${process.env.BASE_URL}/auth/callback?code=mock-code` },
  });
});
```

### .env Variables
```env
# Strategy 1: Token injection
TEST_AUTH_TOKEN=eyJhbGciOiJIUzI1NiJ9...

# Strategy 2: Test accounts
GOOGLE_TEST_EMAIL=test-account@gmail.com
GOOGLE_TEST_PASSWORD=test-password
GITHUB_TEST_EMAIL=test@github-account.com
GITHUB_TEST_PASSWORD=test-password
```

---

## 5. Visual Regression Testing

### When Needed
- Design-heavy pages
- Responsive layout verification
- CSS refactoring confidence
- Cross-browser visual consistency

### Services

| Service | Package | Free Tier | AI Diff |
|---------|---------|-----------|---------|
| [Percy](https://percy.io) | `@percy/playwright` | 5,000 screenshots/month | ✅ |
| [Applitools](https://applitools.com) | `@applitools/eyes-playwright` | 100 checkpoints/month | ✅ Advanced |
| [Chromatic](https://chromatic.com) | `chromatic` | 5,000 snapshots/month | Component-level |
| **Built-in** | N/A | Unlimited | ❌ Pixel-only |

### Code Pattern

```typescript
// Built-in Playwright visual comparison (simplest)
await expect(page).toHaveScreenshot('homepage.png', {
  maxDiffPixelRatio: 0.01,
});

// Percy integration
import percySnapshot from '@percy/playwright';
await percySnapshot(page, 'Homepage');

// Applitools integration
import { Eyes, Target } from '@applitools/eyes-playwright';
const eyes = new Eyes();
await eyes.open(page, 'App', 'Homepage Test');
await eyes.check('Homepage', Target.window().fully());
await eyes.close();
```

---

## 6. Geolocation & IP-based Content

### When Needed
- Region-specific content (pricing, language)
- Geo-restricted features
- IP-based access control

### Approaches

```typescript
// Approach 1: Playwright built-in geolocation (client-side only)
const context = await browser.newContext({
  geolocation: { latitude: 21.0285, longitude: 105.8542 }, // Hanoi
  permissions: ['geolocation'],
});

// Approach 2: Proxy for server-side IP detection
const context = await browser.newContext({
  proxy: {
    server: process.env.PROXY_URL!, // Country-specific proxy
  },
});

// Approach 3: Override Accept-Language header
const context = await browser.newContext({
  locale: 'vi-VN',
  extraHTTPHeaders: {
    'Accept-Language': 'vi-VN,vi;q=0.9',
  },
});
```

### Proxy Services
| Service | Type | Best For |
|---------|------|----------|
| [Bright Data](https://brightdata.com) | Residential | Country-level targeting |
| [Oxylabs](https://oxylabs.io) | Residential/DC | Large-scale testing |
| [SmartProxy](https://smartproxy.com) | Residential | Budget-friendly |

---

## 7. File Download & Document Verification

### When Needed
- PDF invoice/report download
- CSV/Excel export verification
- Image download verification

### Code Pattern

```typescript
import fs from 'fs';
import pdf from 'pdf-parse';

// Trigger download and capture file
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: /download/i }).click(),
]);

const filePath = await download.path();
const fileName = download.suggestedFilename();

// Verify PDF content
if (fileName.endsWith('.pdf')) {
  const buffer = fs.readFileSync(filePath!);
  const data = await pdf(buffer);
  expect(data.text).toContain('Invoice #12345');
  expect(data.numpages).toBeGreaterThan(0);
}

// Verify CSV content
if (fileName.endsWith('.csv')) {
  const content = fs.readFileSync(filePath!, 'utf-8');
  const rows = content.split('\n');
  expect(rows.length).toBeGreaterThan(1); // Header + data
  expect(rows[0]).toContain('Name,Email');
}
```

### Packages
| Package | Purpose |
|---------|---------|
| `pdf-parse` | Extract text from PDF |
| `pdf-lib` | Verify PDF metadata, forms |
| `xlsx` | Parse Excel files |
| `csv-parse` | Parse CSV files |
| `tesseract.js` | OCR for scanned documents |

---

## 8. Anti-Bot / Fingerprint Protection

### When Needed
- Sites using Cloudflare, DataDome, Akamai, PerimeterX
- Aggressive bot detection beyond CAPTCHA

### Prevention Stack (layered approach)

```typescript
// Layer 1: Stealth plugin
import { chromium } from 'playwright-extra';
import stealth from 'playwright-extra-plugin-stealth';
chromium.use(stealth());

// Layer 2: Real browser fingerprint
const browser = await chromium.launch({
  executablePath: process.env.VEILUS_BROWSER_PATH,
  headless: false,
});

// Layer 3: Residential proxy
const context = await browser.newContext({
  proxy: { server: process.env.PROXY_URL! },
  // Layer 4: Realistic viewport and user agent
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
});

// Layer 5: Human-like behavior
async function humanDelay(min = 500, max = 2500) {
  await page.waitForTimeout(Math.random() * (max - min) + min);
}

// Layer 6: Mouse movement simulation
async function humanClick(locator: Locator) {
  const box = await locator.boundingBox();
  if (box) {
    // Random offset within element
    const x = box.x + Math.random() * box.width;
    const y = box.y + Math.random() * box.height;
    await page.mouse.move(x, y, { steps: 10 });
    await humanDelay(100, 300);
    await page.mouse.click(x, y);
  }
}
```

---

## 9. Test Data Generation

### When Needed
- Form filling with realistic data
- Registration tests with unique emails
- Address/phone number validation testing

### Code Pattern

```typescript
import { faker } from '@faker-js/faker';

// Configure locale for Vietnamese data
faker.locale = 'vi';

const testUser = {
  name: faker.person.fullName(),          // "Nguyễn Văn A"
  email: faker.internet.email(),           // unique email
  phone: faker.phone.number(),             // local format
  address: faker.location.streetAddress(), // realistic address
  company: faker.company.name(),
  avatar: faker.image.avatar(),            // URL to avatar image
};

await registrationPage.register(testUser);
```

### Packages
| Package | Purpose |
|---------|---------|
| `@faker-js/faker` | Comprehensive fake data (50+ locales) |
| `chance` | Simple random data |
| `uuid` | Unique identifiers |

---

## 10. Real-time / WebSocket Testing

### When Needed
- Chat applications
- Live notification testing
- Real-time dashboard updates
- Collaborative editing

### Code Pattern

```typescript
// Listen for WebSocket messages
page.on('websocket', (ws) => {
  ws.on('framereceived', (frame) => {
    const data = JSON.parse(frame.payload as string);
    if (data.type === 'notification') {
      console.log('Notification received:', data.message);
    }
  });
});

// Trigger notification from API (parallel)
await Promise.all([
  // Wait for notification to appear in UI
  expect(page.getByText(/new message/i)).toBeVisible({ timeout: 10_000 }),
  // Trigger notification via backend API
  fetch(`${process.env.API_URL}/notifications/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
    body: JSON.stringify({ userId: 'test-user', message: 'New message' }),
  }),
]);
```

---

## Quick Reference — Detection → Integration Map

```
📧 Email form + "check your email"  → Email API (Mailosaur/MailSlurp)
📱 OTP input + "enter code"         → SMS API (Twilio)
💳 Stripe iframe / card form        → Payment Sandbox
🔐 "Sign in with Google/FB"         → OAuth handling
🤖 /sorry/, /captcha, cf-challenge  → CAPTCHA API + Stealth
👁️ Design-heavy UI                  → Visual Regression (Percy)
🌍 Geo-restricted / locale content  → Proxy + Geolocation
📄 Download button + PDF/CSV        → File parse (pdf-parse)
💬 WebSocket / live updates          → Backend API trigger
📝 Registration / forms             → Faker.js data generation
♿ Any page (always recommended)     → axe-core accessibility scan
📊 Any project (always recommended) → Allure reporting
🔄 Any project (always recommended) → CI/CD pipeline
🔌 External API calls in network    → API Mocking (MSW/page.route)
🗄️ Auth-required flows              → Database Seeding
```

---

## 11. ♿ Accessibility Testing (axe-core)

> **Trigger:** Always recommended. Auto-detect: `aria-*` attributes, form elements, images.
> **Suggest at:** Step 2 (always), Step 3 (always recommended), Step 5 (post-delivery)

### When Needed
- WCAG 2.1 AA/AAA compliance (legal requirement in EU, US gov)
- Enterprise / government projects
- Form-heavy applications
- Public-facing websites

### Services

| Service | Package | Free | WCAG Level |
|---------|---------|------|------------|
| [Axe-core](https://deque.com/axe) | `@axe-core/playwright` | ✅ Open source | A, AA, AAA |
| [Pa11y](https://pa11y.org) | `pa11y` | ✅ Open source | A, AA |
| [Lighthouse](https://developers.google.com) | `lighthouse` | ✅ Built-in | Score-based |

### Code Pattern

```typescript
import AxeBuilder from '@axe-core/playwright';

// Add as a separate test for each page
test('accessibility: homepage passes WCAG 2.1 AA', async ({ page }) => {
  await page.goto(process.env.BASE_URL!);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])  // WCAG 2.1 Level AA
    .exclude('.third-party-widget')    // Exclude elements you don't control
    .analyze();

  // Report violations with details
  if (results.violations.length > 0) {
    const summary = results.violations.map(v =>
      `${v.impact}: ${v.description} (${v.nodes.length} instances)`
    ).join('\n');
    console.log('Accessibility violations:\n' + summary);
  }

  expect(results.violations).toEqual([]);
});

// Or embed in existing flow tests
test('login flow is accessible', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Check accessibility at each state
  const beforeLogin = await new AxeBuilder({ page }).analyze();
  expect(beforeLogin.violations).toEqual([]);

  await loginPage.login('user@test.com', 'password');

  const afterLogin = await new AxeBuilder({ page }).analyze();
  expect(afterLogin.violations).toEqual([]);
});
```

### .env Variables
```env
# No API key needed — axe-core is open source
# Optional: set WCAG level
A11Y_WCAG_LEVEL=wcag2aa
```

---

## 12. 🔄 CI/CD Pipeline Integration

> **Trigger:** Always recommended for any project.
> **Suggest at:** Step 3 (always recommended), Step 4 (generate workflow file)

### When Needed
- Automated testing on every PR/commit
- Team collaboration (shared test results)
- Continuous quality gates

### Platform Templates

#### GitHub Actions
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-traces
          path: test-results/
          retention-days: 7
```

#### GitLab CI
```yaml
# .gitlab-ci.yml
playwright:
  image: mcr.microsoft.com/playwright:v1.52.0-noble
  stage: test
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 7 days
```

### Sharding (large test suites)
```yaml
# Split across 4 parallel machines
strategy:
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
steps:
  - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

### Docker Image
```
mcr.microsoft.com/playwright:v1.52.0-noble
```

---

## 13. 📊 Advanced Test Reporting

> **Trigger:** Always recommended for team projects.
> **Suggest at:** Step 3 (always recommended), Step 4 (config update)

### When Needed
- Team-wide test result dashboards
- Historical trend analysis
- Flaky test detection
- Failure categorization

### Services

| Service | Package | Free Tier | Best For |
|---------|---------|-----------|----------|
| [Allure Report](https://allurereport.org) | `allure-playwright` | ✅ Open source | Self-hosted, rich reports |
| [Currents.dev](https://currents.dev) | `@currents/playwright` | Trial | Cloud dashboard, parallel orchestration |
| [ReportPortal](https://reportportal.io) | `agent-js-playwright` | ✅ Open source | AI failure analysis |
| [Tesults](https://tesults.com) | `tesults` | Free tier | Simple cloud reporting |

### Code Pattern — Allure

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],                    // Built-in HTML report
    ['allure-playwright'],       // Allure rich report
  ],
});
```

```bash
# Generate and open Allure report
npx allure generate allure-results -o allure-report --clean
npx allure open allure-report
```

### Add annotations in tests
```typescript
import { allure } from 'allure-playwright';

test('login flow', async ({ page }) => {
  await allure.severity('critical');
  await allure.feature('Authentication');
  await allure.story('User Login');

  // ... test steps
});
```

---

## 14. 🔌 API Mocking & Interception

> **Trigger:** External API calls detected in network logs during Step 2.
> **Suggest at:** Step 2 (auto-detect), Step 3 (context-based), Step 4 (generate helpers)

### When Needed
- Mock unstable external APIs for test reliability
- Test error states (500, 404, timeout)
- Control API responses for deterministic tests
- Avoid hitting real third-party services in CI

### Approaches

| Approach | Package | Complexity | Best For |
|----------|---------|------------|----------|
| Playwright route | Built-in | Low | Simple mocking, intercepting |
| [MSW](https://mswjs.io) | `msw` | Medium | Full API mocking layer |
| [WireMock](https://wiremock.org) | Docker | High | Enterprise, shared mocks |

### Code Pattern — Built-in page.route()

```typescript
// helpers/api-mocks.ts
import { Page } from '@playwright/test';

export async function mockUserAPI(page: Page) {
  await page.route('**/api/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      }),
    });
  });
}

// Mock error states
export async function mockAPIError(page: Page, endpoint: string, status = 500) {
  await page.route(`**${endpoint}`, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
}
```

### Code Pattern — MSW

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/me', () => {
    return HttpResponse.json({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    });
  }),
];

// In test setup
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';
const server = setupServer(...handlers);

test.beforeAll(() => server.listen());
test.afterAll(() => server.close());
```

---

## 15. 🗄️ Database Seeding & Verification

> **Trigger:** Auth-required flows, tests that need pre-existing data.
> **Suggest at:** Step 2 (auto-detect auth), Step 3 (context-based), Step 4 (generate fixtures)

### When Needed
- Tests require logged-in users
- Data must exist before test (products, orders, etc.)
- Cleanup after tests to prevent pollution
- Verify backend state after UI actions

### Approaches

| Approach | Package | Best For |
|----------|---------|----------|
| API seeding | `fetch`/Playwright `request` | Most common, framework agnostic |
| ORM direct | `prisma`, `drizzle` | Type-safe, same models as app |
| SQL scripts | `pg`, `mysql2` | Maximum control |
| Fixtures | Playwright fixtures | Reusable, auto-cleanup |

### Code Pattern — Playwright API Fixtures

```typescript
// fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: import('@playwright/test').Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, request }, use) => {
    // Seed: Create test user via API
    const createRes = await request.post('/api/test/users', {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        role: 'user',
      },
    });
    const user = await createRes.json();

    // Login: Get auth token
    const loginRes = await request.post('/api/auth/login', {
      data: { email: user.email, password: 'TestPassword123!' },
    });
    const { token } = await loginRes.json();

    // Inject token into browser
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('auth_token', t), token);

    await use(page);

    // Cleanup: Delete test user
    await request.delete(`/api/test/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
});
```

### Code Pattern — Prisma Direct

```typescript
// fixtures/db.fixture.ts
import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

export const test = base.extend<{ db: PrismaClient }>({
  db: async ({}, use) => {
    const prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    await use(prisma);
    // Auto-cleanup test data
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-' } },
    });
    await prisma.$disconnect();
  },
});
```

### .env Variables
```env
# API seeding
API_URL=http://localhost:3000
API_ADMIN_TOKEN=admin-token-for-seeding

# Direct DB (Prisma)
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/testdb
```
