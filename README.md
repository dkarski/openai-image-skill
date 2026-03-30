# openai-image-skill

[![version](https://img.shields.io/github/v/release/dkarski/openai-image-skill?label=version)](https://github.com/dkarski/openai-image-skill/releases)
[![license](https://img.shields.io/github/license/dkarski/openai-image-skill)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![platform](https://img.shields.io/badge/platform-Claude%20Code-blueviolet)](https://claude.ai/code)

A [Claude Code](https://claude.ai/code) skill that lets you generate images via OpenAI's image API directly from your Claude conversations.

## Why this skill

- **All OpenAI image models** — DALL-E 2/3, `gpt-image-1`, `gpt-image-1.5`, auto-detects new models daily
- **Quality control** — `--quality=low|standard|hd` to balance cost vs. quality
- **Multiple variants** — `--count=N` to generate several options at once
- **Any language** — triggers on image requests in any language
- **Self-updating** — `generate-image.mjs update` keeps you on the latest version

## Requirements

- [Claude Code](https://claude.ai/code) CLI
- Node.js 18+
- OpenAI API key with image generation access

## Installation

```bash
git clone https://github.com/dkarski/openai-image-skill.git
cd openai-image-skill
bash install.sh
```

This installs:
- `SKILL.md` → `~/.claude/skills/openai-image-skill/SKILL.md`
- `generate-image.mjs` → `~/tools/generate-image.mjs`

Then set your API key (if not already set):

```bash
export OPENAI_API_KEY=sk-...
# Add to ~/.zshrc to persist
```

> **Getting an API key:** Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → Create new secret key.
> Image generation is a paid feature — charges apply per image based on model and size.
> See [OpenAI pricing](https://openai.com/api/pricing/) for current rates.

## Usage

Just talk to Claude naturally — the skill triggers automatically:

> "generate an image of a cat on the moon"
> "draw a futuristic city at sunset, landscape"
> "créer une image d'une forêt enchantée"
> "erstelle ein Logo: minimalist fox"

### Direct CLI usage

```bash
# Basic
node ~/tools/generate-image.mjs "a cat on the moon"

# With options
node ~/tools/generate-image.mjs "photo" --model=gpt-image-1 --quality=hd --size=1792x1024

# Multiple variants
node ~/tools/generate-image.mjs "logo concept" --count=3

# List available models
node ~/tools/generate-image.mjs list-models

# Change default model
node ~/tools/generate-image.mjs set-default gpt-image-1

# Update to latest version
node ~/tools/generate-image.mjs update
```

### Options

| Flag | Description | Example |
|------|-------------|---------|
| `--model` | Model to use | `--model=gpt-image-1` |
| `--quality` | Image quality | `--quality=low` / `standard` / `hd` |
| `--size` | Image dimensions | `--size=1792x1024` |
| `--count` | Number of variants | `--count=3` |
| `--output` | Output file path | `--output=logo.png` |

### Size presets

| Keyword | Size |
|---------|------|
| square | `1024x1024` |
| landscape | `1792x1024` |
| portrait | `1024x1792` |

### Quality presets

| Value | Effect | Best for |
|-------|--------|----------|
| `low` | Fastest, lowest cost | Drafts, iteration |
| `standard` | Balanced (default) | Most use cases |
| `hd` | Highest detail | Final output, `dall-e-3` |

> Note: `dall-e-2` ignores `--quality`. `gpt-image-1` supports `low/standard/hd`. `dall-e-3` supports `standard/hd`.

## Models

| Model | Notes |
|-------|-------|
| `dall-e-2` | Older, cheapest |
| `dall-e-3` | Reliable, supports `--quality=hd` |
| `gpt-image-1` | High quality, supports `--quality=low/standard/hd` |
| `gpt-image-1.5` | Best quality, latest |

The script checks for new models once per day and notifies you when new ones are available.

## Output

By default, images are saved to `~/Pictures/ai-generated/YYYY-MM/` with a timestamped filename.
Use `--output=filename.png` to save to a specific path.

## Updating

```bash
node ~/tools/generate-image.mjs update
```

Checks GitHub Releases and updates both the script and SKILL.md in one step.

## Configuration

Config is stored at `~/.config/dalle/config.json`:

```json
{
  "defaultModel": "gpt-image-1",
  "knownModels": ["dall-e-2", "dall-e-3", "gpt-image-1", "gpt-image-1.5"],
  "lastChecked": "2026-03-30"
}
```

## License

MIT
