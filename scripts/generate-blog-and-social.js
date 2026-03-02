import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://caroflower.com";

// Supabase (opcional)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

const IMAGES_ROOT = path.join(process.cwd(), "images");
const BLOG_DIR = path.join(process.cwd(), "blog");
const POSTS_DIR = path.join(BLOG_DIR, "posts");

const IMAGES_PER_POST = 3;

// ===== Helpers =====
function ensureDirs() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
}

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

function formatPrettyDate(dateISO) {
  try {
    const d = new Date(dateISO);
    return d.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateISO.slice(0, 10);
  }
}

// ===== OpenAI generation =====
async function generateBilingualCopy({ category, imageUrls }) {
  const prompt = `
You are the brand copywriter for "Caro Flower Art" (handmade paper flowers).

Generate bilingual content (EN first, then ES):
- Titles: short, elegant (max 60 chars each)
- Excerpts: 1 sentence each language (max 140 chars)
- Blog post: 220–320 words per language
- Tone: warm, human storytelling about process, handmade details, dedication
- No emojis
- Add a short CTA in each language (1 line)
- Create IG copy: 120–180 characters per language
- Create TikTok copy: 1–2 lines per language
- Provide 6 hashtags (neutral/bilingual is fine)

Category: ${category}
Image URLs:
${imageUrls.map((u) => `- ${u}`).join("\n")}

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
    max_tokens: 1400,
    messages: [
      { role: "system", content: "Write natural, elegant brand copy. No emojis. EN first." },
      { role: "user", content: prompt },
    ],
  });

  const text = resp.choices?.[0]?.message?.content || "";

  const getLine = (key) => {
    const m = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    return m ? m[1].trim() : "";
  };

  const getBlock = (key) => {
    // Captura hasta el siguiente KEY:
    const re = new RegExp(
      `^${key}:\\s*([\\s\\S]*?)(^TITLE_EN:|^TITLE_ES:|^EXCERPT_EN:|^EXCERPT_ES:|^BLOG_EN:|^BLOG_ES:|^IG_EN:|^IG_ES:|^TIKTOK_EN:|^TIKTOK_ES:|^HASHTAGS:|^CTA_EN:|^CTA_ES:)`,
      "m"
    );
    const m = text.match(re);
    if (m) return m[1].trim();

    // fallback
    const re2 = new RegExp(`^${key}:\\s*([\\s\\S]*)$`, "m");
    const m2 = text.match(re2);
    return m2 ? m2[1].trim() : "";
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
    promptUsed: prompt,
  };
}

// ===== Post HTML (bonito + tu CSS) =====
function renderPostHtml({ slug, dateISO, category, imageUrls, copy }) {
  const title = copy.titleEn || "Caro Flower Art";
  const desc = copy.excerptEn || "Behind-the-scenes stories and process of handmade paper flowers.";
  const canonical = `${SITE_BASE_URL}/blog/posts/${slug}.html`;

  const heroImage = imageUrls[0] || "";

  const gallery = imageUrls
    .map(
      (u) => `
      <figure class="post-figure">
        <img src="${u}" alt="${escapeHtml(category)} handmade paper flowers" loading="lazy"/>
      </figure>`
    )
    .join("\n");

  const enParagraphs = escapeHtml(copy.blogEn)
    .split("\n")
    .filter(Boolean)
    .map(p => `<p class="post-p">${p}</p>`)
    .join("");

  const esParagraphs = escapeHtml(copy.blogEs)
    .split("\n")
    .filter(Boolean)
    .map(p => `<p class="post-p">${p}</p>`)
    .join("");

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
  ${heroImage ? `<meta property="og:image" content="${heroImage}" />` : ""}

  <link rel="stylesheet" href="/site.css?v=20260126b" />

  <style>
    .post-wrap{max-width:980px;margin:0 auto;padding:18px 16px 40px}
    .post-top{display:flex;gap:14px;align-items:center;margin:10px 0 16px}
    .post-back{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:600}
    .post-meta{opacity:.75;font-size:14px;margin-top:6px}
    .post-hero{border-radius:18px;overflow:hidden;margin:14px 0 22px;box-shadow:0 10px 25px rgba(0,0,0,.08)}
    .post-hero img{width:100%;height:auto;display:block}

    .post-card{background:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 25px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.06)}
    .post-gallery{display:grid;grid-template-columns:1fr;gap:12px;margin:10px 0 6px}
    @media(min-width:720px){ .post-gallery{grid-template-columns:repeat(3,1fr)} }
    .post-figure{margin:0}
    .post-figure img{width:100%;display:block;border-radius:16px;border:1px solid rgba(0,0,0,.06)}

    /* Aquí el “justificado” */
    .post-p{margin:0 0 12px;line-height:1.85;text-align:justify;text-justify:inter-word}

    /* Separador suave entre EN y ES */
    .divider{height:1px;background:rgba(0,0,0,.10);margin:18px 0}
  </style>
</head>

<body>
  <div id="site-header"></div>

  <main class="post-wrap">
    <div class="post-top">
      <a class="post-back" href="/blog/">← Back to Blog</a>
    </div>

    <h1 style="margin:0">${escapeHtml(copy.titleEn)}</h1>
    <div class="post-meta">${escapeHtml(new Date(dateISO).toDateString())} · Caro Flower Art</div>

    ${heroImage ? `<div class="post-hero"><img src="${heroImage}" alt="${escapeHtml(copy.titleEn)}" loading="lazy"/></div>` : ""}

    <section class="post-card">
      <div class="post-gallery">${gallery}</div>
    </section>

    <section class="post-card" style="margin-top:16px">
      ${enParagraphs}
      <div class="divider"></div>
      ${esParagraphs}
    </section>
  </main>

  <script>
    fetch("/header.html")
      .then(r => r.text())
      .then(html => { document.getElementById("site-header").innerHTML = html; })
      .catch(() => {});
  </script>
</body>
</html>`;
}

