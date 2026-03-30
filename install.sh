#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="${HOME}/.claude/skills/openai-image-skill"
DEFAULT_SCRIPT_DIR="${SKILL_DIR}"

# ── Detect if ~/.local/bin is in PATH ────────────────────────────────────────
HAS_LOCAL_BIN=false
if echo "$PATH" | tr ':' '\n' | grep -qx "${HOME}/.local/bin"; then
  HAS_LOCAL_BIN=true
fi

# ── Choose script install location ───────────────────────────────────────────
echo ""
echo "openai-image-skill installer"
echo ""
echo "Where should openai-image-skill.mjs be installed?"
echo ""
echo "  1) ${HOME}/.claude/skills/openai-image-skill/  ← default (co-located with skill)"
if [ "$HAS_LOCAL_BIN" = true ]; then
  echo "  2) ${HOME}/.local/bin/  ← advanced (in PATH, shorter CLI invocation)"
fi
echo "  3) Custom path"
echo ""
printf "Press Enter for default, or choose (1%s/3): " "$([ "$HAS_LOCAL_BIN" = true ] && echo '/2')"
read -r CHOICE

case "$CHOICE" in
  2)
    if [ "$HAS_LOCAL_BIN" = true ]; then
      SCRIPT_DIR="${HOME}/.local/bin"
    else
      SCRIPT_DIR="$DEFAULT_SCRIPT_DIR"
    fi
    ;;
  3)
    printf "Enter path: "
    read -r CUSTOM_PATH
    SCRIPT_DIR="${CUSTOM_PATH/#\~/$HOME}"
    ;;
  *)
    SCRIPT_DIR="$DEFAULT_SCRIPT_DIR"
    ;;
esac

# ── Determine invoke command ──────────────────────────────────────────────────
if echo "$PATH" | tr ':' '\n' | grep -qx "$SCRIPT_DIR"; then
  INVOKE_CMD="openai-image-skill.mjs"
else
  INVOKE_CMD="node $SCRIPT_DIR/openai-image-skill.mjs"
fi

# ── Install script ────────────────────────────────────────────────────────────
mkdir -p "$SCRIPT_DIR"
cp "$REPO_DIR/openai-image-skill.mjs" "$SCRIPT_DIR/openai-image-skill.mjs"
chmod +x "$SCRIPT_DIR/openai-image-skill.mjs"
echo "  ✓ Script → $SCRIPT_DIR/openai-image-skill.mjs"

# ── Generate SKILL.md with substituted invoke command ────────────────────────
mkdir -p "$SKILL_DIR"
node -e "
  const fs = require('fs');
  const src = fs.readFileSync('$REPO_DIR/SKILL.md', 'utf8');
  fs.writeFileSync('$SKILL_DIR/SKILL.md', src.replace(/\{\{INVOKE_CMD\}\}/g, '$INVOKE_CMD'));
"
echo "  ✓ Skill  → $SKILL_DIR/SKILL.md"

# ── Save install config ───────────────────────────────────────────────────────
node -e "
  const fs = require('fs'), os = require('os'), path = require('path');
  const cfgPath = path.join(os.homedir(), '.config', 'dalle', 'config.json');
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
  cfg.scriptDir = '$SCRIPT_DIR';
  cfg.invokeCmd = '$INVOKE_CMD';
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
"
echo "  ✓ Config saved (~/.config/dalle/config.json)"

# ── API key check ─────────────────────────────────────────────────────────────
echo ""
if [ -z "$OPENAI_API_KEY" ]; then
  echo "  ⚠  OPENAI_API_KEY is not set. Add to ~/.zshrc or ~/.bashrc:"
  echo "     export OPENAI_API_KEY=sk-..."
else
  echo "  ✓ OPENAI_API_KEY is set"
fi

echo ""
echo "Done! Try it:"
echo "  $INVOKE_CMD \"a cat on the moon\""
echo ""
