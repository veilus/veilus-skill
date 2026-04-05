# Step 3: Plan — Review & Confirm Generation Plan

## STEP GOAL

Present all inspection findings to the developer in a clear, structured format. Get confirmation on which pages and elements to include in code generation.

## MANDATORY RULES

- 📖 Read this entire step before taking any action
- ⏸️ MUST wait for developer confirmation before proceeding to generation
- 🔄 Allow the developer to exclude elements, add manual selectors, or request re-inspection

---

## EXECUTION SEQUENCE

### 1. Present Inspection Summary

For each inspected page, display:

```
📋 Page Inspection Results
═══════════════════════════

--- Page 1: {{page_title}} ({{page_url}}) ---
Type: {{pageType}} | Framework: {{framework}}

| # | Element         | Type   | Primary Selector                       | Confidence |
|---|-----------------|--------|----------------------------------------|------------|
| 1 | emailInput      | input  | getByLabel('Email')                    | 🟢 high    |
| 2 | passwordInput   | input  | getByLabel('Password')                 | 🟢 high    |
| 3 | loginButton     | button | getByRole('button', {name: 'Log in'})  | 🟢 high    |
| 4 | forgotLink      | link   | getByText('Forgot Password?')          | 🟡 medium  |
| 5 | socialLoginBtn  | button | locator('.social-login-btn')           | 🔴 low ⚠️  |

⚠️ Warnings:
- 1 element with CSS-only selector (socialLoginBtn)
- CAPTCHA detected: Will add Human Checkpoint

--- Page 2: {{page_title}} ({{page_url}}) ---
[repeat for each page]

═══════════════════════════
📊 Summary: {{page_count}} pages, {{element_count}} elements, {{low_conf_count}} low-confidence
```

### 2. Present Generation Plan

```
📝 Generation Plan
═══════════════════

Files to generate:
├── pages/login.page.ts         (5 elements, 1 action method)
├── pages/dashboard.page.ts     (8 elements, 0 action methods)
├── tests/login-dashboard.spec.ts (1 test with 2 page transitions)
├── playwright.config.ts
├── .env.example                (BASE_URL, TEST_EMAIL, TEST_PASSWORD)
├── .gitignore
└── README.md

🔒 Human Checkpoints: 1 (CAPTCHA at login)
```

### 3. Get Developer Confirmation

```
Review the plan and choose:

[C] Confirm — generate all files as planned
[E] Exclude — remove specific elements or pages
[M] Manual — add custom selectors for low-confidence elements
[R] Re-inspect — go back and re-inspect a page
[A] Adjust — modify the flow or add assertions
```

**Handle each option:**

- **[C] Confirm**: Proceed to Step 4
- **[E] Exclude**: Ask which elements/pages to exclude → update plan → re-present
- **[M] Manual**: Ask for selector overrides → update element's SelectorChain → re-present
- **[R] Re-inspect**: Go back to Step 2 for the specified page
- **[A] Adjust**: Ask for modifications → update plan → re-present

**Loop until developer selects [C].**

---

## NEXT STEP

When developer selects [C], read fully and follow: `./step-04-generate.md`

## FAILURE MODES

❌ Not presenting findings before generation
❌ Not offering options to exclude or adjust
❌ Proceeding without explicit confirmation
❌ Not flagging low-confidence selectors
