// Simple in-memory store for redeemed phone numbers
// Note: This resets when the server restarts. For persistence, connect a database.
let redeemedMap = new Map();

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { phone } = req.body || {};
    if (typeof phone !== "string" || !/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ ok: false, error: "Invalid phone format. Send digits like 919999999999" });
    }

    redeemedMap.set(phone, true);

    return res.status(200).json({ ok: true, phone, redeemed: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
