"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Sparkles, Phone, FileText } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What is Subclass 482 Visa?",
  "Am I eligible for a Partner Visa?",
  "How to book a consultation?",
  "Take the Free Visa Quiz",
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Sorry, I encountered an error. Please try again." },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I am unable to connect right now. Please check your connection." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let cleanLine = line.trim();
      const isBullet = cleanLine.startsWith("* ") || cleanLine.startsWith("- ");
      if (isBullet) {
        cleanLine = cleanLine.substring(2);
      }

      // Bold formatting: **text**
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match;

      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIdx) {
          parts.push(cleanLine.substring(lastIdx, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-brand-primary">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < cleanLine.length) {
        parts.push(cleanLine.substring(lastIdx));
      }

      // Links formatting: [text](url)
      const formattedParts = parts.map((part) => {
        if (typeof part !== "string") return part;

        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const subParts = [];
        let subLastIdx = 0;
        let subMatch;

        while ((subMatch = linkRegex.exec(part)) !== null) {
          if (subMatch.index > subLastIdx) {
            subParts.push(part.substring(subLastIdx, subMatch.index));
          }
          subParts.push(
            <a
              key={subMatch.index}
              href={subMatch[2]}
              target={subMatch[2].startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="text-brand-accent hover:underline font-bold"
            >
              {subMatch[1]}
            </a>
          );
          subLastIdx = linkRegex.lastIndex;
        }
        if (subLastIdx < part.length) {
          subParts.push(part.substring(subLastIdx));
        }
        return subParts;
      }).flat();

      const content = formattedParts.length > 0 ? formattedParts : cleanLine;

      if (isBullet) {
        return (
          <li key={index} className="ml-4 list-disc mb-1 text-sm text-gray-700 leading-relaxed">
            {content}
          </li>
        );
      }

      if (cleanLine === "") {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="mb-2 text-sm text-gray-700 leading-relaxed">
          {content}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          // Initial greeting if empty
          if (messages.length === 0) {
            setMessages([
              {
                role: "assistant",
                content:
                  "Hi! I'm the Migration Republic AI assistant. How can I help you with Australian visa pathways or migration questions today?",
              },
            ]);
          }
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary text-white shadow-2xl hover:bg-brand-primary/90 transition-transform active:scale-95 hover:scale-110 cursor-pointer"
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] sm:w-[400px] h-[580px] rounded-2xl glass-card flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300 border border-white/30 shadow-2xl">
          {/* Header */}
          <div className="bg-brand-primary/95 backdrop-blur-md px-6 py-4 flex items-center justify-between text-white border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
                <Sparkles className="w-5 h-5 text-brand-accent animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Migration AI Assistant</h3>
                <span className="text-xs text-white/75 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Online • Ready to help
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-brand-soft/80 px-4 py-2.5 flex justify-around gap-2 border-b border-gray-100/50 backdrop-blur-sm">
            <a
              href="https://migrationrepublic.com.au/book-a-consultation/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200/60 shadow-sm transition-all hover:scale-[1.02]"
            >
              <Phone className="w-3.5 h-3.5 text-brand-accent" />
              Book Consultation
            </a>
            <Link
              href="/tools/visa-quiz"
              className="flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200/60 shadow-sm transition-all hover:scale-[1.02]"
            >
              <FileText className="w-3.5 h-3.5 text-brand-accent" />
              Free Visa Quiz
            </Link>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white/70 backdrop-blur-md">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === "user"
                      ? "bg-brand-primary text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                    }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>{formatMarkdown(msg.content)}</div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3.5 flex items-center gap-1 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-brand-primary/45 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-brand-primary/65 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-white/70 backdrop-blur-md flex flex-wrap gap-1.5 border-t border-gray-100/50">
              {SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="text-xs text-brand-primary/95 bg-brand-soft hover:bg-brand-primary/5 hover:text-brand-accent px-3 py-1.5 rounded-full border border-gray-100 transition-colors cursor-pointer text-left font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-4 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about visas, eligibility, processes..."
              disabled={isLoading}
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-brand-accent hover:bg-brand-accent/90 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
