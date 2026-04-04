import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.jsx";
import { sendChatMessage } from "../api/chat.api.js";
import { useTranslation } from "react-i18next";

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

  const renderInlineLinks = (text) => {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, index) => {
      if (/^https?:\/\//i.test(part)) {
        return (
          <a
            key={`link-${index}`}
            href={part}
            className="font-semibold text-teal-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            {part}
          </a>
        );
      }
      return <span key={`text-${index}`}>{part}</span>;
    });
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const blocks = content.split(/```/g);
    return blocks.map((block, index) => {
      if (index % 2 === 1) {
        const lines = block.split("\n");
        const firstLine = lines[0].trim();
        const hasLanguage = /^[a-z0-9+#.-]+$/i.test(firstLine);
        const code = hasLanguage ? lines.slice(1).join("\n") : block;
        return (
          <pre
            key={`code-${index}`}
            className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800"
          >
            <code>{code.trim()}</code>
          </pre>
        );
      }
      return (
        <span key={`text-${index}`} className="whitespace-pre-wrap">
          {renderInlineLinks(block)}
        </span>
      );
    });
  };

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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
          <div className="h-96 space-y-3 overflow-y-auto px-4 py-3 text-sm text-slate-600">
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
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      isUser
                        ? "bg-teal-600 text-white"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {renderMessageContent(msg.content)}
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
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <input
                type="text"
                placeholder={t("chatbot.input_placeholder", "Nhập câu hỏi...")}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isAuthenticated || loading}
                className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:bg-white disabled:text-slate-400"
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
      )}

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
