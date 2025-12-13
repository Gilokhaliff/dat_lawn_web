export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "Missing Google Sheets webhook URL" });
  }

  const {
    stream,
    className,
    childName,
    dob,
    parentName,
    phone,
    email,
    contactMethod,
    previousSchool,
    onsite,
    notes,
    trap,
  } = req.body || {};

  if (trap) {
    return res.status(200).json({ ok: true });
  }

  if (!stream || !className || !childName || !dob || !parentName || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const payload = {
    stream,
    className,
    childName,
    dob,
    parentName,
    phone,
    email,
    contactMethod,
    previousSchool,
    onsite,
    notes,
    submittedAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: "Forwarding to Google Sheets failed", detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Registration forwarding failed", err);
    return res.status(500).json({ error: "Unexpected error while forwarding registration" });
  }
}
