import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const USER_SELECT = "id,name,username,email,phone,country,status,role,balance,total_earned,total_withdrawn,bonus,public_token,created_at";
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

const EAST_AFRICA_COUNTRIES = [
  "Burundi", "Democratic Republic of the Congo", "Kenya", "Rwanda",
  "Somalia", "South Sudan", "Tanzania", "Uganda",
] as const;

const registerSchema = z.object({
  name: z.string().trim().min(3).max(80),
  username: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_]+$/),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().regex(/^(0|255)\d{9}$/),
  country: z.enum(EAST_AFRICA_COUNTRIES),
  password: z.string().min(8).max(128),
  partner: z.string().trim().max(120).optional().default(""),
});

async function hashPassword(password: string) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
  const toHex = (value: Uint8Array) => Array.from(value, (b) => b.toString(16).padStart(2, "0")).join("");
  return { hash: toHex(new Uint8Array(bits)), salt: toHex(salt) };
}

async function verifyPassword(password: string, storedHash: string, storedSalt: string) {
  const fromHex = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? []);
  const salt = fromHex(storedSalt);
  const expected = fromHex(storedHash);
  if (!salt.length || !expected.length) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, expected.length * 8);
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

function normalizePhone(phone: string) {
  return phone.startsWith("255") ? `0${phone.slice(3)}` : phone;
}

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.toLowerCase();
    const username = data.username.toLowerCase();
    const phone = normalizePhone(data.phone);

    const duplicate = await db<SupabaseRow[]>(
      `chatblog_users?or=(email.ilike.${encodeURIComponent(normalizedEmail)},username.ilike.${encodeURIComponent(username)},phone.eq.${encodeURIComponent(phone)})&select=id,username,email,phone&limit=1`,
      { method: "GET" },
    );
    if (duplicate[0]) {
      const row = duplicate[0];
      if (String(row.username ?? "").toLowerCase() === username) throw new Error("Username hiyo tayari inatumika.");
      if (String(row.email ?? "").toLowerCase() === normalizedEmail) throw new Error("Email hiyo tayari imesajiliwa.");
      throw new Error("Namba hiyo ya simu tayari imesajiliwa.");
    }

    const { hash, salt } = await hashPassword(data.password);
    const token = crypto.randomUUID() + crypto.randomUUID();
    const rows = await db<SupabaseRow[]>("chatblog_users", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        username: data.username,
        email: normalizedEmail,
        phone,
        country: data.country,
        password_hash: hash,
        password_salt: salt,
        status: "pending",
        role: "user",
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        bonus: 0,
        public_token: token,
      }),
    });
    const user = rows[0];
    if (!user) throw new Error("Usajili haujahifadhiwa.");
    return { ok: true as const, token, user };
  });

const loginSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_]+$/),
  password: z.string().min(8).max(128),
});

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const rows = await db<SupabaseRow[]>(`chatblog_users?username=ilike.${encodeURIComponent(data.username)}&select=${USER_SELECT},password_hash,password_salt&limit=1`, { method: "GET" });
    const user = rows[0];
    if (!user || !(await verifyPassword(data.password, String(user.password_hash ?? ""), String(user.password_salt ?? "")))) {
      throw new Error("Username au password si sahihi.");
    }
    return { ok: true as const, token: String(user.public_token), status: String(user.status), user };
  });

const tokenSchema = z.object({ token: z.string().min(20).max(100) });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`chatblog_users?public_token=eq.${encodeURIComponent(data.token)}&select=${USER_SELECT}&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user) return { ok: false as const, message: "Akaunti haipatikani." };
    const notes = await db<SupabaseRow[]>("chatblog_notifications?active=eq.true&order=created_at.desc&limit=1&select=id,title,message,created_at", { method: "GET" });
    return { ok: true as const, active: user.status === "active", status: user.status, user, notification: notes[0] ?? null };
  });

const paymentSchema = z.object({ token: tokenSchema.shape.token, phone: z.string().trim().regex(/^(0|255)\d{9}$/) });
export const submitPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`chatblog_users?public_token=eq.${encodeURIComponent(data.token)}&select=id,name,email,status&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user) throw new Error("Akaunti haipatikani.");
    await db("chatblog_activation_payments", { method: "POST", body: JSON.stringify({ user_id: user.id, method: "lipa_namba", amount: 14500, phone: normalizePhone(data.phone), status: "pending", metadata: { source: "chatblog" } }) });
    await db(`chatblog_users?id=eq.${encodeURIComponent(String(user.id))}`, { method: "PATCH", body: JSON.stringify({ status: "pending" }) });
    await db("chatblog_admin_notifications", { method: "POST", body: JSON.stringify({ type: "payment", user_id: user.id, title: "Malipo mapya", message: `${user.name} ametuma uthibitisho wa malipo kwa ${data.phone}.`, read: false }) });
    return { ok: true as const, message: "Taarifa ya malipo imetumwa kwa admin. Subiri akaunti i-activate." };
  });


