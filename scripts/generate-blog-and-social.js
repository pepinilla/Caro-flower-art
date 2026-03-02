import OpenAI from "openai";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://caroflower.com";
const IMAGES_ROOT = path.join(process.cwd(), "images");
const BLOG_DIR = path.join(process.cwd(), "blog");
const POSTS_DIR = path.join(BLOG_DIR, "posts");

const IMAGES_PER_POST = 3;
const MAX_POSTS_ON_INDEX = 30;

function listAllImages(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (/\.(png|jpe?g|webp)$/i.test(e.name)) out.push(full);
    }
  }
  return out;
}

function categoryFromPath(filePath) {
  const rel = path.relative(IMAGES_ROOT, filePath).replaceAll("\\", "/");
  const parts = rel.split("/");
  return parts.length > 1 ? parts[0] : "mix";
}

function toPublicUrl(filePath) {
  const rel = path.relative(process.cwd(), filePath).replaceAll("\\", "/");
  return `${SITE_BASE_URL}/${rel}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashSlug(input) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 10);
}

function ensureDirs() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
}

function readJsonSafe(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch { return fallback; }
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function generateBilingualCopy({ category, imageUrls }) {
  const prompt = `
You are the brand copywriter for "Caro Flower Art" (handmade paper flowers).

Generate bilingual content (EN first, then ES):
- Blog post: 220–320 words per language
- Tone: warm, human storytelling about process, handmade details, dedication
- No emojis
- Include a short CTA in each language (1 line)
- Create IG copy: 120–180 characters per language
- Create TikTok copy: 1–2 lines per language
- Provide 6 hashtags (neutral/bilingual is fine)

Today's category: ${category}
Image URLs:
${imageUrls.map(u => `- ${u}`).join("\n")}

Return EXACTLY this format:

TITLE_EN: ...
TITLE_ES: ...
EXCERPT_EN: ...
EXCERPT_ES: ...
BLOG_EN: ...
BLOG_ES: ...
IG_EN: ...
IG_ES: ...
TIKTOK_EN: ...
TIKTOK_ES: ...
HASHTAGS: ...
CTA_EN: ...
CTA_ES: ...
`.trim();

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1200,
    messages: [
      { role: "system", content: "Write natural, elegant marketing copy. No emojis. EN first." },
      { role: "user", content: prompt },
    ],
  });

  const text = resp.choices?.[0]?.message?.content || "";

  const getLine = (key) => {
    const m = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    return m ? m[1].trim() : "";
  };

  const getBlock = (key) => {
    const re = new RegExp(`^${key}:\\s*([\\s\\S]*?)(^\\w+_\\w+:\\s|^HASHTAGS:\\s)`, "m");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  return {
    titleEn: getLine("TITLE_EN"),
    titleEs: getLine("TITLE_ES"),
    excerptEn: getLine("EXCERPT_EN"),
    excerptEs: getLine("EXCERPT_ES"),
    blogEn: getBlock("BLOG_EN"),
    blogEs: getBlock("BLOG_ES"),
    igEn: getLine("IG_EN"),
    igEs: getLine("IG_ES"),
    tiktokEn: getLine("TIKTOK_EN"),
    tiktokEs: getLine("TIKTOK_ES"),
    hashtags: getLine("HASHTAGS"),
    ctaEn: getLine("CTA_EN"),
    ctaEs: getLine("CTA_ES"),
    raw: text,
  };
}

function renderPostHtml({ slug, dateISO, category, imageUrls, copy }) {
  const title = copy.titleEn || "Caro Flower Art";
  const desc = copy.excerptEn || "Behind-the-scenes stories and process of handmade paper flowers.";
  const canonical = `${SITE_BASE_URL}/blog/posts/${slug}.html`;

  const imagesHtml = imageUrls.map(u => `
    <figure style="margin:16px 0">
      <img src="${u}" alt="${escapeHtml(category)} handmade paper flowers" style="max-width:100%;border-radius:12px" loading="lazy">
    </figure>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Caro Flower Art</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${canonical}" />

  <meta property="og:title" content="${escapeHtml(title)} | Caro Flower Art" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  ${imageUrls[0] ? `<meta property="og:image" content="${imageUrls[0]}" />` : ""}
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:980px;margin:0 auto;padding:20px;line-height:1.6">

  <div id="siteHeader"></div>

  <main style="max-width:860px;margin:0 auto;">
    <p><a href="/blog/">← Back to Blog</a></p>
    <h1>${escapeHtml(copy.titleEn)}</h1>
    <p style="opacity:.7">${escapeHtml(new Date(dateISO).toDateString())} · ${escapeHtml(category)}</p>

    ${imagesHtml}

    <h2>English</h2>
    <p>${escapeHtml(copy.blogEn).replaceAll("\n", "<br/>")}</p>
    <p><strong>CTA:</strong> ${escapeHtml(copy.ctaEn)}</p>

    <hr style="margin:24px 0"/>

    <h2>Español</h2>
    <p>${escapeHtml(copy.blogEs).replaceAll("\n", "<br/>")}</p>
    <p><strong>CTA:</strong> ${escapeHtml(copy.ctaEs)}</p>

    <hr style="margin:24px 0"/>
    <h3>Social (Generated)</h3>
    <p><strong>Instagram (EN):</strong> ${escapeHtml(copy.igEn)}</p>
    <p><strong>Instagram (ES):</strong> ${escapeHtml(copy.igEs)}</p>
    <p><strong>TikTok (EN):</strong> ${escapeHtml(copy.tiktokEn)}</p>
    <p><strong>TikTok (ES):</strong> ${escapeHtml(copy.tiktokEs)}</p>
    <p><strong>Hashtags:</strong> ${escapeHtml(copy.hashtags)}</p>
  </main>

  <script>
    fetch("/header.html")
      .then(r => r.text())
      .then(html => { document.getElementById("siteHeader").innerHTML = html; })
      .catch(() => {});
  </script>
</body>
</html>`;
}

function updateBlogIndex(feed) {
  const items = feed.slice(0, MAX_POSTS_ON_INDEX).map(p => `
    <article style="padding:14px 0;border-bottom:1px solid #eee">
      <h2 style="margin:0 0 6px 0">
        <a href="/blog/posts/${p.slug}.html">${escapeHtml(p.titleEn)}</a>
      </h2>
      <div style="opacity:.7;font-size:14px">${escapeHtml(p.date)} · ${escapeHtml(p.category)}</div>
      ${p.heroImage ? `<img src="${p.heroImage}" style="max-width:100%;border-radius:12px;margin-top:10px" loading="lazy">` : ""}
      <p style="margin-top:10px">${escapeHtml(p.excerptEn || "")}</p>
    </article>
  `).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Blog | Caro Flower Art</title>
  <meta name="description" content="Behind-the-scenes stories and process of handmade paper flowers. New posts every 3 days." />
  <link rel="canonical" href="${SITE_BASE_URL}/blog/" />
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:980px;margin:0 auto;padding:20px;line-height:1.6">
  <div id="siteHeader"></div>

  <main class="page" style="max-width: 980px; margin: 0 auto; padding: 20px;">
    <h1>Blog</h1>
    <p>English first · Español después. New post every 3 days.</p>
    ${items || "<p>No posts yet.</p>"}
  </main>

  <script>
    fetch("/header.html")
      .then(r => r.text())
      .then(html => { document.getElementById("siteHeader").innerHTML = html; })
      .catch(() => {});
  </script>
</body>
</html>`;
  writeFile(path.join(BLOG_DIR, "index.html"), html);
}

