import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { registerUser } from "@/lib/backend.functions";
import { saveToken } from "@/lib/session";

export const Route = createFileRoute("/jisajili")({ component: Jisajili });

function Jisajili() {
  const register = useServerFn(registerUser);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (form.name.trim().length < 3) return setError("Weka jina lako kamili.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Weka email sahihi.");
    if (!/^(0|255)\d{9}$/.test(form.phone.replace(/\s/g, ""))) return setError("Weka namba sahihi, mfano 0712345678.");
    setLoading(true);
    try {
      const res = await register({ data: { ...form, phone: form.phone.replace(/\s/g, "") } });
      saveToken(String(res.token));
      navigate({ to: "/lipa" });
    } catch (err) { setError(err instanceof Error ? err.message : "Usajili umeshindikana."); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#f4f7fb] px-4 py-8">
    <div className="mx-auto w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><ArrowLeft className="h-4 w-4" /> Rudi mwanzo</Link>
      <div className="mt-4 rounded-3xl bg-white p-6 shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-900"><img src="/chatblog-logo.png" alt="ChatBlog" className="h-full w-full object-contain" /></div>
        <h1 className="mt-4 text-center text-2xl font-black">Jisajili ChatBlog</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">Jaza taarifa zako. Baada ya usajili utaelekezwa moja kwa moja kwenye malipo.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">Jina kamili<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none ring-0" placeholder="Mfano: Juma Kassim" /></label>
          <label className="block text-sm font-bold">Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="juma@example.com" /></label>
          <label className="block text-sm font-bold">Namba ya simu<input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="0712345678" /></label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 font-black text-white disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} {loading ? "INASAJILI..." : "JISAJILI"}</button>
        </form>
      </div>
    </div>
  </main>;
}