export const submitAutomaticPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`chatblog_users?public_token=eq.${encodeURIComponent(data.token)}&select=id,name,email,status&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user) throw new Error("Akaunti haipatikani.");
    await db("chatblog_activation_payments", { method: "POST", body: JSON.stringify({ user_id: user.id, method: "fimipay", amount: 14500, phone: normalizePhone(data.phone), status: "pending", metadata: { source: "chatblog", channel: "automatic" } }) });
    await db(`chatblog_users?id=eq.${encodeURIComponent(String(user.id))}`, { method: "PATCH", body: JSON.stringify({ status: "pending" }) });
    await db("chatblog_admin_notifications", { method: "POST", body: JSON.stringify({ type: "payment", user_id: user.id, title: "Malipo mapya", message: `${user.name} amekamilisha malipo ya moja kwa moja kwa ${data.phone}.`, read: false }) });
    return { ok: true as const, message: "Malipo yamepokelewa. Subiri account i-activate." };
  });

const adminSchema = z.object({ password: z.string().min(1) });
export const adminListUsers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const users = await db<SupabaseRow[]>(`chatblog_users?select=${USER_SELECT}&order=created_at.desc`, { method: "GET" });
    return { ok: true as const, users };
  });

const statusSchema = adminSchema.extend({ userId: z.string().uuid(), status: z.enum(["active", "pending", "rejected"]) });
export const adminSetUserStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    await db(`chatblog_users?id=eq.${encodeURIComponent(data.userId)}`, { method: "PATCH", body: JSON.stringify({ status: data.status, ...(data.status === "active" ? { activated_at: new Date().toISOString() } : {}) }) });
    if (data.status === "active") await db(`chatblog_activation_payments?user_id=eq.${encodeURIComponent(data.userId)}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "approved", confirmed_at: new Date().toISOString() }) });
    return { ok: true as const };
  });

const notificationSchema = adminSchema.extend({ id: z.string().uuid().optional(), title: z.string().trim().min(2).max(120), message: z.string().trim().min(2).max(1000), active: z.boolean().default(true) });
export const adminSaveNotification = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => notificationSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    if (data.id) await db(`chatblog_notifications?id=eq.${encodeURIComponent(data.id)}`, { method: "PATCH", body: JSON.stringify({ title: data.title, message: data.message, active: data.active }) });
    else await db("chatblog_notifications", { method: "POST", body: JSON.stringify({ title: data.title, message: data.message, active: data.active }) });
    return { ok: true as const };
  });

export const adminListNotifications = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const notifications = await db<SupabaseRow[]>("chatblog_notifications?select=id,title,message,active,created_at&order=created_at.desc", { method: "GET" });
    return { ok: true as const, notifications };
  });

export const adminListRequests = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const payments = await db<SupabaseRow[]>("chatblog_activation_payments?select=id,user_id,phone,amount,method,status,created_at&order=created_at.desc", { method: "GET" });
    const withdrawals = await db<SupabaseRow[]>("chatblog_withdrawals?select=id,user_id,amount,method,account_number,status,created_at&order=created_at.desc", { method: "GET" });
    const notifications = await db<SupabaseRow[]>("chatblog_admin_notifications?select=id,type,user_id,title,message,read,created_at&order=created_at.desc&limit=100", { method: "GET" });
    return { ok: true as const, payments, withdrawals, notifications };
  });

