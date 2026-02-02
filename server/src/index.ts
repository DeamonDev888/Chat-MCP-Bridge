#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { z } from "zod";

import * as fs from "fs";
import * as path from "path";

// Debug Log
const LOG_FILE =
  "C:\\Users\\Deamon\\Desktop\\Backup\\Serveur MCP\\chat_mcp\\server\\mcp.log";
function log(msg: string) {
  try {
    fs.writeFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, {
      flag: "a",
    });
  } catch (e) {
    // console.error("Log failed", e);
  }
}

log(`Starting MCP Server... Node: ${process.version}`);

// MCP Server Setup
const server = new FastMCP({
  name: "chat-bridge-mcp",
  version: "1.0.0",
});

log("FastMCP Initialized");
const API_URL = "http://localhost:3002";

// --- Tools ---

server.addTool({
  name: "send_chat_message",
  description: "Sends a message to the Chat Interface (via Local API)",
  parameters: z.object({
    message: z.string().describe("The content of the message to display"),
    role: z
      .enum(["assistant", "user", "system"])
      .optional()
      .default("assistant"),
  }),
  execute: async (args) => {
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: args.message, role: args.role }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `Message sent via Bridge! (${data.clients} clients online)`,
          },
        ],
      };
    } catch (error) {
      // Fallback: Log to stderr if API is down
      console.error(
        `[Bridge Error] Could not connect to Chat API: ${(error as Error).message}`,
      );
      return {
        content: [
          {
            type: "text",
            text: `Error: Could not connect to Chat Interface. Is the app running? (${(error as Error).message})`,
          },
        ],
        isError: true,
      };
    }
  },
});

server.addTool({
  name: "get_frontend_status",
  description: "Checks if the frontend is connected",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) throw new Error("API unreachable");

      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: `Bridge Status: ONLINE ✅\nConnected Frontends: ${data.clients}\nUptime: ${Math.floor(data.uptime)}s`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Bridge API is OFFERLINE ❌ (Is the React App/Server running?)",
          },
        ],
        isError: true,
      };
    }
  },
});

async function main() {
  log("Attempting to start server...");
  try {
    await server.start();
    log("Server started successfully");
  } catch (error) {
    log(`FATAL ERROR in server.start(): ${(error as Error).message}`);
    log(`Stack: ${(error as Error).stack}`);
    process.exit(1);
  }
  console.error("Chat Bridge MCP Client running (Stdio Mode)...");

  // Keep process alive
  setInterval(() => {}, 10000);
}

main().catch((err) => {
  log(`Unhandled Error: ${err}`);
  console.error(err);
  process.exit(1);
});
