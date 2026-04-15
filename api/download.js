import crypto from "crypto";

const downloadSecret = process.env.DOWNLOAD_SECRET || "dev-secret-change-me";
const downloadUrl = process.env.EBOOK_DOWNLOAD_URL || "https://www.datlawnguy.de/ebooks/eBook1-v2.pdf";

export const handler = async (event) => {
  const token = event.queryStringParameters?.token;
  if (!token || typeof token !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing token" }) };
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [tokenMarker, email, signature] = decoded.split("|");
    if (!tokenMarker || !signature) throw new Error("Malformed token");
    const payload = `${tokenMarker}|${email || ""}`;
    const expectedSig = crypto.createHmac("sha256", downloadSecret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      throw new Error("Invalid signature");
    }

    return {
      statusCode: 302,
      headers: { Location: downloadUrl },
      body: "",
    };
  } catch (err) {
    console.error("Download error:", err.message);
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid link" }) };
  }
};
