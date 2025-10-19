import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ApiKeyNoticeGoogle from "@/components/ApiKeyNoticeGoogle";
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, User, Bot } from "lucide-react";
import Layout from "@/components/Layout";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function Tutor() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text:
        "Hi! I'm here to help you understand SAT, ACT, and AP exam concepts. Try typing or using your voice to ask me anything about test prep!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };
  const checkScrollPosition = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  };
  useEffect(() => { if (shouldAutoScroll) scrollToBottom(); }, [messages, shouldAutoScroll]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
    synthRef.current = window.speechSynthesis;
    return () => { recognitionRef.current?.stop(); synthRef.current?.cancel(); };
  }, []);

  const startListening = () => { if (recognitionRef.current && !isListening) { setIsListening(true); recognitionRef.current.start(); } };
  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };
  const speakText = (text) => {
    const safe = typeof text === "string" ? text : String(text ?? "");
    if (synthRef.current && !isSpeaking && safe) {
      const u = new SpeechSynthesisUtterance(safe);
      u.rate = 0.9; u.pitch = 1; u.volume = 0.8;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(u);
    }
  };
  const stopSpeaking = () => { synthRef.current?.cancel(); setIsSpeaking(false); };

  async function sendChat(userText) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error ? String(err.error) : `HTTP ${res.status}`;
        return `Sorry, I hit an error: ${msg}`;
      }
      const data = await res.json();
      const reply = data?.content ?? data?.reply ?? data?.response ?? "";
      return typeof reply === "string" ? reply : JSON.stringify(reply);
    } catch (e) {
      return `Sorry, I hit an error: ${String(e.message || e)}`;
    }
  }

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { id: Date.now(), text: trimmed, isUser: true, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const replyText = await sendChat(userMessage.text);
      const aiMessage = {
        id: Date.now() + 1,
        text: typeof replyText === "string" ? replyText : JSON.stringify(replyText ?? ""),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "I'm sorry, I'm having trouble connecting right now. Please try again later.", isUser: false, timestamp: new Date() },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // ---------- SAME robust renderer as Practice.jsx ----------
 /* ---------- Math rendering (robust + safe) ---------- */
const renderTextWithMath = (text) => {
  if (text == null) return null;
  let s = String(text);

  // Normalize \( ... \) and \[ ... \]
  s = s
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, p1) => `$${p1}$`)
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, p1) => `$$${p1}$$`);

  if (!s.includes("$")) {
    if (/^\s*\\[A-Za-z]/.test(s.trim())) {
      s = `$${s}$`;
    } else {
      const CHUNK =
        /(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|\\hat\{[^{}]+\}|\\bar\{[^{}]+\}|\\vec\{[^{}]+\}|\\int[^ \n]*|\\sum[^ \n]*|\\lim[^ \n]*|\\log(?:_[^{\s]+|\([^)]*\))?|\\sin|\\cos|\\tan|\\pi|\\theta|\\alpha|\\beta|\\gamma|\\delta|\\lambda|\\mu|\\sigma|\\leq|\\geq|\\neq|\\ne)/g;
      s = s.replace(CHUNK, (m) => `$${m}$`);
    }
  }

  if (s.split("$").length % 2 === 0) {
    s = s.replace(/\$/g, "");
  }

  const parts = s.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2);
      try { return <BlockMath key={i} math={math} />; }
      catch { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      const math = part.slice(1, -1);
      try { return <InlineMath key={i} math={math} />; }
      catch { return <span key={i}>{part}</span>; }
    }
    return (
      <span
        key={i}
        dangerouslySetInnerHTML={{
          __html: part.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        }}
      />
    );
  });
};

  const renderMessageContent = (text) => {
    const safeText = typeof text === "string" ? text : String(text ?? "");
    const parts = safeText.split(/(<highlight>.*?<\/highlight>)/g);
    return parts.map((part, i) => {
      if (part.startsWith("<highlight>") && part.endsWith("</highlight>")) {
        const content = part.slice(11, -12);
        return (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-600/30 px-1 py-0.5 rounded">
            {renderTextWithMath(content)}
          </span>
        );
      }
      return <span key={i}>{renderTextWithMath(part)}</span>;
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your AI Tutor</h1>
            <p className="text-gray-600 dark:text-white/70">
              Ask me anything about test prep. Try typing or using your voice.
            </p>
          </div>

          <ApiKeyNoticeGoogle />

          {/* Chat Container */}
          <Card className="bg-white dark:bg-black border dark:border-white/30 h-[600px] flex flex-col">
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-6 overflow-y-auto overscroll-contain space-y-4"
              onScroll={checkScrollPosition}
            >
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] flex items-start space-x-3 ${message.isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isUser ? "bg-white dark:bg-white text-emerald-600 dark:text-black" : "bg-emerald-400 dark:bg-emerald-400 text-white dark:text-black"
                      }`}
                    >
                      {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-4 rounded-2xl ${
                        message.isUser
                          ? "bg-emerald-600 dark:bg-white text-white dark:text-black rounded-br-md"
                          : "bg-white dark:bg-black border dark:border-white/30 text-gray-900 dark:text-white rounded-bl-md"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{renderMessageContent(message.text)}</div>
                      {!message.isUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (isSpeaking ? stopSpeaking() : speakText(message.text))}
                          className="mt-2 p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-400 dark:bg-emerald-400 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div className="bg-white dark:bg-black border dark:border-white/30 p-4 rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-white/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t dark:border-white/20">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="min-h-[60px] pr-12 resize-none dark:bg-black dark:border-white/50 dark:text-white"
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute bottom-2 right-2 p-2 h-8 w-8 ${
                      isListening
                        ? "text-red-500 dark:text-red-400"
                        : "text-gray-500 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="h-[60px] bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white dark:text-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
