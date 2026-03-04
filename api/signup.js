// /api/signup.js — Pine Beach signup form handler
// Vercel serverless function (Node.js runtime)
//
// POST /api/signup
// Receives form data, validates required fields, then posts the submission
// to the Pine Beach Signups Discord webhook in #harbor-dock for immediate
// visibility. No local file writes — works correctly on Vercel.

const REQUIRED_FIELDS = [
  'businessName',
  'businessType',
  'contactName',
  'email',
  'phone',
  'street',
  'suburb',
  'state',
  'postcode',
];

// Discord webhook — #harbor-dock (Pine Beach Signups)
// Override via DISCORD_WEBHOOK_URL env var if needed
const WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK_URL ||
  'https://discord.com/api/webhooks/1478550146676428852/M4E1pLpsDOCoPggBli9znzhGhLLowwAL53JpuRxkn2B4t2cq9mKZcvCDw19_biiRJQqb';

/**
 * Parse the request body from a Node.js IncomingMessage.
 * Handles the case where Vercel does not auto-populate req.body.
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

/**
 * Post a signup notification to Discord #harbor-dock via webhook.
 */
async function postToDiscord(submission) {
  const lines = [
    `🏖️ **New Pine Beach Signup!**`,
    ``,
    `**Business:** ${submission.businessName} (${submission.businessType})`,
    `**Contact:** ${submission.contactName}`,
    `**Email:** ${submission.email}`,
    `**Phone:** ${submission.phone}`,
    `**Address:** ${submission.address.street}, ${submission.address.suburb} ${submission.address.state} ${submission.address.postcode}`,
    submission.website ? `**Website:** ${submission.website}` : null,
    ``,
    `**ID:** \`${submission.id}\``,
    `**Submitted:** ${submission.submittedAt}`,
    `**Source:** ${submission.source}`,
  ].filter(Boolean).join('\n');

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: lines }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} — ${text}`);
  }
}

module.exports = async function handler(req, res) {
  // CORS headers — allow the Pine Beach website to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body
  const body = await parseBody(req);

  // Validate required fields
  const missing = REQUIRED_FIELDS.filter(
    (field) => !body[field] || !String(body[field]).trim()
  );

  if (missing.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      missing,
    });
  }

  // Build clean submission record
  const submission = {
    id: `signup_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    businessName: String(body.businessName).trim(),
    businessType: String(body.businessType).trim(),
    contactName: String(body.contactName).trim(),
    email: String(body.email).trim().toLowerCase(),
    phone: String(body.phone).trim(),
    website: body.website ? String(body.website).trim() : null,
    address: {
      street: String(body.street).trim(),
      suburb: String(body.suburb).trim(),
      state: String(body.state).trim(),
      postcode: String(body.postcode).trim(),
    },
    source: 'website_form',
    status: 'new',
  };

  // Log always (visible in Vercel function logs)
  console.log('[Pine Beach] New signup:', JSON.stringify(submission, null, 2));

  // Post to Discord #harbor-dock
  try {
    await postToDiscord(submission);
    console.log('[Pine Beach] Signup posted to Discord #harbor-dock');
  } catch (err) {
    // Don't fail the user-facing response if Discord has a hiccup
    console.error('[Pine Beach] Discord webhook error:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: "Thanks! We'll have a preview website ready for you within a few business days.",
  });
};
