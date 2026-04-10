import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.jsx";
import { sendChatMessage } from "../api/chat.api.js";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export default function ChatbotWidget() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: t("chatbot.greeting", "Chào bạn, mình có thể hỗ trợ gì?"),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const { user } = useAuth();
  const endRef = useRef(null);
  const [sessionId] = useState(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  });

  const isAuthenticated = Boolean(user);

  const widgetRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const formatAssistantMessage = (content) => {
    if (!content) return content;
    // Đã loại bỏ khối htmlTagPattern phá hủy HTML tag.

    const markdownPattern = /(^|\n)(#{1,6}\s|-\s|\*\s|\d+\.\s|```)/;
    if (markdownPattern.test(content)) return content;

    const sectionHeadings = new Set([
      "Công thức cơ bản",
      "Trong đó",
      "Mục tiêu",
      "Lời khuyên cho bạn",
    ]);

    const rawLines = content.split(/\r?\n/);
    const mergedLines = [];
    for (let i = 0; i < rawLines.length; i += 1) {
      const current = rawLines[i].trim();
      if (!current) {
        mergedLines.push("");
        continue;
      }

      const next = rawLines[i + 1]?.trim();
      if (next === ":" || next?.startsWith(":")) {
        const after = next === ":" ? rawLines[i + 2]?.trim() : next.slice(1).trim();
        const combined = after ? `${current}: ${after}` : `${current}:`;
        mergedLines.push(combined);
        i += next === ":" ? 2 : 1;
        continue;
      }

      mergedLines.push(current);
    }

    let titleApplied = false;
    const formatted = mergedLines.map((line) => {
      if (!line) return "";

      if (!titleApplied && /Simple\s+Linear\s+Regression/i.test(line)) {
        titleApplied = true;
        return `## ${line}`;
      }

      const formulaMatch = /^[A-Za-z]\w*\s*=\s*.+/.test(line);
      if (formulaMatch) {
        return `$$${line.replace(/\s+/g, " ").trim()}$$`;
      }

      const headingOnly = /^(.+):\s*$/.exec(line);
      if (headingOnly && sectionHeadings.has(headingOnly[1])) {
        return `### ${headingOnly[1]}`;
      }

      const headingInline = /^(.+):\s*(.+)$/.exec(line);
      if (headingInline && sectionHeadings.has(headingInline[1])) {
        return `**${headingInline[1]}:** ${headingInline[2]}`;
      }

      const keyValue = /^([^:]+):\s*(.+)$/.exec(line);
      if (keyValue) {
        return `- **${keyValue[1].trim()}**: ${keyValue[2].trim()}`;
      }

      return line;
    });

    return formatted.join("\n");
  };

  const markdownComponents = useMemo(
    () => ({
      a: ({ children, ...props }) => (
        <a
          {...props}
          className="font-semibold text-teal-600 underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {children}
        </a>
      ),
      p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
      pre: ({ children, ...props }) => (
        <pre className="chat-pre rounded-lg bg-slate-900 border border-slate-700 p-3 my-3 text-slate-100 overflow-x-auto" {...props}>
          {children}
        </pre>
      ),
      code: ({ className, children, ...props }) => {
        // Dựa vào việc có className (language-...) hay không để nhận diện code block hoặc inline code
        if (!className) {
          return (
            <code
              className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 break-words whitespace-pre-wrap"
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
      li: ({ children }) => <li className="mb-1">{children}</li>,
    }),
    []
  );

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, loading]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;
    if (!isAuthenticated) {
      setError(t("chatbot.login_required", "Vui lòng đăng nhập để chat với AI."));
      return;
    }

    setError("");
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);

    try {
      const data = await sendChatMessage({
        conversationId,
        sessionId,
        message: content,
      });
      if (data?.conversation_id) {
        setConversationId(data.conversation_id);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.reply || t("chatbot.no_answer", "Mình chưa có câu trả lời phù hợp."),
        },
      ]);
    } catch (err) {
      setError(err?.response?.data?.detail || t("chatbot.connection_error", "Không thể kết nối tới AI."));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInput = (event) => {
    setInput(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div 
        className={`w-[92vw] max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 origin-bottom-right ${
          open ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none absolute bottom-16 right-0"
        }`}
      >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="text-sm font-semibold text-slate-800">
              {t("chatbot.title", "Trợ lý học tập")}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              aria-label="Close chatbot"
            >
              {t("chatbot.close", "Đóng")}
            </button>
          </div>
          <div className="h-[70vh] max-h-[520px] space-y-3 overflow-y-auto px-4 py-3 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              {t("chatbot.assessment_prompt", "Muốn đánh giá năng lực?")}{" "}
              <Link to="/assessment" className="font-semibold text-teal-600 underline">
                {t("chatbot.start_test", "Bắt đầu bài test")}
              </Link>
              .
            </div>
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={`${msg.role}-${index}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] break-words rounded-lg px-3 py-2 ${
                      isUser
                        ? "bg-teal-600 text-white"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {isUser ? (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    ) : (
                      <div className="chat-prose prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={markdownComponents}
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                        >
                          {formatAssistantMessage(msg.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-500">
                  {t("chatbot.replying", "Đang trả lời...")}
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
            {!isAuthenticated && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {t("chatbot.need_to", "Bạn cần")}{" "}
                <Link to="/login" className="font-semibold underline">
                  {t("chatbot.login", "đăng nhập")}
                </Link>{" "}
                {t("chatbot.to_chat", "để chat với AI.")}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={t("chatbot.input_placeholder", "Nhập câu hỏi (Shift+Enter để xuống dòng)...")}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={!isAuthenticated || loading}
                className="flex-1 resize-none py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:bg-white disabled:text-slate-400 max-h-[120px] min-h-[32px] overflow-y-auto"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!isAuthenticated || loading}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {loading ? "..." : t("chatbot.send", "Gửi")}
              </button>
            </div>
          </div>
        </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700"
        aria-label="Toggle chatbot"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.6-.8L3 21l1.9-5.4a8.4 8.4 0 0 1-1-4.1 8.4 8.4 0 0 1 8.4-8.4 8.4 8.4 0 0 1 8.7 8.4Z" />
        </svg>
      </button>
    </div>
  );
}
