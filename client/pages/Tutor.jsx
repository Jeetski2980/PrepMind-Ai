import { Fragment, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, User, Bot, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import Layout from "@/components/Layout.jsx";
import { renderTextWithMath } from "@/lib/math-rendering.jsx";
import { deleteLocalRecord, readLocalRecord, writeLocalRecord } from "@/lib/local-persistence.js";
// stores chat messages + controls input, loading, voice, and scroll states

const TUTOR_HISTORY_KEY = "tutor-chat-history";

function createWelcomeMessage() {
  return {
    id: 1,
    text: "Hi! What are you working on? I can help explain a step or review a concept with you.",
    isUser: false,
    timestamp: new Date(),
  };
}

function restoreChatHistory(value) {
  if (!Array.isArray(value)) return null;
  const messages = value
    .filter((message) => message && typeof message.text === "string" && typeof message.isUser === "boolean")
    .map((message, index) => ({
      ...message,
      id: message.id ?? Date.now() + index,
      timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp || Date.now()),
    }));
  return messages.some((message) => message.isUser) ? messages : null;
}

const INLINE_MARKDOWN = /(<highlight>[\s\S]*?<\/highlight>|\*\*[\s\S]+?\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

function renderInlineMarkdown(value, keyPrefix) {
  return String(value).split(INLINE_MARKDOWN).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    const highlight = part.match(/^<highlight>([\s\S]*?)<\/highlight>$/);
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);

    if (highlight) {
      return (
        <span key={key} className="rounded bg-yellow-200 px-1 py-0.5 dark:bg-yellow-600/30">
          {renderInlineMarkdown(highlight[1], key)}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{renderTextWithMath(part.slice(2, -2))}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{renderTextWithMath(part.slice(1, -1))}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/10">{part.slice(1, -1)}</code>;
    }
    if (link) {
      return <a key={key} href={link[2]} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 underline underline-offset-2 dark:text-emerald-300">{renderTextWithMath(link[1])}</a>;
    }
    return <Fragment key={key}>{renderTextWithMath(part)}</Fragment>;
  });
}

function splitTableRow(line) {
  const cells = [];
  let cell = "";
  let mathDelimiter = "";

  for (let index = 0; index < line.length; index += 1) {
    if (line.startsWith("\\(", index)) {
      mathDelimiter = "\\)";
      cell += "\\(";
      index += 1;
    } else if (line.startsWith("\\[", index)) {
      mathDelimiter = "\\]";
      cell += "\\[";
      index += 1;
    } else if (mathDelimiter && line.startsWith(mathDelimiter, index)) {
      cell += mathDelimiter;
      index += 1;
      mathDelimiter = "";
    } else if (line[index] === "$" && !mathDelimiter) {
      mathDelimiter = line.startsWith("$$", index) ? "$$" : "$";
      cell += mathDelimiter;
      if (mathDelimiter === "$$") index += 1;
    } else if (mathDelimiter && line[index] === "$" && mathDelimiter === "$" || mathDelimiter === "$$" && line.startsWith("$$", index)) {
      cell += mathDelimiter;
      if (mathDelimiter === "$$") index += 1;
      mathDelimiter = "";
    } else if (line[index] === "|" && !mathDelimiter) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += line[index];
    }
  }

  if (cell.trim() || cells.length) cells.push(cell.trim());
  if (cells[0] === "") cells.shift();
  if (cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isListItem(line) {
  return line.match(/^\s*(?:[-+*]|\d+[.)])\s+(.+)$/);
}

function isTableStart(lines, index) {
  return Boolean(lines[index]?.includes("|") && isTableSeparator(lines[index + 1] || ""));
}

