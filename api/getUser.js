export default function handler(req, res) {
  if (!global.users) global.users = {};
  const { username } = req.query;

  if (!username || !global.users[username]) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json(global.users[username]);
}
