#!/usr/bin/env bash

# Install git hooks by symlinking from scripts/git-hooks to .git/hooks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🔧 Installing git hooks..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}⚠️  No .git directory found. Skipping git hooks installation.${NC}"
  echo -e "${YELLOW}   (This is normal if you're installing dependencies without git initialized)${NC}"
  echo ""
  exit 0
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Get the absolute path to the scripts directory
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_HOOKS_DIR="${SCRIPTS_DIR}/git-hooks"
GIT_DIR=".git/hooks"

# Counter for installed hooks
INSTALLED=0

# Install each hook
for hook in "${GIT_HOOKS_DIR}"/*; do
  if [ -f "$hook" ]; then
    hook_name=$(basename "$hook")
    hook_dest="${GIT_DIR}/${hook_name}"

    # Make the source hook executable
    chmod +x "$hook"

    # Remove existing hook or symlink
    if [ -e "$hook_dest" ] || [ -L "$hook_dest" ]; then
      rm "$hook_dest"
    fi

    # Create symlink
    # Use relative path for better portability
    relative_path="../../scripts/git-hooks/${hook_name}"
    ln -s "$relative_path" "$hook_dest"
    INSTALLED=$((INSTALLED + 1))
  fi
done

echo ""
if [ $INSTALLED -gt 0 ]; then
  echo -e "${GREEN}✅ Successfully installed ${INSTALLED} git hook(s)${NC}"
else
  echo -e "${YELLOW}⚠️  No git hooks found to install${NC}"
  echo ""
fi
