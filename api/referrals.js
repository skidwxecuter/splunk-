// api/referrals.js
// Simple in-memory referral API for Vercel serverless functions.
// NOTE: in-memory = resets on cold start. Use a DB for persistence.

let users = {};      // { username: { username, referrals, createdAt } }
let usedKeys = {};   // prevent double-count: { ip_or_deviceKey: true }

export default function handler(req, res) {
  // common headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

  if (req.method === "POST") {
    const { action, username } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: "Missing action" });
    }

    // REGISTER: create user, fail if exists
    if (action === "register") {
      if (!username || typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ error: "Username required" });
      }
      const clean = username.trim();
      if (users[clean]) {
        return res.status(400).json({ error: "Username already registered" });
      }
      users[clean] = { username: clean, referrals: 0, createdAt: Date.now() };
      console.log("Registered:", clean);
      return res.status(200).json({ message: "Registered", link: `/?ref=${encodeURIComponent(clean)}`, user: users[clean] });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  // GET requests:
  // - if ?ref=NAME : count referral (one per IP/device)
  // - otherwise returns leaderboard
  if (req.method === "GET") {
    const ref = req.query.ref;
    const deviceKey = req.query.device || ""; // optional device key from frontend

    if (ref) {
      const clean = String(ref).trim();
      if (!users[clean]) {
        // don't auto-create referrers on click; return 404 so frontend can show message
        return res.status(404).json({ error: "Referrer not found" });
      }

      // anti-farm: combine ip + device key if provided
      const key = deviceKey ? `${ip}|${deviceKey}` : ip;

      if (usedKeys[key]) {
        return res.status(400).json({ error: "This device/IP already used a referral" });
      }

      // mark used and increment
      usedKeys[key] = true;
      users[clean].referrals = (users[clean].referrals || 0) + 1;
      console.log(`Referral counted for ${clean} from ${key}`);
      return res.status(200).json({ message: "Referral counted", user: users[clean] });
    }

    // No ref param => return leaderboard
    const leaderboard = Object.values(users)
      .sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
    return res.status(200).json({ leaderboard });
  }

  res.status(405).json({ error: "Method not allowed" });
}
