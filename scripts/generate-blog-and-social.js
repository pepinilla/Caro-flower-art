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
- Provide clean paragraphs (use line breaks between paragraphs)

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
    const re = new RegExp(
      `^${key}:\\s*([\\s\\S]*?)(^TITLE_EN:|^TITLE_ES:|^EXCERPT_EN:|^EXCERPT_ES:|^BLOG_EN:|^BLOG_ES:)`,
      "m"
    );
    const m = text.match(re);
    if (m) return m[1].trim();

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
    raw: text,
    promptUsed: prompt,
  };
}

// ===== Post HTML (tu versión bonita, sin headers EN/ES) =====
function renderPostHtml({ slug, dateISO, category, imageUrls, copy }) {
  const title = copy.titleEn || "Caro Flower Art";
  const desc =
    copy.excerptEn || "Behind-the-scenes stories and process of handmade paper flowers.";
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
    .map((p) => `<p class="post-p">${p}</p>`)
    .join("");

  const esParagraphs = escapeHtml(copy.blogEs)
    .split("\n")
    .filter(Boolean)
    .map((p) => `<p class="post-p">${p}</p>`)
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
    .post-top{display:flex;justify-content:center;margin:10px 0 16px}
    .post-back{text-decoration:none;font-weight:600}
    .post-meta{text-align:center;opacity:.75;font-size:14px;margin-top:10px}
    .post-hero{border-radius:18px;overflow:hidden;margin:14px 0 22px;box-shadow:0 10px 25px rgba(0,0,0,.08)}
    .post-hero img{width:100%;height:auto;display:block}

    .post-card{background:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 25px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.06)}
    .post-gallery{display:grid;grid-template-columns:1fr;gap:12px;margin:10px 0 6px}
    @media(min-width:720px){ .post-gallery{grid-template-columns:repeat(3,1fr)} }
    .post-figure{margin:0}
    .post-figure img{width:100%;display:block;border-radius:16px;border:1px solid rgba(0,0,0,.06)}

    .post-p{margin:0 0 12px;line-height:1.85;text-align:justify;text-justify:inter-word}
    .divider{height:1px;background:rgba(0,0,0,.10);margin:18px 0}
  </style>
</head>

<body>
  <div id="site-header"></div>

  <main class="post-wrap">
    <div class="post-top">
      <a class="post-back" href="/blog/">← Back to Blog</a>
    </div>

    <h1 style="margin:0;text-align:center">${escapeHtml(copy.titleEn)}</h1>
    <div class="post-meta">${escapeHtml(new Date(dateISO).toDateString())}</div>

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

// ===== Sitemap add-only =====
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

// ===== Supabase BLOG tracking =====
async function pushBlogTrackingToSupabase({ slug, category, copy, imageUrls, postUrl, runKey }) {
  if (!supabase) {
    console.log("Supabase not configured. Skipping blog tracking insert.");
    return;
  }

  const contentHash = crypto
    .createHash("sha1")
    .update([slug, copy.titleEn, copy.titleEs, ...imageUrls].join("|"))
    .digest("hex");

  const row = {
    status: "published",
    slug,
    category,
    title_en: copy.titleEn || null,
    title_es: copy.titleEs || null,
    excerpt_en: copy.excerptEn || null,
    excerpt_es: copy.excerptEs || null,
    post_url: postUrl,
    image_urls: imageUrls,
    content_hash: contentHash,
    run_key: runKey || null,
  };

  const { error } = await supabase.from("blog_posts").insert(row);

  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      console.log("Already tracked in Supabase (duplicate).");
      return;
    }
    throw new Error(`Supabase blog_posts insert failed: ${error.message}`);
  }
}

// ===== Optional: avoid repeating recent categories =====
async function getRecentCategories(limit = 10) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("blog_posts")
    .select("category")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []).map((r) => r.category).filter(Boolean);
}

// ===== Main =====
async function run() {
  ensureDirs();

  const allImages = listAllImages(IMAGES_ROOT);
  if (!allImages.length) throw new Error("No images found in /images");

  const categories = [...new Set(allImages.map(categoryFromPath))];

  // ✅ Rotate categories (tries to avoid last 10)
  const recent = await getRecentCategories(10);
  const pool = categories.filter((c) => !recent.includes(c));
  const categoryPool = pool.length ? pool : categories;
  const category = categoryPool[Math.floor(Math.random() * categoryPool.length)];

  const categoryImages = allImages.filter((f) => categoryFromPath(f) === category);
  const pickedFiles = shuffle(categoryImages).slice(0, Math.min(IMAGES_PER_POST, categoryImages.length));
  const imageUrls = pickedFiles.map(toPublicUrl);

  const copy = await generateBilingualCopy({ category, imageUrls });

  const dateISO = new Date().toISOString();
  const runKey = `${dateISO.slice(0, 10)}-${hashSlug(dateISO)}`;
  const slug = `${category}-${hashSlug((copy.titleEn || category) + "-" + dateISO)}`;

  const postHtml = renderPostHtml({ slug, dateISO, category, imageUrls, copy });
  writeFile(path.join(POSTS_DIR, `${slug}.html`), postHtml);

  const postUrl = `${SITE_BASE_URL}/blog/posts/${slug}.html`;
  updateSitemapAddPost({ postUrl });

  await pushBlogTrackingToSupabase({ slug, category, copy, imageUrls, postUrl, runKey });

  console.log("OK:", { slug, category, images: imageUrls.length, postUrl, runKey });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
