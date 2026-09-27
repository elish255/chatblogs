import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, UserRound } from "lucide-react";
import { getDashboard } from "@/lib/backend.functions";
import { clearToken, loadToken } from "@/lib/session";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const get = useServerFn(getDashboard);
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = loadToken();
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    void get({ data: { token } }).then(setData).catch(() => navigate({ to: "/login" })).finally(() => setLoading(false));
  }, [get, navigate]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] font-bold">Inapakia account...</main>;
  if (!data?.ok || !data.user) return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">Akaunti haipatikani.</main>;

  const user = data.user;
  const logout = () => { clearToken(); navigate({ to: "/login" }); };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-900"><img src="/chatblog-logo.png" alt="ChatBlog" className="h-full w-full object-contain" /></div>
            <div><p className="text-xs font-bold text-slate-400">CHATBLOG ACCOUNT</p><h1 className="text-xl font-black">Karibu, {String(user.name)}</h1></div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"><LogOut className="h-4 w-4" /> Logout</button>
        </div>

        <div className="mt-4 rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 p-6 text-white shadow-card">
          <p className="text-xs font-black tracking-widest text-white/70">BALANCE</p>
          <p className="mt-2 text-4xl font-black">TZS {Number(user.balance ?? 0).toLocaleString()}</p>
          <p className="mt-2 text-sm text-white/80">Status: <strong>{String(user.status)}</strong></p>
        </div>

        <div className="mt-4 rounded-3xl bg-white p-6 shadow-card">
          <div className="flex items-center gap-2"><UserRound className="h-5 w-5" /><h2 className="font-black">Taarifa za Account</h2></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Username</p><p className="font-black">{String(user.username)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Country</p><p className="font-black">{String(user.country)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Simu</p><p className="font-black">{String(user.phone)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Mapato</p><p className="font-black">TZS {Number(user.total_earned ?? 0).toLocaleString()}</p></div>
          </div>
        </div>

        {data.active ? (
          <Link to="/" className="mt-4 block rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 text-center font-black text-white">ENDELEA KWENYE CHATBLOG</Link>
        ) : (
          <div className="mt-4 rounded-3xl bg-amber-50 p-5 text-center"><p className="font-black text-amber-800">Account bado haija-activate.</p><p className="mt-1 text-sm text-amber-700">Kamilisha malipo na subiri Admin a-activate account.</p><Link to="/lipa" className="mt-4 inline-block rounded-full bg-amber-600 px-6 py-3 font-black text-white">NENDA KWENYE MALIPO</Link></div>
        )}
      </div>
    </main>
  );
}
