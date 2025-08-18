// api/protect.js  (ESM, Node 18)
import fs from "node:fs";
import path from "node:path";

function checkBasic(auth, user, pass) {
  if (!auth?.startsWith("Basic ")) return false;
  const raw = Buffer.from(auth.slice(6), "base64").toString("utf8");
  const [u, p] = raw.split(":");
  return u === user && p === pass;
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const ok = checkBasic(auth, process.env.ADMIN_USER, process.env.ADMIN_PASS);

  if (!ok) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Mindryx Admin"');
    return res.status(401).end("Auth required");
  }

  // Sadece GET ile admin panelini döndürüyoruz
  if (req.method !== "GET") {
    return res.status(405).end("Method not allowed");
  }

  try {
    const file = path.join(process.cwd(), "public", "admin.html");
    const html = fs.readFileSync(file, "utf8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (e) {
    console.error("admin.html read error:", e);
    return res.status(500).json({ error: "admin.html not found" });
  }
}
