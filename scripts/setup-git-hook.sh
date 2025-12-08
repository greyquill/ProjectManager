#!/bin/bash

# Script to setup git pre-commit hook for CLAUDE.md updates

HOOK_FILE=".git/hooks/pre-commit"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "[Setup] Setting up git pre-commit hook for CLAUDE.md updates..."

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo "[Setup] Error: .git directory not found. Make sure you're in a git repository."
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/.git/hooks"

# Create pre-commit hook
cat > "$PROJECT_ROOT/$HOOK_FILE" << 'EOF'
#!/bin/bash

# Auto-update CLAUDE.md before commit
echo "[Git Hook] Updating CLAUDE.md..."
cd "$(git rev-parse --show-toplevel)"
node scripts/update-claude-md.js

# Add CLAUDE.md if it was modified
git add CLAUDE.md 2>/dev/null || true

exit 0
EOF

# Make hook executable
chmod +x "$PROJECT_ROOT/$HOOK_FILE"

echo "[Setup] Git pre-commit hook installed successfully!"
echo "[Setup] CLAUDE.md will be automatically updated on each commit."

