// /api/generate-meta.js
import { Octokit } from "octokit";

async function commit(octo, owner, repo, path, content, message) {
  // önce sha çek
  let sha;
  try {
    const { data: file } = await octo.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
      }
    );
    sha = file.sha;
  } catch {
    sha = undefined; // dosya yoksa sorun değil
  }

  await octo.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    sha,
  });
}

export default async function handler(req, res) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const base = process.env.CANONICAL_BASE || "https://www.mindryx.org";

    const octo = new Octokit({ auth: token });

    // robots.txt
    const robots = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;

    // basit sitemap
    const arts = await fetch(
      `${req.headers.origin}/public/content/articles.json`
    ).then((r) => r.json());
    const urls = [`${base}/`, ...arts.map((a) => `${base}/articles/${a.slug}`)];
    const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

    // commit et
    await commit(
      octo,
      owner,
      repo,
      "public/robots.txt",
      robots,
      "chore(admin): generate robots.txt"
    );
    await commit(
      octo,
      owner,
      repo,
      "public/sitemap.xml",
      sm,
      "chore(admin): generate sitemap.xml"
    );

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "generate-meta failed" });
  }
}
