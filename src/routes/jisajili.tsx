import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { registerUser } from "@/lib/backend.functions";
import { saveToken } from "@/lib/session";

export const Route = createFileRoute("/jisajili")({ component: Jisajili });

const EAST_AFRICA_COUNTRIES = [
  "Burundi",
  "Democratic Republic of the Congo",
  "Kenya",
  "Rwanda",
  "Somalia",
  "South Sudan",
  "Tanzania",
  "Uganda",
];

function Jisajili() {
  const register = useServerFn(registerUser);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", phone: "", country: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 3) return setError("Weka jina lako kamili.");
    if (!/^[A-Za-z0-9_]{3,30}$/.test(form.username.trim())) return setError("Username iwe na herufi, namba au underscore pekee (angalau 3).");
    if (!/^(0|255)\d{9}$/.test(form.phone.replace(/\s/g, ""))) return setError("Weka namba sahihi, mfano 0712345678.");
    if (!form.country) return setError("Chagua nchi yako.");
    if (form.password.length < 8) return setError("Password iwe na angalau herufi 8.");
    if (form.password !== form.confirmPassword) return setError("Password na Confirm Password hazifanani.");

    setLoading(true);
    try {
      const res = await register({
        data: {
          name: form.name.trim(),
          username: form.username.trim(),
          phone: form.phone.replace(/\s/g, ""),
          country: form.country as (typeof EAST_AFRICA_COUNTRIES)[number],
          password: form.password,
        },
      });
      saveToken(String(res.token));
      navigate({ to: "/lipa" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Usajili umeshindikana.";
      setError(message.includes("duplicate") || message.includes("unique") ? "Username au taarifa hiyo tayari imesajiliwa." : message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-[#f4f7fb] px-4 py-8">
    <div className="mx-auto w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><ArrowLeft className="h-4 w-4" /> Rudi mwanzo</Link>
      <div className="mt-4 rounded-3xl bg-white p-6 shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-900"><img src="/chatblog-logo.png" alt="ChatBlog" className="h-full w-full object-contain" /></div>
        <h1 className="mt-4 text-center text-2xl font-black">Jisajili ChatBlog</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">Jaza taarifa zako. Baada ya usajili utaelekezwa moja kwa moja kwenye malipo.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">Jina kamili<input value={form.name} onChange={e=>update("name",e.target.value)} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="Mfano: Juma Kassim" /></label>
          <label className="block text-sm font-bold">Username<input value={form.username} onChange={e=>update("username",e.target.value)} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="Mfano: juma_kassim" autoComplete="username" /></label>
          <label className="block text-sm font-bold">Namba ya simu<input type="tel" value={form.phone} onChange={e=>update("phone",e.target.value)} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="0712345678" autoComplete="tel" /></label>
          <label className="block text-sm font-bold">Choose Country<select value={form.country} onChange={e=>update("country",e.target.value)} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none"><option value="">Chagua nchi</option>{EAST_AFRICA_COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}</select></label>
          <label className="block text-sm font-bold">Password<div className="relative mt-1"><input type={showPassword ? "text" : "password"} value={form.password} onChange={e=>update("password",e.target.value)} className="w-full rounded-2xl bg-slate-100 px-4 py-3 pr-12 outline-none" placeholder="Angalau herufi 8" autoComplete="new-password" /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label="Onyesha password">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>
          <label className="block text-sm font-bold">Confirm Password<div className="relative mt-1"><input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={e=>update("confirmPassword",e.target.value)} className="w-full rounded-2xl bg-slate-100 px-4 py-3 pr-12 outline-none" placeholder="Rudia password" autoComplete="new-password" /><button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label="Onyesha confirm password">{showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 font-black text-white disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} {loading ? "INASAJILI..." : "JISAJILI"}</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-500">Una account tayari? <Link to="/login" className="font-black text-blue-600 hover:underline">Login</Link></div>
      </div>
    </div>
  </main>;
}
