import Stripe from "stripe";
import crypto from "crypto";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const downloadSecret = process.env.DOWNLOAD_SECRET || "dev-secret-change-me";
const downloadBase = process.env.DOWNLOAD_BASE || "https://www.datlawnguy.de/api/download";
const resendKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

function createSignedDownloadLink(email = "") {
  const issuedAt = Date.now();
  const payload = `${issuedAt}|${String(email || "").slice(0, 120)}`;
  const sig = crypto.createHmac("sha256", downloadSecret).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${sig}`).toString("base64url");
  return `${downloadBase}?token=${token}`;
}

async function sendDownloadEmail(to, name = "", idempotencyKey = "") {
  if (!resendKey || !to) return;
  const link = createSignedDownloadLink(to);
  const safeName = name ? `, ${String(name).slice(0, 120)}` : "";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0b1a12;">
      <h2 style="margin:0 0 12px 0;">Danke für deinen Kauf${safeName}!</h2>
      <p style="margin:0 0 12px 0;">Hier ist dein Ebook-Download:</p>
      <p style="margin:0 0 16px 0;">
        <a href="${link}" style="background:#175c33;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">E-Book herunterladen (PDF)</a>
      </p>
      <p style="margin:0 0 12px 0;color:#0b1a12;"><strong>Hinweis:</strong> Du kannst diesen Download-Link jederzeit wieder verwenden. Bitte leite ihn nicht weiter.</p>
      <p style="margin:0;color:#4c5d51;">Falls der Button nicht funktioniert, nutze diesen Link: <br><a href="${link}">${link}</a></p>
    </div>
  `;

  const headers = {
    Authorization: `Bearer ${resendKey}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: resendFrom,
      to,
      subject: "DAT LAWN GUY - eBook Frühling Rasenpflege ohne Bullshit",
      html,
    }),
  });
  if (!result.ok) {
    const text = await result.text();
    throw new Error(`Resend error ${result.status}: ${text}`);
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!stripe || !webhookSecret) {
    return { statusCode: 500, body: "Webhook not configured" };
  }

  const signature = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || "";
    try {
      await sendDownloadEmail(email, name, stripeEvent.id);
      console.log("Download email sent to:", email);
    } catch (err) {
      console.error("Failed to send download email:", err.message);
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ received: true }),
  };
};
