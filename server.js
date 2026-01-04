import http from "http";
import { readFile, stat, writeFile } from "fs/promises";
import path from "path";
import url from "url";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config({ path: ".env.local" });

const PORT = process.env.PORT || 3000;
const root = process.cwd();
const successUrl = process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/success";
const cancelUrl = process.env.STRIPE_CANCEL_URL || "http://localhost:3000/cancel";
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const reviewsFile = path.join(root, "reviews.json");
const purchasesFile = path.join(root, "purchases.json");
const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
const resendKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";
const downloadUrl = process.env.EBOOK_DOWNLOAD_URL || "https://www.datlawnguy.de/ebooks/eBook1.pdf";
let memoryReviews = [];
let memoryPurchases = [];

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function readReviews() {
  // Prefer Upstash KV if configured
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/reviews`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      if (!res.ok) throw new Error(`KV get failed: ${res.status}`);
      const data = await res.json();
      if (data && typeof data.result === "string") {
        const parsed = JSON.parse(data.result);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (err) {
      console.warn("KV read failed, falling back to file:", err.message);
    }
  }
  // Fallback to file
  try {
    const data = await readFile(reviewsFile, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    console.warn("File read failed, falling back to memory:", err.message);
  }
  return memoryReviews;
}

async function writeReviews(list) {
  const safe = Array.isArray(list) ? list.slice(-200) : [];
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/set/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kvToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: JSON.stringify(safe) }),
      });
      if (!res.ok) throw new Error(`KV set failed: ${res.status}`);
      return;
    } catch (err) {
      console.warn("KV write failed, falling back to file/memory:", err.message);
    }
  }
  try {
    await writeFile(reviewsFile, JSON.stringify(safe, null, 2), "utf-8");
  } catch (err) {
    console.warn("File write failed, storing in memory only:", err.message);
    memoryReviews = safe;
  }
}

async function readPurchases() {
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/purchases`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      if (!res.ok) throw new Error(`KV purchases get failed: ${res.status}`);
      const data = await res.json();
      if (data && typeof data.result === "string") {
        const parsed = JSON.parse(data.result);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn("KV purchases read failed, falling back:", err.message);
    }
  }
  try {
    const data = await readFile(purchasesFile, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn("Purchases file read failed, falling back to memory:", err.message);
    }
  }
  return memoryPurchases;
}

