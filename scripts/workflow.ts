// @ts-nocheck
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

/**
 * 🌌 SENTINEL ORCHESTRATOR - Workflow Processor
 * Manages the intelligence loop between Front-end signals and AI cognition.
 */

const API_URL = 'http://localhost:3002/events';
const AGENT_NAME = 'chat_mcp_assistant'; 

// Deriving the path relative to the current project to avoid hardcoded user paths
const WORKFLOW_DIR = path.resolve(process.cwd(), '../Workflow');
const SETTINGS_PATH = path.join(WORKFLOW_DIR, `.claude/settings_${AGENT_NAME}.json`);
const MCP_CONFIG_PATH = path.join(WORKFLOW_DIR, 'mcp.json');

console.log('🌌 [Orchestrator] Initializing Intelligence Loop...');
console.log(`📡 [Orchestrator] Connecting to Vector Hub at ${API_URL}`);
console.log(`🤖 [Orchestrator] Targeted Agent: ${AGENT_NAME}`);

let processedMessages = new Set<string>();

function startMonitoring() {
  const req = http.get(API_URL, (res: http.IncomingMessage) => {
    console.log('✅ [Orchestrator] Signal connection established.');

    res.on('data', (chunk: any) => {
      const data = chunk.toString();
      // SSE filter
      if (data.startsWith('data: ')) {
        try {
          const payload = JSON.parse(data.substring(6));
          processSignal(payload);
        } catch (e) {
          // Heartbeat/Malformed
        }
      }
    });

    res.on('error', (err: Error) => {
      console.error('❌ [Orchestrator] Signal lost:', err.message);
      setTimeout(startMonitoring, 5000);
    });
  });

  req.on('error', (err: Error) => {
    console.error('❌ [Orchestrator] Connection failed:', err.message);
    setTimeout(startMonitoring, 5000);
  });
}

function processSignal(payload: any) {
  const { id, role, content } = payload;

  // Only process new human messages
  if (role !== 'user' || processedMessages.has(id)) return;

  processedMessages.add(id);
  console.log(`\n📥 [Signal Received] Human: "${content}"`);
  console.log(`🧠 [Process] Invoking AI Agent via Claude Code Runner...`);

  // Construction of the Claude CLI command
  // Logic based on Workflow/src/tools/run_claude.ts
  const args = [
    '-p', // --print-result-json equivalent or similar
    '--output-format', 'json',
    '--dangerously-skip-permissions',
    '--settings', SETTINGS_PATH,
    '--mcp-config', MCP_CONFIG_PATH
  ];

  const runner = spawn('claude', args, { 
    shell: true, 
    cwd: WORKFLOW_DIR 
  });

  let stdout = '';
  let stderr = '';

  runner.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  runner.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
    // Pre-log errors for visibility
    if (chunk.toString().includes('Error')) {
       console.error(`⚠️ [Agent Log]: ${chunk.toString().trim()}`);
    }
  });

  runner.on('close', (code: number) => {
    if (code === 0) {
      console.log(`📤 [Process] Signal processed successfully (Agent acknowledged).`);
    } else {
      console.error(`❌ [Process] Agent task failed (Exit code: ${code})`);
      if (stderr) console.error(`   Log: ${stderr.substring(0, 200)}...`);
    }
  });

  // Inject the prompt via stdin
  if (runner.stdin) {
    runner.stdin.write(content);
    runner.stdin.end();
  }
}

// Global process error handling
process.on('uncaughtException', (err) => {
  console.error('💥 [Critical Error] Orchestrator exception:', err.message);
});

// Initialization
startMonitoring();
