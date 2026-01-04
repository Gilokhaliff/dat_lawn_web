import Stripe from "stripe";
import crypto from "crypto";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const downloadUrl = process.env.EBOOK_DOWNLOAD_URL || "https://www.datlawnguy.de/ebooks/eBook1.pdf";
const downloadSecret = process.env.DOWNLOAD_SECRET || "dev-secret-change-me";
const downloadBase = process.env.DOWNLOAD_BASE || "https://www.datlawnguy.de/api/download";
const resendKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function createSignedDownloadLink(email = "") {
  const expires = Date.now() + 1000 * 60 * 60 * 24; // 24h
  const payload = `${expires}|${toStringSafe(email)}`;
  const sig = crypto.createHmac("sha256", downloadSecret).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${sig}`).toString("base64url");
  return `${downloadBase}?token=${token}`;
}

async function sendDownloadEmail(to, name = "") {
  if (!resendKey || !to) return;
  const link = createSignedDownloadLink(to);
  const safeName = name ? `, ${toStringSafe(name)}` : "";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0b1a12;">
      <h2 style="margin:0 0 12px 0;">Danke für deinen Kauf${safeName}!</h2>
      <p style="margin:0 0 12px 0;">Hier ist dein Ebook-Download:</p>
      <p style="margin:0 0 16px 0;">
        <a href="${link}" style="background:#175c33;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">E-Book herunterladen (PDF)</a>
      </p>
      <p style="margin:0;color:#4c5d51;">Falls der Button nicht funktioniert, nutze diesen Link: <br><a href="${link}">${link}</a></p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to,
      subject: "DAT LAWN GUY - eBook Frühling Rasenpflege ohne Bullshit",
      html,
    }),
  });
}

function toStringSafe(val) {
  try {
    return String(val || "").slice(0, 120);
  } catch (e) {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  if (!stripe || !webhookSecret) {
    return res.status(500).end("Webhook not configured");
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).end(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || "";
    try {
      await sendDownloadEmail(email, name);
    } catch (err) {
      console.error("Failed to send download email:", err.message);
    }
  }

  res.status(200).json({ received: true });
}