async function writePurchases(list) {
  const safe = Array.isArray(list) ? list.slice(-500) : [];
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/set/purchases`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kvToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: JSON.stringify(safe) }),
      });
      if (!res.ok) throw new Error(`KV purchases set failed: ${res.status}`);
      return;
    } catch (err) {
      console.warn("KV purchases write failed, falling back:", err.message);
    }
  }
  try {
    await writeFile(purchasesFile, JSON.stringify(safe, null, 2), "utf-8");
  } catch (err) {
    console.warn("Purchases file write failed, storing memory only:", err.message);
    memoryPurchases = safe;
  }
}

async function sendDownloadEmail(to, name = "there") {
  if (!resendKey || !to) return;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0b1a12;">
      <h2 style="margin:0 0 12px 0;">Danke für deinen Kauf${name ? `, ${escapeHtml(name)}` : ""}!</h2>
      <p style="margin:0 0 12px 0;">Hier ist dein Ebook-Download:</p>
      <p style="margin:0 0 16px 0;">
        <a href="${downloadUrl}" style="background:#175c33;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">E-Book herunterladen (PDF)</a>
      </p>
      <p style="margin:0;color:#4c5d51;">Falls der Button nicht funktioniert, nutze diesen Link: <br><a href="${downloadUrl}">${downloadUrl}</a></p>
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

async function serveFile(res, filePath) {
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    const type = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    } else {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server error");
    }
  }
}

async function handleCheckout(req, res) {
  if (!stripe || !process.env.STRIPE_PRICE_ID) {
    return sendJson(res, 500, { error: "Stripe not configured" });
  }
  try {
    const body = await readBody(req);
    const priceId = body.priceId || process.env.STRIPE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_creation: "always",
      phone_number_collection: { enabled: true },
      metadata: { item: "ebook", priceId },
    });
    return sendJson(res, 200, { url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    return sendJson(res, 500, { error: "Unable to create checkout session" });
  }
}

async function handleReviews(req, res) {
  if (req.method === "GET") {
    try {
      const reviews = await readReviews();
      return sendJson(res, 200, { reviews });
    } catch (err) {
      console.error("Read reviews failed:", err.message);
      return sendJson(res, 500, { reviews: [] });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await readBody(req);
      const cleanName = (body.name || "").toString().trim().slice(0, 80) || "Guest";
      const cleanText = (body.comment || body.text || "").toString().trim().slice(0, 800);
      const cleanRating = Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0)));
      if (!cleanText) return sendJson(res, 400, { error: "Comment required" });
      const existing = await readReviews();
      const review = {
        name: cleanName,
        text: cleanText,
        createdAt: Date.now(),
        rating: cleanRating,
      };
      const updated = [review, ...existing].slice(0, 200);
      await writeReviews(updated);
      return sendJson(res, 200, { review });
    } catch (err) {
      console.error("Write review failed:", err.message);
      return sendJson(res, 500, { error: "Unable to save review", detail: err.message });
    }
  }

  return sendJson(res, 405, { error: "Method not allowed" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function handleWebhook(req, res) {
  if (!stripe || !webhookSecret) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    return res.end("Webhook not configured");
  }
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    const rawBody = Buffer.concat(chunks);
    const signature = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Checkout complete for:", session.customer_details?.email || "unknown email");
      // Persist purchaser snapshot
      try {
        const existing = await readPurchases();
        const record = {
          id: session.id,
          customer: {
            name: session.customer_details?.name || "",
            email: session.customer_details?.email || "",
            phone: session.customer_details?.phone || "",
          },
          amount_total: session.amount_total,
          currency: session.currency,
          priceId: session.metadata?.priceId || "",
          created: Date.now(),
        };
        const deduped = existing.filter((p) => p.id !== record.id);
        await writePurchases([record, ...deduped]);
      } catch (err) {
        console.warn("Failed to store purchase:", err.message);
      }
      // TODO: Trigger email with signed download link here.
      try {
        if (session.customer_details?.email && resendKey) {
          await sendDownloadEmail(session.customer_details.email, session.customer_details.name || "there");
        }
      } catch (err) {
        console.warn("Failed to send download email:", err.message);
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true }));
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || "/");

  if (req.method === "POST" && pathname === "/api/checkout") {
    return handleCheckout(req, res);
  }
  if (req.method === "POST" && pathname === "/api/stripe-webhook") {
    return handleWebhook(req, res);
  }
  if ((req.method === "GET" || req.method === "POST") && pathname === "/api/reviews") {
    return handleReviews(req, res);
  }
  if (req.method === "GET" && pathname === "/api/purchases") {
    try {
      const purchases = await readPurchases();
      return sendJson(res, 200, { purchases });
    } catch (err) {
      console.warn("Purchases fetch failed:", err.message);
      return sendJson(res, 500, { purchases: [] });
    }
  }

  if (pathname === "/") pathname = "/index.html";
  let filePath = path.join(root, pathname);

  // If path has no extension, try adding .html
  if (!path.extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    try {
      const htmlStat = await stat(htmlPath);
      if (htmlStat.isFile()) {
        filePath = htmlPath;
      }
    } catch (e) {
      // ignore
    }
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      await serveFile(res, path.join(filePath, "index.html"));
    } else {
      await serveFile(res, filePath);
    }
  } catch {
    // fallback to index.html for any missing route
    await serveFile(res, path.join(root, "index.html"));
  }
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});