const withdrawalSchema = tokenSchema.extend({ amount: z.number().int().min(50000), method: z.string().trim().min(2).max(40), phone: z.string().trim().regex(/^(0|255)\d{9}$/) });
export const requestWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => withdrawalSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`chatblog_users?public_token=eq.${encodeURIComponent(data.token)}&select=id,status,balance&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || user.status !== "active") throw new Error("Akaunti yako haija-activate.");
    if (data.amount > Number(user.balance ?? 0)) throw new Error("Huna salio la kutosha.");
    await db("chatblog_withdrawals", { method: "POST", body: JSON.stringify({ user_id: user.id, amount: data.amount, method: data.method, account_number: normalizePhone(data.phone), status: "pending" }) });
    await db("chatblog_admin_notifications", { method: "POST", body: JSON.stringify({ type: "withdrawal", user_id: user.id, title: "Withdrawal mpya", message: `Mtumiaji ameomba TZS ${data.amount.toLocaleString()} kupitia ${data.method}.`, read: false }) });
    return { ok: true as const, message: "Ombi la withdrawal limetumwa kwa admin." };
  });

const approveSchema = adminSchema.extend({ withdrawalId: z.string().uuid(), action: z.enum(["approve", "reject"]) });
export const adminProcessWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => approveSchema.parse(data))
  .handler(async ({ data }) => {
    admin(data.password);
    const rows = await db<SupabaseRow[]>(`chatblog_withdrawals?id=eq.${encodeURIComponent(data.withdrawalId)}&select=id,user_id,amount,status&limit=1`, { method: "GET" });
    const withdrawal = rows[0];
    if (!withdrawal || withdrawal.status !== "pending") throw new Error("Withdrawal hii tayari imefanyiwa kazi.");
    if (data.action === "reject") {
      await db(`chatblog_withdrawals?id=eq.${encodeURIComponent(data.withdrawalId)}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", reviewed_at: new Date().toISOString() }) });
      return { ok: true as const };
    }
    const users = await db<SupabaseRow[]>(`chatblog_users?id=eq.${encodeURIComponent(String(withdrawal.user_id))}&select=id,balance,total_withdrawn&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || Number(user.balance ?? 0) < Number(withdrawal.amount)) throw new Error("Salio la mtumiaji halitoshi.");
    await db(`chatblog_users?id=eq.${encodeURIComponent(String(user.id))}`, { method: "PATCH", body: JSON.stringify({ balance: Number(user.balance) - Number(withdrawal.amount), total_withdrawn: Number(user.total_withdrawn ?? 0) + Number(withdrawal.amount) }) });
    await db(`chatblog_withdrawals?id=eq.${encodeURIComponent(data.withdrawalId)}`, { method: "PATCH", body: JSON.stringify({ status: "approved", reviewed_at: new Date().toISOString() }) });
    return { ok: true as const };
  });

const chatStartSchema = tokenSchema.extend({ foreigner: z.string().min(1).max(120), price: z.number().int().min(1).max(500000) });
export const startChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatStartSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`chatblog_users?public_token=eq.${encodeURIComponent(data.token)}&select=id,status&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || user.status !== "active") throw new Error("Akaunti yako haija-activate.");
    const sessionId = crypto.randomUUID();
    const rows = await db<SupabaseRow[]>("chatblog_chat_sessions?select=id,session_id", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        user_id: user.id,
        person_name: data.foreigner,
        payout: data.price,
        message_count: 0,
        status: "open",
      }),
    });
    const chat = Array.isArray(rows) ? rows[0] : undefined;
    if (!chat?.id) throw new Error("Chat haijaanza. Hakikisha SQL ya chatblog_chat_sessions ime-run kwenye Supabase.");
    return { ok: true as const, chatId: String(chat.id), sessionId: String(chat.session_id ?? sessionId) };
  });

const messageSchema = tokenSchema.extend({ chatId: z.string().uuid(), text: z.string().trim().min(1).max(500) });
export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => messageSchema.parse(data))
  .handler(async ({ data }) => {
    const chats = await db<SupabaseRow[]>(`chatblog_chat_sessions?id=eq.${encodeURIComponent(data.chatId)}&select=id,user_id,person_name,payout,message_count,status&limit=1`, { method: "GET" });
    const chat = chats[0];
    if (!chat) throw new Error("Chat haipatikani.");
    const users = await db<SupabaseRow[]>(`chatblog_users?public_token=eq.${encodeURIComponent(data.token)}&select=id,status&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user || String(user.id) !== String(chat.user_id) || user.status !== "active") throw new Error("Hauruhusiwi kwenye chat hii.");
    if (chat.status === "completed" || chat.status === "closed") return { ok: true as const, reply: "Chat hii imekamilika. Chagua mtu mwingine kuanza chat mpya.", completed: true, credited: 0 };
    await db("chatblog_chat_messages", { method: "POST", body: JSON.stringify({ chat_id: chat.id, sender: "user", text: data.text }) });
    const count = Number(chat.message_count ?? 0) + 1;
    const replies = ["Asante 😊 Endelea kunifundisha Kiswahili.", "Hilo nimeelewa! Unaweza kunipa mfano mwingine?", "Napenda sana Kiswahili cha Tanzania 🇹🇿", "Sawa kabisa. Niambie zaidi kuhusu hilo."];
    const reply = replies[(count - 1) % replies.length] ?? replies[0];
    await db("chatblog_chat_messages", { method: "POST", body: JSON.stringify({ chat_id: chat.id, sender: "foreigner", text: reply }) });
    if (count >= 10) {
      const freshRows = await db<SupabaseRow[]>(`chatblog_users?id=eq.${encodeURIComponent(String(user.id))}&select=id,balance,total_earned&limit=1`, { method: "GET" });
      const fresh = freshRows[0];
      const price = Number(chat.payout);
      await db(`chatblog_users?id=eq.${encodeURIComponent(String(user.id))}`, { method: "PATCH", body: JSON.stringify({ balance: Number(fresh?.balance ?? 0) + price, total_earned: Number(fresh?.total_earned ?? 0) + price }) });
      await db(`chatblog_chat_sessions?id=eq.${encodeURIComponent(String(chat.id))}`, { method: "PATCH", body: JSON.stringify({ message_count: count, status: "completed", completed_at: new Date().toISOString() }) });
      return { ok: true as const, reply, completed: true, credited: price };
    }
    await db(`chatblog_chat_sessions?id=eq.${encodeURIComponent(String(chat.id))}`, { method: "PATCH", body: JSON.stringify({ message_count: count }) });
    return { ok: true as const, reply, completed: false, credited: 0 };
  });
