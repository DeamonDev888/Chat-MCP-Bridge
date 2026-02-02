---
description: Automated Input Processor for Chat-MCP
---

// turbo-all

# 🌌 Chat-MCP Bridge Workflow

This workflow automates the loop of receiving human input from the Chat Interface, processing it via an AI Agent, and broadcasting the response back to the bridge.

## 🏁 Steps

### 1. Wait for Human Input

Use the command status to monitor if a new message has arrived at the API Hub.

```bash
# Check bridge status and connected clients
curl -s http://localhost:3002/status
```

### 2. Invoke AI Agent (Claude Code Runner)

// turbo
Pass the latest human input to a specialized agent that has the `chat-bridge-mcp` tools enabled.

```bash
# Run the agent with context of the chat bridge
# Replace [INPUT] with the actual user message
mcp-run chat-bridge-mcp "Analyze and reply to the user via the bridge: [INPUT]"
```

### 3. Verify Message Delivery

// turbo
Check the bridge server logs to ensure the agent successfully called the `send_chat_message` tool.

```bash
# Verify log entry for broadcast
tail -n 5 server/mcp.log
```

## 🛠️ Automated Execution Guide

To run this workflow continuously in the background, you can use the orchestrator:

```bash
pnpm workflow
```

---

_Generated for DeamonDev888 / Chat-MCP-Bridge_
