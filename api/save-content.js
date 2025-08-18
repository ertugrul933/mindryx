// Vercel/Node 18+ ortamında fetch globaldir.
function checkBasic(header, user, pass) {
  if (!header?.startsWith("Basic ")) return false;
  const raw = Buffer.from(header.slice(6), "base64").toString("utf8");
  const [u, p] = raw.split(":");
  return u === user && p === pass;
}

async function getFileSha(owner, repo, token, filePath) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;
  const r = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mindryx-api",
    },
  });
  if (r.status === 404) return null; // yeni dosya
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`GitHub get file failed (${r.status}): ${t}`);
  }
  const json = await r.json();
  return json.sha || null;
}

async function putFile(
  owner,
  repo,
  token,
  filePath,
  contentBase64,
  message,
  sha
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;
  const body = {
    message: message || `Update ${filePath}`,
    content: contentBase64,
    sha: sha || undefined,
  };
  const r = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mindryx-api",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`GitHub put file failed (${r.status}): ${t}`);
  }
  return r.json();
}

export default async function handler(req, res) {
  // Auth
  const auth = req.headers.authorization || "";
  const ok = checkBasic(auth, process.env.ADMIN_USER, process.env.ADMIN_PASS);
  if (!ok) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Mindryx Admin API"');
    return res.status(401).json({ error: "Auth required" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Body parse (Vercel req.body hazır gelir; string ise parse ederiz)
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res
        .status(400)
        .json({ error: "Invalid JSON string body", detail: String(e.message) });
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Body must be JSON" });
  }

  const { filePath, content, contentBase64, message } = body;

  if (!filePath) return res.status(400).json({ error: "filePath required" });

  // İçerik -> base64
  let b64 = contentBase64;
  if (!b64) {
    if (content == null)
      return res
        .status(400)
        .json({ error: "content or contentBase64 required" });
    const raw =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);
    b64 = Buffer.from(raw, "utf8").toString("base64");
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return res
      .status(500)
      .json({ error: "Missing GitHub env (GITHUB_OWNER/REPO/TOKEN)" });
  }

  try {
    const sha = await getFileSha(owner, repo, token, filePath);
    const result = await putFile(
      owner,
      repo,
      token,
      filePath,
      b64,
      message,
      sha || undefined
    );
    return res
      .status(200)
      .json({ ok: true, path: filePath, commit: result.commit?.sha });
  } catch (e) {
    console.error("save-content error:", e);
    return res.status(500).json({ error: String(e.message) });
  }
}
