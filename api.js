// api.js
import http from "http";
import url from "url";

let users = {}; // store users: { "username": { referrals, invite, lastReferral } }

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  const parsed = url.parse(req.url, true);
  const { pathname } = parsed;

  // ✅ Save invite created by bot
  if (pathname === "/api/saveInvite" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      const { user, invite } = JSON.parse(body || "{}");
      if (!user || !invite) {
        res.end(JSON.stringify({ error: "Missing fields" }));
        return;
      }

      if (!users[user]) {
        users[user] = { referrals: 0, invite, lastReferral: 0 };
      } else {
        users[user].invite = invite;
      }

      res.end(JSON.stringify({ success: true, invite }));
    });
    return;
  }

  // ✅ Add referral when bot detects invite used
  if (pathname === "/api/addReferral" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      const { code } = JSON.parse(body || "{}");

      const userEntry = Object.entries(users).find(([_, u]) => u.invite === code);
      if (!userEntry) {
        res.end(JSON.stringify({ error: "Invite not found" }));
        return;
      }

      const [username, data] = userEntry;
      data.referrals += 1;
      data.lastReferral = Date.now();

      res.end(JSON.stringify({ success: true, user: username, referrals: data.referrals }));
    });
    return;
  }

  // ✅ Get user stats
  if (pathname === "/api/getUser" && req.method === "GET") {
    const username = parsed.query.username;
    if (!username || !users[username]) {
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }
    res.end(JSON.stringify(users[username]));
    return;
  }

  // ✅ Leaderboard
  if (pathname === "/api/leaderboard" && req.method === "GET") {
    const leaderboard = Object.entries(users)
      .map(([name, data]) => ({ name, referrals: data.referrals }))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10);

    res.end(JSON.stringify(leaderboard));
    return;
  }

  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("API running on port 3000"));
