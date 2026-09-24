import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, mcpCommand, ephemeral } from '../bin/tfa.js';

test('the kit is the nine tools, in loop order', () => {
  assert.deepEqual(TOOLS, ['agent-hq', 'lens', 'anvil', 'keep', 'cortex', 'scout', 'prism', 'recall', 'iris']);
});

test('from npx, servers are registered with npx -y — never a path into a cache that can be cleared', () => {
  assert.deepEqual(mcpCommand('lens', { stable: false }), ['npx', '-y', '@tools-for-agents/lens', 'mcp']);
  assert.deepEqual(mcpCommand('agent-hq', { stable: false }), ['npx', '-y', '@tools-for-agents/agent-hq'], "agent-hq's bin IS its server");
  assert.equal(ephemeral('/Users/x/.npm/_npx/abc123/node_modules/tools-for-agents/bin/tfa.js'), true);
  assert.equal(ephemeral('/usr/local/lib/node_modules/tools-for-agents/bin/tfa.js'), false);
});
