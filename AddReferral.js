export default function handler(req, res) {
  if (req.method === "POST") {
    const { code } = req.body;
    if (!global.users) global.users = {};

    const user = Object.entries(global.users).find(([u, data]) => data.invite === code);
    if (!user) return res.status(404).json({ error: "Invite not found" });

    const [username, data] = user;
    data.referrals += 1;
    data.lastReferral = Date.now();

    res.status(200).json({ success: true, user: username, referrals: data.referrals });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
