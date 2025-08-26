// api/referral.js
let users = {}; // In-memory store (resets if redeployed)

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { action, username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    if (action === "register") {
      if (!users[username]) {
        users[username] = { referrals: 0 };
      }
      return res.status(200).json({ message: "User registered", user: users[username] });
    }

    if (action === "addReferral") {
      if (!users[username]) {
        users[username] = { referrals: 0 };
      }
      users[username].referrals += 1;
      return res.status(200).json({ message: "Referral added", user: users[username] });
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  if (req.method === "GET") {
    const leaderboard = Object.entries(users)
      .map(([username, data]) => ({ username, referrals: data.referrals }))
      .sort((a, b) => b.referrals - a.referrals);

    return res.status(200).json(leaderboard);
  }

  res.status(405).json({ error: "Method not allowed" });
                                   }
