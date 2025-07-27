# Agent Hooks

This directory contains automated hooks that run during development to maintain code quality and keep documentation in sync.

## Available Hooks

### 1. pre-save-hook.sh
Runs before saving files to ensure code quality:
- Runs ESLint on TypeScript/JavaScript files
- Checks for console.log statements in production code
- Finds TODO/FIXME/HACK comments
- Validates spec file structure

### 2. test-runner-hook.sh
Automatically runs relevant tests when code changes:
- Finds and runs tests for changed source files
- Runs test files when they are modified
- Suggests creating tests for untested code

### 3. documentation-updater-hook.sh
Keeps documentation in sync with specs:
- Updates feature documentation when specs change
- Tracks task completion progress
- Maintains feature index

## Usage

These hooks can be integrated with your IDE or development tools:

### VS Code Integration
Add to `.vscode/settings.json`:
```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "\\.(ts|tsx|js|jsx|md)$",
        "cmd": "${workspaceFolder}/.kiro/agent-hooks/pre-save-hook.sh ${file}"
      },
      {
        "match": "\\.(ts|tsx|js|jsx)$",
        "cmd": "${workspaceFolder}/.kiro/agent-hooks/test-runner-hook.sh ${file}"
      },
      {
        "match": "\\.kiro/specs/.*\\.md$",
        "cmd": "${workspaceFolder}/.kiro/agent-hooks/documentation-updater-hook.sh ${file}"
      }
    ]
  }
}
```

### Manual Usage
```bash
# Run pre-save checks
./.kiro/agent-hooks/pre-save-hook.sh path/to/file.ts

# Run tests for a file
./.kiro/agent-hooks/test-runner-hook.sh path/to/file.ts

# Update documentation
./.kiro/agent-hooks/documentation-updater-hook.sh .kiro/specs/feature/requirements.md
```

## Customization

Feel free to modify these hooks to match your team's workflow:
- Add more linting rules
- Include additional test frameworks
- Customize documentation format
- Add integration with CI/CD pipelines
EOF < /dev/null