import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const successUrl = process.env.STRIPE_SUCCESS_URL || "https://www.datlawnguy.de/success";
const cancelUrl = process.env.STRIPE_CANCEL_URL || "https://www.datlawnguy.de/cancel";
const defaultPrice = process.env.STRIPE_PRICE_ID || null;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: "Method Not Allowed" };
  }

  if (!stripe) {
    return { statusCode: 500, body: JSON.stringify({ error: "Stripe not configured" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const priceId = body.priceId || defaultPrice;
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing priceId" }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_creation: "always",
      metadata: { item: "ebook", priceId },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Checkout error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Unable to create checkout session" }) };
  }
};
