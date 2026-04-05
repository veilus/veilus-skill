# Step 2: Discover — Navigate & Inspect Pages

## STEP GOAL

Navigate to the target URL using Playwright MCP, capture accessibility snapshots, perform deep DOM inspection, and generate cascade selectors for every interactive element.

## MANDATORY RULES

- 📖 Read this entire step before taking any action
- 🔄 For multi-page flows: repeat the inspect loop for each page
- ⏸️ Pause at each new page to show findings and get user confirmation (Guided Autopilot)
- 📊 Build PageInspection data for each page in the flow

---

## EXECUTION SEQUENCE

### 1. Navigate to Target URL

Use Playwright MCP to navigate:
- Call `browser_navigate` with `{{target_url}}`
- Wait for page load (networkidle or domcontentloaded)
- If navigation fails (timeout, 404, SSL) → report error and ask user to verify URL

### 2. Capture Accessibility Snapshot

Use Playwright MCP `browser_snapshot` to get the accessibility tree:
- Identifies all interactive elements: inputs, buttons, links, selects, checkboxes
- Captures headings and landmark regions for page context
- Records element roles, names, and text content

### 3. Deep DOM Inspection

Use Playwright MCP `browser_evaluate` to run JavaScript for additional details:

**Framework Detection:**
```javascript
(() => {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return 'react';
  if (window.__VUE__) return 'vue';
  if (window.ng || document.querySelector('[ng-version]')) return 'angular';
  if (document.querySelector('[data-svelte-h]')) return 'svelte';
  return 'static';
})()
```

**Dynamic ID Detection:**
```javascript
(() => {
  const inputs = document.querySelectorAll('input, button, select, textarea, a');
  const dynamicIds = [];
  inputs.forEach(el => {
    if (el.id && /[a-f0-9]{4,}|^:r[0-9a-z]+:$/i.test(el.id)) {
      dynamicIds.push(el.id);
    }
  });
  return { count: dynamicIds.length, examples: dynamicIds.slice(0, 5) };
})()
```

**Additional Checks:**
```javascript
(() => ({
  hasTestIds: document.querySelectorAll('[data-testid]').length,
  hasShadowDOM: document.querySelectorAll('*').length !== document.querySelectorAll('*:not(:defined)').length ? 'possible' : 'none',
  hasIframes: document.querySelectorAll('iframe').length,
  hasCaptcha: !!(document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .g-recaptcha, .h-captcha'))
}))()
```

### 4. Generate Cascade Selectors

For each interactive element found, generate a SelectorChain following cascade priority:

**Priority Order:**
1. **`getByRole('role', { name: 'name' })`** — if role + accessible name available → confidence: HIGH
2. **`getByLabel('label')`** — if associated label exists → confidence: HIGH
3. **`getByText('text')`** — if unique visible text content → confidence: MEDIUM
4. **`getByTestId('id')`** — if data-testid attribute present → confidence: MEDIUM
5. **`page.locator('css')`** — last resort → confidence: LOW

**Rules:**
- If ambiguous (multiple matches): add `.first()`, `.nth(n)`, or parent scoping
- Always generate `.or()` fallback with the next available strategy
- Flag elements with ONLY CSS selectors as "⚠️ low confidence"

### 5. Build PageInspection

Structure all findings into internal PageInspection format:

```
PageInspection:
  url: {{current_url}}
  title: {{page_title}}
  pageType: form | list | dashboard | detail | landing | other
  framework: react | vue | angular | svelte | static | unknown
  elements: [
    { name, type, role, label, text, testId, selectorChain, confidence }
  ]
  edgeCases: { hasShadowDOM, hasIframes, hasDynamicIds, hasCaptcha }
```

### 6. Multi-Page Flow Loop (if applicable)

If `{{flow_description}}` describes multiple pages:

1. Present current page findings (summary table)
2. **PAUSE** — ask user: "I found [N] elements on [Page Name]. Confirm and describe the next action?"
3. User confirms and describes next step (e.g., "fill login form and click Login")
4. Perform the action using Playwright MCP (`browser_type`, `browser_click`)
5. Detect navigation (URL change, new content)
6. If new page detected → go back to step 2 (snapshot new page)
7. Repeat until flow is complete or user says "stop"

**External Integration Detection:**

During inspection, detect elements/patterns that require external API integration. Flag each in the summary.

| Detection Signal | Flag Message | Integration | Trigger |
|-----------------|-------------|-------------|----------|
| `iframe[src*="recaptcha"]`, `.g-recaptcha`, URL `/sorry/` | `⚠️ CAPTCHA detected` | CAPTCHA Solving API | Auto |
| MFA/OTP input (`maxlength="6"`, `autocomplete="one-time-code"`) | `⚠️ MFA/2FA detected` | SMS API (Twilio) | Auto |
| Email form + "check your email" / "verify" text | `📧 Email verification flow detected` | Email API (Mailosaur) | Auto |
| `iframe[src*="stripe"]`, `input[name*="card"]`, URL `/checkout` | `💳 Payment form detected` | Payment Sandbox | Auto |
| "Sign in with Google/Facebook/GitHub", OAuth redirect links | `🔐 OAuth/Social login detected` | OAuth Handling | Auto |
| Cloudflare challenge, DataDome, `cf-challenge` | `🤖 Anti-bot protection detected` | Stealth + Proxy | Auto |
| `a[download]`, PDF/CSV download buttons | `📄 File download detected` | File Verification | Auto |
| WebSocket connections, live chat widgets | `💬 Real-time features detected` | WebSocket Testing | Auto |
| Registration forms with many fields (>5 inputs) | `📝 Complex form — suggest faker.js` | Test Data Generation | Auto |
| Geo-restricted content, locale selector | `🌍 Geo-sensitive content detected` | Proxy/Geolocation | Auto |
| `aria-*` attributes, form elements, images without alt | `♿ Accessibility scan recommended` | axe-core (§13) | Always |
| Login form, password inputs, sensitive data fields | `🔒 Security testing opportunity` | OWASP ZAP (§14) | Auto |
| Navigation-heavy flow (>2 page transitions) | `⚡ Performance metrics recommended` | Lighthouse/Web Vitals (§15) | Auto |
| External API calls in network log | `🔌 API mocking recommended` | MSW / page.route() (§20) | Auto |

For detailed integration patterns, see `../resources/external-integrations.md`.

### 7. Proceed

After all pages inspected, show brief summary:
```
📋 Inspection Complete!

Pages inspected: {{page_count}}
Total elements: {{element_count}}
Low confidence selectors: {{low_confidence_count}}
Human checkpoints: {{checkpoint_count}}
External integrations needed: {{integration_count}}

{{#each integrations}}
  {{flag_emoji}} {{integration_name}}: {{description}}
{{/each}}

[C] Continue to review findings
```

---

## NEXT STEP

When user selects [C], read fully and follow: `./step-03-plan.md`

## FAILURE MODES

❌ Not using accessibility-first approach (snapshot before evaluate)
❌ Not pausing at each page for user confirmation
❌ Missing cascade selector fallbacks
❌ Not detecting CAPTCHA/MFA
❌ Not detecting external integration needs (email, SMS, payment, OAuth)
❌ Not flagging anti-bot protection signals
