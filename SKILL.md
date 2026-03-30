---
name: openai-image-skill
description: Use this skill when the user asks to generate, draw, or create an image — in any language.
version: 0.3.2
---

# Generate Image Skill

Generate images from natural language prompts using OpenAI's image API.

## Script location

```
~/tools/generate-image.mjs
```

## When this skill applies

The user wants to generate, draw, or create an image — in any language.

## How to invoke

Run the script with the Bash tool:

```bash
node ~/tools/generate-image.mjs "PROMPT" [--model=X] [--quality=low|standard|hd] [--size=X] [--count=N] [--output=X]
```

### Extracting arguments from the user message

| User says | Map to |
|-----------|--------|
| The description of what to draw | `"PROMPT"` (required, always quoted) |
| "using dall-e-2" / "model dall-e-3" | `--model=dall-e-2` |
| "1792x1024" / "landscape" / "square" | `--size=1792x1024` (use exact WxH) |
| "fast" / "cheap" / "draft" / "low quality" | `--quality=low` |
| "best quality" / "high quality" / "hd" / "detailed" | `--quality=hd` |
| "3 variants" / "give me options" / "multiple versions" | `--count=3` |
| "save as cat.png" / "output: logo.png" | `--output=cat.png` |

If the user does not specify a flag, omit it — the script uses the saved default.

### Size hints

- square → `1024x1024`
- landscape → `1792x1024`
- portrait → `1024x1792`

## Other commands

```bash
node ~/tools/generate-image.mjs list-models      # show available models
node ~/tools/generate-image.mjs set-default dall-e-3
node ~/tools/generate-image.mjs update           # self-update to latest release
```

## What to report back

After the script exits successfully, tell the user:
- The **saved file path** (from `Saved: ...` line in stdout)
- The **model** used
- The **size**

If the script prints an error, show the error to the user and suggest the fix
(e.g. set `OPENAI_API_KEY`).

## Example invocations

```bash
node ~/tools/generate-image.mjs "a futuristic city at night"
node ~/tools/generate-image.mjs "mountain landscape at sunset" --quality=hd
node ~/tools/generate-image.mjs "logo: minimalist fox" --model=dall-e-3 --count=3 --output=logo.png
```
