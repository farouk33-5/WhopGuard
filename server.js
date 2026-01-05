/*
 Secure Whop Membership Verification API
 Works on Vercel — Single File
*/

import http from "http";
import url from "url";

const PORT = process.env.PORT || 5000;
const WHOP_API_KEY = process.env.WHOP_API_KEY;

async function checkSubscription(email) {
  const res = await fetch(
    `https://api.whop.com/api/v2/memberships?email=${email}`,
    {
      headers: { Authorization: `Bearer ${WHOP_API_KEY}` }
    }
  );

  const data = await res.json();

  if (!data || !data.length) return null;

  return data[0];
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET" && parsed.pathname === "/") {
    res.end(JSON.stringify({ status: "Whop API Running on Vercel ✅" }));
    return;
  }

  if (req.method === "POST" && parsed.pathname === "/login") {
    let body = "";

    req.on("data", chunk => (body += chunk));

    req.on("end", async () => {
      try {
        if (!WHOP_API_KEY) {
          res.statusCode = 500;
          res.end(JSON.stringify({ message: "API key missing" }));
          return;
        }

        const { email } = JSON.parse(body);

        if (!email) {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: "Email is required" }));
          return;
        }

        const sub = await checkSubscription(email);

        if (!sub) {
          res.statusCode = 403;
          res.end(JSON.stringify({ message: "No active subscription" }));
          return;
        }

        if (sub.status !== "active") {
          res.statusCode = 403;
          res.end(JSON.stringify({ message: "Subscription expired" }));
          return;
        }

        res.end(
          JSON.stringify({
            message: "Login success",
            user: email,
            product: sub.product_name
          })
        );
      } catch {
        res.statusCode = 500;
        res.end(JSON.stringify({ message: "Server error" }));
      }
    });

    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ message: "Not found" }));
});

server.listen(PORT);
