import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { loginUser } from "@/lib/backend.functions";
import { saveToken } from "@/lib/session";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const login = useServerFn(loginUser);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username.trim())) return setError("Weka Username sahihi.");
    if (password.length < 8) return setError("Password iwe na angalau herufi 8.");
    setLoading(true);
    try {
      const res = await login({ data: { username: username.trim(), password } });
      saveToken(String(res.token));
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login imeshindikana.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Rudi mwanzo
        </Link>
        <div className="mt-4 rounded-3xl bg-white p-6 shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
            <img src="/chatblog-logo.png" alt="ChatBlog" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-black">Login ChatBlog</h1>
          <p className="mt-2 text-center text-sm leading-6 text-slate-500">Weka Username na password kuingia kwenye account yako.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-bold">
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 outline-none" placeholder="Mfano: juma_kassim" autoComplete="username" />
            </label>
            <label className="block text-sm font-bold">
              Password
              <div className="relative mt-1">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl bg-slate-100 px-4 py-3 pr-12 outline-none" placeholder="Password yako" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label="Onyesha password">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 font-black text-white disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "INAINGIA..." : "LOGIN"}
            </button>
            <div className="pt-1 text-center text-sm text-slate-500">
              Huna account? <Link to="/jisajili" className="font-black text-violet-600 hover:underline">Jisajili</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
