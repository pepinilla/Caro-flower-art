import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ===== Config =====
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://caroflower.com";

// Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

// Modes
const DRY_RUN = process.env.DRY_RUN === "true"; // no files, no db, no pinterest
const PINTEREST_DRY_RUN = process.env.PINTEREST_DRY_RUN === "true"; // skip pinterest only
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

// Pinterest
const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN || "";
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID || "";
const PINTEREST_API_BASE = process.env.PINTEREST_API_BASE || "https://api.pinterest.com/v5"; // or https://api-sandbox.pinterest.com/v5

// Content settings
const IMAGES_ROOT = path.join(process.cwd(), "images");
const BLOG_DIR = path.join(process.cwd(), "blog");
const POSTS_DIR = path.join(BLOG_DIR, "posts");

const IMAGES_PER_POST = Number(process.env.IMAGES_PER_POST || 3);
const RECENT_CATEGORY_AVOID = Number(process.env.RECENT_CATEGORY_AVOID || 10);
const RECENT_IMAGE_AVOID_POSTS = Number(process.env.RECENT_IMAGE_AVOID_POSTS || 30);

const MAX_FEED_ITEMS = Number(process.env.MAX_FEED_ITEMS || 30);

// ===== Helpers =====
function ensureDirs() {
  if (DRY_RUN) return;
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
}

