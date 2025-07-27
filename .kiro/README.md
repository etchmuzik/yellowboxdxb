# .kiro Directory Structure

This directory contains all project specifications, steering documents, and automation hooks for the Yellow Box fleet management system.

## Directory Structure

```
.kiro/
├── specs/                      # Feature specifications
│   ├── analytics-reporting/    # Analytics & reporting system specs
│   ├── expense-management/     # Expense tracking and approval specs
│   ├── fleet-tracking/         # Real-time GPS tracking specs
│   ├── notification-system/    # Notification and alerting specs
│   └── rider-management/       # Rider lifecycle management specs
│
├── steering/                   # Project guidance documents
│   ├── coding-standards.md     # Development standards and practices
│   ├── deployment-guide.md     # Deployment procedures and checklist
│   ├── firebase-security-patterns.md  # Security best practices
│   ├── integration-guidelines.md      # Third-party integration guide
│   ├── project-roadmap.md      # Project timeline and milestones
│   ├── testing-strategy.md     # Comprehensive testing approach
│   └── yellowbox-project-context.md   # Project overview and context
│
└── agent-hooks/               # Automated development hooks
    ├── pre-save-hook.sh       # Code quality checks before save
    ├── test-runner-hook.sh    # Automatic test execution
    ├── documentation-updater-hook.sh  # Keep docs in sync
    └── README.md              # Hook usage instructions
```

## Spec Structure

Each feature specification contains three files:

1. **requirements.md** - Business requirements and user stories
2. **design.md** - Technical architecture and implementation details
3. **tasks.md** - Actionable implementation tasks with priorities

## Using This Structure

### For Developers
1. Check relevant specs before implementing features
2. Update tasks.md as you complete items
3. Use agent hooks for automated quality checks

### For Project Managers
1. Review project-roadmap.md for timeline
2. Check tasks.md files for progress tracking
3. Use steering documents for decision making

### For New Team Members
1. Start with yellowbox-project-context.md
2. Review coding-standards.md
3. Explore relevant feature specs

## Quick Links

- [Project Overview](steering/yellowbox-project-context.md)
- [Coding Standards](steering/coding-standards.md)
- [Testing Strategy](steering/testing-strategy.md)
- [Deployment Guide](steering/deployment-guide.md)
- [Project Roadmap](steering/project-roadmap.md)

## Automation

The agent-hooks directory contains scripts that can be integrated with your IDE to:
- Enforce code quality standards
- Run tests automatically
- Keep documentation updated

See [agent-hooks/README.md](agent-hooks/README.md) for setup instructions.
EOF < /dev/null