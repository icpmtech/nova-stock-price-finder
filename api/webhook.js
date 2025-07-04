// /api/webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).end();
  }

  // Trate eventos que você deseja:
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    // Ex: gravar no seu banco que o pagamento foi concluído
    console.log('💰 Pagamento bem-sucedido:', pi.id);
  }

  res.status(200).json({ received: true });
}
