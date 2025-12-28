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
const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;

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
    throw err;
  }
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
      console.warn("KV write failed, falling back to file:", err.message);
    }
  }
  await writeFile(reviewsFile, JSON.stringify(safe, null, 2), "utf-8");
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
      return sendJson(res, 500, { error: "Unable to save review" });
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
      // TODO: Trigger email with signed download link here.
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