function updateSitemap(feed) {
  const urls = [
    `${SITE_BASE_URL}/`,
    `${SITE_BASE_URL}/blog/`,
    ...feed.map(p => `${SITE_BASE_URL}/blog/posts/${p.slug}.html`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

  writeFile(path.join(process.cwd(), "sitemap.xml"), xml);
}

async function run() {
  ensureDirs();

  const allImages = listAllImages(IMAGES_ROOT);
  if (!allImages.length) throw new Error("No images found in /images");

  const categories = [...new Set(allImages.map(categoryFromPath))];
  const category = categories[Math.floor(Math.random() * categories.length)];

  const categoryImages = allImages.filter(f => categoryFromPath(f) === category);
  const pickedFiles = shuffle(categoryImages).slice(0, Math.min(IMAGES_PER_POST, categoryImages.length));
  const imageUrls = pickedFiles.map(toPublicUrl);

  const copy = await generateBilingualCopy({ category, imageUrls });

  const dateISO = new Date().toISOString();
  const slug = `${category}-${hashSlug((copy.titleEn || category) + "-" + dateISO)}`;

  const postHtml = renderPostHtml({ slug, dateISO, category, imageUrls, copy });
  writeFile(path.join(POSTS_DIR, `${slug}.html`), postHtml);

  const feedPath = path.join(BLOG_DIR, "posts.json");
  const feed = readJsonSafe(feedPath, []);
  feed.unshift({
    slug,
    date: dateISO.slice(0, 10),
    category,
    titleEn: copy.titleEn || `Caro Flower Art · ${category}`,
    excerptEn: copy.excerptEn || "",
    heroImage: imageUrls[0] || ""
  });
  writeFile(feedPath, JSON.stringify(feed, null, 2));

  updateBlogIndex(feed);
  updateSitemap(feed);

  console.log("OK:", { slug, category, images: imageUrls.length });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
