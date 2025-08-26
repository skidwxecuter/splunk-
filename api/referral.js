let users = {}; // in-memory storage (resets on redeploy, use DB for permanent)

export default function handler(req, res) {
  if (req.method === "POST") {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }
    if (users[username]) {
      return res.status(400).json({ error: "Username already exists" });
    }

    users[username] = { referrals: 0 };
    return res.status(200).json({ message: "Registered", username });
  }

  if (req.method === "GET") {
    const { ref } = req.query;

    if (ref) {
      if (!users[ref]) {
        return res.status(404).json({ error: "Referrer not found" });
      }
      users[ref].referrals++;
      return res.status(200).json({ message: "Referral counted", ref });
    }

    // leaderboard
    const leaderboard = Object.entries(users)
      .map(([u, d]) => ({ username: u, referrals: d.referrals }))
      .sort((a, b) => b.referrals - a.referrals);

    return res.status(200).json({ leaderboard });
  }

  res.status(405).json({ error: "Method not allowed" });
}
