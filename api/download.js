import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const downloadSecret = process.env.DOWNLOAD_SECRET || "dev-secret-change-me";
const filePath = path.join(process.cwd(), "ebooks", "eBook1-v2.pdf");

export default async function handler(req, res) {
  const { token } = req.query || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [expires, email, signature] = decoded.split("|");
    if (!expires || !signature) throw new Error("Malformed token");
    if (Number(expires) < Date.now()) throw new Error("Expired token");
    const payload = `${expires}|${email || ""}`;
    const expectedSig = crypto.createHmac("sha256", downloadSecret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      throw new Error("Invalid signature");
    }

    const pdf = await fs.readFile(filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="eBook1-v2.pdf"');
    return res.status(200).send(pdf);
  } catch (err) {
    console.error("Download error:", err.message);
    return res.status(400).json({ error: "Invalid or expired link" });
  }
}
