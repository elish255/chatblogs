import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Fimipay server-side adapter.
 *
 * Keep credentials and API URLs on the server. The exact API URLs can be set
 * from the Fimipay dashboard/docs without exposing secrets to the browser.
 */
const orderSchema = z.object({
  buyer_name: z.string().trim().min(2).max(80),
  buyer_email: z.string().trim().email().max(120),
  buyer_phone: z.string().trim().regex(/^(0|255)\d{9}$/),
  amount: z.number().int().min(500).max(5000000),
});

function getConfig() {
  return {
    key: process.env["FIMIPAY_API_KEY"],
    createUrl: process.env["FIMIPAY_CREATE_PAYMENT_URL"],
    statusUrl: process.env["FIMIPAY_ORDER_STATUS_URL"],
  };
}

function authHeaders(key: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
    "X-API-KEY": key,
  };
}

function extractOrder(body: unknown) {
  const b = body as any;
  return {
    orderId:
      b?.data?.order_id ??
      b?.data?.orderId ??
      b?.data?.reference ??
      b?.order_id ??
      b?.orderId ??
      b?.reference ??
      "",
    message: b?.message ?? b?.data?.message ?? "Ombi la malipo limetumwa kwenye simu yako.",
    success:
      b?.success === true ||
      b?.status === "success" ||
      b?.status === "SUCCESS" ||
      b?.data?.status === "success" ||
      b?.data?.status === "SUCCESS",
  };
}

export const createPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const { key, createUrl } = getConfig();
    if (!key || !createUrl) {
      return {
        ok: false as const,
        message: "Huduma ya malipo ya moja kwa moja haijawekwa sawa kwenye server.",
      };
    }

    const payload = {
      amount: 14500,
      currency: "TZS",
      buyer_name: data.buyer_name,
      buyer_email: data.buyer_email,
      buyer_phone: data.buyer_phone,
      customer: {
        name: data.buyer_name,
        email: data.buyer_email,
        phone: data.buyer_phone,
      },
    };

    const res = await fetch(createUrl, {
      method: "POST",
      headers: authHeaders(key),
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);
    const parsed = extractOrder(body);

    if (!res.ok || !parsed.success || !parsed.orderId) {
      return {
        ok: false as const,
        message: parsed.message || "Imeshindikana kuanzisha malipo ya moja kwa moja.",
      };
    }

    return {
      ok: true as const,
      order_id: String(parsed.orderId),
      reference: String(parsed.orderId),
      message: parsed.message,
    };
  });

export const checkPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ order_id: z.string().trim().min(3).max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { key, statusUrl } = getConfig();
    if (!key || !statusUrl) return { ok: false as const, status: "UNKNOWN" };

    const separator = statusUrl.includes("?") ? "&" : "?";
    const url = `${statusUrl}${separator}order_id=${encodeURIComponent(data.order_id)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: authHeaders(key),
    });

    const body = await res.json().catch(() => null);
    const b = body as any;
    const status =
      b?.data?.payment_status ??
      b?.data?.status ??
      b?.payment_status ??
      b?.status ??
      "PENDING";

    return { ok: res.ok, status: String(status).toUpperCase() };
  });
