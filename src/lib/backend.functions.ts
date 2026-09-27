import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const USER_SELECT = "id,name,email,phone,status,balance,total_earned,total_withdrawn,bonus,created_at";

type SupabaseRow = Record<string, unknown>;

function config() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL na SUPABASE_SERVICE_ROLE_KEY hazijawekwa.");
  return { url: url.replace(/\/$/, ""), key };
}

async function db<T = SupabaseRow | SupabaseRow[]>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: init.method === "POST" || init.method === "PATCH" ? "return=representation" : "return=minimal",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Database error ${res.status}`);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function admin(password: string) {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected || password !== expected) throw new Error("Nenosiri la admin si sahihi.");
}

const registerSchema = z.object({
  name: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().regex(/^(0|255)\d{9}$/),
  partner: z.string().trim().max(120).optional().default(""),
});

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const token = crypto.randomUUID() + crypto.randomUUID();
    const rows = await db<SupabaseRow[]>("profiles", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        partner: data.partner,
        public_token: token,
        status: "pending_payment",
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        bonus: 0,
      }),
    });
    const user = rows[0];
    if (!user) throw new Error("Usajili haujahifadhiwa.");
    return { ok: true as const, token, user };
  });

const tokenSchema = z.object({ token: z.string().min(20).max(100) });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`profiles?public_token=eq.${encodeURIComponent(data.token)}&select=${USER_SELECT}&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user) return { ok: false as const, message: "Akaunti haipatikani." };
    const notes = await db<SupabaseRow[]>("notifications?active=eq.true&order=created_at.desc&limit=1&select=id,title,message,created_at", { method: "GET" });
    if (user.status !== "active") {
      return { ok: true as const, active: false as const, status: user.status, user, notification: notes[0] ?? null };
    }
    return { ok: true as const, active: true as const, status: user.status, user, notification: notes[0] ?? null };
  });

const paymentSchema = z.object({ token: z.string().min(20).max(100), phone: z.string().trim().regex(/^(0|255)\d{9}$/) });
export const submitPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`profiles?public_token=eq.${encodeURIComponent(data.token)}&select=id,name,email,status&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user) throw new Error("Akaunti haipatikani.");
    await db("payment_submissions", { method: "POST", body: JSON.stringify({ user_id: user.id, phone: data.phone, amount: 14500, status: "pending" }) });
    await db(`profiles?id=eq.${encodeURIComponent(String(user.id))}`, { method: "PATCH", body: JSON.stringify({ payment_phone: data.phone, status: "payment_submitted" }) });
    await db("admin_notifications", { method: "POST", body: JSON.stringify({ type: "payment", user_id: user.id, title: "Malipo mapya", message: `${user.name} ametuma uthibitisho wa malipo kwa ${data.phone}.`, read: false }) });
    return { ok: true as const, message: "Taarifa ya malipo imetumwa kwa admin. Subiri akaunti i-activate." };
  });

const adminSchema = z.object({ password: z.string().min(1) });
export const adminListUsers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const users = await db<SupabaseRow[]>("profiles?select=id,name,email,phone,status,balance,total_earned,total_withdrawn,created_at&order=created_at.desc", { method: "GET" });
    return { ok: true as const, users };
  });

const statusSchema = adminSchema.extend({ userId: z.string().uuid(), status: z.enum(["active", "inactive", "payment_submitted", "pending_payment"]) });
export const adminSetUserStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    await db(`profiles?id=eq.${encodeURIComponent(data.userId)}`, { method: "PATCH", body: JSON.stringify({ status: data.status }) });
    if (data.status === "active") {
      await db(`payment_submissions?user_id=eq.${encodeURIComponent(data.userId)}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) });
    }
    return { ok: true as const };
  });

const notificationSchema = adminSchema.extend({ id: z.string().uuid().optional(), title: z.string().trim().min(2).max(120), message: z.string().trim().min(2).max(1000), active: z.boolean().default(true) });
export const adminSaveNotification = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => notificationSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    if (data.id) {
      await db(`notifications?id=eq.${encodeURIComponent(data.id)}`, { method: "PATCH", body: JSON.stringify({ title: data.title, message: data.message, active: data.active }) });
    } else {
      await db("notifications", { method: "POST", body: JSON.stringify({ title: data.title, message: data.message, active: data.active }) });
    }
    return { ok: true as const };
  });

export const adminListNotifications = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const notifications = await db<SupabaseRow[]>("notifications?select=id,title,message,active,created_at&order=created_at.desc", { method: "GET" });
    return { ok: true as const, notifications };
  });

export const adminListRequests = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const payments = await db<SupabaseRow[]>("payment_submissions?select=id,user_id,phone,amount,status,created_at,profiles(name,email,phone)&order=created_at.desc", { method: "GET" });
    const withdrawals = await db<SupabaseRow[]>("withdrawals?select=id,user_id,amount,method,phone,status,created_at,profiles(name,email)&order=created_at.desc", { method: "GET" });
    const notifications = await db<SupabaseRow[]>("admin_notifications?select=id,type,user_id,title,message,read,created_at&order=created_at.desc&limit=100", { method: "GET" });
    return { ok: true as const, payments, withdrawals, notifications };
  });

