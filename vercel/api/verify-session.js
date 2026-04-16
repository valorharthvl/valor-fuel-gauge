const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ ok: false, error: 'Missing session_id' });
  }

  try {
    var session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ ok: false, error: 'Payment not completed' });
    }

    var credits = 20;
    if (session.metadata && session.metadata.credits) {
      credits = parseInt(session.metadata.credits, 10);
    }

    res.status(200).json({
      ok: true,
      credits: credits,
      payment_status: session.payment_status,
      amount_total: session.amount_total
    });
  } catch (err) {
    console.error('[Valor] verify-session error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};
