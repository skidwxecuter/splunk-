let data = {};

export default function handler(req, res) {
  if (req.method === "POST") {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    if (!data[username]) data[username] = { referrals: 0 };

    return res.status(200).json({ message: "Registered", user: username });
  }
  res.status(405).end();
}
