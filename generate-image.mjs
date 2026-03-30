#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, renameSync, chmodSync } from 'fs';
import { createInterface } from 'readline';
import { request as httpsRequest, get as httpsGet } from 'https';
import { homedir } from 'os';
import { join, resolve, dirname } from 'path';

const VERSION = '0.2.1';
const RELEASES_API = 'https://api.github.com/repos/dkarski/openai-image-skill/releases/latest';
const REPO_RAW = 'https://raw.githubusercontent.com/dkarski/openai-image-skill/main';

const CONFIG_PATH = join(homedir(), '.config', 'dalle', 'config.json');
const DEFAULT_CONFIG = {
  defaultModel: 'dall-e-3',
  knownModels: ['dall-e-2', 'dall-e-3'],
  lastChecked: '',
};

// ── Config ──────────────────────────────────────────────────────────────────

function readConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function writeConfig(obj) {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(obj, null, 2));
}

// ── API ─────────────────────────────────────────────────────────────────────

function checkApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      'Error: OPENAI_API_KEY is not set.\n' +
      'Fix: export OPENAI_API_KEY=sk-...  (add to ~/.zshrc to persist)'
    );
    process.exit(1);
  }
}

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.openai.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = httpsRequest(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let data;
        try { data = JSON.parse(text); } catch { data = {}; }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data?.error?.message ?? text}`));
        }
      });
    });
    req.on('error', err => reject(new Error(`Network error: ${err.message}`)));
    if (payload) req.write(payload);
    req.end();
  });
}

function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadToBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', err => reject(new Error(`Network error: ${err.message}`)));
  });
}

// ── Interactive prompts ──────────────────────────────────────────────────────

function askYesNo(question) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} (y/n): `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function askChoice(list) {
  return new Promise(resolve => {
    list.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Pick number: ', answer => {
      rl.close();
      const idx = parseInt(answer, 10) - 1;
      const safeIdx = isNaN(idx) ? 0 : Math.max(0, Math.min(list.length - 1, idx));
      resolve(list[safeIdx]);
    });
  });
}

// ── Daily model check ────────────────────────────────────────────────────────

async function runDailyCheck(config) {
  const today = new Date().toISOString().slice(0, 10);
  await checkLatestVersion(config);
  if (config.lastChecked === today) return config;

  let fetched;
  try {
    const data = await apiRequest('GET', '/v1/models');
    fetched = data.data
      .map(m => m.id)
      .filter(id => id.includes('dall-e') || id.startsWith('gpt-image'))
      .sort();
  } catch (err) {
    console.warn(`Warning: model check failed — ${err.message}`);
    config.lastChecked = today;
    writeConfig(config);
    return config;
  }

  const newModels = fetched.filter(m => !(config.knownModels ?? []).includes(m));
  config.knownModels = fetched;
  config.lastChecked = today;

  if (newModels.length > 0) {
    console.log(`\nNew image models available: ${newModels.join(', ')}`);
    if (process.stdin.isTTY) {
      const doSwitch = await askYesNo('Switch default model?');
      if (doSwitch) {
        console.log('Available models:');
        config.defaultModel = await askChoice(fetched);
        console.log(`Default set to: ${config.defaultModel}`);
      }
    } else {
      console.log('(Run interactively to switch default.)');
    }
  }

  writeConfig(config);
  return config;
}

