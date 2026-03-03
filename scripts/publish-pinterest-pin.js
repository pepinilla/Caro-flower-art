import { createClient } from "@supabase/supabase-js";

const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://caroflower.com";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}
if (!PINTEREST_ACCESS_TOKEN) {
  throw new Error("Missing PINTEREST_ACCESS_TOKEN (GitHub secret)");
}
if (!PINTEREST_BOARD_ID) {
  throw new Error("Missing PINTEREST_BOARD_ID (GitHub secret)");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchLatestPublishedPost() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("created_at, title_en, excerpt_en, post_url, image_urls")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Supabase error: ${error.message}`);
  const post = (data || [])[0];
  if (!post) throw new Error("No published posts found in Supabase.");

  return post;
}

async function waitForUrl200(url, tries = 12, delayMs = 15000) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return true;
      console.log(`URL not ready (${res.status}) try ${i}/${tries}: ${url}`);
    } catch (e) {
      console.log(`URL check failed try ${i}/${tries}: ${url} :: ${String(e)}`);
    }
    await sleep(delayMs);
  }
  return false;
}

async function createPinterestPin({ title, description, link, imageUrl, boardId }) {
  const body = {
    board_id: boardId,
    title,
    description,
    link,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
  };

  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINTEREST_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Pinterest create pin failed (${res.status}): ${text}`);
  }

  return JSON.parse(text);
}

async function run() {
  const post = await fetchLatestPublishedPost();

  const title = post.title_en || "Caro Flower Art";
  const description = post.excerpt_en || "Handmade paper flowers and behind-the-scenes process.";
  const link = post.post_url || `${SITE_BASE_URL}/blog/`;

  const imageUrl = (post.image_urls || [])[0];
  if (!imageUrl) throw new Error("Latest post has no image_urls[0] in Supabase.");

  // Espera a que GitHub Pages/tu hosting ya sirva la imagen
  const ok = await waitForUrl200(imageUrl);
  if (!ok) {
    throw new Error(`Image URL still not public after retries: ${imageUrl}`);
  }

  const pin = await createPinterestPin({
    title,
    description,
    link,
    imageUrl,
    boardId: PINTEREST_BOARD_ID,
  });

  console.log("PINTEREST OK:", {
    pin_id: pin?.id,
    board_id: PINTEREST_BOARD_ID,
    link,
    imageUrl,
  });
}

run().catch((e) => {
  console.error("PINTEREST FAILED:", e?.message || e);
  process.exit(1);
});
