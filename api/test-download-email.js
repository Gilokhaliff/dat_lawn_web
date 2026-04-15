import crypto from "crypto";

const resendKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";
const downloadSecret = process.env.DOWNLOAD_SECRET || "dev-secret-change-me";
const downloadBase = process.env.DOWNLOAD_BASE || "https://www.datlawnguy.de/api/download";
const adminToken = process.env.REVIEWS_ADMIN_TOKEN;

function toStringSafe(val) {
  try {
    return String(val || "").slice(0, 120);
  } catch (e) {
    return "";
  }
}

function createSignedDownloadLink(email = "") {
  const issuedAt = Date.now();
  const payload = `${issuedAt}|${toStringSafe(email)}`;
  const sig = crypto.createHmac("sha256", downloadSecret).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${sig}`).toString("base64url");
  return `${downloadBase}?token=${token}`;
}

async function sendDownloadEmail(to, name = "", idempotencyKey = "") {
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
      <p style="margin:0 0 12px 0;color:#0b1a12;"><strong>Hinweis:</strong> Du kannst diesen Download-Link jederzeit wieder verwenden. Bitte leite ihn nicht weiter.</p>
      <p style="margin:0;color:#4c5d51;">Falls der Button nicht funktioniert, nutze diesen Link: <br><a href="${link}">${link}</a></p>
    </div>
  `;

  const headers = {
    Authorization: `Bearer ${resendKey}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: resendFrom,
      to,
      subject: "DAT LAWN GUY - eBook Frühling Rasenpflege ohne Bullshit",
      html,
    }),
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: "Method Not Allowed" };
  }

  if (!adminToken) {
    return { statusCode: 500, body: JSON.stringify({ error: "Admin token not configured" }) };
  }
  const provided = event.headers["x-admin-token"] || "";
  if (!provided || provided !== adminToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (!resendKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Resend not configured" }) };
  }

  const body = JSON.parse(event.body || "{}");
  const email = toStringSafe(body.email);
  const name = toStringSafe(body.name);
  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  try {
    await sendDownloadEmail(email, name, `test-${Date.now()}`);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Email send failed" }) };
  }
};