// ── Version check ────────────────────────────────────────────────────────────

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'User-Agent': `openai-image-skill/${VERSION}` },
    };
    const req = httpsRequest(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch { reject(new Error('Invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function checkLatestVersion(config) {
  const today = new Date().toISOString().slice(0, 10);
  if (config.versionChecked === today) return;

  let latestTag;
  try {
    const data = await fetchJson(RELEASES_API);
    latestTag = data.tag_name?.replace(/^v/, '');
  } catch {
    return;
  }

  config.versionChecked = today;
  config.latestVersion = latestTag;
  writeConfig(config);

  if (latestTag && latestTag !== VERSION) {
    console.log(`\nUpdate available: v${VERSION} → v${latestTag}`);
    console.log('Run: generate-image.mjs update\n');
  }
}

// ── Commands ─────────────────────────────────────────────────────────────────

function defaultFilename() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `image_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
}

async function cmdGenerate(prompt, opts, config) {
  config = await runDailyCheck(config);

  const model = opts.model ?? config.defaultModel;
  const size = opts.size ?? '1024x1024';
  const outputPath = resolve(opts.output ?? defaultFilename());

  console.log(`Generating with ${model} (${size})…`);

  const isGptImage = model.startsWith('gpt-image');
  const body = { model, prompt, n: 1, size };
  if (!isGptImage) body.response_format = 'url';

  const result = await apiRequest('POST', '/v1/images/generations', body);

  let buffer;
  if (result.data[0].b64_json) {
    buffer = Buffer.from(result.data[0].b64_json, 'base64');
  } else {
    buffer = await downloadToBuffer(result.data[0].url);
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buffer);

  console.log(`Saved:  ${outputPath}`);
  console.log(`Model:  ${model}`);
  console.log(`Size:   ${size}`);
}

async function cmdListModels(config) {
  const data = await apiRequest('GET', '/v1/models');
  const models = data.data
    .map(m => m.id)
    .filter(id => id.includes('dall-e') || id.startsWith('gpt-image'))
    .sort();

  console.log('Image generation models:');
  for (const m of models) {
    const marker = m === config.defaultModel ? ' ← default' : '';
    console.log(`  ${m}${marker}`);
  }
}

async function cmdSetDefault(model, config) {
  config.defaultModel = model;
  writeConfig(config);
  console.log(`Default model set to: ${model}`);
}

async function cmdUpdate() {
  let release;
  try {
    release = await fetchJson(RELEASES_API);
  } catch (err) {
    console.error(`Could not reach GitHub: ${err.message}`);
    process.exit(1);
  }

  const remoteVersion = release.tag_name?.replace(/^v/, '');
  if (!remoteVersion) {
    console.error('Could not determine latest version.');
    process.exit(1);
  }

  if (remoteVersion === VERSION) {
    console.log(`Already up to date (v${VERSION}).`);
    return;
  }

  console.log(`Update available: v${VERSION} → v${remoteVersion}`);
  console.log(`Release notes: ${release.html_url}`);

  if (process.stdin.isTTY) {
    const doUpdate = await askYesNo('Update now?');
    if (!doUpdate) return;
  }

  const scriptPath = resolve(process.argv[1]);
  const tmpPath = `${scriptPath}.tmp`;
  const skillMdPath = join(homedir(), '.claude', 'skills', 'openai-image-skill', 'SKILL.md');

  console.log('Downloading update…');
  const scriptBuffer = await downloadToBuffer(`${REPO_RAW}/generate-image.mjs`);
  writeFileSync(tmpPath, scriptBuffer);
  renameSync(tmpPath, scriptPath);
  chmodSync(scriptPath, 0o755);

  try {
    const skillBuffer = await downloadToBuffer(`${REPO_RAW}/SKILL.md`);
    writeFileSync(skillMdPath, skillBuffer);
    console.log('  ✓ SKILL.md updated');
  } catch {
    console.warn('  ⚠  Could not update SKILL.md (skill may not be installed at default path)');
  }

  console.log(`\nUpdated to v${remoteVersion}. Restart Claude Code to reload skill.`);
}

// ── CLI parser ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {};
  const positional = [];

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      const key = arg.slice(2, eqIdx === -1 ? undefined : eqIdx);
      const val = eqIdx === -1 ? 'true' : arg.slice(eqIdx + 1);
      flags[key] = val;
    } else {
      positional.push(arg);
    }
  }

  const [first, second] = positional;
  if (first === 'list-models') return { command: 'list-models' };
  if (first === 'set-default') return { command: 'set-default', model: second };
  if (first === 'update') return { command: 'update' };
  if (first) return { command: 'generate', prompt: first, ...flags };
  return { command: 'help' };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const parsed = parseArgs(process.argv);

  if (parsed.command === 'help') {
    console.log([
      'Usage:',
      '  generate-image.mjs "prompt" [--model=X] [--size=X] [--output=X]',
      '  generate-image.mjs list-models',
      '  generate-image.mjs set-default <model-id>',
      '  generate-image.mjs update',
    ].join('\n'));
    return;
  }

  const config = readConfig();

  if (parsed.command !== 'update') checkApiKey();

  switch (parsed.command) {
    case 'list-models':
      await cmdListModels(config);
      break;
    case 'set-default':
      if (!parsed.model) {
        console.error('Usage: generate-image.mjs set-default <model-id>');
        process.exit(1);
      }
      await cmdSetDefault(parsed.model, config);
      break;
    case 'generate':
      await cmdGenerate(parsed.prompt, parsed, config);
      break;
    case 'update':
      await cmdUpdate();
      break;
  }
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
