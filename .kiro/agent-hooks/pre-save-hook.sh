#\!/bin/bash
# Pre-save hook - Runs before saving files

# Check if it's a TypeScript/JavaScript file
if [[ "$1" =~ \.(ts|tsx|js|jsx)$ ]]; then
    echo "🔍 Running pre-save checks for $1..."
    
    # Run ESLint
    if command -v eslint &> /dev/null; then
        eslint "$1" --fix
        if [ $? -ne 0 ]; then
            echo "❌ ESLint found issues. Please fix them before saving."
            exit 1
        fi
    fi
    
    # Check for console.log statements in production code
    if [[ \! "$1" =~ \.(test|spec)\. ]] && grep -n "console\.log" "$1"; then
        echo "⚠️  Warning: console.log found in production code"
    fi
    
    # Check for TODO comments
    if grep -n "TODO\|FIXME\|HACK" "$1"; then
        echo "📝 Found TODO/FIXME/HACK comments - remember to address them"
    fi
fi

# Check if it's a spec file
if [[ "$1" =~ \.kiro/specs/.*/.*\.md$ ]]; then
    echo "📋 Validating spec file structure..."
    
    # Check for required sections in requirements.md
    if [[ "$1" =~ requirements\.md$ ]]; then
        required_sections=("Overview" "Goals" "Functional Requirements" "Non-Functional Requirements")
        for section in "${required_sections[@]}"; do
            if \! grep -q "^## .*$section" "$1"; then
                echo "⚠️  Missing required section: $section"
            fi
        done
    fi
    
    # Check for required sections in design.md
    if [[ "$1" =~ design\.md$ ]]; then
        required_sections=("System Architecture" "Technical Design" "User Interface")
        for section in "${required_sections[@]}"; do
            if \! grep -q "^## .*$section" "$1"; then
                echo "⚠️  Missing required section: $section"
            fi
        done
    fi
fi

echo "✅ Pre-save checks completed"
exit 0
EOF < /dev/null