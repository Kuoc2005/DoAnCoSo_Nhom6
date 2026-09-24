import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type ChatMsg = { role: "user" | "assistant"; text: string };

function stripMarkdownBold(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, "$1");
}

export function MatchAssistantChat() {
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Chào bạn! Mình là trợ lý tìm bạn chơi: phân lớp ý định và gợi ý ghép theo hồ sơ gaming (chỉ hiện người tương thích từ 30% trở lên). Hãy thử: “tìm bạn Valorant”, “xếp hạng nạp tiền”, hoặc “giá thuê bao nhiêu”.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!ready || !user) return null;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await apiFetch("/api/match/assistant", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        message?: string;
        reply?: string;
        intent?: string;
      };
      if (!res.ok) {
        throw new Error(typeof j.message === "string" ? j.message : "Không gửi được.");
      }
      const reply = typeof j.reply === "string" ? j.reply : "";
      setMessages((m) => [...m, { role: "assistant", text: stripMarkdownBold(reply) }]);
    } catch (e: unknown) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: e instanceof Error ? e.message : "Lỗi mạng." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          className={cn(
            "flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_12px_40px_rgb(0_0_0_/_0.18)]"
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-[#280071] to-[#6460FF] px-3 py-2 text-white">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="size-4" aria-hidden />
              Trợ lý AI tìm bạn chơi
            </span>
            <button
              type="button"
              className="rounded-[8px] p-1 hover:bg-white/15"
              aria-label="Đóng"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-[min(52vh,420px)] space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((msg, i) => (
              <div
                key={`${i}-${msg.role}`}
                className={cn(
                  "max-w-[92%] rounded-[12px] px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-[rgb(100_96_255_/_0.12)] text-[#280071]"
                    : "mr-auto bg-muted text-[#354052]"
                )}
              >
                {msg.text}
              </div>
            ))}
            {loading ? <p className="text-caption text-text-secondary">Đang phân lớp &amp; ghép điểm...</p> : null}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 border-t border-border p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Nhập tin nhắn..."
              className="min-h-[40px] flex-1 rounded-[10px] border border-border bg-background px-3 text-sm outline-none focus:border-[#6460FF]"
            />
            <Button type="button" variant="pdPrimary" className="shrink-0 px-3" disabled={loading} onClick={() => void send()}>
              <Send className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#280071] to-[#6460FF] text-white shadow-lg hover:opacity-95"
        aria-label="Mở trợ lý AI"
        onClick={() => setOpen((o) => !o)}
      >
        <MessageCircle className="size-7" />
      </button>
    </div>
  );
}
