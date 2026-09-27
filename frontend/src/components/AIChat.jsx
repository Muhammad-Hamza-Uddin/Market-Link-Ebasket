import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Sparkles,
  RotateCcw,
  User,
  Shield,
  Sprout,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { api, getToken } from "../api/client";
import { useStore } from "../context/StoreContext";

const ROLE_PROMPTS = {
  customer: [
    { label: "🕒 Market Timings", query: "What are the market timings and active locations?" },
    { label: "🥕 Vegetables in Stock", query: "Which organic vegetables and fruits are currently in stock?" },
    { label: "👨‍🌾 Active Farmers", query: "Which verified farmers are active and where are their stalls?" },
    { label: "📦 Pickup Windows", query: "How do pickup windows and pay-at-pickup work?" },
    { label: "💳 Order & Pay Policy", query: "Can you explain how to place an order and pay at pickup?" },
  ],
  farmer: [
    { label: "📦 Update Weekly Stock", query: "How do I update my weekly stock in the farmer dashboard?" },
    { label: "🕒 Set Pickup Windows", query: "How do I configure pickup time slots and operating days for my stall?" },
    { label: "📋 Manage Order Queue", query: "How do I view incoming customer orders and mark them packed or completed?" },
    { label: "⭐ Customer Reviews", query: "Where can I see reviews and ratings left by customers?" },
  ],
  admin: [
    { label: "👥 Approve Farmers", query: "How do I approve or review pending farmer applications?" },
    { label: "📢 Broadcast Announcement", query: "How do I post a platform announcement for users?" },
    { label: "📊 Sales Reports", query: "Where can I view overall platform order statistics and reports?" },
    { label: "📍 Market Management", query: "How do I add or update a farmers market location?" },
  ],
  guest: [
    { label: "ℹ️ About MarketLink", query: "What is MarketLink and how does pre-ordering work?" },
    { label: "🕒 Market Timings", query: "What are the active market locations and timings?" },
    { label: "🥕 Available Items", query: "What fresh products can I browse and order?" },
    { label: "🔑 How to Register", query: "How do I create a Customer or Farmer account?" },
  ],
};

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Parses bold text (**text**) safely into React nodes
function renderFormattedInlineText(text, navigate, onClose) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      const lower = inner.toLowerCase();

      // Quick link detection for key pages
      if (lower === "products" || lower === "products page") {
        return (
          <button
            key={index}
            onClick={() => { navigate("/products"); onClose(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700, color: "#166534", textDecoration: "underline", background: "none", border: "none", padding: "0 2px", cursor: "pointer", fontSize: "inherit" }}
          >
            {inner} <ArrowRight size={11} />
          </button>
        );
      }
      if (lower === "markets" || lower === "markets page") {
        return (
          <button
            key={index}
            onClick={() => { navigate("/markets"); onClose(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700, color: "#166534", textDecoration: "underline", background: "none", border: "none", padding: "0 2px", cursor: "pointer", fontSize: "inherit" }}
          >
            {inner} <ArrowRight size={11} />
          </button>
        );
      }
      if (lower === "farmers" || lower === "farmers page") {
        return (
          <button
            key={index}
            onClick={() => { navigate("/farmers"); onClose(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700, color: "#166534", textDecoration: "underline", background: "none", border: "none", padding: "0 2px", cursor: "pointer", fontSize: "inherit" }}
          >
            {inner} <ArrowRight size={11} />
          </button>
        );
      }
      if (lower === "orders" || lower === "orders page") {
        return (
          <button
            key={index}
            onClick={() => { navigate("/orders"); onClose(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700, color: "#166534", textDecoration: "underline", background: "none", border: "none", padding: "0 2px", cursor: "pointer", fontSize: "inherit" }}
          >
            {inner} <ArrowRight size={11} />
          </button>
        );
      }

      return (
        <strong key={index} style={{ fontWeight: 700, color: "#111827" }}>
          {inner}
        </strong>
      );
    }
    return part;
  });
}