const withdrawalSchema = tokenSchema.extend({ amount: z.number().int().min(50000), method: z.string().trim().min(2).max(40), phone: z.string().trim().regex(/^(0|255)\d{9}$/) });
export const requestWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => withdrawalSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`profiles?public_token=eq.${encodeURIComponent(data.token)}&select=id,status,balance&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || user.status !== "active") throw new Error("Akaunti yako haija-activate.");
    const balance = Number(user.balance ?? 0);
    if (data.amount > balance) throw new Error("Huna salio la kutosha.");
    await db("withdrawals", { method: "POST", body: JSON.stringify({ user_id: user.id, amount: data.amount, method: data.method, phone: data.phone, status: "pending" }) });
    await db("admin_notifications", { method: "POST", body: JSON.stringify({ type: "withdrawal", user_id: user.id, title: "Withdrawal mpya", message: `Mtumiaji ameomba TZS ${data.amount.toLocaleString()} kupitia ${data.method}.`, read: false }) });
    return { ok: true as const, message: "Ombi la withdrawal limetumwa kwa admin." };
  });

const approveSchema = adminSchema.extend({ withdrawalId: z.string().uuid(), action: z.enum(["approve", "reject"]) });
export const adminProcessWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => approveSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const rows = await db<SupabaseRow[]>(`withdrawals?id=eq.${encodeURIComponent(data.withdrawalId)}&select=id,user_id,amount,status&limit=1`, { method: "GET" });
    const withdrawal = rows[0];
    if (!withdrawal || withdrawal.status !== "pending") throw new Error("Withdrawal hii tayari imefanyiwa kazi.");
    if (data.action === "reject") {
      await db(`withdrawals?id=eq.${encodeURIComponent(data.withdrawalId)}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) });
      return { ok: true as const };
    }
    const users = await db<SupabaseRow[]>(`profiles?id=eq.${encodeURIComponent(String(withdrawal.user_id))}&select=id,balance,total_withdrawn&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || Number(user.balance ?? 0) < Number(withdrawal.amount)) throw new Error("Salio la mtumiaji halitoshi.");
    await db(`profiles?id=eq.${encodeURIComponent(String(user.id))}`, { method: "PATCH", body: JSON.stringify({ balance: Number(user.balance) - Number(withdrawal.amount), total_withdrawn: Number(user.total_withdrawn ?? 0) + Number(withdrawal.amount) }) });
    await db(`withdrawals?id=eq.${encodeURIComponent(data.withdrawalId)}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) });
    return { ok: true as const };
  });

const chatStartSchema = tokenSchema.extend({ foreigner: z.string().min(1).max(120), price: z.number().int().min(1).max(500000) });
export const startChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatStartSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`profiles?public_token=eq.${encodeURIComponent(data.token)}&select=id,status&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || user.status !== "active") throw new Error("Akaunti yako haija-activate.");
    const rows = await db<SupabaseRow[]>("chat_sessions", { method: "POST", body: JSON.stringify({ user_id: user.id, foreigner: data.foreigner, price: data.price, message_count: 0, completed: false }) });
    const chat = rows[0];
    if (!chat) throw new Error("Chat haijaanza.");
    return { ok: true as const, chatId: String(chat.id) };
  });

const messageSchema = tokenSchema.extend({ chatId: z.string().uuid(), text: z.string().trim().min(1).max(500) });
export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => messageSchema.parse(data))
  .handler(async ({ data }) => {
    const chats = await db<SupabaseRow[]>(`chat_sessions?id=eq.${encodeURIComponent(data.chatId)}&select=id,user_id,foreigner,price,message_count,completed&limit=1`, { method: "GET" });
    const chat = chats[0];
    if (!chat) throw new Error("Chat haipatikani.");
    const users = await db<SupabaseRow[]>(`profiles?public_token=eq.${encodeURIComponent(data.token)}&select=id,status&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || String(user.id) !== String(chat.user_id) || user.status !== "active") throw new Error("Hauruhusiwi kwenye chat hii.");
    if (chat.completed) return { ok: true as const, reply: "Chat hii imekamilika. Chagua mtu mwingine kuanza chat mpya.", completed: true, credited: 0 };
    await db("chat_messages", { method: "POST", body: JSON.stringify({ chat_id: chat.id, sender: "user", text: data.text }) });
    const count = Number(chat.message_count ?? 0) + 1;
    const replies = [
      "Asante 😊 Endelea kunifundisha Kiswahili.",
      "Hilo nimeelewa! Unaweza kunipa mfano mwingine?",
      "Napenda sana Kiswahili cha Tanzania 🇹🇿",
      "Sawa kabisa. Niambie zaidi kuhusu hilo.",
    ];
    const reply = replies[(count - 1) % replies.length] ?? replies[0];
    await db("chat_messages", { method: "POST", body: JSON.stringify({ chat_id: chat.id, sender: "foreigner", text: reply }) });
    if (count >= 10) {
      const users2 = await db<SupabaseRow[]>(`profiles?id=eq.${encodeURIComponent(String(user.id))}&select=id,balance,total_earned&limit=1`, { method: "GET" });
      const fresh = users2[0];
      const price = Number(chat.price);
      await db(`profiles?id=eq.${encodeURIComponent(String(user.id))}`, { method: "PATCH", body: JSON.stringify({ balance: Number(fresh?.balance ?? 0) + price, total_earned: Number(fresh?.total_earned ?? 0) + price }) });
      await db(`chat_sessions?id=eq.${encodeURIComponent(String(chat.id))}`, { method: "PATCH", body: JSON.stringify({ message_count: count, completed: true, completed_at: new Date().toISOString() }) });
      return { ok: true as const, reply, completed: true, credited: price };
    }
    await db(`chat_sessions?id=eq.${encodeURIComponent(String(chat.id))}`, { method: "PATCH", body: JSON.stringify({ message_count: count }) });
    return { ok: true as const, reply, completed: false, credited: 0 };
  });
