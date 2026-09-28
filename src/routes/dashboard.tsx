import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Send, X, Wallet, Bell, UserRound, MessageCircle } from "lucide-react";
import { getDashboard, sendChatMessage, startChat } from "@/lib/backend.functions";
import { clearToken, loadToken } from "@/lib/session";
import { dashboardPartners } from "@/lib/dashboard-partners";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const photoFor = (id: number) => {
  const n = Math.max(1, Number(id) || 1);
  return `https://randomuser.me/api/portraits/${n <= 30 ? "men" : "women"}/${((n - 1) % 30) + 1}.jpg`;
};

function Dashboard() {
  const get = useServerFn(getDashboard);
  const beginChat = useServerFn(startChat);
  const send = useServerFn(sendChatMessage);
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<(typeof dashboardPartners)[number] | null>(null);
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [text, setText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");

  const token = useMemo(() => loadToken(), []);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    void get({ data: { token } }).then(setData).catch(() => navigate({ to: "/login" })).finally(() => setLoading(false));
  }, [get, navigate, token]);

  const logout = () => { clearToken(); navigate({ to: "/login" }); };

  const openChat = async (partner: (typeof dashboardPartners)[number]) => {
    if (!token || !data?.active) return;
    setChatError("");
    setChatBusy(true);
    try {
      const result = await beginChat({ data: { token, foreigner: partner.name, price: 8500 } });
      setSelected(partner);
      setChatId(String(result.chatId));
      setMessages([{ sender: "foreigner", text: partner.openings[0] ?? `Habari, mimi ni ${partner.name}.` }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Chat haijaanza.");
    } finally {
      setChatBusy(false);
    }
  };

  const sendMessage = async () => {
    const value = text.trim();
    if (!value || !token || !chatId || chatBusy) return;
    setChatBusy(true);
    setChatError("");
    setMessages((current) => [...current, { sender: "user", text: value }]);
    setText("");
    try {
      const result = await send({ data: { token, chatId, text: value } });
      setMessages((current) => [...current, { sender: "foreigner", text: result.reply }]);
      if (result.completed) {
        setTimeout(() => setSelected(null), 1200);
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Ujumbe haujatumwa.");
    } finally {
      setChatBusy(false);
    }
  };

  if (loading) return <main className="cb-dashboard-shell flex min-h-screen items-center justify-center font-bold">Inapakia account...</main>;
  if (!data?.ok || !data.user) return <main className="cb-dashboard-shell flex min-h-screen items-center justify-center">Akaunti haipatikani.</main>;

  const user = data.user;

  return (
    <main className="cb-dashboard-shell">
      <div className="cb-dashboard-grid-bg" />
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="cb-dashboard-header">
          <div className="flex items-center gap-3">
            <div className="cb-dashboard-logo"><img src="/chatblog-logo.png" alt="ChatBlog" /></div>
            <div><p className="cb-eyebrow">CHATBLOG</p><h1 className="cb-dashboard-title">Karibu, {String(user.name)}</h1></div>
          </div>
          <button onClick={logout} className="cb-logout"><LogOut className="h-4 w-4" /> Logout</button>
        </header>

        <section className="cb-dashboard-hero">
          <div>
            <p className="cb-eyebrow">SALIO LAKO</p>
            <p className="cb-balance">TZS {Number(user.balance ?? 0).toLocaleString()}</p>
            <p className="cb-muted">Mapato yote: TZS {Number(user.total_earned ?? 0).toLocaleString()}</p>
          </div>
          <Wallet className="cb-hero-icon" />
        </section>

        {data.notification && (
          <section className="cb-dashboard-note"><Bell className="h-5 w-5" /><div><strong>{String(data.notification.title)}</strong><p>{String(data.notification.message)}</p></div></section>
        )}

        <section className="cb-dashboard-account">
          <div className="cb-section-heading"><UserRound className="h-5 w-5" /><div><h2>Taarifa za Account</h2><p>Maelezo ya account yako</p></div></div>
          <div className="cb-account-grid">
            <div><span>Username</span><strong>{String(user.username)}</strong></div>
            <div><span>Nchi</span><strong>{String(user.country)}</strong></div>
            <div><span>Simu</span><strong>{String(user.phone)}</strong></div>
            <div><span>Status</span><strong className="cb-status">{String(user.status)}</strong></div>
          </div>
        </section>

        {data.active ? (
          <section className="cb-chat-section">
            <div className="cb-section-heading">
              <MessageCircle className="h-5 w-5" />
              <div><h2>Anza Chat</h2><p>Chagua mtu unayetaka kuzungumza naye</p></div>
            </div>
            <div className="cb-partners-list">
              {dashboardPartners.map((partner) => (
                <article key={partner.id} className="cb-partner-card">
                  <div className="cb-partner-head">
                    <div className="cb-avatar-wrap"><img src={photoFor(partner.id)} alt={partner.name} className="cb-partner-avatar" loading="lazy" referrerPolicy="no-referrer" /><span className="cb-online-dot" /></div>
                    <div className="cb-partner-info"><h3>{partner.name}, {partner.age}</h3><p>{partner.flag} {partner.country}</p><small>● Online sasa</small></div>
                    <span className="cb-partner-rate">TZS 8,500</span>
                  </div>
                  <p className="cb-partner-bio">{partner.bio}</p>
                  <button className="cb-chat-btn" onClick={() => void openChat(partner)} disabled={chatBusy}>{chatBusy ? "Inaanza..." : "Chat"}</button>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="cb-dashboard-note cb-pending"><div><strong>Account bado haija-activate.</strong><p>Kamilisha malipo na subiri Admin a-activate account.</p></div></section>
        )}
      </div>

      {selected && (
        <div className="cb-chat-overlay">
          <div className="cb-chat-modal">
            <div className="cb-chat-top">
              <div className="flex items-center gap-3"><img src={photoFor(selected.id)} alt={selected.name} /><div><strong>{selected.name}, {selected.age}</strong><span>● Online sasa</span></div></div>
              <button onClick={() => setSelected(null)} aria-label="Funga"><X /></button>
            </div>
            <div className="cb-chat-messages">
              {messages.map((message, index) => <div key={index} className={message.sender === "user" ? "cb-msg cb-msg-user" : "cb-msg cb-msg-foreigner"}>{message.text}</div>)}
              {chatError && <div className="cb-chat-error">{chatError}</div>}
            </div>
            <div className="cb-chat-input"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendMessage(); }} placeholder="Andika ujumbe..." disabled={chatBusy} /><button onClick={() => void sendMessage()} disabled={chatBusy || !text.trim()}><Send className="h-4 w-4" /></button></div>
          </div>
        </div>
      )}
    </main>
  );
}
