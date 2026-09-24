import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { useSupportWebSocket, type DirectChatMessage, type SupportChatMessage } from "@/hooks/useSupportWebSocket";
import { cn } from "@/lib/utils";

type ConversationRow = {
  otherUserId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  accountType?: string;
  lastText: string;
  lastSenderId: string;
  lastAt: string;
  messageCount: number;
};

type OtherUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  accountType?: string;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

function AvatarBubble({ name, avatarUrl, className }: { name: string; avatarUrl?: string; className?: string }) {
  const url = avatarUrl?.trim();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#6460FF] to-[#7B19D8] text-xs font-bold text-white",
        className
      )}
    >
      {url ? <img src={url} alt="" className="size-full object-cover" /> : name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function MessagesPage() {
  const { user, ready } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const withUsername = searchParams.get("with")?.trim().toLowerCase() ?? "";

  const [tab, setTab] = useState<"direct" | "support">(withUsername ? "direct" : "direct");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeOther, setActiveOther] = useState<OtherUser | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectChatMessage[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const loadConversations = useCallback(async () => {
    const res = await apiFetch("/api/messages/conversations");
    if (!res.ok) throw new Error("Không tải được hội thoại.");
    const data = (await res.json()) as { conversations: ConversationRow[] };
    setConversations(data.conversations ?? []);
  }, []);

  const loadDirectThread = useCallback(async (otherUserId: string) => {
    const res = await apiFetch(`/api/messages/direct/${encodeURIComponent(otherUserId)}`);
    if (!res.ok) throw new Error("Không tải được tin nhắn.");
    const data = (await res.json()) as { otherUser: OtherUser; messages: DirectChatMessage[] };
    setActiveOther(data.otherUser);
    setDirectMessages(data.messages ?? []);
  }, []);

  const loadSupport = useCallback(async () => {
    const res = await apiFetch("/api/messages/support");
    if (!res.ok) throw new Error("Không tải được hội thoại hỗ trợ.");
    const data = (await res.json()) as { messages: SupportChatMessage[] };
    setSupportMessages(data.messages);
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    setLoadingConversations(true);
    loadConversations()
      .catch(() => toast.error("Không tải được danh sách chat."))
      .finally(() => setLoadingConversations(false));
  }, [ready, user, loadConversations]);

  useEffect(() => {
    if (!ready || !user) return;
    setLoadingSupport(true);
    loadSupport()
      .catch(() => toast.error("Không tải được tin nhắn hỗ trợ."))
      .finally(() => setLoadingSupport(false));
  }, [ready, user, loadSupport]);

  useEffect(() => {
    if (!ready || !user || !withUsername) return;
    let cancelled = false;
    setTab("direct");
    setLoadingThread(true);
    (async () => {
      try {
        const lookup = await apiFetch(`/api/players/${encodeURIComponent(withUsername)}`);
        if (!lookup.ok) throw new Error("Không tìm thấy người dùng.");
        const { player } = (await lookup.json()) as { player: { id: string; username: string; displayName: string; avatarUrl?: string; accountType?: string } };
        if (cancelled) return;
        await loadDirectThread(player.id);
        setSearchParams({}, { replace: true });
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Lỗi mở chat.");
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, withUsername, loadDirectThread, setSearchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [directMessages.length, supportMessages.length, activeOther?.id, tab]);

  useSupportWebSocket(token, (payload) => {
    if (payload.type === "support_message") {
      if (user && payload.threadUserId !== user._id) return;
      setSupportMessages((prev) => (prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]));
      return;
    }
    if (payload.type === "direct_message" && user) {
      const ids = payload.participantIds.map(String);
      if (!ids.includes(user._id)) return;
      const otherId = ids.find((id) => id !== user._id);
      setDirectMessages((prev) => {
        if (activeOther && otherId !== activeOther.id) return prev;
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
      void loadConversations().catch(() => {});
    }
  });

  async function openConversation(row: ConversationRow) {
    setTab("direct");
    setLoadingThread(true);
    try {
      await loadDirectThread(row.otherUserId);
    } catch {
      toast.error("Không tải được tin nhắn.");
    } finally {
      setLoadingThread(false);
    }
  }

  async function handleSendDirect(e: FormEvent) {
    e.preventDefault();
    if (!activeOther || !user) return;
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/messages/direct", {
        method: "POST",
        body: JSON.stringify({ toUserId: activeOther.id, text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Gửi thất bại.");
      }
      const data = (await res.json()) as { message: DirectChatMessage };
      setDirectMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      setDraft("");
      await loadConversations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi thất bại.");
    } finally {
      setSending(false);
    }
  }

  async function handleSendSupport(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/messages/support", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Gửi thất bại.");
      }
      const data = (await res.json()) as { message: SupportChatMessage };
      setSupportMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi thất bại.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#666666]">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: "/messages" }} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#280071]">Tin nhắn</h1>
        <p className="mt-1 text-sm text-[#666666]">
          Chat riêng với người cho thuê / người thuê, hoặc liên hệ đội ngũ quản trị.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("direct");
            setDraft("");
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            tab === "direct" ? "bg-[#6460FF] text-white shadow-sm" : "bg-white text-[#354052] ring-1 ring-[#e8e4f5]"
          )}
        >
          <Users className="mr-1.5 inline size-4" aria-hidden />
          Riêng tư
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("support");
            setDraft("");
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            tab === "support" ? "bg-[#6460FF] text-white shadow-sm" : "bg-white text-[#354052] ring-1 ring-[#e8e4f5]"
          )}
        >
          Hỗ trợ
        </button>
      </div>

      {tab === "direct" ? (
        <div className="grid min-h-[min(560px,calc(100vh-260px))] overflow-hidden rounded-2xl border border-[#e8e4f5] bg-white shadow-sm md:grid-cols-[240px_1fr]">
          <aside className="border-b border-[#e8e4f5] bg-[#faf9ff] md:border-b-0 md:border-r">
            <p className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-[#6460FF]">Hội thoại</p>
            <div className="max-h-[200px] overflow-y-auto md:max-h-none md:min-h-[480px]">
              {loadingConversations ? (
                <p className="px-3 py-4 text-center text-xs text-[#999999]">Đang tải…</p>
              ) : conversations.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[#999999]">
                  Chưa có chat. Mở hồ sơ người chơi và bấm &quot;Nhắn tin&quot;.
                </p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.otherUserId}
                    type="button"
                    onClick={() => void openConversation(c)}
                    className={cn(
                      "flex w-full items-start gap-2 border-b border-[#f0edf8] px-3 py-3 text-left transition hover:bg-white",
                      activeOther?.id === c.otherUserId && "bg-white ring-1 ring-inset ring-[#6460FF]/30"
                    )}
                  >
                    <AvatarBubble name={c.displayName} avatarUrl={c.avatarUrl} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#280071]">{c.displayName}</p>
                      <p className="truncate text-xs text-[#999999]">@{c.username}</p>
                      <p className="mt-0.5 truncate text-xs text-[#666666]">{c.lastText}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="flex flex-col">
            {activeOther ? (
              <>
                <div className="flex items-center gap-3 border-b border-[#e8e4f5] bg-[#f7f5fc] px-4 py-3">
                  <AvatarBubble name={activeOther.displayName} avatarUrl={activeOther.avatarUrl} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#280071]">{activeOther.displayName}</p>
                    <p className="text-xs text-[#999999]">
                      @{activeOther.username}
                      {activeOther.accountType === "provider" ? " · Người cho thuê" : " · Người thuê"}
                    </p>
                  </div>
                  <Link
                    to={`/players/${activeOther.username}`}
                    className="hidden text-xs font-semibold text-[#6460FF] hover:underline sm:inline"
                  >
                    Xem hồ sơ
                  </Link>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {loadingThread ? (
                    <p className="text-center text-sm text-[#999999]">Đang tải…</p>
                  ) : directMessages.length === 0 ? (
                    <p className="text-center text-sm text-[#999999]">Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</p>
                  ) : (
                    directMessages.map((m) => {
                      const mine = m.senderId === user._id;
                      return (
                        <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                              mine
                                ? "rounded-tr-sm bg-gradient-to-br from-[#6460FF] to-[#7B19D8] text-white"
                                : "rounded-tl-sm bg-white ring-1 ring-[#e8e4f5]"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                            <p className={cn("mt-1 text-[10px]", mine ? "text-white/80" : "text-[#999999]")}>
                              {formatTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={(e) => void handleSendDirect(e)} className="border-t border-[#e8e4f5] bg-white p-3">
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={2000}
                      placeholder="Nhắn với người chơi…"
                      className="min-h-10 flex-1 rounded-xl border border-[#e8e4f5] bg-[#faf9ff] px-3 text-sm text-[#280071] outline-none focus:border-[#6460FF] focus:ring-2 focus:ring-[#6460FF]/20"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#6460FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#554fd9] disabled:opacity-50"
                    >
                      <Send className="size-4" aria-hidden />
                      Gửi
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <Users className="size-10 text-[#cccccc]" aria-hidden />
                <p className="text-sm text-[#666666]">Chọn hội thoại bên trái hoặc nhắn tin từ trang hồ sơ người chơi.</p>
                <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6460FF] hover:underline">
                  <ArrowLeft className="size-4" />
                  Khám phá người chơi
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex max-h-[min(560px,calc(100vh-220px))] flex-col overflow-hidden rounded-2xl border border-[#e8e4f5] bg-white shadow-sm">
          <div className="border-b border-[#e8e4f5] bg-[#f7f5fc] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6460FF]">Hỗ trợ từ quản trị</p>
            <p className="text-sm text-[#354052]">@{user.username}</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loadingSupport ? (
              <p className="text-center text-sm text-[#999999]">Đang tải…</p>
            ) : supportMessages.length === 0 ? (
              <p className="text-center text-sm text-[#999999]">Chưa có tin nhắn. Hãy gửi câu hỏi bên dưới.</p>
            ) : (
              supportMessages.map((m) => {
                const mine = m.authorId === user._id && m.authorRole === "user";
                const adminSide = m.authorRole === "admin";
                return (
                  <div key={m.id} className={cn("flex", adminSide ? "justify-start" : mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        adminSide ? "rounded-tl-sm bg-white ring-1 ring-[#e8e4f5]" : "rounded-tr-sm bg-gradient-to-br from-[#6460FF] to-[#7B19D8] text-white"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={cn("mt-1 text-[10px]", adminSide ? "text-[#999999]" : "text-white/80")}>
                        {adminSide ? "Quản trị" : "Bạn"} · {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e) => void handleSendSupport(e)} className="border-t border-[#e8e4f5] bg-white p-3">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                placeholder="Nhập tin nhắn hỗ trợ…"
                className="min-h-10 flex-1 rounded-xl border border-[#e8e4f5] bg-[#faf9ff] px-3 text-sm text-[#280071] outline-none focus:border-[#6460FF] focus:ring-2 focus:ring-[#6460FF]/20"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#6460FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#554fd9] disabled:opacity-50"
              >
                <Send className="size-4" aria-hidden />
                Gửi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
