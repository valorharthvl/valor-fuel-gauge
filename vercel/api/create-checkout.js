const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the extension ID passed from the checkout page.
    var ext = '';
    if (req.body && req.body.ext) {
      ext = req.body.ext;
    }

    var baseUrl = process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL
      : 'https://valor-checkout.vercel.app';

    var successUrl = baseUrl + '/success.html?session_id={CHECKOUT_SESSION_ID}';
    if (ext) {
      successUrl += '&ext=' + encodeURIComponent(ext);
    }

    var cancelUrl = baseUrl + '/cancel.html';
    if (ext) {
      cancelUrl += '?ext=' + encodeURIComponent(ext);
    }

    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Valor Action Pack',
              description: '50 AI action credits for Valor AI Fuel Gauge'
            },
            unit_amount: 999
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        product: 'valor_action_pack',
        credits: '50'
      }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[Valor] create-checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
