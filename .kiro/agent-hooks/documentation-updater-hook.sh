#\!/bin/bash
# Documentation updater hook - Updates docs when specs change

CHANGED_FILE="$1"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$0")")")"
DOCS_DIR="$PROJECT_ROOT/docs"

# Check if it's a spec file
if [[ "$CHANGED_FILE" =~ \.kiro/specs/(.*)/.*\.md$ ]]; then
    FEATURE_NAME="${BASH_REMATCH[1]}"
    echo "📚 Spec file changed for feature: $FEATURE_NAME"
    
    # Create docs directory if it doesn't exist
    mkdir -p "$DOCS_DIR/features"
    
    # Generate feature documentation
    FEATURE_DOC="$DOCS_DIR/features/${FEATURE_NAME}.md"
    
    echo "📝 Updating feature documentation..."
    cat > "$FEATURE_DOC" << 'DOCEOF'
# ${FEATURE_NAME} Feature Documentation

*Auto-generated from specs on $(date)*

## Overview
DOCEOF
    
    # Extract overview from requirements.md
    if [ -f "$PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/requirements.md" ]; then
        sed -n '/^## Overview/,/^##/p' "$PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/requirements.md" | \
        sed '1d;$d' >> "$FEATURE_DOC"
    fi
    
    echo "" >> "$FEATURE_DOC"
    echo "## Implementation Status" >> "$FEATURE_DOC"
    echo "" >> "$FEATURE_DOC"
    
    # Check task completion from tasks.md
    if [ -f "$PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/tasks.md" ]; then
        TOTAL_TASKS=$(grep -c "^\- \[ \]" "$PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/tasks.md" 2>/dev/null || echo 0)
        COMPLETED_TASKS=$(grep -c "^\- \[x\]" "$PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/tasks.md" 2>/dev/null || echo 0)
        
        echo "- Total Tasks: $((TOTAL_TASKS + COMPLETED_TASKS))" >> "$FEATURE_DOC"
        echo "- Completed: $COMPLETED_TASKS" >> "$FEATURE_DOC"
        echo "- Remaining: $TOTAL_TASKS" >> "$FEATURE_DOC"
        echo "- Progress: $((COMPLETED_TASKS * 100 / (TOTAL_TASKS + COMPLETED_TASKS + 1)))%" >> "$FEATURE_DOC"
    fi
    
    echo "" >> "$FEATURE_DOC"
    echo "## Technical Details" >> "$FEATURE_DOC"
    echo "" >> "$FEATURE_DOC"
    echo "For detailed technical information, see:" >> "$FEATURE_DOC"
    echo "- [Requirements]($PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/requirements.md)" >> "$FEATURE_DOC"
    echo "- [Design]($PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/design.md)" >> "$FEATURE_DOC"
    echo "- [Tasks]($PROJECT_ROOT/.kiro/specs/$FEATURE_NAME/tasks.md)" >> "$FEATURE_DOC"
    
    echo "✅ Documentation updated: $FEATURE_DOC"
fi

# Update main feature index
if [[ "$CHANGED_FILE" =~ \.kiro/specs/.*/.*\.md$ ]]; then
    echo "📋 Updating feature index..."
    
    FEATURE_INDEX="$DOCS_DIR/features/index.md"
    cat > "$FEATURE_INDEX" << 'INDEXEOF'
# Yellow Box Features

*Auto-generated index on $(date)*

## Available Features

INDEXEOF
    
    # List all features
    for spec_dir in "$PROJECT_ROOT"/.kiro/specs/*/; do
        if [ -d "$spec_dir" ]; then
            feature=$(basename "$spec_dir")
            echo "- [${feature}](./${feature}.md)" >> "$FEATURE_INDEX"
        fi
    done
    
    echo "✅ Feature index updated"
fi

exit 0
