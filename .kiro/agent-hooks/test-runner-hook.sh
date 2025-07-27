#\!/bin/bash
# Test runner hook - Automatically runs tests when code changes

# Get the changed file
CHANGED_FILE="$1"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$0")")")"

# Check if it's a source file
if [[ "$CHANGED_FILE" =~ \.(ts|tsx|js|jsx)$ ]] && [[ \! "$CHANGED_FILE" =~ \.(test|spec)\. ]]; then
    echo "🧪 Source file changed: $CHANGED_FILE"
    
    # Find corresponding test file
    BASE_NAME=$(basename "$CHANGED_FILE" | sed 's/\.[^.]*$//')
    DIR_NAME=$(dirname "$CHANGED_FILE")
    
    TEST_PATTERNS=(
        "${DIR_NAME}/__tests__/${BASE_NAME}.test.*"
        "${DIR_NAME}/${BASE_NAME}.test.*"
        "${DIR_NAME}/${BASE_NAME}.spec.*"
    )
    
    for PATTERN in "${TEST_PATTERNS[@]}"; do
        TEST_FILES=$(find "$PROJECT_ROOT" -path "$PATTERN" 2>/dev/null)
        if [ -n "$TEST_FILES" ]; then
            echo "📋 Found test files:"
            echo "$TEST_FILES"
            
            # Run tests if npm test is available
            if [ -f "$PROJECT_ROOT/package.json" ] && grep -q '"test"' "$PROJECT_ROOT/package.json"; then
                echo "🏃 Running tests..."
                cd "$PROJECT_ROOT"
                npm test -- "$TEST_FILES" --watchAll=false
            fi
            break
        fi
    done
    
    if [ -z "$TEST_FILES" ]; then
        echo "⚠️  No test file found for $CHANGED_FILE"
        echo "💡 Consider creating a test file"
    fi
fi

# If it's a test file that changed, run it
if [[ "$CHANGED_FILE" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
    echo "🧪 Test file changed: $CHANGED_FILE"
    if [ -f "$PROJECT_ROOT/package.json" ] && grep -q '"test"' "$PROJECT_ROOT/package.json"; then
        echo "🏃 Running test..."
        cd "$PROJECT_ROOT"
        npm test -- "$CHANGED_FILE" --watchAll=false
    fi
fi

exit 0
