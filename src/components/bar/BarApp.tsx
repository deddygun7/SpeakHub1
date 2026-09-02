"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  sounds,
  type Achievement,
  type ChannelInfo,
  type Dm,
  type Me,
  type OnlineUser,
  type Room,
  type WireMessage,
} from "@/components/bar/core";
import Sidebar from "@/components/bar/Sidebar";
import MessageList from "@/components/bar/MessageList";
import Composer from "@/components/bar/Composer";
import {
  AchievementsModal,
  BoardModal,
  ChannelInfoPanel,
  CommandPalette,
  CreateRoomModal,
  DailyModal,
  JoinRoomModal,
  ProfilePanel,
  SearchModal,
  SettingsModal,
  ShopModal,
  Toasts,
  type Toast,
} from "@/components/bar/Overlays";

export type ModalKind = "createRoom" | "joinRoom" | "settings" | "shop" | "board" | "achievements" | "daily" | "search" | null;

type Props = { initialMe: Me; initialChannelId: number | null };

export default function BarApp({ initialMe, initialChannelId }: Props) {
  const router = useRouter();
  const [me, setMe] = useState<Me>(initialMe);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dms, setDms] = useState<Dm[]>([]);
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [currentId, setCurrentId] = useState<number | null>(initialChannelId);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [members, setMembers] = useState<OnlineUser[]>([]);
  const [pinned, setPinned] = useState<WireMessage[]>([]);
  const [messages, setMessages] = useState<WireMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<WireMessage | null>(null);
  const [editing, setEditing] = useState<WireMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<"info" | "profile" | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [lockedRoom, setLockedRoom] = useState<{ id: number; name: string; icon: string } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dailyResult, setDailyResult] = useState<{ message: string; xpGain: number; coinGain: number; streak: number; whisky: { name: string; color: string } } | null>(null);
  const [connected, setConnected] = useState(true);

  const currentIdRef = useRef<number | null>(initialChannelId);
  const messagesRef = useRef<WireMessage[]>([]);
  const lastSyncRef = useRef<string | null>(null);
  const typingUntilRef = useRef(0);
  const meRef = useRef(me);
  meRef.current = me;
  messagesRef.current = messages;
  currentIdRef.current = currentId;

  /* ---------- toasts ---------- */
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.kind === "unlock" ? 6000 : 3800);
  }, []);

  const handleUnlocked = useCallback(
    (unlocked?: Achievement[]) => {
      if (!unlocked?.length) return;
      sounds.unlock();
      for (const a of unlocked) toast({ kind: "unlock", title: `Достижение: ${a.title}`, text: a.description, icon: a.icon });
    },
    [toast],
  );

  const fail = useCallback(
    (err: unknown) => {
      sounds.error();
      if (err instanceof ApiError && err.status === 401) {
        router.push("/enter");
        return;
      }
      toast({ kind: "error", title: err instanceof Error ? err.message : "Ошибка" });
    },
    [router, toast],
  );

  /* ---------- data loaders ---------- */
  const loadChannels = useCallback(async () => {
    try {
      const data = await api<{ rooms: Room[]; dms: Dm[] }>("/api/channels");
      setRooms(data.rooms);
      setDms(data.dms);
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  const mergeMessages = useCallback((incoming: WireMessage[], replaceAll = false) => {
    setMessages((prev) => {
      const base = replaceAll ? [] : prev;
      const map = new Map(base.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return Array.from(map.values()).sort((a, b) => a.id - b.id);
    });
  }, []);

  const openChannel = useCallback(
    async (id: number) => {
      setCurrentId(id);
      currentIdRef.current = id;
      setLoading(true);
      setReplyTo(null);
      setEditing(null);
      setTyping([]);
      setSidebarOpen(false);
      setLockedRoom(null);
      if (typeof window !== "undefined") window.history.replaceState(null, "", `/bar?c=${id}`);
      try {
        const info = await api<{ channel: ChannelInfo; members: OnlineUser[]; pinned: WireMessage[] }>(`/api/channels/${id}`);
        const hist = await api<{ messages: WireMessage[]; hasMore: boolean; unlocked?: Achievement[] }>(`/api/channels/${id}/messages?limit=60`);
        if (currentIdRef.current !== id) return;
        setChannel(info.channel);
        setMembers(info.members);
        setPinned(info.pinned);
        mergeMessages(hist.messages, true);
        setHasMore(hist.hasMore);
        setUnread((u) => ({ ...u, [id]: 0 }));
        lastSyncRef.current = new Date().toISOString();
        if (hist.unlocked?.length) {
          handleUnlocked(hist.unlocked);
          void loadChannels();
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          // locked private room -> ask password
          try {
            const res = await fetch(`/api/channels/${id}`, { cache: "no-store" });
            const data = (await res.json()) as { channel?: { id: number; name: string; icon: string } };
            if (data.channel) {
              setLockedRoom(data.channel);
              setModal("joinRoom");
            }
          } catch {
            /* ignore */
          }
          setChannel(null);
          setMessages([]);
        } else fail(e);
      } finally {
        if (currentIdRef.current === id) setLoading(false);
      }
    },
    [fail, handleUnlocked, loadChannels, mergeMessages],
  );

  const loadOlder = useCallback(async () => {
    const id = currentIdRef.current;
    const first = messagesRef.current[0];
    if (!id || !first) return;
    try {
      const hist = await api<{ messages: WireMessage[]; hasMore: boolean }>(`/api/channels/${id}/messages?limit=50&before=${first.id}`);
      mergeMessages(hist.messages);
      setHasMore(hist.hasMore);
    } catch (e) {
      fail(e);
    }
  }, [fail, mergeMessages]);

  /* ---------- initial ---------- */
  useEffect(() => {
    void loadChannels();
    if (initialChannelId) void openChannel(initialChannelId);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- sync loop ---------- */
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      const id = currentIdRef.current;
      const afterId = messagesRef.current.reduce((m, x) => Math.max(m, x.id), 0);
      try {
        const data = await api<{
          now: string;
          messages: WireMessage[];
          typing: string[];
          online: OnlineUser[];
          unread: Record<number, number>;
          me: Me;
        }>("/api/sync", {
          method: "POST",
          json: { channelId: id, afterId, since: lastSyncRef.current, typing: Date.now() < typingUntilRef.current },
        });
        if (stopped) return;
        setConnected(true);
        lastSyncRef.current = data.now;
        if (id === currentIdRef.current && data.messages.length) {
          const fresh = data.messages.filter((m) => m.id > afterId && m.userId !== meRef.current.id);
          if (fresh.length && document.visibilityState === "visible") sounds.receive();
          mergeMessages(data.messages);
          if (data.messages.some((m) => m.isPinned || m.id <= afterId)) {
            setPinned((p) => {
              const map = new Map(p.map((x) => [x.id, x]));
              for (const m of data.messages) {
                if (m.isPinned && !m.deletedAt) map.set(m.id, m);
                else map.delete(m.id);
              }
              return Array.from(map.values()).sort((a, b) => b.id - a.id);
            });
          }
        }
        setTyping(data.typing);
        setOnline(data.online);
        setUnread({ ...data.unread, ...(id ? { [id]: 0 } : {}) });
        setMe((prev) => (prev.xp !== data.me.xp || prev.coins !== data.me.coins || prev.title !== data.me.title || prev.nameColor !== data.me.nameColor ? data.me : prev));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          router.push("/enter");
          return;
        }
        setConnected(false);
      } finally {
        if (!stopped) timer = setTimeout(tick, document.visibilityState === "visible" ? 2500 : 9000);
      }
    };
    timer = setTimeout(tick, 400);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [mergeMessages, router]);

  // refresh channel list when unread keys change (new DM appears)
  const unreadKeys = useMemo(() => Object.keys(unread).sort().join(","), [unread]);
  useEffect(() => {
    if (!unreadKeys) return;
    const known = new Set([...rooms.map((r) => r.id), ...dms.map((d) => d.id)]);
    if (unreadKeys.split(",").some((k) => k && !known.has(Number(k)))) void loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadKeys]);

  /* ---------- actions ---------- */
  const send = useCallback(
    async (content: string) => {
      const id = currentIdRef.current;
      if (!id) return false;
      try {
        if (editing) {
          const data = await api<{ message: WireMessage }>(`/api/messages/${editing.id}`, { method: "PATCH", json: { content } });
          mergeMessages([data.message]);
          setEditing(null);
          return true;
        }
        const data = await api<{ messages: WireMessage[]; unlocked: Achievement[]; xpGain: number; info: string | null }>(`/api/channels/${id}/messages`, {
          method: "POST",
          json: { content, replyToId: replyTo?.id ?? null },
        });
        mergeMessages(data.messages);
        setReplyTo(null);
        typingUntilRef.current = 0;
        sounds.send();
        if (content.startsWith("/topic")) void openChannel(id);
        if (content.startsWith("/pour")) sounds.pour();
        if (data.info) toast({ kind: "info", title: data.info });
        handleUnlocked(data.unlocked);
        if (!rooms.find((r) => r.id === id)?.joined && channel?.type === "room") void loadChannels();
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [channel?.type, editing, fail, handleUnlocked, loadChannels, mergeMessages, openChannel, replyTo?.id, rooms, toast],
  );

  const react = useCallback(
    async (msg: WireMessage, emoji: string) => {
      try {
        const data = await api<{ message: WireMessage; unlocked: Achievement[] }>(`/api/messages/${msg.id}`, { method: "POST", json: { action: "react", emoji } });
        mergeMessages([data.message]);
        sounds.click();
        handleUnlocked(data.unlocked);
      } catch (e) {
        fail(e);
      }
    },
    [fail, handleUnlocked, mergeMessages],
  );

  const pin = useCallback(
    async (msg: WireMessage) => {
      try {
        const data = await api<{ message: WireMessage }>(`/api/messages/${msg.id}`, { method: "POST", json: { action: "pin" } });
        mergeMessages([data.message]);
        setPinned((p) => (data.message.isPinned ? [data.message, ...p.filter((x) => x.id !== msg.id)] : p.filter((x) => x.id !== msg.id)));
        toast({ kind: "info", title: data.message.isPinned ? "Закреплено на стене" : "Снято со стены" });
      } catch (e) {
        fail(e);
      }
    },
    [fail, mergeMessages, toast],
  );

  const remove = useCallback(
    async (msg: WireMessage) => {
      try {
        const data = await api<{ message: WireMessage }>(`/api/messages/${msg.id}`, { method: "DELETE" });
        mergeMessages([data.message]);
        setPinned((p) => p.filter((x) => x.id !== msg.id));
      } catch (e) {
        fail(e);
      }
    },
    [fail, mergeMessages],
  );

  const openDm = useCallback(
    async (userId: number) => {
      try {
        const data = await api<{ channelId: number }>(`/api/users/${userId}`, { method: "POST" });
        await loadChannels();
        setRightPanel(null);
        void openChannel(data.channelId);
      } catch (e) {
        fail(e);
      }
    },
    [fail, loadChannels, openChannel],
  );

  const showProfile = useCallback((userId: number) => {
    setProfileId(userId);
    setRightPanel("profile");
  }, []);

  const joinRoom = useCallback(
    async (id: number, password?: string) => {
      try {
        const data = await api<{ unlocked?: Achievement[] }>(`/api/channels/${id}`, { method: "POST", json: { password } });
        handleUnlocked(data.unlocked);
        setModal(null);
        await loadChannels();
        void openChannel(id);
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [fail, handleUnlocked, loadChannels, openChannel],
  );

  const leaveRoom = useCallback(
    async (id: number) => {
      try {
        await api(`/api/channels/${id}`, { method: "DELETE" });
        await loadChannels();
        const lobby = rooms.find((r) => r.slug === "lobby");
        if (currentIdRef.current === id && lobby) void openChannel(lobby.id);
        setRightPanel(null);
      } catch (e) {
        fail(e);
      }
    },
    [fail, loadChannels, openChannel, rooms],
  );

  const claimDaily = useCallback(async () => {
    try {
      const data = await api<{ user: Me; xpGain: number; coinGain: number; streak: number; whisky: { name: string; color: string }; unlocked: Achievement[]; message: string }>(
        "/api/me",
        { method: "POST", json: { action: "daily" } },
      );
      setMe(data.user);
      setDailyResult({ message: data.message, xpGain: data.xpGain, coinGain: data.coinGain, streak: data.streak, whisky: data.whisky });
      setModal("daily");
      sounds.pour();
      handleUnlocked(data.unlocked);
    } catch (e) {
      fail(e);
    }
  }, [fail, handleUnlocked]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }, [router]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setModal(null);
        setReplyTo(null);
        setEditing(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dailyAvailable = useMemo(() => {
    if (!me.lastDailyClaim) return true;
    return Math.floor(new Date(me.lastDailyClaim).getTime() / 86_400_000) !== Math.floor(Date.now() / 86_400_000);
  }, [me.lastDailyClaim]);

  const totalUnread = useMemo(() => Object.entries(unread).reduce((s, [k, v]) => (Number(k) === currentId ? s : s + v), 0), [unread, currentId]);
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) NEON DRAM` : "NEON DRAM — бар";
  }, [totalUnread]);

  const currentDm = dms.find((d) => d.id === currentId);
  const headerTitle = channel ? (channel.type === "dm" ? currentDm?.partner?.displayName ?? "Личный чат" : channel.name) : lockedRoom ? lockedRoom.name : "…";

  return (
    <div className="flex h-[100svh] overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar
          me={me}
          rooms={rooms}
          dms={dms}
          online={online}
          unread={unread}
          currentId={currentId}
          dailyAvailable={dailyAvailable}
          connected={connected}
          onOpen={(id) => void openChannel(id)}
          onCreateRoom={() => setModal("createRoom")}
          onDaily={() => void claimDaily()}
          onSettings={() => setModal("settings")}
          onShop={() => setModal("shop")}
          onBoard={() => setModal("board")}
          onAchievements={() => setModal("achievements")}
          onPalette={() => setPaletteOpen(true)}
          onProfile={showProfile}
          onDm={(id) => void openDm(id)}
          onLogout={() => void logout()}
        />
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="glass flex items-center gap-3 border-b px-4 py-2.5">
          <button className="btn-ghost !px-2.5 !py-1.5 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Меню">
            ☰
          </button>
          <span className="text-2xl">{channel?.type === "dm" ? "🤫" : channel?.icon ?? lockedRoom?.icon ?? "🥃"}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-sm font-bold uppercase tracking-[0.15em] text-ink">{headerTitle}</h1>
              {channel?.isPrivate && <span className="text-xs text-muted">🔐</span>}
              {channel?.type === "dm" && currentDm?.partner && (
                <span className={`text-[10px] font-display uppercase tracking-widest ${currentDm.partner.online ? "text-lime-neon" : "text-muted"}`}>
                  {currentDm.partner.online ? "online" : "offline"}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted">
              {channel?.type === "dm" ? currentDm?.partner?.status || "личный разговор под неоном" : channel?.topic || channel?.description || "—"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!connected && <span className="hidden font-display text-[10px] uppercase tracking-widest text-red-400 sm:inline">reconnect…</span>}
            <button className="btn-ghost !px-2.5 !py-1.5" title="Поиск в зале" onClick={() => setModal("search")}>
              🔍
            </button>
            {pinned.length > 0 && (
              <button className="btn-ghost !px-2.5 !py-1.5" title="Закреплённые" onClick={() => setRightPanel((p) => (p === "info" ? null : "info"))}>
                📌 {pinned.length}
              </button>
            )}
            <button className={`btn-ghost !px-2.5 !py-1.5 ${rightPanel === "info" ? "bg-acc/20" : ""}`} title="О зале" onClick={() => setRightPanel((p) => (p === "info" ? null : "info"))}>
              ⓘ
            </button>
          </div>
        </header>

        <MessageList
          me={me}
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          typing={typing}
          channel={channel}
          lockedRoom={lockedRoom}
          onLoadOlder={() => void loadOlder()}
          onReact={(m, e) => void react(m, e)}
          onReply={(m) => {
            setEditing(null);
            setReplyTo(m);
          }}
          onEdit={(m) => {
            setReplyTo(null);
            setEditing(m);
          }}
          onDelete={(m) => void remove(m)}
          onPin={(m) => void pin(m)}
          onProfile={showProfile}
          onUnlock={() => setModal("joinRoom")}
        />

        {channel && (
          <Composer
            key={channel.id}
            channel={channel}
            replyTo={replyTo}
            editing={editing}
            members={members}
            onCancelReply={() => setReplyTo(null)}
            onCancelEdit={() => setEditing(null)}
            onTyping={() => {
              typingUntilRef.current = Date.now() + 3500;
            }}
            onSend={send}
          />
        )}
      </section>

      {/* Right panel */}
      {rightPanel && (
        <aside className="fixed inset-y-0 right-0 z-40 w-80 border-l border-line bg-[var(--panel)] shadow-2xl xl:static xl:shadow-none">
          {rightPanel === "profile" && profileId ? (
            <ProfilePanel userId={profileId} meId={me.id} onClose={() => setRightPanel(null)} onDm={(id) => void openDm(id)} onCheers={(username) => void send(`/cheers @${username}`)} />
          ) : (
            <ChannelInfoPanel
              channel={channel}
              members={members}
              pinned={pinned}
              meId={me.id}
              onClose={() => setRightPanel(null)}
              onProfile={showProfile}
              onLeave={(id) => void leaveRoom(id)}
              onUnpin={(m) => void pin(m)}
            />
          )}
        </aside>
      )}

      {/* Overlays */}
      {paletteOpen && (
        <CommandPalette
          rooms={rooms}
          dms={dms}
          onClose={() => setPaletteOpen(false)}
          onOpen={(id) => {
            setPaletteOpen(false);
            void openChannel(id);
          }}
          onDm={(id) => {
            setPaletteOpen(false);
            void openDm(id);
          }}
          onCommand={(cmd) => {
            setPaletteOpen(false);
            if (cmd === "createRoom") setModal("createRoom");
            else if (cmd === "daily") void claimDaily();
            else setModal(cmd as ModalKind);
          }}
        />
      )}
      {modal === "createRoom" && (
        <CreateRoomModal
          onClose={() => setModal(null)}
          onCreated={async (id, unlocked) => {
            setModal(null);
            handleUnlocked(unlocked);
            await loadChannels();
            void openChannel(id);
          }}
          onError={fail}
        />
      )}
      {modal === "joinRoom" && lockedRoom && <JoinRoomModal room={lockedRoom} onClose={() => setModal(null)} onJoin={(pw) => joinRoom(lockedRoom.id, pw)} />}
      {modal === "settings" && (
        <SettingsModal
          me={me}
          onClose={() => setModal(null)}
          onSaved={(u) => {
            setMe(u);
            toast({ kind: "info", title: "Профиль обновлён" });
          }}
          onError={fail}
        />
      )}
      {modal === "shop" && (
        <ShopModal
          me={me}
          onClose={() => setModal(null)}
          onBought={(u, msg, unlocked) => {
            setMe(u);
            toast({ kind: "info", title: msg });
            handleUnlocked(unlocked);
          }}
          onError={fail}
        />
      )}
      {modal === "board" && <BoardModal meId={me.id} onClose={() => setModal(null)} onProfile={showProfile} />}
      {modal === "achievements" && <AchievementsModal onClose={() => setModal(null)} />}
      {modal === "daily" && dailyResult && <DailyModal result={dailyResult} onClose={() => setModal(null)} />}
      {modal === "search" && channel && <SearchModal channelId={channel.id} onClose={() => setModal(null)} onProfile={showProfile} />}
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))} />
    </div>
  );
}
