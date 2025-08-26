export default function handler(req, res) {
  if (req.method === "POST") {
    const { user, invite } = req.body;

    if (!global.users) global.users = {};

    if (!global.users[user]) {
      global.users[user] = { referrals: 0, invite, lastReferral: 0 };
    } else {
      global.users[user].invite = invite;
    }

    res.status(200).json({ success: true, invite });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