function listAllImages(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
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

function toImageKey(filePath) {
  return path.relative(IMAGES_ROOT, filePath).replaceAll("\\", "/");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hash10(input) {
  return crypto.createHash("sha1").update(String(input)).digest("hex").slice(0, 10);
}

function writeFile(filePath, content) {
  if (DRY_RUN) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isoDateOnly(dateISO) {
  return (dateISO || "").slice(0, 10);
}

function safeJsonLd(obj) {
  return JSON.stringify(obj).replaceAll("</", "<\\/");
}

function clamp(str, max) {
  const s = String(str || "");
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

function safePinterestDescription({ category, excerptEn, postUrl }) {
  // Pinterest descriptions can be long, but keep it clean.
  const base = excerptEn ? excerptEn.trim() : `Handmade paper flowers from Caro Flower Art.`;
  const extra = `\n\nSee the full post: ${postUrl}\n\n#handmade #paperflowers #floralart #DIY #crafts #CaroFlowerArt`;
  return clamp(`${base}${extra}`, 490);
}

// ===== Supabase helpers =====
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

async function getRecentImageKeys(limitPosts = 30) {
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("image_keys")
    .order("created_at", { ascending: false })
    .limit(limitPosts);

  if (error) return new Set();
  const set = new Set();
  for (const row of data || []) {
    const keys = row.image_keys || [];
    for (const k of keys) set.add(k);
  }
  return set;
}

async function getLatestPostsForFeed(limit = 30) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("blog_posts")
    .select("created_at, title_en, excerpt_en, post_url")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

// ===== OpenAI generation (strict + retry) =====
function parseCopyStrict(text) {
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

  const copy = {
    titleEn: getLine("TITLE_EN"),
    titleEs: getLine("TITLE_ES"),
    excerptEn: getLine("EXCERPT_EN"),
    excerptEs: getLine("EXCERPT_ES"),
    blogEn: getBlock("BLOG_EN"),
    blogEs: getBlock("BLOG_ES"),
  };

  if (!copy.titleEn || !copy.blogEn || !copy.blogEs) {
    throw new Error("AI output missing required fields (TITLE_EN/BLOG_EN/BLOG_ES).");
  }
  return copy;
}

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

  const call = async () => {
    const resp = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1400,
      messages: [
        { role: "system", content: "Write natural, elegant brand copy. No emojis. EN first." },
        { role: "user", content: prompt },
      ],
    });
    const text = resp.choices?.[0]?.message?.content || "";
    return { text, promptUsed: prompt };
  };

  try {
    const { text, promptUsed } = await call();
    const parsed = parseCopyStrict(text);
    return { ...parsed, raw: text, promptUsed };
  } catch {
    const { text, promptUsed } = await call();
    const parsed = parseCopyStrict(text);
    return { ...parsed, raw: text, promptUsed };
  }
}

// ===== Post HTML =====
function renderPostHtml({ slug, dateISO, category, imageUrls, copy }) {
  const title = copy.titleEn || "Caro Flower Art";
  const desc = copy.excerptEn || "Behind-the-scenes stories and process of handmade paper flowers.";
  const canonical = `${SITE_BASE_URL}/blog/posts/${slug}.html`;

  const heroImage = imageUrls[0] || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: desc,
    datePublished: dateISO,
    dateModified: dateISO,
    author: { "@type": "Organization", name: "Caro Flower Art" },
    publisher: { "@type": "Organization", name: "Caro Flower Art" },
    image: imageUrls,
    mainEntityOfPage: canonical,
  };

  const gallery = imageUrls
    .map(
      (u) => `
      <figure class="post-figure">
        <img
          src="${u}"
          alt="${escapeHtml(category)} handmade paper flowers"
          loading="lazy"
          decoding="async"
        />
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

  <meta name="article:published_time" content="${dateISO}" />

  <script type="application/ld+json">${safeJsonLd(jsonLd)}</script>

  <link rel="stylesheet" href="/site.css?v=20260126b" />

  <style>
    .post-wrap{max-width:980px;margin:0 auto;padding:18px 16px 40px}
    .post-top{display:flex;justify-content:center;margin:10px 0 16px}
    .post-back{text-decoration:none;font-weight:600}
    .post-meta{text-align:center;opacity:.75;font-size:14px;margin-top:10px}

    .post-hero{border-radius:18px;overflow:hidden;margin:14px 0 22px;box-shadow:0 10px 25px rgba(0,0,0,.08);background:rgba(0,0,0,.03)}
    .post-hero img{width:100%;height:auto;display:block;aspect-ratio:16/9;object-fit:cover;object-position:center}

    .post-card{background:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 25px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.06)}
    .post-gallery{display:grid;grid-template-columns:1fr;gap:12px;margin:10px 0 6px}
    @media(min-width:720px){ .post-gallery{grid-template-columns:repeat(3,1fr)} }
    .post-figure{margin:0}
    .post-figure img{width:100%;display:block;border-radius:16px;border:1px solid rgba(0,0,0,.06);aspect-ratio:4/3;object-fit:cover;object-position:center;background:rgba(0,0,0,.03)}

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

    ${heroImage ? `<div class="post-hero">
      <img src="${heroImage}" alt="${escapeHtml(copy.titleEn)}" loading="lazy" decoding="async"/>
    </div>` : ""}

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

// ===== Sitemap (with lastmod) =====
function updateSitemapAddPost({ postUrl, dateISO }) {
  const sitemapPath = path.join(process.cwd(), "sitemap.xml");

  let xml = "";
  if (fs.existsSync(sitemapPath)) {
    xml = fs.readFileSync(sitemapPath, "utf-8");
  } else {
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
  }

  if (xml.includes(`<loc>${postUrl}</loc>`)) return;

  const lastmod = isoDateOnly(dateISO);
  const entry = `  <url><loc>${postUrl}</loc><lastmod>${lastmod}</lastmod></url>\n`;
  xml = xml.replace("</urlset>", `${entry}</urlset>`);
  writeFile(sitemapPath, xml);
}

// ===== RSS Feed (feed.xml) =====
async function updateFeedXml() {
  if (!supabase) return;

  const posts = await getLatestPostsForFeed(MAX_FEED_ITEMS);

  const itemsXml = posts
    .map((p) => {
      const title = escapeHtml(p.title_en || "Caro Flower Art");
      const link = p.post_url;
      const pubDate = new Date(p.created_at).toUTCString();
      const desc = escapeHtml(p.excerpt_en || "");
      return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Caro Flower Art Blog</title>
    <link>${SITE_BASE_URL}/blog/</link>
    <description>Behind-the-scenes stories of handmade paper flowers.</description>
    ${itemsXml}
  </channel>
</rss>`;

  writeFile(path.join(process.cwd(), "feed.xml"), xml);
}

// ===== robots.txt =====
function ensureRobotsTxt() {
  const target = `User-agent: *
Allow: /

Sitemap: ${SITE_BASE_URL}/sitemap.xml
Sitemap: ${SITE_BASE_URL}/feed.xml
`;
  writeFile(path.join(process.cwd(), "robots.txt"), target);
}

// ===== Supabase BLOG tracking =====
async function insertBlogTrackingRow(row) {
  if (!supabase) return { ok: false, error: null };
  if (DRY_RUN) return { ok: true, error: null };

  const { error } = await supabase.from("blog_posts").insert(row);
  if (!error) return { ok: true, error: null };

  const msg = String(error.message || "").toLowerCase();
  if (msg.includes("duplicate") || msg.includes("unique")) {
    return { ok: true, error: null };
  }
  return { ok: false, error };
}

async function pushBlogTrackingToSupabase({
  slug, category, copy, imageUrls, imageKeys, postUrl, runKey, status, errorText,
}) {
  if (!supabase) {
    console.log("Supabase not configured. Skipping tracking.");
    return;
  }

  const contentHash = crypto
    .createHash("sha1")
    .update([slug, copy?.titleEn, copy?.titleEs, ...(imageKeys || [])].join("|"))
    .digest("hex");

  const row = {
    status: status || "published",
    slug,
    category,
    title_en: copy?.titleEn || null,
    title_es: copy?.titleEs || null,
    excerpt_en: copy?.excerptEn || null,
    excerpt_es: copy?.excerptEs || null,
    post_url: postUrl,
    image_urls: imageUrls || [],
    image_keys: imageKeys || [],
    content_hash: contentHash,
    run_key: runKey || null,
    ai_model: AI_MODEL,
    error: errorText || null,
  };

  const { ok, error } = await insertBlogTrackingRow(row);
  if (!ok) throw new Error(`Supabase insert failed: ${error.message}`);
}

// ===== Pinterest: create a Pin =====
async function createPinterestPin({ title, description, boardId, imageUrl, linkUrl }) {
  if (DRY_RUN || PINTEREST_DRY_RUN) {
    console.log("PINTEREST SKIP (dry run):", { boardId, title, imageUrl, linkUrl });
    return { skipped: true };
  }

  if (!PINTEREST_ACCESS_TOKEN) throw new Error("Missing PINTEREST_ACCESS_TOKEN");
  if (!boardId) throw new Error("Missing PINTEREST_BOARD_ID/boardId");
  if (!imageUrl) throw new Error("Missing imageUrl");

  const url = `${PINTEREST_API_BASE}/pins`;

  const payload = {
    board_id: String(boardId),
    title: clamp(title, 100),
    description: clamp(description, 500),
    link: linkUrl,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINTEREST_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}

  if (!res.ok) {
    throw new Error(`Pinterest create pin failed (${res.status}): ${text}`);
  }

  return json || { ok: true };
}

// ===== Main =====
async function run() {
  ensureDirs();

  const allImages = listAllImages(IMAGES_ROOT);
  if (!allImages.length) throw new Error("No images found in /images");

  const categories = [...new Set(allImages.map(categoryFromPath))];

  // Rotate categories
  const recentCats = await getRecentCategories(RECENT_CATEGORY_AVOID);
  const catPool = categories.filter((c) => !recentCats.includes(c));
  const chosenCategoryPool = catPool.length ? catPool : categories;
  const category = chosenCategoryPool[Math.floor(Math.random() * chosenCategoryPool.length)];

  // Avoid repeating images
  const recentKeys = await getRecentImageKeys(RECENT_IMAGE_AVOID_POSTS);
  const categoryImages = allImages.filter((f) => categoryFromPath(f) === category);

  let candidates = shuffle(categoryImages).filter((f) => !recentKeys.has(toImageKey(f)));
  if (candidates.length < IMAGES_PER_POST) candidates = shuffle(categoryImages);

  const pickedFiles = candidates.slice(0, Math.min(IMAGES_PER_POST, candidates.length));
  const imageUrls = pickedFiles.map(toPublicUrl);
  const imageKeys = pickedFiles.map(toImageKey);

  const dateISO = new Date().toISOString();
  const runKey = `${isoDateOnly(dateISO)}-${hash10(dateISO)}`;
  const slug = `${category}-${hash10((category + "-" + dateISO + "-" + imageKeys.join(",")))}`;
  const postUrl = `${SITE_BASE_URL}/blog/posts/${slug}.html`;

  let copy = null;

  try {
    copy = await generateBilingualCopy({ category, imageUrls });

    const postHtml = renderPostHtml({ slug, dateISO, category, imageUrls, copy });
    writeFile(path.join(POSTS_DIR, `${slug}.html`), postHtml);

    updateSitemapAddPost({ postUrl, dateISO });
    ensureRobotsTxt();
    await pushBlogTrackingToSupabase({
      slug, category, copy, imageUrls, imageKeys, postUrl, runKey,
      status: "published",
      errorText: null,
    });

    await updateFeedXml();

    // ===== Pinterest publish =====
    const heroImage = imageUrls[0];
    const pinTitle = copy.titleEn;
    const pinDesc = safePinterestDescription({
      category,
      excerptEn: copy.excerptEn,
      postUrl,
    });

    // Prefer the env var board id, but allow overriding
    const boardId = PINTEREST_BOARD_ID;

    const pinResp = await createPinterestPin({
      title: pinTitle,
      description: pinDesc,
      boardId,
      imageUrl: heroImage,
      linkUrl: postUrl,
    });

    console.log("OK:", {
      slug,
      category,
      images: imageUrls.length,
      postUrl,
      runKey,
      pinterest: PINTEREST_DRY_RUN || DRY_RUN ? "skipped" : pinResp?.id || "created",
      dryRun: DRY_RUN,
    });
  } catch (e) {
    const errText = String(e?.message || e);

    try {
      await pushBlogTrackingToSupabase({
        slug, category,
        copy: copy || { titleEn: null, titleEs: null, excerptEn: null, excerptEs: null },
        imageUrls, imageKeys, postUrl, runKey,
        status: "failed",
        errorText: errText.slice(0, 900),
      });
    } catch (_) {}

    console.error("FAILED:", { slug, category, postUrl, runKey, error: errText });
    process.exit(1);
  }
}

run();
