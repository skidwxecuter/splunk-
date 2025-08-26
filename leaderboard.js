export default function handler(req, res) {
  if (!global.users) global.users = {};

  const leaderboard = Object.entries(global.users)
    .map(([user, data]) => ({ user, referrals: data.referrals }))
    .sort((a, b) => b.referrals - a.referrals);

  res.status(200).json(leaderboard);
}
