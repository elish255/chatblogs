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

const EAST_AFRICA_COUNTRIES = [
  "Burundi",
  "Democratic Republic of the Congo",
  "Kenya",
  "Rwanda",
  "Somalia",
  "South Sudan",
  "Tanzania",
  "Uganda",
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
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    key,
    256,
  );
  const toHex = (value: Uint8Array) => Array.from(value, (b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2-sha256$120000$${toHex(salt)}$${toHex(new Uint8Array(bits))}`;
}


async function authAdmin<T = SupabaseRow>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Auth error ${res.status}`);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function findSupabaseAuthUserByEmail(email: string) {
  try {
    const result = await authAdmin<{ users?: Array<{ id: string; email?: string | null }> }>(
      "admin/users?per_page=1000&page=1",
      { method: "GET" },
    );
    return (result.users ?? []).find((u) => String(u.email ?? "").toLowerCase() === email.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

async function createOrRecoverSupabaseAuthUser(email: string, password: string) {
  try {
    return {
      user: await authAdmin<{ id: string }>("admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, email_confirm: true }),
      }),
      created: true,
    };
  } catch (error) {
    const existing = await findSupabaseAuthUserByEmail(email);
    if (!existing) throw error;

    // This is normally an orphaned Auth user left by an interrupted registration.
    // A real profile is checked before this function is called, so we only recover
    // an Auth record that does not yet belong to a ChatBlog/Chatpesa profile.
    const updated = await authAdmin<{ id: string }>(`admin/users/${encodeURIComponent(existing.id)}`, {
      method: "PUT",
      body: JSON.stringify({ password, email_confirm: true }),
    });
    return { user: updated, created: false };
  }
}

async function deleteSupabaseAuthUser(id: string) {
  try {
    await authAdmin(`admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {
    // Best-effort cleanup only. Never hide the original registration error.
  }
}

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const token = crypto.randomUUID() + crypto.randomUUID();
    const passwordHash = await hashPassword(data.password);
    const existing = await db<SupabaseRow[]>(
      `chatblog_account_details?username=eq.${encodeURIComponent(data.username)}&select=id&limit=1`,
      { method: "GET" },
    );
    if (existing[0]) throw new Error("Username hiyo tayari inatumika.");

    const normalizedEmail = data.email.toLowerCase();
    const existingEmail = await db<SupabaseRow[]>(
      `profiles?email=eq.${encodeURIComponent(normalizedEmail)}&select=id,name,email,phone,status,balance,total_earned,total_withdrawn,bonus,created_at&limit=1`,
      { method: "GET" },
    );

    // ChatBlog shares the same Supabase database with Chatpesa. An email can therefore
    // already have a profiles row even when it has never completed ChatBlog registration.
    // In that case, reuse the existing Auth/profile identity instead of treating it as
    // a duplicate registration or trying to insert a second profiles row.
    let authUser: { id: string };
    let user: SupabaseRow | undefined;
    let authCreated = false;

    if (existingEmail[0]?.id) {
      authUser = { id: String(existingEmail[0].id) };
      user = existingEmail[0];

      // Make sure the Auth record exists. If it does, update its password so the
      // credentials entered on this ChatBlog registration remain usable.
      const authByEmail = await findSupabaseAuthUserByEmail(normalizedEmail);
      if (authByEmail) {
        // The profiles FK must point to this same Auth user. If the shared database
        // contains inconsistent legacy data, do not silently attach the wrong account.
        if (authByEmail.id !== String(existingEmail[0].id)) {
          throw new Error("Email hii ina records zinazokinzana kwenye akaunti ya zamani. Tafadhali tumia email nyingine au safisha record hiyo ya zamani.");
        }
        authUser = { id: authByEmail.id };
        try {
          await authAdmin(`admin/users/${encodeURIComponent(authByEmail.id)}`, {
            method: "PUT",
            body: JSON.stringify({ password: data.password, email_confirm: true }),
          });
        } catch {
          // The legacy PBKDF2 login below still works even if Auth password update fails.
        }
      }

      // Existing shared profiles may not have a ChatBlog token yet. Give them one
      // without overwriting an existing token used by another part of the system.
      if (!user.public_token) {
        await db(`profiles?id=eq.${encodeURIComponent(String(user.id))}`, {
          method: "PATCH",
          body: JSON.stringify({ public_token: token }),
        });
        user = { ...user, public_token: token };
      } else {
        token = String(user.public_token);
      }
    } else {
      // profiles.id is linked to auth.users.id in the shared Supabase database.
      // Therefore Auth must be created first; a random UUID cannot satisfy the FK.
      try {
        const result = await createOrRecoverSupabaseAuthUser(normalizedEmail, data.password);
        authUser = result.user;
        authCreated = result.created;
      } catch (error) {
        const raw = error instanceof Error ? error.message : String(error);
        if (/already|registered|exists|duplicate/i.test(raw)) {
          throw new Error("Email hiyo tayari inatumika. Inaonekana kuna akaunti ya zamani kwenye mfumo.");
        }
        throw new Error(`Usajili wa akaunti umeshindikana: ${raw}`);
      }

      const rows = await db<SupabaseRow[]>("profiles", {
        method: "POST",
        body: JSON.stringify({
          id: authUser.id,
          name: data.name,
          email: normalizedEmail,
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
      user = rows[0];
      if (!user) {
        if (authCreated) await deleteSupabaseAuthUser(authUser.id);
        throw new Error("Usajili haujahifadhiwa.");
      }
    }

    // Do not create a second ChatBlog account-details row for the same user.
    // If one already exists, keep the existing username and credentials.
    const existingDetails = await db<SupabaseRow[]>(
      `chatblog_account_details?user_id=eq.${encodeURIComponent(String(user.id))}&select=id,username,email,country,password_hash&limit=1`,
      { method: "GET" },
    );
    if (existingDetails[0]) {
      throw new Error("Akaunti hii tayari ina usajili wa ChatBlog. Tumia Login.");
    }

    try {
      await db("chatblog_account_details", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          username: data.username,
          email: normalizedEmail,
          country: data.country,
          password_hash: passwordHash,
        }),
      });
    } catch (error) {
      // Only clean up records created by this registration attempt. Never delete a
      // pre-existing shared Chatpesa profile.
      if (authCreated) {
        await db(`profiles?id=eq.${encodeURIComponent(String(user.id))}`, { method: "DELETE" });
        await deleteSupabaseAuthUser(authUser.id);
      }
      throw error;
    }

    return { ok: true as const, token, user };
  });

const loginSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_]+$/),
  password: z.string().min(8).max(128),
});

async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationsRaw, saltHex, hashHex] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationsRaw || !saltHex || !hashHex) return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const fromHex = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? []);
  const salt = fromHex(saltHex);
  const expected = fromHex(hashHex);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, expected.length * 8);
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const details = await db<SupabaseRow[]>(`chatblog_account_details?username=eq.${encodeURIComponent(data.username)}&select=user_id,username,email,password_hash,country&limit=1`, { method: "GET" });
    const account = details[0];
    if (!account || !(await verifyPassword(data.password, String(account.password_hash ?? "")))) {
      throw new Error("Username au password si sahihi.");
    }
    const users = await db<SupabaseRow[]>(`profiles?id=eq.${encodeURIComponent(String(account.user_id))}&select=id,name,email,phone,status,public_token,balance,total_earned,total_withdrawn,bonus,created_at&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user) throw new Error("Akaunti haipatikani.");
    return { ok: true as const, token: String(user.public_token), status: String(user.status), user: { ...user, username: account.username, email: account.email, country: account.country } };
  });

const tokenSchema = z.object({ token: z.string().min(20).max(100) });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const users = await db<SupabaseRow[]>(`profiles?public_token=eq.${encodeURIComponent(data.token)}&select=${USER_SELECT}&limit=1`, { method: "GET" });
    const user = users[0];
    if (!user) return { ok: false as const, message: "Akaunti haipatikani." };
    const details = await db<SupabaseRow[]>(`chatblog_account_details?user_id=eq.${encodeURIComponent(String(user.id))}&select=username,email,country&limit=1`, { method: "GET" });
    const account = details[0] ?? {};
    const userWithAccount = { ...user, username: account.username ?? "", email: account.email ?? "", country: account.country ?? "" };
    const notes = await db<SupabaseRow[]>("notifications?active=eq.true&order=created_at.desc&limit=1&select=id,title,message,created_at", { method: "GET" });
    if (user.status !== "active") {
      return { ok: true as const, active: false as const, status: user.status, user: userWithAccount, notification: notes[0] ?? null };
    }
    return { ok: true as const, active: true as const, status: user.status, user: userWithAccount, notification: notes[0] ?? null };
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
    const payments = await db<SupabaseRow[]>("payment_submissions?select=id,user_id,phone,amount,status,created_at,profiles(name,phone)&order=created_at.desc", { method: "GET" });
    const withdrawals = await db<SupabaseRow[]>("withdrawals?select=id,user_id,amount,method,phone,status,created_at,profiles(name)&order=created_at.desc", { method: "GET" });
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
