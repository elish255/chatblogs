import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Copy, Loader2, Zap } from "lucide-react";
import { ACTIVATION_FEE, PAYMENT_BUSINESS_NAME, PAYMENT_LIPA_NUMBER, loadToken } from "@/lib/session";
import { getDashboard, submitPayment } from "@/lib/backend.functions";
import { checkPaymentStatus, createPaymentOrder } from "@/lib/fimipay.functions";

export const Route = createFileRoute("/lipa")({ component: Lipa });

function Lipa() {
  const navigate = useNavigate();
  const load = useServerFn(getDashboard);
  const sendPayment = useServerFn(submitPayment);
  const createOrder = useServerFn(createPaymentOrder);
  const statusOrder = useServerFn(checkPaymentStatus);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!loadToken()) navigate({ to: "/jisajili" }); }, [navigate]);
  const normalized = () => phone.replace(/\s/g, "");
  const valid = () => /^(0|255)\d{9}$/.test(normalized());

  async function manual(e: React.FormEvent) {
    e.preventDefault(); setMessage("");
    if (!valid()) return setMessage("Weka namba sahihi, mfano 0712345678.");
    const token=loadToken(); if (!token) return navigate({to:"/jisajili"});
    setLoading(true);
    try { await sendPayment({data:{token,phone:normalized()}}); setDone(true); }
    catch(err){ setMessage(err instanceof Error ? err.message : "Imeshindikana kutuma taarifa ya malipo."); }
    finally{setLoading(false);}
  }

  async function automatic() {
    setMessage("");
    if (!valid()) return setMessage("Weka namba ya simu ya kulipia kwanza.");
    const token=loadToken(); if(!token) return navigate({to:"/jisajili"});
    setLoading(true);
    try {
      const profile=await load({data:{token}});
      if(!profile.ok || !profile.user) throw new Error("Taarifa za akaunti hazipatikani.");
      const order=await createOrder({data:{buyer_name:String(profile.user.name),buyer_email:String(profile.user.email),buyer_phone:normalized(),amount:ACTIVATION_FEE}});
      if(!order.ok || !order.order_id) throw new Error(order.message || "Imeshindikana kuanzisha Fimipay.");
      setMessage(order.message || "Thibitisha malipo kwenye simu yako.");
      let paid=false;
      for(let i=0;i<12;i++){
        await new Promise(r=>setTimeout(r,5000));
        const st=await statusOrder({data:{order_id:order.order_id}});
        const status=String(st.status).toUpperCase();
        if(["SUCCESS","SUCCESSFUL","PAID","COMPLETED","APPROVED"].includes(status)){paid=true;break;}
        if(["FAILED","CANCELLED","CANCELED","EXPIRED","DECLINED"].includes(status)) throw new Error("Malipo hayajakamilika. Jaribu tena au tumia Lipa Namba.");
      }
      if(!paid) throw new Error("Muda wa kusubiri malipo umeisha. Kama umelipa, tumia NIMELIPIA.");
      await sendPayment({data:{token,phone:normalized()}});
      setDone(true);
    } catch(err){ setMessage(err instanceof Error ? err.message : "Automatic payment imeshindikana."); }
    finally{setLoading(false);}
  }

  async function copy(){ await navigator.clipboard?.writeText(PAYMENT_LIPA_NUMBER); setCopied(true); window.setTimeout(()=>setCopied(false),1500); }

  if(done) return <main className="min-h-screen bg-[#f4f7fb] px-4 py-8"><div className="mx-auto w-full max-w-md"><div className="rounded-3xl bg-white p-7 text-center shadow-card"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500"/><h1 className="mt-4 text-2xl font-black">Taarifa imetumwa</h1><p className="mt-2 text-sm leading-6 text-slate-500">Malipo ya TZS {ACTIVATION_FEE.toLocaleString()} yamewasilishwa kwa Admin. Baada ya account ku-activate utaweza kutumia ChatBlog.</p><Link to="/" className="mt-5 block rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-black text-white">RUDI CHATBLOG</Link></div></div></main>;

  return <main className="min-h-screen bg-[#f4f7fb] px-4 py-8"><div className="mx-auto w-full max-w-md">
    <Link to="/jisajili" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><ArrowLeft className="h-4 w-4"/> Rudi usajili</Link>
    <div className="mt-4 rounded-3xl bg-white p-6 shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-900"><img src="/chatblog-logo.png" alt="ChatBlog" className="h-full w-full object-contain"/></div>
      <h1 className="mt-4 text-center text-2xl font-black">Malipo ya ChatBlog</h1>
      <p className="mt-2 text-center text-sm text-slate-500">Kiasi cha usajili ni <strong>TZS {ACTIVATION_FEE.toLocaleString()}</strong>.</p>

      <div className="mt-5 rounded-3xl bg-gradient-to-br from-[#0c9b9e] to-[#20a9df] p-5 text-white">
        <p className="text-xs font-black tracking-widest text-white/80">LIPA NAMBA</p>
        <div className="mt-2 flex items-center justify-between gap-3"><span className="text-3xl font-black tracking-wide">{PAYMENT_LIPA_NUMBER}</span><button type="button" onClick={copy} className="rounded-xl bg-white/20 p-2"><Copy className="h-5 w-5"/></button></div>
        <p className="mt-2 text-sm font-bold">{PAYMENT_BUSINESS_NAME}</p><p className="mt-1 text-sm font-bold">TZS {ACTIVATION_FEE.toLocaleString()}</p>{copied&&<p className="mt-2 text-xs font-bold">Lipa namba imenakiliwa ✓</p>}
      </div>

      <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-teal-600"/><h2 className="font-black">Automatic Payment — Fimipay</h2></div>
        <p className="mt-1 text-xs leading-5 text-slate-600">Weka namba ya simu kisha bonyeza hapa. Push ya Fimipay itatumwa kwenye simu yako.</p>
        <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" className="mt-3 w-full rounded-xl bg-white px-4 py-3 outline-none" placeholder="0712345678"/>
        <button type="button" onClick={()=>void automatic()} disabled={loading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3.5 font-black text-white disabled:opacity-60">{loading&&<Loader2 className="h-4 w-4 animate-spin"/>} LIPA AUTOMATIC — TZS {ACTIVATION_FEE.toLocaleString()}</button>
      </div>

      <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200"/><span className="text-xs font-black text-slate-400">AU MANUAL</span><div className="h-px flex-1 bg-slate-200"/></div>
      <form onSubmit={manual} className="space-y-3">
        <label className="block text-sm font-bold">Namba uliyotumia kulipa<input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" className="mt-1 w-full rounded-xl bg-slate-100 px-4 py-3 outline-none" placeholder="0712345678"/></label>
        {message&&<p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">{message}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 font-black text-white disabled:opacity-60">{loading&&<Loader2 className="h-4 w-4 animate-spin"/>} NIMELIPIA</button>
      </form>
    </div>
  </div></main>;
}
