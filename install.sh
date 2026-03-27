#!/usr/bin/env bash
set -e

SKILL_DIR="${HOME}/.claude/skills/openai-image-skill"
TOOLS_DIR="${HOME}/tools"

echo "Installing openai-image-skill..."

# Copy skill definition
mkdir -p "$SKILL_DIR"
cp SKILL.md "$SKILL_DIR/SKILL.md"
echo "  ✓ Skill installed to $SKILL_DIR"

# Copy script
mkdir -p "$TOOLS_DIR"
cp generate-image.mjs "$TOOLS_DIR/generate-image.mjs"
chmod +x "$TOOLS_DIR/generate-image.mjs"
echo "  ✓ Script installed to $TOOLS_DIR"

# Check for API key
if [ -z "$OPENAI_API_KEY" ]; then
  echo ""
  echo "  ⚠  OPENAI_API_KEY is not set."
  echo "     Add this to your ~/.zshrc or ~/.bashrc:"
  echo "     export OPENAI_API_KEY=sk-..."
else
  echo "  ✓ OPENAI_API_KEY is set"
fi

echo ""
echo "Done! Try it:"
echo "  node ~/tools/generate-image.mjs \"a cat on the moon\""