function isBlockStart(lines, index) {
  const line = lines[index] || "";
  const trimmed = line.trim();
  return /^(#{1,6})\s+/.test(trimmed) || /^(?:---+|\*\*\*+|___+)\s*$/.test(trimmed) ||
    trimmed.startsWith("```") || trimmed.startsWith("$$") || trimmed.startsWith("\\[") ||
    Boolean(isListItem(line)) || isTableStart(lines, index);
}

function renderMarkdownMessage(value) {
  const lines = String(value).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let index = 0;
  let blockIndex = 0;

  while (index < lines.length) {
    const trimmed = lines[index].trim();
    const key = `chat-block-${blockIndex++}`;
    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(<pre key={key} className="my-3 max-w-full overflow-x-auto rounded-lg bg-gray-100 p-3 text-sm dark:bg-white/10"><code>{code.join("\n")}</code></pre>);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const HeadingTag = heading[1].length <= 2 ? "h2" : "h3";
      blocks.push(<HeadingTag key={key} className="mb-2 mt-4 font-bold leading-snug first:mt-0">{renderInlineMarkdown(heading[2], key)}</HeadingTag>);
      index += 1;
      continue;
    }

    if (/^(?:---+|\*\*\*+|___+)\s*$/.test(trimmed)) {
      blocks.push(<hr key={key} className="my-3 border-gray-200 dark:border-white/20" />);
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headerCells = splitTableRow(lines[index]);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().includes("|")) rows.push(splitTableRow(lines[index++]));
      blocks.push(
        <div key={key} className="my-3 max-w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-white/15">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-emerald-50 dark:bg-emerald-400/10"><tr>{headerCells.map((cell, cellIndex) => <th key={cellIndex} className="border-b border-gray-200 px-3 py-2 font-semibold dark:border-white/15">{renderInlineMarkdown(cell, `${key}-head-${cellIndex}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="even:bg-gray-50/70 dark:even:bg-white/[0.03]">{headerCells.map((_cell, cellIndex) => <td key={cellIndex} className="border-b border-gray-100 px-3 py-2 align-top last:border-b-0 dark:border-white/10">{renderInlineMarkdown(row[cellIndex] || "", `${key}-row-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    const firstListItem = lines[index].match(/^\s*(?:([-+*])|(\d+)[.)])\s+(.+)$/);
    if (firstListItem) {
      const ordered = Boolean(firstListItem[2]);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*(?:([-+*])|(\d+)[.)])\s+(.+)$/);
        if (!item || Boolean(item[2]) !== ordered) break;
        items.push(item[3]);
        index += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(<ListTag key={key} className={`my-2 space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item, `${key}-item-${itemIndex}`)}</li>)}</ListTag>);
      continue;
    }

    if (trimmed.startsWith("$$") || trimmed.startsWith("\\[")) {
      const closer = trimmed.startsWith("$$") ? "$$" : "\\]";
      const mathLines = [lines[index++]];
      if (!mathLines[0].trim().endsWith(closer) || mathLines[0].trim() === closer) {
        while (index < lines.length) {
          const line = lines[index++];
          mathLines.push(line);
          if (line.includes(closer)) break;
        }
      }
      blocks.push(<div key={key} className="my-3 max-w-full overflow-x-auto">{renderTextWithMath(mathLines.join("\n"))}</div>);
      continue;
    }

    const paragraph = [lines[index++]];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) paragraph.push(lines[index++]);
    blocks.push(<p key={key} className="my-2 first:mt-0 last:mb-0">{renderInlineMarkdown(paragraph.join("\n"), key)}</p>);
  }

  return blocks;
}

export default function Tutor() {
  const [messages, setMessages] = useState(() => [createWelcomeMessage()]);
  const [isChatReady, setIsChatReady] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    let isActive = true;
    readLocalRecord(TUTOR_HISTORY_KEY).then((savedMessages) => {
      if (!isActive) return;
      const restoredMessages = restoreChatHistory(savedMessages);
      if (restoredMessages) setMessages(restoredMessages);
    }).finally(() => {
      if (isActive) setIsChatReady(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isChatReady) return;
    if (!messages.some((message) => message.isUser)) {
      void deleteLocalRecord(TUTOR_HISTORY_KEY);
      return;
    }
    void writeLocalRecord(TUTOR_HISTORY_KEY, messages);
  }, [isChatReady, messages]);

// handles scrolling behavior (auto scroll + checking if user is near bottom)
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
  useEffect(() => {
    if (shouldAutoScroll) scrollToBottom();
  }, [messages, shouldAutoScroll, isFullScreen]);

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
    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);
  useEffect(() => {
    if (!isFullScreen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullScreen]);
  // sets up speech recognition (voice input) + speech synthesis (text to speech)
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };
  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };
  const speakText = (text) => {
    const safe = typeof text === "string" ? text : String(text ?? "");
    if (synthRef.current && !isSpeaking && safe) {
      const u = new SpeechSynthesisUtterance(safe);
      u.rate = 1.3;
      u.pitch = 1;
      u.volume = 0.8;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(u);
    }
  };
  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  async function sendChat(userText, history = []) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error ? String(err.error) : `HTTP ${res.status}`;
        return { content: `Sorry, I hit an error: ${msg}`, truncated: false };
      }
      const data = await res.json();
      const reply = data?.content ?? data?.reply ?? data?.response ?? "";
      return {
        content: typeof reply === "string" ? reply : JSON.stringify(reply),
        truncated: Boolean(data?.truncated),
      };
    } catch (e) {
      return { content: `Sorry, I hit an error: ${String(e.message || e)}`, truncated: false };
    }
  }

  const sendMessage = async (messageText) => {
    const trimmed = (typeof messageText === "string" ? messageText : inputText).trim();
    if (!trimmed || isLoading || !isChatReady) return;

    const userMessage = {
      id: Date.now(),
      text: trimmed,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((message) => message.id !== 1)
        .slice(-10)
        .map((message) => ({
          role: message.isUser ? "user" : "model",
          text: String(message.text ?? "").slice(0, 900),
        }));
      const completion = await sendChat(userMessage.text, history);
      const aiMessage = {
        id: Date.now() + 1,
        text: completion.content,
        truncated: completion.truncated,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  };

  const startNewChat = () => {
    if (isLoading || !isChatReady) return;
    setMessages([createWelcomeMessage()]);
    setInputText("");
    stopSpeaking();
    void deleteLocalRecord(TUTOR_HISTORY_KEY);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessageContent = (text) => {
    const safeText = typeof text === "string" ? text : String(text ?? "");
    return renderMarkdownMessage(safeText);
  };

  const starterPrompts = [
    "Can you explain how slope works?",
    "Help me set up this word problem.",
    "Why is this answer choice wrong?",
  ];
  const hasStarted = messages.some((message) => message.isUser);
  const chatPanel = (
          <Card className={"flex flex-col border bg-white dark:border-white/30 dark:bg-black " + (isFullScreen ? "h-full min-h-0" : "h-[520px]")}>
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-6 overflow-y-auto overscroll-contain space-y-4"
              onScroll={checkScrollPosition}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] flex items-start space-x-3 ${
                      message.isUser
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isUser
                          ? "bg-white dark:bg-white text-emerald-600 dark:text-black"
                          : "bg-emerald-400 dark:bg-emerald-400 text-white dark:text-black"
                      }`}
                    >
                      {message.isUser ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-2xl ${
                        message.isUser
                          ? "bg-emerald-600 dark:bg-white text-white dark:text-black rounded-br-md"
                          : "bg-white dark:bg-black border dark:border-white/30 text-gray-900 dark:text-white rounded-bl-md"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {renderMessageContent(message.text)}
                        {message.truncated && (
                          <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                            This answer reached the response limit. Ask me to continue from here.
                          </p>
                        )}
                      </div>
                      {!message.isUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            isSpeaking
                              ? stopSpeaking()
                              : speakText(message.text)
                          }
                          className="mt-2 p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
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
                        <div
                          className="w-2 h-2 bg-gray-400 dark:bg-white/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 dark:bg-white/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
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
                    onChange={(e) => {
                      if (e.target.value.length <= 350)
                        setInputText(e.target.value);
                    }}
                    maxLength={350}
                    onKeyDown={handleKeyDown}
                    aria-label="Your message" placeholder="Ask me anything... (max 350 characters)"
                    className="min-h-[60px] pr-12 resize-none dark:bg-black dark:border-white/50 dark:text-white"
                    disabled={isLoading || !isChatReady}
                  />
                  <div className="absolute bottom-1 right-12 text-xs text-gray-500 dark:text-white/60">
                    {inputText.length}/350
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={isListening ? "Stop voice input" : "Start voice input"}
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute bottom-2 right-2 p-2 h-8 w-8 ${
                      isListening
                        ? "text-red-500 dark:text-red-400"
                        : "text-gray-500 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  aria-label="Send message"
                  onClick={() => sendMessage()}
                  disabled={!inputText.trim() || isLoading || !isChatReady}
                  className="h-[60px] bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white dark:text-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
  );

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex h-screen flex-col bg-gray-50 text-gray-950 dark:bg-black dark:text-white">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-black sm:px-8">
          <div>
            <p className="font-semibold">PrepMind tutor</p>
            <p className="text-xs text-gray-500 dark:text-white/50">Your conversation is ready to continue</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFullScreen(false)}
            className="rounded-full border-gray-300 bg-white dark:border-white/20 dark:bg-white/5 dark:text-white"
          >
            <Minimize2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Minimize chat
          </Button>
        </header>
        <main className="min-h-0 flex-1 px-3 py-3 sm:px-6 sm:py-5">
          <div className="mx-auto h-full max-w-6xl">
            {chatPanel}
          </div>
        </main>
      </div>
    );
  }

  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-emerald-50/70 to-white px-4 py-10 dark:from-black dark:to-black sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">Study space</p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">Study with a tutor</h1>
              <p className="mt-2 max-w-2xl text-gray-600 dark:text-white/65">
                Ask about a question, a concept, or the step that’s not clicking yet.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-800/10 bg-white/80 px-4 py-2 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-white/65 sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {hasStarted ? "Conversation in progress" : "Start with one of these prompts"}
            </div>
          </div>

          <section className="mb-4 rounded-2xl border border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
            {hasStarted ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                  <MessageSquare className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Conversation started</p>
                  <p className="text-sm text-gray-500 dark:text-white/55">Continue here, or open it in full chat.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={startNewChat}
                  disabled={isLoading || !isChatReady}
                  className="ml-auto shrink-0 rounded-full border-gray-300 bg-white px-4 dark:border-white/20 dark:bg-white/5 dark:text-white"
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  New chat
                </Button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Try a question to get started</p>
                <div className="flex flex-wrap gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      disabled={isLoading || !isChatReady}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-left text-sm text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-wait disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/75 dark:hover:border-emerald-400 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-white/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </span>
              Your tutor chat
            </div>
            {chatPanel}
          </div>

          {hasStarted && !isLoading && (
            <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500 dark:text-white/50">Your messages stay in this chat when you expand it.</p>
              <Button
                type="button"
                onClick={() => setIsFullScreen(true)}
                className="rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
              >
                Continue in full chat
                <Maximize2 className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
