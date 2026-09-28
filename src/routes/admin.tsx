import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, Check, X, RefreshCw } from "lucide-react";
import { adminListRequests, adminListUsers, adminSetUserStatus, adminProcessWithdrawal, adminSaveNotification } from "@/lib/backend.functions";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const listUsers = useServerFn(adminListUsers);
  const listRequests = useServerFn(adminListRequests);
  const setStatus = useServerFn(adminSetUserStatus);
  const processWithdrawal = useServerFn(adminProcessWithdrawal);
  const saveNotification = useServerFn(adminSaveNotification);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any>({ payments: [], withdrawals: [], notifications: [] });
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setError(""); setLoading(true);
    try {
      const [u, r] = await Promise.all([listUsers({ data: { password } }), listRequests({ data: { password } })]);
      setUsers(u.users as any[]); setRequests(r); setAuthed(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Imeshindikana kufungua admin."); setAuthed(false); }
    finally { setLoading(false); }
  }

  async function status(userId: string, value: "active" | "pending" | "rejected") {
    try { await setStatus({ data: { password, userId, status: value } }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Imeshindikana."); }
  }

  async function withdrawal(id: string, action: "approve" | "reject") {
    try { await processWithdrawal({ data: { password, withdrawalId: id, action } }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Imeshindikana."); }
  }

  async function notification(e: React.FormEvent) {
    e.preventDefault();
    try { await saveNotification({ data: { password, title, message, active: true } }); setTitle(""); setMessage(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Imeshindikana."); }
  }

  if (!authed) return <main className="min-h-screen bg-slate-950 px-4 py-10"><div className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-2xl"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white"><ShieldCheck/></div><h1 className="mt-4 text-center text-2xl font-black">ChatBlog Admin</h1><p className="mt-2 text-center text-sm text-slate-500">Weka nenosiri la admin kuendelea.</p><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') void load()}} className="mt-5 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="Admin password"/><button onClick={()=>void load()} disabled={loading||!password} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3.5 font-black text-white disabled:opacity-50">{loading&&<Loader2 className="h-4 w-4 animate-spin"/>} INGIA ADMIN</button>{error&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}</div></main>;

  return <main className="min-h-screen bg-[#f4f7fb] px-4 py-6"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">ChatBlog Admin</h1><p className="text-sm text-slate-500">Simamia users, malipo, withdrawals na notifications.</p></div><button onClick={()=>void load()} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold shadow"><RefreshCw className="h-4 w-4"/> Refresh</button></div>{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-card"><h2 className="text-xl font-black">Users</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b"><th className="p-3">Jina</th><th>Username</th><th>Email</th><th>Simu</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-b last:border-0"><td className="p-3 font-bold">{String(u.name)}</td><td>{String(u.username)}</td><td>{String(u.email)}</td><td>{String(u.phone)}</td><td>{String(u.status)}</td><td className="space-x-2 py-3"><button onClick={()=>void status(String(u.id),'active')} className="rounded-lg bg-emerald-100 px-3 py-1 font-bold text-emerald-700">Activate</button><button onClick={()=>void status(String(u.id),'rejected')} className="rounded-lg bg-red-100 px-3 py-1 font-bold text-red-700">Reject</button></td></tr>)}</tbody></table></div></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-white p-5 shadow-card"><h2 className="text-xl font-black">Malipo</h2><div className="mt-3 space-y-3">{requests.payments.map((p:any)=><div key={p.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><b>{String(p.phone)}</b><span className="font-bold">TZS {Number(p.amount).toLocaleString()}</span></div><p className="mt-1 text-xs text-slate-500">Njia: {String(p.method)} · {String(p.status)}</p></div>)}</div></div>
      <div className="rounded-3xl bg-white p-5 shadow-card"><h2 className="text-xl font-black">Withdrawals</h2><div className="mt-3 space-y-3">{requests.withdrawals.map((w:any)=><div key={w.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between"><b>TZS {Number(w.amount).toLocaleString()}</b><span>{String(w.status)}</span></div><p className="text-sm">{String(w.method)} · {String(w.account_number)}</p>{w.status==='pending'&&<div className="mt-3 flex gap-2"><button onClick={()=>void withdrawal(String(w.id),'approve')} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white"><Check className="h-4 w-4"/> Approve</button><button onClick={()=>void withdrawal(String(w.id),'reject')} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 font-bold text-white"><X className="h-4 w-4"/> Reject</button></div>}</div>)}</div></div></section>
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-card"><h2 className="text-xl font-black">Notification</h2><form onSubmit={notification} className="mt-4 grid gap-3"><input value={title} onChange={e=>setTitle(e.target.value)} required className="rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="Title"/><textarea value={message} onChange={e=>setMessage(e.target.value)} required className="min-h-28 rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="Ujumbe wa notification"/><button className="rounded-full bg-violet-600 py-3 font-black text-white">Tuma Notification</button></form></section>
  </div></main>;
}
