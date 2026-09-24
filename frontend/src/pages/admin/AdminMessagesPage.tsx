import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSupportWebSocket, type SupportChatMessage } from "@/hooks/useSupportWebSocket";
import { cn } from "@/lib/utils";

type ThreadRow = {
  threadUserId: string;
  username: string;
  displayName: string;
  messageCount: number;
  lastAt: string;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  selectedRef.current = selected;

  const loadThreads = useCallback(async () => {
    const res = await apiFetch("/api/admin/support-threads");
    if (!res.ok) throw new Error("Không tải được danh sách.");
    const data = (await res.json()) as { threads: ThreadRow[] };
    setThreads(data.threads);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingThreads(true);
    loadThreads()
      .catch(() => {
        if (!cancelled) toast.error("Không tải được hội thoại.");
      })
      .finally(() => {
        if (!cancelled) setLoadingThreads(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadThreads]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMsgs(true);
    apiFetch(`/api/admin/support-threads/${encodeURIComponent(selected)}/messages`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Không tải tin.");
        return res.json() as Promise<{ messages: SupportChatMessage[] }>;
      })
      .then((d) => {
        if (!cancelled) setMessages(d.messages);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không tải tin nhắn.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMsgs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selected]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReloadThreads = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void loadThreads().catch(() => {});
    }, 500);
  }, [loadThreads]);

  useSupportWebSocket(token, (payload) => {
    if (payload.type !== "support_message") return;
    const sel = selectedRef.current;
    if (sel && payload.threadUserId === sel) {
      setMessages((prev) => (prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]));
    }
    scheduleReloadThreads();
  });

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!selected || !text || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/admin/support-messages", {
        method: "POST",
        body: JSON.stringify({ threadUserId: selected, text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Gửi thất bại.");
      }
      const data = (await res.json()) as { message: SupportChatMessage };
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      setDraft("");
      void loadThreads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi thất bại.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tin nhắn hỗ trợ</h1>
        <p className="mt-2 text-sm text-slate-400">Realtime — chọn người dùng bên trái để xem thread và trả lời.</p>
      </div>

      <div className="flex min-h-[min(560px,calc(100vh-200px))] flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#12141c] lg:w-72">
          <p className="border-b border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Hội thoại</p>
          <div className="max-h-64 overflow-y-auto lg:max-h-[520px]">
            {loadingThreads ? (
              <p className="p-3 text-sm text-slate-500">Đang tải…</p>
            ) : threads.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">Chưa có tin nhắn từ người dùng.</p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.threadUserId}
                  type="button"
                  onClick={() => setSelected(t.threadUserId)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 border-b border-white/5 px-3 py-2.5 text-left text-sm transition hover:bg-white/5",
                    selected === t.threadUserId && "bg-[#6460FF]/20 ring-1 ring-inset ring-[#6460FF]/40"
                  )}
                >
                  <span className="font-semibold text-white">{t.displayName}</span>
                  <span className="text-xs text-slate-500">@{t.username}</span>
                  <span className="text-[10px] text-slate-600">{formatTime(t.lastAt)} · {t.messageCount} tin</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#12141c]">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">Chọn một hội thoại.</div>
          ) : (
            <>
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-white">{threads.find((x) => x.threadUserId === selected)?.displayName ?? "User"}</p>
                <p className="text-xs text-slate-500">ID thread: {selected}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {loadingMsgs ? (
                  <p className="text-center text-sm text-slate-500">Đang tải…</p>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.authorRole === "admin";
                    return (
                      <div key={m.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                            isAdmin ? "rounded-br-sm bg-[#6460FF]/90 text-white" : "rounded-tl-sm bg-white/10 text-slate-100 ring-1 ring-white/10"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p className={cn("mt-1 text-[10px]", isAdmin ? "text-white/80" : "text-slate-500")}>
                            {isAdmin ? "Bạn (admin)" : "Người dùng"} · {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={(e) => void handleSend(e)} className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={2000}
                    placeholder="Phản hồi…"
                    className="min-h-10 flex-1 rounded-lg border border-white/10 bg-[#0c0e14] px-3 text-sm text-white outline-none focus:border-[#6460FF]/50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#6460FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#554fd9] disabled:opacity-50"
                  >
                    <Send className="size-4" aria-hidden />
                    Gửi
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
