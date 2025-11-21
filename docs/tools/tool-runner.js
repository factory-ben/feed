#!/usr/bin/env node

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const TOOLS_DIR = path.join(ROOT, 'docs', 'tools');
const MANIFEST_PATH = path.join(TOOLS_DIR, 'manifest.json');
const CACHE_DIR = path.join(os.tmpdir(), 'factory-tools-cache');
const DEFAULT_BASE_URL = process.env.TOOLBOX_BASE_URL || 'https://factory-ben.github.io/feed-aggregator';

function usage(exitCode = 0) {
  const text = `Usage:
  node docs/tools/tool-runner.js --list
  node docs/tools/tool-runner.js <tool-name> [-- arg1 arg2 ...]

Examples:
  node docs/tools/tool-runner.js --list
  node docs/tools/tool-runner.js classify-feed --input docs/data/feed.json --dry-run
`;
  console.log(text);
  process.exit(exitCode);
}

async function readManifest() {
  try {
    const raw = await fsPromises.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const remoteUrl = `${DEFAULT_BASE_URL}/tools/manifest.json`;
    const res = await fetch(remoteUrl);
    if (!res.ok) {
      throw new Error(`Unable to load manifest locally or remotely (${res.status})`);
    }
    return await res.json();
  }
}

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function ensureTool(toolName, manifestEntry) {
  const localScript = path.join(TOOLS_DIR, toolName, 'script.js');
  if (fs.existsSync(localScript)) {
    return localScript;
  }

  ensureDirSync(CACHE_DIR);
  const cachedScript = path.join(CACHE_DIR, `${toolName}.js`);

  let needsDownload = true;
  if (fs.existsSync(cachedScript)) {
    const buffer = await fsPromises.readFile(cachedScript);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    if (!manifestEntry.hash || manifestEntry.hash === hash) {
      needsDownload = false;
    }
  }

  if (needsDownload) {
    if (!manifestEntry.entry) {
      throw new Error(`Manifest entry for ${toolName} is missing the script path.`);
    }
    const remoteUrl = `${DEFAULT_BASE_URL}/${manifestEntry.entry}`;
    const res = await fetch(remoteUrl);
    if (!res.ok) {
      throw new Error(`Failed to download ${toolName} script (${res.status})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    if (manifestEntry.hash && manifestEntry.hash !== hash) {
      throw new Error(`Hash mismatch for ${toolName}. Expected ${manifestEntry.hash}, got ${hash}`);
    }
    await fsPromises.writeFile(cachedScript, buffer, { mode: 0o755 });
  }

  return cachedScript;
}

async function runTool(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [scriptPath, ...args], {
      stdio: 'inherit',
      env: process.env,
    });

    proc.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tool exited with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    usage(1);
  }

  if (argv[0] === '--help' || argv[0] === '-h') {
    usage(0);
  }

  const manifest = await readManifest();
  const tools = manifest.tools || {};

  if (argv[0] === '--list') {
    const entries = Object.entries(tools);
    if (!entries.length) {
      console.log('No tools found in manifest.');
      return;
    }
    console.log('Available tools:\n');
    for (const [name, info] of entries) {
      console.log(`- ${name}: ${info.description || 'No description provided.'}`);
    }
    return;
  }

  const toolName = argv[0];
  const toolArgs = argv.slice(1);
  const manifestEntry = tools[toolName];
  if (!manifestEntry) {
    console.error(`Tool "${toolName}" not found in manifest. Run with --list to see available tools.`);
    process.exit(1);
  }

  const scriptPath = await ensureTool(toolName, manifestEntry);
  await runTool(scriptPath, toolArgs);
}

main().catch(error => {
  console.error('[tool-runner] Error:', error.message);
  process.exit(1);
});
