const resendKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";
const contactTo = process.env.CONTACT_TO || "datlawnguy0@gmail.com";

function send(res, status, payload) {
  res.status(status).json(payload);
}

function toStringSafe(val, max = 800) {
  try {
    return String(val || "").trim().slice(0, max);
  } catch (e) {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  if (!resendKey) return send(res, 500, { error: "Email not configured" });

  const body = req.body || {};
  const name = toStringSafe(body.name || "Guest", 120);
  const email = toStringSafe(body.email || body.contact || "", 200);
  const message = toStringSafe(body.message || "", 2000);

  if (!email || !email.includes("@") || !message) {
    return send(res, 400, { error: "Name, email, and message required" });
  }

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0b1a12;">
      <h2 style="margin:0 0 12px 0;">New website message</h2>
      <p style="margin:0 0 6px 0;"><strong>Name:</strong> ${name}</p>
      <p style="margin:0 0 6px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin:12px 0 0 0;"><strong>Message:</strong></p>
      <p style="margin:6px 0 0 0;white-space:pre-line;">${message}</p>
    </div>
  `;

  try {
    const resEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: contactTo,
        reply_to: email,
        subject: `DAT LAWN GUY - Contact form (${name})`,
        html,
      }),
    });

    if (!resEmail.ok) {
      return send(res, 500, { error: "Email send failed" });
    }
    return send(res, 200, { ok: true });
  } catch (err) {
    return send(res, 500, { error: "Email send failed" });
  }
}
