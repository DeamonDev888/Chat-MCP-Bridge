import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  MoreVertical,
  Paperclip,
  Mic,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your advanced AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // SSE (Server-Sent Events) Connection
    // Connection via /api proxy to avoid CORS issues
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      console.log('Connected to MCP Bridge (SSE)');
      setIsConnected(true);
    };

    eventSource.onerror = (err) => {
      console.log('Disconnected from MCP Bridge (SSE)', err);
      // Don't set isConnected to false immediately if you want to avoid flickering,
      // but strictly speaking, it is disconnected.
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsConnected(false);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const newMsg: Message = {
          id: payload.id,
          role: payload.role,
          content: payload.content,
          timestamp: new Date(payload.timestamp)
        };
        setMessages((prev) => [...prev, newMsg]);
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessageContent = input;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Send the message to the Bridge API so the Agent can "hear" it
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageContent,
          role: 'user'
        })
      });
    } catch (err) {
      console.error('Failed to send message to bridge', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-gray-100 font-sans overflow-hidden selection:bg-purple-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col w-full max-w-5xl mx-auto h-full shadow-2xl bg-black/40 backdrop-blur-sm border-x border-white/5">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Chat-MCP AI
              </h1>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 ${isConnected ? "bg-emerald-500" : "bg-red-500"} rounded-full animate-pulse`}
                />
                <span className="text-xs text-gray-400 font-medium">
                  {isConnected ? "Hub Connected" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20"
                      : "bg-zinc-700"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-gray-300" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative p-4 rounded-2xl shadow-sm ${
                    msg.role === "user"
                      ? "bg-white text-black rounded-tr-sm"
                      : "bg-white/10 text-gray-100 rounded-tl-sm backdrop-blur-md border border-white/5"
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <span
                    className={`absolute bottom-[-1.2rem] text-[10px] text-gray-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                      msg.role === "user" ? "right-0" : "left-0"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="p-4 sm:p-6 border-t border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="relative max-w-4xl mx-auto flex items-end gap-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-2 shadow-2xl focus-within:ring-1 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all">
            <button
              className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              className="flex-1 bg-transparent border-none text-white placeholder-gray-500 resize-none focus:ring-0 max-h-32 py-3 px-2"
              placeholder="Type your message..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ minHeight: "44px" }}
            />

            {input.trim() ? (
              <button
                onClick={handleSend}
                className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-600">
              Chat-MCP AI can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
