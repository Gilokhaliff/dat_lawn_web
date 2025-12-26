import http from "http";
import { readFile, stat } from "fs/promises";
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
