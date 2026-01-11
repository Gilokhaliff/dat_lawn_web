const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;

function send(res, status, payload) {
  res.status(status).json(payload);
}

async function readReviews() {
  if (!kvUrl || !kvToken) return [];
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
}

async function writeReviews(list) {
  if (!kvUrl || !kvToken) return;
  const safe = Array.isArray(list) ? list.slice(-200) : [];
  const res = await fetch(`${kvUrl}/set/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value: JSON.stringify(safe) }),
  });
  if (!res.ok) throw new Error(`KV set failed: ${res.status}`);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const reviews = await readReviews();
      return send(res, 200, { reviews });
    } catch (err) {
      return send(res, 500, { reviews: [] });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const cleanName = (body.name || "").toString().trim().slice(0, 80) || "Guest";
      const cleanText = (body.comment || body.text || "").toString().trim().slice(0, 800);
      const cleanRating = Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0)));
      const rawImage = (body.imageUrl || "").toString().trim();
      const cleanImage = /^https?:\/\//i.test(rawImage) ? rawImage.slice(0, 500) : "";
      if (!cleanText) return send(res, 400, { error: "Comment required" });
      const existing = await readReviews();
      const review = {
        name: cleanName,
        text: cleanText,
        createdAt: Date.now(),
        rating: cleanRating,
        imageUrl: cleanImage,
      };
      const updated = [review, ...existing].slice(0, 200);
      await writeReviews(updated);
      return send(res, 200, { review });
    } catch (err) {
      return send(res, 500, { error: "Unable to save review" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
