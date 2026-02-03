---
description: Advanced Orchestration Workflow for Chat-MCP
---

// turbo-all

# 🌌 Chat-MCP Bridge: Intelligence Workflow

This document outlines the automated intelligence loop. It describes how human input is captured, processed by the **Sentient Orchestrator**, and handled by specialized AI Agents via the Machine Context Protocol.

## 🏁 The Intelligence Loop

### 1. Vector Hub: Capturing Human Input

![Step 1 - UI Input](../assets/workflow_1.png)

The React interface acts as the primary sensory organ. When a user transmits a signal (message):

1. The UI generates a **POST** request to the Hub (`/api/messages`).
2. The Hub broadcasts the signal via **SSE (Server-Sent Events)** to all active listeners.

### 2. Sentient Orchestrator: Event Monitoring

// turbo
The **Orchestrator Script** (`scripts/workflow.ts`) maintains a persistent connection to the Hub's event stream. It acts as the gateway between the human interface and the AI's cognitive center.

**Process Execution:**

- **Signal Detection:** The script identifies new `user` messages in real-time.
- **Agent Invocation:** It triggers the **Claude Code Runner** (or selected agent) with the latest context.
- **Command Injection:**
  ```powershell
  # The orchestrator executes the agent via the runner
  mcp-run chat-bridge-mcp "Analyze and respond to signal: [LATEST_MESSAGE]"
  ```

### 3. Machine Response: Feedback Loop

![Step 3 - Event Stream](../assets/workflow_3.png)

// turbo
The AI Agent, once invoked, utilizes the `send_chat_message` tool provided by the `chat-bridge-mcp` server. This ensures the response is injected back into the Hub and displayed on the UI instantly.

**Validation:**
Ensure the Hub acknowledges the broadcast by monitoring the server logs:

```bash
# Monitor the real-time broadcast frequency
tail -n 20 server/mcp.log
```

## 🛠️ Deployment & Execution

To activate the fully automated intelligence loop, run the orchestrator in persistent mode:

```bash
pnpm workflow
```

---

_Protocol established for Nexus-AI / Chat-MCP-Bridge_
