#\!/bin/bash

# Sub-Agent 1: Console Cleanup Task
echo "[$(date)] Sub-Agent-1: Starting console.log cleanup..." >> logs/task-001.log

# Find all console.log statements in src directory
echo "Scanning for console.log statements..."
grep -r "console\.log" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | grep -v "node_modules" > logs/console-logs-found.txt

# Count console.log statements
COUNT=$(wc -l < logs/console-logs-found.txt)
echo "Found $COUNT console.log statements to remove"

# Remove console.log statements (excluding test files)
find src/ -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \! -path "*/test/*" \! -name "*.test.*" -exec sed -i.bak '/console\.log/d' {} \;

# Update progress
echo "[$(date)] Sub-Agent-1: Removed $COUNT console.log statements" >> logs/task-001.log
echo "[$(date)] TASK-001: COMPLETED - Console cleanup finished" >> logs/task-completion.log

# Clean up backup files
find src/ -name "*.bak" -delete

echo "✓ Console cleanup completed\!"
