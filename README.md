# veilus-skill

> Collection of AI coding skills by [Veilus](https://veilus.io) — plug-and-play modules that extend AI coding assistants with specialized automation capabilities.

## Skills

| Skill | Description | Status |
|-------|-------------|--------|
| [**vl-playwright-gen**](./vl-playwright-gen/) | AI-powered Playwright test generator with POM, cascade selectors, and 15 external integration patterns | ✅ Stable |

## What Are AI Coding Skills?

Skills are structured instruction sets that teach AI coding assistants (Gemini CLI, Claude Code, etc.) how to perform complex, multi-step tasks. Each skill contains:

- **Workflow steps** — sequential instructions the AI follows
- **Scripts** — helper utilities for scaffolding, validation, etc.
- **Resources** — best practices, code patterns, and reference docs

Think of them as **reusable recipes** that make your AI assistant an expert in specific domains.

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/veilus/veilus-skill.git
```

### 2. Copy the skill you need

**For Gemini CLI / Antigravity:**
```bash
cp -r veilus-skill/vl-playwright-gen/ your-project/.agent/skills/vl-playwright-gen/
```

**For Claude Code:**
```bash
cp -r veilus-skill/vl-playwright-gen/ your-project/.claude/skills/vl-playwright-gen/
```

### 3. Use it

Open your AI assistant in the project and say:
```
"generate playwright tests for https://myapp.com/login"
```

## Compatibility

| Platform | Skills Directory | Tested |
|----------|-----------------|--------|
| Gemini CLI | `.agent/skills/` | ✅ |
| Antigravity | `.agent/skills/` | ✅ |
| Claude Code | `.claude/skills/` | ✅ |

## Repository Structure

```
veilus-skill/
├── vl-playwright-gen/          # Playwright test generator skill
│   ├── SKILL.md                # Skill entry point
│   ├── workflow.md             # 5-step orchestrator
│   ├── steps/                  # Step-by-step instructions
│   ├── scripts/                # Node.js helper scripts
│   ├── resources/              # Best practices & integration guides
│   └── README.md               # Skill documentation
├── .agent/skills/              # BMad agent skills (project management)
├── .gitignore
└── README.md                   # This file
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/new-skill`)
3. Follow the existing skill structure (SKILL.md → workflow.md → steps/)
4. Submit a PR

## License

MIT — [Veilus](https://veilus.io)