// ===== Sitemap add-only (para que /blog detecte nuevos posts) =====
function updateSitemapAddPost({ postUrl }) {
  const sitemapPath = path.join(process.cwd(), "sitemap.xml");

  let xml = "";
  if (fs.existsSync(sitemapPath)) {
    xml = fs.readFileSync(sitemapPath, "utf-8");
  } else {
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
  }

  if (xml.includes(`<loc>${postUrl}</loc>`)) return;

  const entry = `  <url><loc>${postUrl}</loc></url>\n`;
  xml = xml.replace("</urlset>", `${entry}</urlset>`);
  writeFile(sitemapPath, xml);
}

// ===== Supabase insert (ajustado a TU tabla social_posts) =====
async function pushSocialToSupabase({ copy, imageUrls, postUrl, runKey }) {
  if (!supabase) {
    console.log("Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY missing). Skipping DB insert.");
    return;
  }

  // Guardamos hashtags dentro del contenido (porque tu tabla no tiene columna hashtags/lang/title)
  const igEn = `${copy.igEn}\n\n${copy.hashtags}`.trim();
  const igEs = `${copy.igEs}\n\n${copy.hashtags}`.trim();
  const ttEn = `${copy.tiktokEn}\n\n${copy.hashtags}`.trim();
  const ttEs = `${copy.tiktokEs}\n\n${copy.hashtags}`.trim();

  const rows = [
    {
      platform: "instagram",
      status: "pending",
      prompt: copy.promptUsed,
      content: igEn,
      image_urls: imageUrls,
      post_url: postUrl,
      run_key: runKey,
    },
    {
      platform: "instagram",
      status: "pending",
      prompt: copy.promptUsed,
      content: igEs,
      image_urls: imageUrls,
      post_url: postUrl,
      run_key: runKey,
    },
    {
      platform: "tiktok",
      status: "pending",
      prompt: copy.promptUsed,
      content: ttEn,
      image_urls: imageUrls,
      post_url: postUrl,
      run_key: runKey,
    },
    {
      platform: "tiktok",
      status: "pending",
      prompt: copy.promptUsed,
      content: ttEs,
      image_urls: imageUrls,
      post_url: postUrl,
      run_key: runKey,
    },
  ];

  const { error } = await supabase.from("social_posts").insert(rows);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
}

// ===== Main =====
async function run() {
  ensureDirs();

  const allImages = listAllImages(IMAGES_ROOT);
  if (!allImages.length) throw new Error("No images found in /images");

  const categories = [...new Set(allImages.map(categoryFromPath))];
  const category = categories[Math.floor(Math.random() * categories.length)];

  const categoryImages = allImages.filter((f) => categoryFromPath(f) === category);
  const pickedFiles = shuffle(categoryImages).slice(0, Math.min(IMAGES_PER_POST, categoryImages.length));
  const imageUrls = pickedFiles.map(toPublicUrl);

  const copy = await generateBilingualCopy({ category, imageUrls });

  const dateISO = new Date().toISOString();
  const runKey = `${dateISO.slice(0, 10)}-${hashSlug(dateISO)}`; // para agrupar la corrida
  const slug = `${category}-${hashSlug((copy.titleEn || category) + "-" + dateISO)}`;

  const postHtml = renderPostHtml({ slug, dateISO, category, imageUrls, copy });
  writeFile(path.join(POSTS_DIR, `${slug}.html`), postHtml);

  const postUrl = `${SITE_BASE_URL}/blog/posts/${slug}.html`;
  updateSitemapAddPost({ postUrl });

  await pushSocialToSupabase({ copy, imageUrls, postUrl, runKey });

  console.log("OK:", { slug, category, images: imageUrls.length, postUrl, runKey });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
