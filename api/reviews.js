const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
const adminToken = process.env.REVIEWS_ADMIN_TOKEN;

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

export const handler = async (event) => {
  const method = event.httpMethod;

  if (method === "GET") {
    try {
      const reviews = await readReviews();
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviews }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ reviews: [] }) };
    }
  }

  if (method === "DELETE") {
    if (!adminToken) return { statusCode: 500, body: JSON.stringify({ error: "Admin token not configured" }) };
    const provided = event.headers["x-admin-token"] || event.queryStringParameters?.token || "";
    if (!provided || provided !== adminToken) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    try {
      await writeReviews([]);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: "Unable to clear reviews" }) };
    }
  }

  if (method === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const cleanName = (body.name || "").toString().trim().slice(0, 80) || "Guest";
      const cleanText = (body.comment || body.text || "").toString().trim().slice(0, 800);
      const cleanRating = Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0)));
      const rawImages = Array.isArray(body.imageUrls) ? body.imageUrls : [];
      const cleanImages = rawImages
        .filter((url) => typeof url === "string" && /^https?:\/\//i.test(url))
        .map((url) => url.slice(0, 500))
        .slice(0, 4);
      const rawImage = (body.imageUrl || "").toString().trim();
      const cleanImage = /^https?:\/\//i.test(rawImage) ? rawImage.slice(0, 500) : "";
      if (!cleanText) return { statusCode: 400, body: JSON.stringify({ error: "Comment required" }) };
      const existing = await readReviews();
      const review = {
        name: cleanName,
        text: cleanText,
        createdAt: Date.now(),
        rating: cleanRating,
        imageUrls: cleanImages.length ? cleanImages : cleanImage ? [cleanImage] : [],
      };
      const updated = [review, ...existing].slice(0, 200);
      await writeReviews(updated);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ review }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: "Unable to save review" }) };
    }
  }

  return { statusCode: 405, headers: { Allow: "GET, POST, DELETE" }, body: "Method Not Allowed" };
};
