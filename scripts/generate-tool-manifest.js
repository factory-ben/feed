#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'docs', 'tools');
const MANIFEST_PATH = path.join(TOOLS_DIR, 'manifest.json');
const IGNORE = new Set(['_lib']);

async function readJson(filePath, fallback = {}) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function buildEntry(toolName) {
  const toolDir = path.join(TOOLS_DIR, toolName);
  const scriptPath = path.join(toolDir, 'script.js');
  const toolMetaPath = path.join(toolDir, 'tool.json');

  try {
    const scriptBuffer = await fs.readFile(scriptPath);
    const hash = crypto.createHash('sha256').update(scriptBuffer).digest('hex');
    const stats = await fs.stat(scriptPath);
    const meta = await readJson(toolMetaPath, {});

    return {
      name: meta.name || toolName,
      description: meta.description || '',
      version: meta.version || '1.0.0',
      entry: `tools/${toolName}/script.js`,
      hash,
      size: stats.size,
      args: meta.args || [],
      env: meta.env || [],
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function main() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    tools: {},
  };

  let entries = [];
  try {
    entries = await fs.readdir(TOOLS_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('No docs/tools directory found. Nothing to do.');
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (IGNORE.has(entry.name) || entry.name.startsWith('.')) continue;

    const tool = await buildEntry(entry.name);
    if (tool) {
      manifest.tools[entry.name] = tool;
    }
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest with ${Object.keys(manifest.tools).length} tool(s) to ${path.relative(ROOT, MANIFEST_PATH)}`);
}

main().catch(error => {
  console.error('[manifest] Failed to generate manifest:', error);
  process.exit(1);
});
