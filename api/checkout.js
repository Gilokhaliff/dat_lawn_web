import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const successUrl = process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/success";
const cancelUrl = process.env.STRIPE_CANCEL_URL || "http://localhost:3000/cancel";
const defaultPrice = process.env.STRIPE_PRICE_ID || null;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end("Method Not Allowed");
  }

  if (!stripe) {
    res.statusCode = 500;
    return res.json({ error: "Stripe not configured" });
  }

  try {
    const body = req.body || {};
    const priceId = body.priceId || defaultPrice;
    if (!priceId) {
      res.statusCode = 400;
      return res.json({ error: "Missing priceId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
}