// Structured message block parser
function StructuredMessageContent({ text, navigate, onClose }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <div key={`list-${elements.length}`} style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "6px 0" }}>
          {currentList.map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12.5px", lineHeight: 1.55 }}>
              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", marginTop: "6px", flexShrink: 0 }} />
              <div style={{ flex: 1, color: "#374151" }}>
                {renderFormattedInlineText(item, navigate, onClose)}
              </div>
            </div>
          ))}
        </div>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`space-${idx}`} style={{ height: "4px" }} />);
      return;
    }

    if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
      flushList();
      const headerText = trimmed.replace(/^#+\s*/, "");
      elements.push(
        <div
          key={`header-${idx}`}
          style={{
            fontWeight: 800,
            fontSize: "13px",
            color: "#1b4332",
            marginTop: "8px",
            marginBottom: "4px",
            paddingBottom: "3px",
            borderBottom: "1px solid #e2ece5",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Sparkles size={13} style={{ color: "#16a34a" }} />
          {renderFormattedInlineText(headerText, navigate, onClose)}
        </div>
      );
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      flushList();
      elements.push(
        <div key={`num-${idx}`} style={{ display: "flex", alignItems: "flex-start", gap: "8px", margin: "4px 0", fontSize: "12.5px", lineHeight: 1.55 }}>
          <span style={{ fontSize: "10px", fontWeight: 800, background: "#dcfce7", color: "#166534", borderRadius: "50%", width: "18px", height: "18px", display: "grid", placeItems: "center", flexShrink: 0, marginTop: "1px" }}>
            {numberedMatch[1]}
          </span>
          <div style={{ flex: 1, color: "#374151" }}>
            {renderFormattedInlineText(numberedMatch[2], navigate, onClose)}
          </div>
        </div>
      );
      return;
    }

    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.replace(/^[•\-\*]\s*/, "");
      currentList.push(itemText);
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${idx}`} style={{ margin: "4px 0", fontSize: "12.5px", lineHeight: 1.6, color: "#374151" }}>
        {renderFormattedInlineText(trimmed, navigate, onClose)}
      </p>
    );
  });

  flushList();

  return <div style={{ wordBreak: "break-word" }}>{elements}</div>;
}

export default function AIChat() {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const role = currentUser?.role && getToken() ? currentUser.role : "guest";
  const suggestions = ROLE_PROMPTS[role] || ROLE_PROMPTS.guest;

  const initialGreeting =
    role === "farmer"
      ? `Hello ${currentUser?.name || "Farmer"}! Main MarketLink AI assistant hoon. Aap stock update, pickup slots, ya order queue ke bare mein pooch sakte hain.`
      : role === "admin"
      ? `Welcome Admin ${currentUser?.name || ""}! MarketLink AI is ready to assist with farmer approvals, market schedules, or announcements.`
      : role === "customer"
      ? `Hi ${currentUser?.name || "there"}! MarketLink AI assistant here. Ask me about market timings, active farmers, pickup windows, or in-stock fresh produce.`
      : `Hi! Welcome to MarketLink. Ask me about our farmers markets, timings, pickup windows, or available produce.`;

  const [messages, setMessages] = useState([
    { from: "bot", text: initialGreeting, time: formatTime() },
  ]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, sending]);

  const sendQuery = async (queryText) => {
    const text = String(queryText || input).trim();
    if (!text || sending) return;

    const previous = messages;
    const nowTime = formatTime();
    setMessages((current) => [...current, { from: "user", text, time: nowTime }]);
    setInput("");
    setSending(true);

    try {
      const history = previous.slice(-8).map((message) => ({
        role: message.from === "user" ? "user" : "assistant",
        content: message.text,
      }));

      const response = await api.post("/ai/chat", { message: text, history });
      const answer = response.data?.data?.answer || response.data?.answer || "I am here to help!";
      setMessages((current) => [
        ...current,
        { from: "bot", text: answer, time: formatTime() },
      ]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "AI assistant is temporarily unavailable. Please try again.";
      setMessages((current) => [
        ...current,
        { from: "bot", text: errorMessage, time: formatTime() },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReset = () => {
    setMessages([{ from: "bot", text: initialGreeting, time: formatTime() }]);
  };

  const renderRoleBadge = () => {
    if (role === "farmer") {
      return (
        <span style={{ fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: "10px" }}>
          <Sprout size={11} /> Farmer Mode
        </span>
      );
    }
    if (role === "admin") {
      return (
        <span style={{ fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: "10px" }}>
          <Shield size={11} /> Admin Mode
        </span>
      );
    }
    if (role === "customer") {
      return (
        <span style={{ fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: "10px" }}>
          <User size={11} /> Customer Mode
        </span>
      );
    }
    return (
      <span style={{ fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: "10px" }}>
        Guest Mode
      </span>
    );
  };

  return (
    <>
      {/* Floating Action Button (hides smoothly when chat is open) */}
      <button
        className={`ai-fab ${open ? "is-hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Open MarketLink AI assistant"
      >
        <MessageCircle size={24} />
      </button>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="ai-mobile-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-chat"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            {/* Header */}
            <div className="ai-head">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(4px)",
                    display: "grid",
                    placeItems: "center",
                    border: "1px solid rgba(255,255,255,0.25)",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={20} style={{ color: "#a7f3d0" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.2px", display: "flex", alignItems: "center", gap: "6px" }}>
                    MarketLink AI
                    <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
                  </div>
                  <div style={{ marginTop: "2px" }}>{renderRoleBadge()}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={handleReset}
                  aria-label="Restart conversation"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    transition: "all 0.15s ease",
                  }}
                  title="Clear conversation"
                >
                  <RotateCcw size={13} /> Clear
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "6px",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="ai-messages" aria-live="polite">
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: m.from === "user" ? "flex-end" : "flex-start",
                    width: "100%",
                  }}
                >
                  {/* Message label for bot */}
                  {m.from === "bot" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", paddingLeft: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e5b38" }}>MarketLink Assistant</span>
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>{m.time}</span>
                    </div>
                  )}

                  {/* Message Card */}
                  <div
                    style={
                      m.from === "user"
                        ? {
                            maxWidth: "85%",
                            padding: "10px 14px",
                            background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
                            color: "#ffffff",
                            borderRadius: "16px 16px 3px 16px",
                            fontSize: "12.5px",
                            lineHeight: 1.5,
                            boxShadow: "0 3px 10px rgba(27, 67, 50, 0.2)",
                          }
                        : {
                            maxWidth: "96%",
                            width: "100%",
                            padding: "12px 14px",
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderLeft: "3.5px solid #2d6a4f",
                            borderRadius: "4px 14px 14px 14px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                            position: "relative",
                          }
                    }
                  >
                    {m.from === "user" ? (
                      <div>{m.text}</div>
                    ) : (
                      <>
                        <StructuredMessageContent
                          text={m.text}
                          navigate={navigate}
                          onClose={() => setOpen(false)}
                        />
                        {/* Copy button */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px", paddingTop: "4px", borderTop: "1px dashed #f0f4f1" }}>
                          <button
                            onClick={() => handleCopy(m.text, i)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "10.5px",
                              color: copiedIndex === i ? "#16a34a" : "#94a3b8",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              transition: "all 0.15s ease",
                            }}
                            title="Copy response"
                          >
                            {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                            {copiedIndex === i ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timestamp for user */}
                  {m.from === "user" && (
                    <span style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px", paddingRight: "4px" }}>
                      {m.time}
                    </span>
                  )}
                </div>
              ))}

              {/* Thinking wave animation */}
              {sending && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e5b38" }}>MarketLink Assistant</span>
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderLeft: "3.5px solid #22c55e",
                      borderRadius: "4px 14px 14px 14px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#4b5563",
                    }}
                  >
                    <div style={{ display: "flex", gap: "4px" }}>
                      <motion.span
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }}
                      />
                      <motion.span
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }}
                      />
                      <motion.span
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }}
                      />
                    </div>
                    <span>Checking live inventory & schedules…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Role-based Suggested Questions Bar */}
            <div className="ai-suggestions-bar">
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#1e5b38",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Sparkles size={12} style={{ color: "#16a34a" }} />
                Suggested Questions:
              </div>
              <div className="ai-suggestions-scroll">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={sending}
                    onClick={() => sendQuery(item.query)}
                    className="ai-suggestion-chip"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="ai-input-wrap">
              <input
                className="ai-input-field"
                aria-label="Ask MarketLink AI"
                value={input}
                disabled={sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendQuery()}
                placeholder="Ask in English or Roman Urdu..."
              />
              <button
                className="ai-send-btn"
                onClick={() => sendQuery()}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                style={{
                  background: input.trim() && !sending ? "linear-gradient(135deg, #1b4332, #2d6a4f)" : "#e2e8f0",
                  color: input.trim() && !sending ? "#ffffff" : "#94a3b8",
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}