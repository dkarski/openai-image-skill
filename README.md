# openai-image-skill

A [Claude Code](https://claude.ai/code) skill that lets you generate images via OpenAI's image API directly from your Claude conversations.

Supports DALL-E 2, DALL-E 3, and the newer `gpt-image-1` / `gpt-image-1.5` models. Automatically detects new models daily and prompts you to switch.

## Requirements

- [Claude Code](https://claude.ai/code) CLI
- Node.js 18+
- OpenAI API key with image generation access

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/openai-image-skill.git
cd openai-image-skill
bash install.sh
```

This copies:
- `SKILL.md` → `~/.claude/skills/openai-image-skill/SKILL.md`
- `generate-image.mjs` → `~/tools/generate-image.mjs`

Then set your API key (if not already set):

```bash
export OPENAI_API_KEY=sk-...
# Add to ~/.zshrc to persist
```

## Usage

Just talk to Claude naturally — the skill triggers automatically:

> "generate an image of a cat on the moon"
> "draw a futuristic city at sunset, landscape"
> "wygeneruj obrazek górskiego krajobrazu"

### Direct CLI usage

```bash
# Basic
node ~/tools/generate-image.mjs "a cat on the moon"

# With options
node ~/tools/generate-image.mjs "a cat on the moon" --model=gpt-image-1.5 --size=1792x1024 --output=cat.png

# List available models
node ~/tools/generate-image.mjs list-models

# Change default model
node ~/tools/generate-image.mjs set-default gpt-image-1.5
```

### Options

| Flag | Description | Example |
|------|-------------|---------|
| `--model` | Model to use | `--model=gpt-image-1.5` |
| `--size` | Image dimensions | `--size=1792x1024` |
| `--output` | Output file path | `--output=image.png` |

### Size presets

| Keyword | Size |
|---------|------|
| square | `1024x1024` |
| landscape | `1792x1024` |
| portrait | `1024x1792` |

## Models

| Model | Notes |
|-------|-------|
| `dall-e-2` | Older, cheaper |
| `dall-e-3` | Reliable, good quality |
| `gpt-image-1` | High quality, newer |
| `gpt-image-1.5` | Best quality, latest |

The script checks for new models once per day and notifies you when new ones are available.

## Configuration

Config is stored at `~/.config/dalle/config.json`:

```json
{
  "defaultModel": "gpt-image-1.5",
  "knownModels": ["dall-e-2", "dall-e-3", "gpt-image-1", "gpt-image-1.5"],
  "lastChecked": "2026-03-27"
}
```

## License

MIT
