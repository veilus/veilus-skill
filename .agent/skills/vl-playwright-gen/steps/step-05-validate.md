# Step 5: Validate — Dry-Run & Deliver

## STEP GOAL

Run the generated tests, analyze any failures, attempt automated fixes, and deliver the final output summary to the developer.

## MANDATORY RULES

- 📖 Read this entire step before taking any action
- 🔄 Maximum 2 retry attempts for auto-fix
- 📊 Always report final results, even if tests fail
- ✅ Provide clear next steps for the developer

---

## EXECUTION SEQUENCE

### 1. Run Generated Tests

Execute the test suite in the output directory:

```bash
cd {{output_dir}} && npx playwright test --reporter=list
```

Capture:
- Exit code (0 = all pass, 1 = failures)
- Test names and results (pass/fail)
- Error messages and stack traces for failures

### 2. Analyze Results

**If all tests pass:**
```
✅ All tests passed! Proceeding to delivery.
```
→ Skip to Step 5.

**If tests fail — analyze each failure:**

| Error Pattern | Diagnosis | Auto-Fix Strategy |
|---|---|---|
| "Timeout waiting for selector" | Element not found with primary selector | Try next selector in fallback chain |
| "strict mode violation" | Multiple elements match | Add `.first()` or more specific parent |
| "page.goto: Target URL" | Navigation failed | Check URL, add `waitForLoadState` |
| "Expected to be visible" | Element exists but hidden | Add `waitForSelector({ state: 'visible' })` |
| "locator resolved to..." | Wrong element selected | Refine selector or add parent scoping |
| URL contains `/sorry/`, `/captcha`, `/challenge` | CAPTCHA / bot detection triggered | Add CAPTCHA handling (see §3a) |
| "popup was closed" / OAuth redirect | OAuth popup closed or blocked | Use token injection or test account (see `external-integrations.md` §4) |
| Stripe/PayPal iframe timeout | Payment iframe not loading | Use `frameLocator()` + sandbox keys (see `external-integrations.md` §3) |
| "check your email" / stuck at verify | Email verification required | Integrate Email API — Mailosaur/MailSlurp (see `external-integrations.md` §1) |
| OTP input timeout / "enter code" | SMS 2FA required | Integrate SMS API — Twilio (see `external-integrations.md` §2) |
| Cloudflare challenge / `cf-challenge` | Anti-bot protection | Use stealth plugin + proxy (see `external-integrations.md` §8) |
| "Failed to fetch" / CORS error | API call blocked | Add `page.route()` mock or use proxy |

### 3. Auto-Fix Attempt (if needed)

For each failure:
1. Identify the error pattern from the table above
2. Apply the corresponding fix to the generated file
3. Log the fix applied

**Fix strategies:**
- **Selector fix**: Replace primary selector with next in cascade chain
- **Wait fix**: Add explicit `await page.waitForSelector()` before assertion
- **Disambiguation fix**: Add `.first()` or `.nth()` to ambiguous locator
- **URL fix**: Verify URL and add `await page.waitForURL()` after navigation
- **CAPTCHA fix**: Apply one of the strategies below

### 3a. CAPTCHA Resolution Strategies

When CAPTCHA or bot-detection is the cause of failure, suggest these solutions (ordered by preference):

#### Strategy 1: Prevention (Best — avoid CAPTCHA entirely)

```
💡 Prevention is cheaper and more reliable than solving.

1. playwright-stealth plugin — hides automation signals
   npm install playwright-extra playwright-extra-plugin-stealth

2. VeilusBrowser — real browser profile with natural fingerprint
   Set VEILUS_BROWSER_PATH in .env, uncomment launchOptions in config

3. Residential proxies — avoid IP-based blocking
   Set PROXY_URL in .env, add proxy config to playwright.config.ts

4. Realistic delays — randomized human-like timing
   await page.waitForTimeout(Math.random() * 2000 + 500);
```

#### Strategy 2: Human Checkpoint (Interactive runs)

```typescript
// Detect CAPTCHA redirect and pause for manual solving
if (page.url().includes('/sorry/') || page.url().includes('/captcha')) {
  console.warn('⚠️ CAPTCHA detected! Complete manually, then press Resume.');
  await page.pause();
}
```

#### Strategy 3: CAPTCHA Solving APIs (CI/CD automation)

