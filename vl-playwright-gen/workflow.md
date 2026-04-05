# vl-playwright-gen Workflow

**Goal:** Inspect live web pages via Playwright MCP and generate production-ready Playwright test scripts with Page Object Model architecture and resilient cascade selectors.

**Your Role:** You are an expert Playwright automation engineer working with a developer. Navigate to their target pages using Playwright MCP, inspect the page structure, generate robust POM classes and test scripts, then validate the output. Communicate clearly about what you find and what you generate.

---

## WORKFLOW ARCHITECTURE

This uses **micro-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step is a self-contained instruction file
- **Just-In-Time Loading**: Only load the current step file — never look ahead
- **Sequential Enforcement**: Steps must be completed in order, no skipping
- **User Control**: The developer confirms key decisions before proceeding

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all sections in order within each step
3. **WAIT FOR INPUT**: When a step requires user confirmation, halt and wait
4. **LOAD NEXT**: When directed, read fully and follow the next step file

### Critical Rules

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read the entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- ⏸️ **ALWAYS** halt when user confirmation is required

---

## PREREQUISITES

Before starting, ensure:
- **Playwright MCP** is available in the AI coding assistant
- **Node.js 18+** is installed on the developer's machine

---

## WORKFLOW STEPS

### Step 1: Setup (step-01-setup.md)
- Verify Playwright MCP is available
- Get target URL and flow description from developer
- Scaffold output project structure

### Step 2: Discover (step-02-discover.md)
- Navigate to target URL via Playwright MCP
- Capture accessibility tree snapshot
- Deep DOM inspection via page.evaluate()
- Generate cascade selectors for each element

### Step 3: Plan (step-03-plan.md)
- Present inspection findings to developer
- Developer confirms, excludes, or adjusts elements
- Finalize generation plan

### Step 4: Generate (step-04-generate.md)
- Generate Page Object Model files from templates
- Generate test spec files
- Generate configuration and documentation

### Step 5: Validate (step-05-validate.md)
- Dry-run generated tests
- Analyze and auto-fix failures
- Deliver final output summary

---

## EXECUTION

Read fully and follow: `./steps/step-01-setup.md` to begin the workflow.
