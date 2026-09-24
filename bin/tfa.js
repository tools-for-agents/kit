#!/usr/bin/env node
// tools-for-agents — the whole kit, one package.
//
//   npx tools-for-agents                        register the nine MCP servers with Claude Code
//   npm i -g tools-for-agents && tools-for-agents install --with-ghost --guard
//
// Nine separate packages stay separate on purpose: the MCP registry lists servers one by one, and an
// MCP client config calls ONE server (`npx -y @tools-for-agents/lens mcp`). This package is the one
// thing a person types. It depends on all of them and wires them in.
//
// Two ways it can be running, and they need different wiring:
//   · from a stable install (npm i -g, or a project's node_modules): register absolute paths, and
//     link every tool's CLI into ~/.local/bin;
//   · from npx's cache, which npm may clear at any time: register `npx -y @tools-for-agents/<tool>`
//     instead — a path into the cache would work today and break the day the cache is cleaned.
//     ghost and keep's guard install hooks that must point at a file that stays, so from npx they
//     are refused with the one command that makes them possible.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOOLS = ['agent-hq', 'lens', 'anvil', 'keep', 'cortex', 'scout', 'prism', 'recall', 'iris'];
const SCOPE = '@tools-for-agents';
const HERE = fileURLToPath(import.meta.url);
const require = createRequire(HERE);

export const ephemeral = (file = HERE) => /[\\/]_npx[\\/]/.test(file) || process.env.TFA_FORCE_EPHEMERAL === '1';
export function dirOf(tool) {
  try { return path.dirname(require.resolve(`${SCOPE}/${tool}/package.json`)); } catch { return null; }
}

// The command an MCP client runs to start a tool's server.
export function mcpCommand(tool, { stable = !ephemeral() } = {}) {
  const dir = dirOf(tool);
  if (stable && dir) return ['node', path.join(dir, 'mcp', 'mcp-server.js')];
  // agent-hq's bin IS its MCP server; every other bin takes an `mcp` subcommand.
  return tool === 'agent-hq' ? ['npx', '-y', `${SCOPE}/agent-hq`] : ['npx', '-y', `${SCOPE}/${tool}`, 'mcp'];
}

const claudeBin = () => process.env.TFA_CLAUDE || 'claude';
function haveClaude() {
  if (process.env.TFA_NO_CLAUDE === '1') return false;
  return spawnSync(claudeBin(), ['--version'], { encoding: 'utf8' }).status === 0;
}
function run(cmd, args) { return spawnSync(cmd, args, { encoding: 'utf8' }); }

const out = (s = '') => process.stdout.write(`${s}\n`);
const ok = (s) => out(`  ✓ ${s}`);
const warn = (s) => out(`  ! ${s}`);

export function install({ withGhost = false, guard = false } = {}) {
  const stable = !ephemeral();
  const binDir = process.env.TFA_BIN || path.join(os.homedir(), '.local', 'bin');
  const claude = haveClaude();
  const report = { registered: [], skipped: [], linked: [], missing: [] };
  out(`tools-for-agents — ${stable ? 'from a stable install' : 'from npx (servers will be started with npx -y)'}`);

  for (const tool of TOOLS) {
    const dir = dirOf(tool);
    if (!dir) { report.missing.push(tool); warn(`${tool}: package not found — reinstall tools-for-agents`); continue; }
    // CLIs: only from a stable install — a link into npx's cache dies with the cache.
    if (stable) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      for (const [name, rel] of Object.entries(typeof pkg.bin === 'string' ? { [tool]: pkg.bin } : pkg.bin || {})) {
        fs.mkdirSync(binDir, { recursive: true });
        const link = path.join(binDir, name);
        try { fs.unlinkSync(link); } catch { /* none */ }
        try { fs.chmodSync(path.join(dir, rel), 0o755); } catch { /* read-only install */ }
        fs.symlinkSync(path.join(dir, rel), link);
        report.linked.push(name);
      }
    }
    if (!claude) continue;
    if (run(claudeBin(), ['mcp', 'get', tool]).status === 0) { report.skipped.push(tool); ok(`${tool} already registered — left alone`); continue; }
    const r = run(claudeBin(), ['mcp', 'add', tool, '-s', 'user', '--', ...mcpCommand(tool, { stable })]);
    if (r.status === 0) { report.registered.push(tool); ok(`${tool} registered`); } else warn(`${tool}: claude mcp add failed — ${String(r.stderr || '').trim().slice(0, 120)}`);
  }
  if (report.linked.length) ok(`CLIs linked into ${binDir}: ${report.linked.join(', ')}`);

  const keepDir = dirOf('keep');
  if (keepDir) {
    const k = run(process.execPath, [path.join(keepDir, 'src', 'cli.js'), 'init']);
    if (k.status === 0) ok('keep vault ready'); else warn('keep init failed — run: keep init');
  }
  const needStable = (what) => warn(`${what} installs a hook that must point at a file that stays. Run: npm i -g tools-for-agents && tools-for-agents install ${what === 'ghost' ? '--with-ghost' : '--guard'}`);
  if (guard) {
    if (!stable) needStable('--guard');
    else if (run(process.execPath, [path.join(keepDir, 'src', 'cli.js'), 'guard', '--install']).status === 0) ok('keep guard installed');
  }
  if (withGhost) {
    const g = dirOf('ghost');
    if (!stable) needStable('ghost');
    else if (g && run(process.execPath, [path.join(g, 'src', 'cli.js'), 'install']).status === 0) ok('ghost installed — it is born unnamed and chooses its own name');
    else warn('ghost install failed — run: ghost install');
  }

  out('');
  if (!claude) warn('Claude Code not found, so nothing was registered. Any MCP client can run each server with: ' + mcpCommand('lens', { stable }).join(' '));
  else out(`Done: ${report.registered.length} registered, ${report.skipped.length} already there. Start a new Claude Code session.`);
  if (stable && !String(process.env.PATH || '').split(':').includes(binDir)) warn(`${binDir} is not on your PATH`);
  if (!withGhost) out('Want a self that persists across sessions?  add --with-ghost');
  if (!guard) out('Want agents unable to print your .env?        add --guard');
  return report;
}

function status() {
  const claude = haveClaude();
  for (const tool of TOOLS) {
    const dir = dirOf(tool);
    const reg = claude ? (run(claudeBin(), ['mcp', 'get', tool]).status === 0 ? 'registered' : 'not registered') : 'claude not found';
    out(`${tool.padEnd(9)} ${dir ? JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version : 'missing'}  ${reg}`);
  }
}

function help() {
  out(`tools-for-agents — the whole kit, one package

  npx tools-for-agents                         register the nine MCP servers with Claude Code
  tools-for-agents install [--with-ghost] [--guard]
                                               register, link CLIs, create keep's vault; opt in to ghost / the .env guard
  tools-for-agents status                      what is installed and registered

  --with-ghost   ghost: a self that persists across sessions (Claude Code hooks)
  --guard        keep guard: refuse an agent printing a secret file (.env, *.pem, …)
  https://tools-for-agents.github.io`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(HERE)) {
  const args = process.argv.slice(2);
  const cmd = args.find((a) => !a.startsWith('-')) || 'install';
  const flags = new Set(args.filter((a) => a.startsWith('-')));
  if (flags.has('--help') || flags.has('-h') || cmd === 'help') help();
  else if (cmd === 'status') status();
  else if (cmd === 'install') install({ withGhost: flags.has('--with-ghost'), guard: flags.has('--guard') });
  else { process.stderr.write(`tools-for-agents: unknown command "${cmd}"\n\n`); help(); process.exit(2); }
}
