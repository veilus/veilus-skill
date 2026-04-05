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

### 6. Workflow Complete

The skill workflow ends here. The developer has:
- Generated POM files with cascade selectors
- Generated test specs with assertions
- Configuration files (playwright.config.ts, .env.example)
- Documentation (README.md)
- Validation results with fix suggestions

---

## FAILURE MODES

❌ Not running dry-run validation
❌ Giving up after first failure without attempting fix
❌ Not reporting failure details to developer
❌ Not providing clear next steps