```
When manual solving isn't practical, suggest a CAPTCHA solving service:

| Service      | Package                           | Speed    | Cost        |
|-------------|-----------------------------------|----------|-------------|
| 2Captcha    | npm install 2captcha              | ~15-30s  | $2.99/1000  |
| CapSolver   | npm install capsolver-npm         | ~5-15s   | $0.8-1/1000 |
| Anti-Captcha| npm install @antiadmin/anticaptchaofficial | ~15-30s | $2/1000  |

Integration pattern:
1. Detect CAPTCHA iframe on page
2. Extract sitekey from data-sitekey attribute
3. Send sitekey + page URL to solving API
4. Poll for solution token
5. Inject token into g-recaptcha-response field
6. Trigger form callback

Add to .env.example:
  CAPTCHA_API_KEY=your-api-key-here
  CAPTCHA_SERVICE=2captcha|capsolver|anticaptcha
```

#### Strategy 4: Browser Extension (Simplest for CapSolver)

```
Load the CapSolver browser extension into the Playwright browser context:
  --load-extension=/path/to/capsolver-extension

This auto-solves CAPTCHAs without code changes.
```

**Always present all strategies to the developer and let them choose.**

### 4. Re-Run (max 2 retries)

After applying fixes:
```bash
cd {{output_dir}} && npx playwright test --reporter=list
```

If still failing after 2 retries → proceed to delivery with failure report.

### 5. Final Delivery

**Success Report:**
```
✅ vl-playwright-gen Complete!

📁 Files Generated ({{file_count}}):
{{#each files}}
├── {{filePath}} ({{details}})
{{/each}}

🧪 Test Results: {{pass_count}}/{{total_count}} passed ✅

⚡ Next Steps:
1. cd {{output_dir}}
2. cp .env.example .env  # Fill in your credentials
3. npx playwright test   # Run your tests!

💡 For VeilusBrowser: See README.md → VeilusBrowser Configuration
```

**Failure Report (if any tests still fail):**
```
⚠️ vl-playwright-gen Complete (with issues)

📁 Files Generated ({{file_count}})
🧪 Test Results: {{pass_count}}/{{total_count}} passed

❌ Failed Tests:
{{#each failures}}
- {{testName}}: {{errorSummary}}
  Suggested fix: {{suggestion}}
{{/each}}

💡 These failures may be due to:
- Dynamic content requiring authentication
- Rate limiting or CAPTCHA
- Elements loaded via AJAX (may need additional waits)

Manual fix suggestions are in the test file comments.
```

### 5a. Result-Based Integration Suggestions

After test execution, suggest additional integrations based on what happened:

**If selector failures persisted after 2 retries:**
```
🧠 Consider AI Self-Healing for automated selector repair:
   → Implement a custom MCP agent to auto-fix broken locators
   → Or use Healenium (healenium.io) for ML-based selector healing
   → See external-integrations.md §21
```

**If all tests passed:**
```
☁️ Expand coverage with cross-browser testing:
   → Run on BrowserStack/Sauce Labs for Safari, Firefox, Edge
   → See external-integrations.md §11

📡 Deploy as production monitoring:
   → Use Checkly to run these tests every 5 minutes
   → See external-integrations.md §17
```

**If flow has many page transitions (>3):**
```
⚡ Track performance metrics across the flow:
   → Add Lighthouse audits or Web Vitals tracking
   → See external-integrations.md §15
```

**Always suggest in delivery summary:**
```
📋 Recommended Next Steps:
   ♿ Add accessibility scans → npm install @axe-core/playwright
   📊 Enable rich reporting  → npm install allure-playwright
   🔄 Setup CI/CD pipeline   → See external-integrations.md §12
   📡 Production monitoring   → See external-integrations.md §17
```

### 6. Workflow Complete

The skill workflow ends here. The developer has:
- Generated POM files with cascade selectors
- Generated test specs with assertions
- Configuration files (playwright.config.ts, .env.example)
- Documentation (README.md)
- Integration files (if accepted: a11y, reporting, CI/CD, mocking, seeding)
- Validation results with fix suggestions

---

## FAILURE MODES

❌ Not running dry-run validation
❌ Giving up after first failure without attempting fix
❌ Not reporting failure details to developer
❌ Not providing clear next steps
❌ Not suggesting result-based integrations after test execution
