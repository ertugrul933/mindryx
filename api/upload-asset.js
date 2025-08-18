// api/upload-asset.js
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  try {
    const { path, contentBase64, message } = await readBody(req);
    if (!path || !path.startsWith("public/assets/"))
      return res
        .status(400)
        .json({ error: "Yol public/assets altında olmalı" });
    const result = await putToGithub(
      path,
      contentBase64,
      message || `Upload ${path}`
    );
    // raw URL döndür (hızlı kullanım)
    const raw = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${path}`;
    res.status(200).json({ ok: true, url: raw, path: result.path });
  } catch (e) {
    res.status(500).send(String(e));
  }
}
async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function putToGithub(path, base64, message) {
  const { ertugrul933, mindryx, GITHUB_TOKEN } = process.env;
  const api = `https://api.github.com/repos/${ertugrul933}/${mindryx}/contents/${path}`;
  // mevcutsa sha al
  let sha;
  const head = await fetch(api, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "mindryx-admin",
    },
  });
  if (head.status === 200) sha = (await head.json()).sha;

  const r = await fetch(api, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "mindryx-admin",
    },
    body: JSON.stringify({ message, content: base64, sha }),
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
