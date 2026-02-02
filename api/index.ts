
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3002;

// Configure CORS to allow any origin (for development)
app.use(cors({
  origin: true, // Reflect request origin
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

// Store active SSE clients
let clients: { id: number; res: express.Response }[] = [];

// SSE Endpoint for Frontend
app.get('/events', (req, res) => {
  // Standard SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  console.log(`[API] Client connected: ${clientId} (Total: ${clients.length})`);

  req.on('close', () => {
    console.log(`[API] Client disconnected: ${clientId}`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

// API Endpoint for MCP Server (or anyone) to send messages
app.post('/messages', (req, res) => {
  const { message, role } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const payload = {
    id: Date.now().toString(),
    role: role || 'assistant',
    content: message,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all connected SSE clients
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  console.log(`[API] Broadcasted message to ${clients.length} clients: "${message}"`);
  
  res.json({ success: true, clients: clients.length });
});

// Status Endpoint
app.get('/status', (req, res) => {
  res.json({ 
    status: 'online', 
    clients: clients.length,
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`Chat API Server running on port ${PORT}`);
  console.log(`- SSE (Frontend): http://localhost:${PORT}/events`);
  console.log(`- API (MCP):      http://localhost:${PORT}/messages`);
  
  // Keep alive
  setInterval(() => {
    // console.log('[Heartbeat] tick');
  }, 10000);
});
