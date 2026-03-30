---
name: openai-image-skill
description: Use this skill when the user asks to generate, draw, or create an image. Trigger phrases include "wygeneruj obraz", "wygeneruj zdjęcie", "narysuj", "stwórz obrazek", "zrób grafikę", "zrób obrazek", "generate image", "generate a picture", "draw me", "create image", "make an image", "create a picture", or any similar request to produce visual content from a text description.
version: 0.2.1
---

# Generate Image Skill

Generate images from natural language prompts using OpenAI's image API.

## Script location

```
~/tools/generate-image.mjs
```

## When this skill applies

The user wants to generate, draw, or create an image — in Polish or English.

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
| "szybko" / "tanio" / "draft" / "low quality" | `--quality=low` |
| "najlepsza jakość" / "high quality" / "hd" / "szczegółowy" | `--quality=hd` |
| "3 warianty" / "give me 3 options" / "multiple versions" | `--count=3` |
| "save as cat.png" / "output: logo.png" | `--output=cat.png` |

If the user does not specify a flag, omit it — the script uses the saved default.

### Size hints

- square / kwadrat → `1024x1024`
- landscape / poziomy → `1792x1024`
- portrait / pionowy → `1024x1792`

## Other commands

```bash
node ~/tools/generate-image.mjs list-models      # show available models
node ~/tools/generate-image.mjs set-default dall-e-3
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
# Polish
node ~/tools/generate-image.mjs "górski krajobraz o zachodzie słońca"
node ~/tools/generate-image.mjs "kot siedzący na księżycu" --size=1024x1792 --output=kot.png

# English
node ~/tools/generate-image.mjs "a futuristic city at night"
node ~/tools/generate-image.mjs "logo: minimalist fox, flat design" --model=dall-e-3 --output=logo.png
```
